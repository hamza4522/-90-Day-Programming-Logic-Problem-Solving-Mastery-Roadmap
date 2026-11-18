# Lab 2.5 — IaC Security Scanning with Checkov & tfsec
**Phase**: 2 — CI/CD Security  
**Difficulty**: ⭐⭐ Intermediate  
**Estimated Time**: 3–4 hours  
**Category**: Infrastructure as Code (IaC) Security

---

## 🎯 Objective

Learn to scan **Infrastructure as Code** (Terraform, Kubernetes, Docker Compose) for security misconfigurations BEFORE they are deployed. IaC misconfigurations are one of the leading causes of cloud breaches — public S3 buckets, open security groups, unencrypted databases, all caused by a few lines of Terraform.

---

## 📋 Problem Statement

Your team manages AWS infrastructure using Terraform. A recent audit found that several resources were misconfigured:
- An S3 bucket with public access enabled
- An RDS database without encryption
- A security group allowing SSH from anywhere (0.0.0.0/0)
- An EC2 instance with no IMDSv2 enforcement

These were all caught AFTER deployment. Your job is to implement IaC scanning in the CI/CD pipeline so these are caught BEFORE `terraform apply`.

---

## 🛠️ Prerequisites

- Python 3.x (for Checkov)
- Docker (for tfsec)
- Terraform (optional — for running plan-based scans)

---

## 📋 Tasks

### Task 1: Create Insecure Terraform Configuration

```bash
mkdir iac-security-lab && cd iac-security-lab
```

Create `main.tf` — intentionally insecure:
```hcl
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

# Issue 1: S3 bucket with public access
resource "aws_s3_bucket" "data" {
  bucket = "my-company-data-bucket"
  acl    = "public-read"  # BAD: publicly readable
}

# Issue 2: No versioning on S3
resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration {
    status = "Disabled"  # BAD: should be Enabled
  }
}

# Issue 3: RDS without encryption
resource "aws_db_instance" "main" {
  identifier        = "prod-database"
  engine            = "mysql"
  engine_version    = "8.0"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  username          = "admin"
  password          = "Password123!"  # BAD: hardcoded password
  
  storage_encrypted = false  # BAD: encryption disabled
  
  publicly_accessible = true  # BAD: database exposed to internet
  
  skip_final_snapshot = true  # BAD: no backup on deletion
  
  backup_retention_period = 0  # BAD: no automated backups
}

# Issue 4: Security group too permissive
resource "aws_security_group" "web" {
  name        = "web-sg"
  description = "Web server security group"

  # BAD: SSH open to entire internet
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # BAD: All traffic allowed outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Issue 5: EC2 without IMDSv2
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  
  # BAD: IMDSv1 allowed (vulnerable to SSRF → SSRF → credential theft)
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "optional"  # BAD: should be "required" for IMDSv2
  }
  
  # BAD: No encrypted root volume
  root_block_device {
    volume_type = "gp3"
    encrypted   = false
  }
}
```

Create `kubernetes.yaml` — insecure K8s manifest:
```yaml
# BAD K8s Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vulnerable-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: vulnerable
  template:
    metadata:
      labels:
        app: vulnerable
    spec:
      containers:
        - name: app
          image: myapp:latest  # BAD: unpinned image
          
          # BAD: Running as root
          securityContext:
            runAsUser: 0
            allowPrivilegeEscalation: true  # BAD
            readOnlyRootFilesystem: false   # BAD
            
          # BAD: No resource limits (allows resource exhaustion)
          # resources: not set
          
          env:
            # BAD: Hardcoded secrets in env
            - name: DB_PASSWORD
              value: "mysecretpassword"
```

### Task 2: Run Checkov Against Terraform

1. Install Checkov and scan the `main.tf` file
2. Document ALL findings — note the check ID (e.g., `CKV_AWS_18`) and what it means
3. Find and research the **most critical finding** — what real-world attack does it enable?
4. Generate a JSON report and identify how many checks passed vs failed

### Task 3: Run tfsec Against Terraform

1. Run tfsec using Docker (no install needed)
2. Compare tfsec findings with Checkov findings:
   - Which findings overlap?
   - Which are unique to each tool?
3. Generate an HTML report from tfsec

### Task 4: Scan Kubernetes Manifests

1. Run Checkov against `kubernetes.yaml`
2. Run `kube-score` or `kubesec` as additional tools
3. Identify the **top 3 most critical K8s security issues**

### Task 5: Fix the Infrastructure

Fix `main.tf` to resolve all HIGH and CRITICAL Checkov findings:
- Enable S3 bucket encryption and block all public access
- Enable RDS encryption and remove public access
- Restrict the security group (no 0.0.0.0/0 on port 22)
- Enforce IMDSv2 on EC2
- Enable root volume encryption

After fixing, re-run Checkov and confirm the findings are resolved.

### Task 6: CI/CD Integration

Create `.github/workflows/iac-security.yml` with:
- Checkov scan on Terraform files
- Checkov scan on K8s manifests
- tfsec scan (via Docker)
- Fail on HIGH/CRITICAL findings
- Upload SARIF to GitHub Security tab
- Generate a compliance summary report

---

## 📝 Deliverables

1. `main.tf` — original insecure configuration
2. `main-secure.tf` — your fixed Terraform
3. `kubernetes.yaml` — K8s manifest
4. `kubernetes-secure.yaml` — fixed K8s manifest
5. `checkov-report.json` — Checkov scan output
6. `.github/workflows/iac-security.yml` — CI pipeline
7. `findings-analysis.md` — Your analysis of findings

---

## ❓ Questions to Answer

1. What real-world attack is enabled by `http_tokens = "optional"` (IMDSv2 disabled) combined with an SSRF vulnerability in the application?
2. What is the **CIS Benchmark** and how does Checkov relate to it?
3. You have 47 Checkov findings on your first scan. How do you prioritize which to fix first without overwhelming your team?
4. What is **drift detection** in IaC security? How would you detect if someone manually changed a security group in the AWS console?
5. What is the difference between **preventive controls** (what you just built) and **detective controls**? Give an example of each.

---

> 💡 **IMDSv2 SSRF Attack Chain**: In 2019, the Capital One breach was caused by an SSRF vulnerability → IMDSv1 metadata access → AWS credentials stolen from EC2 metadata → 100M+ customer records exfiltrated. Enforcing IMDSv2 would have broken this attack chain.

> 💡 **Quick wins**: Sort Checkov findings by severity. Fix `CRITICAL` first, then `HIGH`. Accept remaining `MEDIUM`/`LOW` risks if the benefit doesn't justify the effort.
