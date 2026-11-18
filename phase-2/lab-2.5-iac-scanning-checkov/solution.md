# Lab 2.5 — IaC Security Scanning Solution Guide
**Phase**: 2 — CI/CD Security

---

## Task 2: Checkov Installation & Scan

```bash
# Install Checkov
pip install checkov

# Or via Docker (no install)
docker run --rm -v "$(pwd):/tf" bridgecrew/checkov -d /tf

# Scan Terraform directory
checkov -d . --framework terraform

# Scan with JSON output
checkov -d . \
  --framework terraform \
  --output json \
  --output-file checkov-report.json

# Scan with SARIF output (for GitHub Security)
checkov -d . \
  --framework terraform \
  --output sarif \
  --output-file checkov.sarif

# Scan only for specific severity
checkov -d . --check-threshold HIGH

# Scan with specific checks only
checkov -d . --check CKV_AWS_18,CKV_AWS_19,CKV_AWS_53

# Scan K8s manifests
checkov -f kubernetes.yaml --framework kubernetes
```

### Expected Checkov Output (Terraform)

```
terraform scan results:
Passed checks: 2, Failed checks: 18, Skipped checks: 0

Check: CKV_AWS_52: "Ensure S3 bucket has MFA delete enabled"
  FAILED for resource: aws_s3_bucket.data
  File: /main.tf:13-16

Check: CKV_AWS_18: "Ensure the S3 bucket has access logging enabled"
  FAILED for resource: aws_s3_bucket.data
  File: /main.tf:13-16

Check: CKV_AWS_53: "Ensure S3 bucket has block public ACLS enabled"
  FAILED for resource: aws_s3_bucket.data
  File: /main.tf:13-16

Check: CKV_AWS_17: "Ensure all data stored in the RDS instance is securely encrypted"
  FAILED for resource: aws_db_instance.main
  File: /main.tf:28-46

Check: CKV_AWS_293: "Ensure that AWS RDS database instance is not publicly accessible"
  FAILED for resource: aws_db_instance.main
  File: /main.tf:28-46

Check: CKV_AWS_25: "Ensure no security groups allow ingress from 0.0.0.0:0 to port 22"
  FAILED for resource: aws_security_group.web
  File: /main.tf:49-65

Check: CKV_AWS_79: "Ensure Instance Metadata Service Version 1 is not enabled"
  FAILED for resource: aws_instance.web
  File: /main.tf:68-82
...
```

---

## Task 3: tfsec

```bash
# Run tfsec via Docker (no install needed)
docker run --rm -v "$(pwd):/src" aquasec/tfsec /src

# With HTML output
docker run --rm -v "$(pwd):/src" aquasec/tfsec \
  --format html \
  /src > tfsec-report.html

# With JSON output
docker run --rm -v "$(pwd):/src" aquasec/tfsec \
  --format json \
  /src > tfsec-report.json

# Install natively (Go required)
go install github.com/aquasecurity/tfsec/cmd/tfsec@latest
tfsec .
```

---

## Task 5: Fixed Terraform Configuration

```hcl
# main-secure.tf — FIXED CONFIGURATION

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# FIXED: S3 bucket with proper security
resource "aws_s3_bucket" "data" {
  bucket = "my-company-data-bucket"
  # Remove 'acl' attribute — managed by separate resource
}

# Block ALL public access
resource "aws_s3_bucket_public_access_block" "data" {
  bucket = aws_s3_bucket.data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning
resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# Enable access logging
resource "aws_s3_bucket_logging" "data" {
  bucket        = aws_s3_bucket.data.id
  target_bucket = aws_s3_bucket.data.id  # or separate log bucket
  target_prefix = "s3-access-logs/"
}

# FIXED: RDS with full security
resource "aws_db_instance" "main" {
  identifier        = "prod-database"
  engine            = "mysql"
  engine_version    = "8.0"
  instance_class    = "db.t3.micro"
  allocated_storage = 20

  username = "admin"
  # FIXED: Use SSM Parameter or Secrets Manager, not hardcoded
  password = data.aws_secretsmanager_secret_version.db_password.secret_string

  # FIXED: Encryption enabled
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  # FIXED: Not publicly accessible
  publicly_accessible = false

  # FIXED: Keep final snapshot
  skip_final_snapshot       = false
  final_snapshot_identifier = "prod-database-final-snapshot"

  # FIXED: Enable automated backups
  backup_retention_period = 7
  backup_window           = "03:00-04:00"

  # FIXED: Enable deletion protection
  deletion_protection = true

  # FIXED: Enable Multi-AZ for HA
  multi_az = true

  # FIXED: Enable enhanced monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # FIXED: Enable audit logging
  enabled_cloudwatch_logs_exports = ["audit", "error", "general", "slowquery"]
}

# KMS key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}

# FIXED: Restrictive security group
resource "aws_security_group" "web" {
  name        = "web-sg"
  description = "Web server security group — allows only HTTPS inbound"

  # FIXED: No SSH from internet — use AWS Systems Manager Session Manager instead
  # If SSH is needed, restrict to bastion host IP:
  # ingress {
  #   from_port   = 22
  #   to_port     = 22
  #   protocol    = "tcp"
  #   cidr_blocks = ["10.0.0.0/8"]  # Internal only
  # }

  # Allow HTTPS only
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS from internet"
  }

  # FIXED: Restrict outbound to necessary ports only
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS outbound"
  }
}

# FIXED: EC2 with IMDSv2 and encryption
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  # FIXED: Enforce IMDSv2 (prevents SSRF → credential theft)
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"    # IMDSv2 required
    http_put_response_hop_limit = 1             # Prevent SSRF
  }

  # FIXED: Encrypted root volume
  root_block_device {
    volume_type = "gp3"
    encrypted   = true
    kms_key_id  = aws_kms_key.rds.arn
  }

  # FIXED: Use IAM instance profile instead of hardcoded credentials
  iam_instance_profile = aws_iam_instance_profile.web.name

  # FIXED: Disable detailed monitoring for cost, enable for security
  monitoring = true

  vpc_security_group_ids = [aws_security_group.web.id]
}
```

---

## Task 6: CI/CD IaC Security Pipeline

```yaml
# .github/workflows/iac-security.yml
name: IaC Security Scanning

on:
  push:
    paths:
      - '**.tf'
      - '**.yaml'
      - '**.yml'
  pull_request:
    paths:
      - '**.tf'
      - '**.yaml'
      - '**.yml'

permissions:
  contents: read
  security-events: write

jobs:
  checkov-terraform:
    name: Checkov — Terraform
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Checkov — Terraform Scan
        uses: bridgecrewio/checkov-action@master
        with:
          directory: .
          framework: terraform
          output_format: sarif
          output_file_path: checkov-tf.sarif
          soft_fail: false  # Fail the job on findings
          check: CKV_AWS_*  # Only AWS checks (adjust as needed)

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: checkov-tf.sarif
          category: checkov-terraform

  checkov-kubernetes:
    name: Checkov — Kubernetes
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Checkov — K8s Scan
        uses: bridgecrewio/checkov-action@master
        with:
          directory: .
          framework: kubernetes
          output_format: sarif
          output_file_path: checkov-k8s.sarif

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: checkov-k8s.sarif
          category: checkov-kubernetes

  tfsec:
    name: tfsec
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: tfsec Scan
        uses: aquasecurity/tfsec-action@v1.0.0
        with:
          soft_fail: false
          format: sarif
          sarif_file: tfsec.sarif

      - name: Upload tfsec SARIF
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: tfsec.sarif
          category: tfsec

  compliance-report:
    name: Compliance Summary
    runs-on: ubuntu-latest
    needs: [checkov-terraform, checkov-kubernetes, tfsec]
    if: always()
    steps:
      - uses: actions/checkout@v4

      - name: Install Checkov
        run: pip install checkov

      - name: Generate Compliance Report
        run: |
          checkov -d . \
            --framework terraform,kubernetes \
            --output json > compliance-report.json
          
          # Extract summary
          python3 << 'EOF'
          import json
          with open('compliance-report.json') as f:
              data = json.load(f)
          
          if isinstance(data, list):
              passed = sum(r.get('summary', {}).get('passed', 0) for r in data)
              failed = sum(r.get('summary', {}).get('failed', 0) for r in data)
          else:
              passed = data.get('summary', {}).get('passed', 0)
              failed = data.get('summary', {}).get('failed', 0)
          
          total = passed + failed
          score = (passed / total * 100) if total > 0 else 0
          print(f"Compliance Score: {score:.1f}% ({passed}/{total} checks passed)")
          EOF

      - name: Upload Compliance Report
        uses: actions/upload-artifact@v4
        with:
          name: iac-compliance-report
          path: compliance-report.json
          retention-days: 90
```

---

## ✅ Answers to Reflection Questions

### 1. IMDSv2 Disabled + SSRF = Credential Theft

**The Attack Chain (Capital One 2019)**:
```
1. Application has SSRF vulnerability
   (e.g., http://victim.com/fetch?url=http://169.254.169.254/...)
                    ↓
2. Attacker makes the server request its own EC2 metadata:
   GET http://169.254.169.254/latest/meta-data/iam/security-credentials/
                    ↓
3. IMDSv1 responds without authentication:
   {"AccessKeyId": "ASIA...", "SecretAccessKey": "...", "Token": "..."}
                    ↓
4. Attacker uses these credentials to access AWS
   (S3, DynamoDB, etc.)
                    ↓
5. Data exfiltration at scale
```

**IMDSv2 Prevention**: Requires a PUT request with a session token FIRST, then GET with that token. SSRF-based attacks (which use GET) cannot complete step 2.

### 2. CIS Benchmark & Checkov

The **CIS (Center for Internet Security) Benchmark** is a globally recognized set of security best practices for cloud services (AWS, Azure, GCP), operating systems, and more. Published by security experts and adopted by compliance frameworks.

Checkov maps its checks directly to CIS Benchmark IDs:
- `CKV_AWS_53` → CIS AWS 2.1.1 (S3 public access)
- `CKV_AWS_79` → CIS AWS 5.6 (EC2 IMDSv2)

When Checkov passes, you're demonstrating **CIS compliance** — useful for SOC2, ISO 27001, and audit evidence.

### 3. Prioritizing 47 Findings

**Triage framework**:
1. **Severity first**: Fix CRITICAL (data breach risk) before HIGH before MEDIUM
2. **Exploitability**: Is this exposed to the internet? If yes, higher priority
3. **Asset criticality**: Production database >> development environment
4. **Fix complexity**: Quick wins (1-line fix) first to show momentum
5. **CISA KEV list**: Is this CVE actively exploited in the wild?

**Practical approach**:
- Sprint 1: Fix all CRITICAL findings (typically 3-5)
- Sprint 2: Fix HIGH findings related to internet-exposed resources
- Backlog: Medium/Low with quarterly review
- Suppress (with justification): Findings you've accepted as risk

### 4. IaC Drift Detection

**Drift** occurs when the actual cloud infrastructure diverges from the IaC definition (someone made a manual change in the console).

**Detection tools**:
```bash
# Terraform built-in drift detection
terraform plan  # Shows what Terraform wants to change vs actual state

# HashiCorp Sentinel (policy enforcement)
# AWS Config Rules (continuous compliance)
# CloudQuery (SQL queries against cloud state)
# Driftctl (dedicated drift detection)
driftctl scan --from tfstate://terraform.tfstate
```

**Prevention**: IAM policy that **denies manual changes** to production — all changes must go through Terraform.

### 5. Preventive vs Detective Controls

| Control Type | Definition | IaC Example |
|---|---|---|
| **Preventive** | Stops the bad action from happening | Checkov in CI pipeline — blocks `terraform apply` of insecure code |
| **Detective** | Discovers bad things that already happened | AWS Config Rule — alerts when S3 bucket becomes public |
| **Corrective** | Automatically fixes detected issues | AWS Config Auto-remediation — disables public access automatically |

**In practice**: You need all three:
- Preventive (CI/CD gate) → primary defense
- Detective (AWS Config, CloudTrail, GuardDuty) → catches drift and incidents
- Corrective (Lambda/SSM automation) → auto-remediate low-risk issues
