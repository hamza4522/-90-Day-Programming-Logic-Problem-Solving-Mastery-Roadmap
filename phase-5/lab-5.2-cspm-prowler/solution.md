# Lab 5.2 — Cloud Security Posture Management (CSPM) Solution Guide
**Phase**: 5 — Expert

---

## Task 1: Prowler Installation & First Scan

```bash
# Install Prowler
pip install prowler

# Verify
prowler --version

# Quick scan — critical checks only
prowler aws --severity critical high

# Full CIS Level 1 scan with HTML report
prowler aws -M html json-ocsf csv \
  --output-directory ./prowler-reports/ \
  --output-filename cis-scan-$(date +%Y%m%d)

# Scan specific services
prowler aws --services s3 iam ec2 rds cloudtrail

# Scan specific checks
prowler aws --checks \
  s3_bucket_public_access \
  s3_bucket_server_side_encryption \
  iam_root_mfa_enabled \
  iam_user_accesskey_unused \
  cloudtrail_multi_region_enabled \
  ec2_securitygroup_allow_ingress_from_internet_to_tcp_port_22 \
  rds_instance_storage_encrypted \
  rds_instance_no_public_access
```

### Understanding Prowler Output

```
[PASS] s3_bucket_server_side_encryption: S3 Bucket my-secure-bucket has encryption enabled
[FAIL] s3_bucket_public_access: S3 Bucket company-data-public has public access enabled
[WARN] iam_user_accesskey_unused: IAM User deploy-bot has access key unused for 45 days
```

Statuses:
- **PASS** ✅ — check passed, configuration is secure
- **FAIL** ❌ — misconfiguration found, action needed
- **WARN** ⚠️ — potential issue, needs review
- **MANUAL** 📋 — requires human verification (can't be automated)
- **INFO** ℹ️ — informational (not a security finding)

---

## Task 2: CIS Benchmark Category Analysis

```bash
# Run by category
prowler aws --categories internet-exposed -M json-ocsf

# Parse results to count pass/fail per category
python3 << 'EOF'
import json
import glob
from collections import defaultdict

results = defaultdict(lambda: {'PASS': 0, 'FAIL': 0, 'WARN': 0})

for f in glob.glob('./prowler-reports/*.json'):
    with open(f) as fh:
        for line in fh:
            try:
                finding = json.loads(line)
                category = finding.get('service_name', 'unknown')
                status = finding.get('status', 'unknown')
                results[category][status] += 1
            except json.JSONDecodeError:
                continue

print(f"{'Service':<20} {'PASS':>6} {'FAIL':>6} {'WARN':>6} {'Score':>8}")
print("=" * 50)
for svc, counts in sorted(results.items()):
    total = counts['PASS'] + counts['FAIL']
    score = f"{counts['PASS']/total*100:.0f}%" if total > 0 else "N/A"
    print(f"{svc:<20} {counts['PASS']:>6} {counts['FAIL']:>6} {counts['WARN']:>6} {score:>8}")
EOF
```

---

## Task 3: Vulnerable Terraform Environment

```hcl
# vulnerable-cloud/main.tf
terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "random_id" "suffix" {
  byte_length = 4
}

# ═══════════════════════════════════════
# ❌ VULNERABLE RESOURCES (BEFORE)
# ═══════════════════════════════════════

# ❌ S3: Public access, no encryption, no versioning, no logging
resource "aws_s3_bucket" "vulnerable" {
  bucket = "company-data-${random_id.suffix.hex}"
  # Missing: encryption, versioning, access logging, public access block
}

# ❌ Security Group: SSH open to the world
resource "aws_security_group" "open_ssh" {
  name        = "allow-all-ssh"
  description = "VULNERABLE: SSH from anywhere"

  ingress {
    description = "SSH from anywhere"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ❌ IAM: User with admin access, access keys, no MFA enforcement
resource "aws_iam_user" "deploy_bot" {
  name = "deploy-bot"
}

resource "aws_iam_user_policy_attachment" "deploy_admin" {
  user       = aws_iam_user.deploy_bot.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

resource "aws_iam_access_key" "deploy_bot_key" {
  user = aws_iam_user.deploy_bot.name
}

# ❌ RDS: Public, unencrypted, no deletion protection
resource "aws_db_instance" "vulnerable_db" {
  identifier          = "vulnerable-db"
  engine              = "mysql"
  engine_version      = "8.0"
  instance_class      = "db.t3.micro"
  allocated_storage   = 20
  username            = "admin"
  password            = "SuperSecret123!"  # ❌ Hardcoded password
  publicly_accessible = true               # ❌ Public
  storage_encrypted   = false              # ❌ No encryption
  deletion_protection = false              # ❌ No delete protection
  skip_final_snapshot = true
}

# ❌ CloudTrail: Disabled (not created)
# No CloudTrail resource = no audit logging
```

### Fixed Version

```hcl
# vulnerable-cloud/main-fixed.tf

# ✅ S3: Private, encrypted, versioned, logged
resource "aws_s3_bucket" "secure" {
  bucket = "company-data-${random_id.suffix.hex}"
}

resource "aws_s3_bucket_public_access_block" "secure" {
  bucket = aws_s3_bucket.secure.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "secure" {
  bucket = aws_s3_bucket.secure.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "secure" {
  bucket = aws_s3_bucket.secure.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_logging" "secure" {
  bucket        = aws_s3_bucket.secure.id
  target_bucket = aws_s3_bucket.log_bucket.id
  target_prefix = "s3-access-logs/"
}

# ✅ Security Group: SSH only from VPN CIDR
resource "aws_security_group" "restricted_ssh" {
  name        = "ssh-from-vpn-only"
  description = "SSH restricted to company VPN"

  ingress {
    description = "SSH from VPN"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]  # Company VPN CIDR only
  }

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS outbound only"
  }
}

# ✅ IAM: Role-based (no user access keys), least privilege
resource "aws_iam_role" "deploy_role" {
  name = "deploy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "codebuild.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "deploy_policy" {
  name = "deploy-least-privilege"
  role = aws_iam_role.deploy_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:PutImage",
          "ecs:UpdateService"
        ]
        Resource = "*"
      }
    ]
  })
}

# ✅ RDS: Private, encrypted, deletion protected
resource "aws_db_instance" "secure_db" {
  identifier          = "secure-db"
  engine              = "mysql"
  engine_version      = "8.0"
  instance_class      = "db.t3.micro"
  allocated_storage   = 20
  username            = "admin"
  password            = data.aws_secretsmanager_secret_version.db_password.secret_string
  publicly_accessible = false
  storage_encrypted   = true
  kms_key_id          = aws_kms_key.db_encryption.arn
  deletion_protection = true
  skip_final_snapshot = false

  db_subnet_group_name   = aws_db_subnet_group.private.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
}

# ✅ CloudTrail: Multi-region, with S3 logging
resource "aws_cloudtrail" "main" {
  name                          = "main-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true
  }
}
```

---

## Task 4: CI/CD CSPM Pipeline

```yaml
# .github/workflows/cspm-scan.yml
name: Cloud Security Posture Check

on:
  schedule:
    - cron: '0 7 * * *'  # Daily at 7 AM UTC
  pull_request:
    paths:
      - 'terraform/**'
      - 'infrastructure/**'
  workflow_dispatch:

permissions:
  id-token: write  # For OIDC AWS auth
  contents: read
  pull-requests: write

jobs:
  prowler-scan:
    name: "☁️ Cloud Security Audit"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_PROWLER_ROLE_ARN }}
          aws-region: us-east-1

      - name: Install Prowler
        run: pip install prowler

      - name: Run Prowler Scan
        id: prowler
        run: |
          prowler aws \
            --severity critical high \
            -M json-ocsf html csv \
            --output-directory ./prowler-output \
            --output-filename scan-${{ github.run_number }} \
            --status FAIL \
            || true  # Don't fail here — analyze below

          # Count findings
          CRITICAL=$(grep -c '"severity": "critical"' prowler-output/*.json 2>/dev/null || echo 0)
          HIGH=$(grep -c '"severity": "high"' prowler-output/*.json 2>/dev/null || echo 0)
          TOTAL_FAIL=$(grep -c '"status": "FAIL"' prowler-output/*.json 2>/dev/null || echo 0)

          echo "critical=$CRITICAL" >> $GITHUB_OUTPUT
          echo "high=$HIGH" >> $GITHUB_OUTPUT
          echo "total_fail=$TOTAL_FAIL" >> $GITHUB_OUTPUT

      - name: Compare with Previous Scan
        id: diff
        run: |
          # Download previous scan results
          # (In practice, pull from S3 or artifact storage)
          # Compare to find NEW findings
          echo "new_findings=0" >> $GITHUB_OUTPUT

      - name: Upload Reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: prowler-reports-${{ github.run_number }}
          path: prowler-output/
          retention-days: 365

      - name: Post PR Comment
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const critical = '${{ steps.prowler.outputs.critical }}';
            const high = '${{ steps.prowler.outputs.high }}';
            const totalFail = '${{ steps.prowler.outputs.total_fail }}';

            const body = `## ☁️ Cloud Security Posture Report

            | Severity | Count |
            |---|---|
            | 🔴 Critical | ${critical} |
            | 🟠 High | ${high} |
            | 📊 Total Failures | ${totalFail} |

            ${parseInt(critical) > 0 ? '❌ **Critical cloud misconfigurations detected!** Review required before merge.' : '✅ No critical cloud misconfigurations.'}

            _Full report available in pipeline artifacts._`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body
            });

      - name: Fail on Critical Findings
        if: steps.prowler.outputs.critical != '0'
        run: |
          echo "❌ ${{ steps.prowler.outputs.critical }} critical cloud misconfigurations found!"
          exit 1

  terraform-security-gate:
    name: "🔒 Pre-Deploy Security Gate"
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3

      - name: Terraform Init & Plan
        run: |
          cd terraform/
          terraform init
          terraform plan -out=tfplan
          terraform show -json tfplan > tfplan.json

      - name: Checkov Scan (IaC)
        uses: bridgecrewio/checkov-action@v12
        with:
          file: terraform/tfplan.json
          framework: terraform_plan
          soft_fail: false  # Hard fail on critical
```

---

## ✅ Answers to Reflection Questions

### 1. CSPM vs CWPP

| | CSPM | CWPP |
|---|---|---|
| **What it checks** | Cloud CONFIG (IAM, S3, SGs, CloudTrail) | Cloud WORKLOADS (VMs, containers, serverless) |
| **When** | Before/after deployment (config drift) | At runtime (active protection) |
| **Examples** | Prowler, AWS Config, Prisma Cloud CSPM | Falco, Aqua, Sysdig, CrowdStrike |
| **Analogy** | "Is the door locked?" | "Is someone breaking in right now?" |

CSPM = preventive (fix misconfigs). CWPP = detective/protective (stop active threats).

### 2. Prioritizing 150 Findings

**Wrong**: Fix all 150 this week (burnout, mistakes, no prioritization).

**Right**: Risk-based prioritization:
1. **P0 (this week)**: Internet-exposed resources with sensitive data (public S3 with PII, open SSH)
2. **P1 (2 weeks)**: Missing security controls (no CloudTrail, no encryption at rest)
3. **P2 (1 month)**: Best practice improvements (access key rotation, unused IAM users)
4. **P3 (backlog)**: Low-risk findings (naming conventions, tagging)

Fix 10 critical findings this week. That eliminates more risk than fixing 150 low-priority ones.

### 3. Preventing Configuration Drift

1. **Infrastructure as Code (IaC)**: All changes through Terraform — no manual AWS Console changes
2. **Drift detection**: AWS Config rules or Prowler on a schedule detect when reality ≠ IaC
3. **SCPs (Service Control Policies)**: Organization-level policies that PREVENT certain actions regardless of IAM permissions (e.g., SCP that blocks `s3:PutBucketPolicy` with public access)
4. **Guardrails**: AWS Config auto-remediation — automatically reverts non-compliant changes
5. **Alerts**: CloudWatch Events → Lambda → Slack when a security-relevant change is made outside of CI/CD

### 4. Shared Responsibility Model

| Layer | AWS Responsibility | Your Responsibility |
|---|---|---|
| **Physical** | Data centers, hardware, networking | N/A |
| **Hypervisor** | EC2 hypervisor, host OS | N/A |
| **Network** | VPC infrastructure | Security groups, NACLs, routing |
| **OS** | Managed services (RDS, Lambda) | EC2 instance OS patching |
| **Application** | N/A | Your application code, libraries |
| **Data** | N/A | Encryption, access controls, classification |
| **Identity** | IAM service availability | IAM policies, MFA, least privilege |

**Key insight**: AWS secures the cloud. You secure what's IN the cloud.

### 5. Personal IAM Access Keys — Risks

**Risks**:
- Keys can be committed to Git accidentally (the #1 cause of AWS account compromise)
- Keys don't expire by default — forgotten keys are backdoors
- Keys can be stolen from developer laptops
- No MFA protection (unlike console login)
- Hard to audit "who did what" when keys are shared

**Better alternatives**:
- **AWS SSO / IAM Identity Center**: Temporary credentials via browser login
- **OIDC federation**: CI/CD gets temporary credentials via GitHub Actions OIDC
- **IAM Roles**: EC2 instances and Lambda use roles (no keys needed)
- **aws-vault**: Encrypts credentials, enforces MFA, provides temporary credentials

