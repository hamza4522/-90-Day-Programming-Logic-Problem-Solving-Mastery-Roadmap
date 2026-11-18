# Lab 5.2 — Cloud Security Posture Management (CSPM) with Prowler
**Phase**: 5 — Expert  
**Difficulty**: ⭐⭐⭐⭐ Expert  
**Estimated Time**: 4–5 hours  
**Category**: Cloud Security, CSPM, AWS/GCP/Azure Hardening, CIS Benchmarks

---

## 🎯 Objective

Use **Prowler** to continuously audit your cloud infrastructure (AWS/GCP/Azure) against CIS Benchmarks, detect misconfigurations, and build an automated cloud security posture management pipeline. While the previous labs focused on application and container security, this lab tackles the **cloud infrastructure** layer — because a hardened application on a misconfigured cloud is still vulnerable.

---

## 📋 Problem Statement

Your company runs on AWS with 3 accounts (dev, staging, prod). A penetration test just revealed:
1. An S3 bucket containing customer PII was **publicly accessible**
2. IAM users had **access keys that hadn't been rotated in 400+ days**
3. CloudTrail was **disabled** in the dev account
4. Several EC2 instances had **security groups allowing 0.0.0.0/0 on SSH**
5. RDS instances had **encryption disabled** and **public accessibility enabled**
6. The root account had **no MFA** and had been used in the last 30 days

The penetration tester noted: "These are all well-known misconfigurations that automated tooling would have caught." Your task: make sure they're caught continuously and automatically.

---

## 🛠️ Prerequisites

- AWS account (free tier is sufficient for most checks) OR use LocalStack for local simulation
- AWS CLI configured (`aws configure`)
- Docker installed (Prowler runs easily via Docker)
- Completed Lab 2.5 (IaC scanning with Checkov) recommended

---

## 📋 Tasks

### Task 1: Install and Run Prowler

1. Install Prowler:
   ```bash
   # Via pip
   pip install prowler

   # Or via Docker
   docker pull toniblyx/prowler

   # Or from source
   git clone https://github.com/prowler-cloud/prowler
   cd prowler && pip install .
   ```

2. Run a quick scan:
   ```bash
   # Full CIS benchmark scan
   prowler aws

   # Specific checks only
   prowler aws --checks s3_bucket_public_access iam_root_mfa_enabled \
     cloudtrail_multi_region_enabled ec2_sg_ssh_open

   # Output formats
   prowler aws -M json-ocsf csv html
   ```

3. Explore the results:
   - How many checks ran?
   - How many PASS vs FAIL vs MANUAL?
   - What are the top 5 most critical failures?

### Task 2: Understand CIS AWS Benchmark Categories

Prowler checks map to CIS AWS Foundations Benchmark sections. For each category, identify your top failures:

| CIS Section | What It Checks | Example Prowler Check |
|---|---|---|
| 1. Identity & Access Management | IAM policies, MFA, access keys | `iam_root_mfa_enabled` |
| 2. Logging | CloudTrail, CloudWatch, VPC Flow Logs | `cloudtrail_multi_region_enabled` |
| 3. Monitoring | CloudWatch alarms for security events | `cloudwatch_alarm_unauthorized_api_calls` |
| 4. Networking | Security groups, VPCs, NACLs | `ec2_sg_ssh_open` |
| 5. Storage | S3 bucket policies, encryption | `s3_bucket_public_access` |

Run each section independently and document findings:
```bash
prowler aws --categories internet-exposed
prowler aws --categories encryption
prowler aws --categories iam
prowler aws --categories logging
```

### Task 3: Create a Deliberately Misconfigured Environment

Using Terraform, create a **vulnerable-by-design** AWS environment to test Prowler against:

```hcl
# vulnerable-cloud/main.tf

# ❌ S3 bucket with public access
resource "aws_s3_bucket" "vulnerable_bucket" {
  bucket = "company-data-public-${random_id.suffix.hex}"
}

# ❌ No encryption, no versioning, no logging

# ❌ Security group allowing SSH from anywhere
resource "aws_security_group" "open_ssh" {
  name = "allow-all-ssh"
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Bad!
  }
}

# ❌ IAM user with admin access and no MFA
resource "aws_iam_user" "over_privileged" {
  name = "deploy-bot"
}
resource "aws_iam_user_policy_attachment" "admin" {
  user       = aws_iam_user.over_privileged.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}
```

1. Deploy the Terraform
2. Run Prowler against it
3. Document all findings
4. Fix each misconfiguration in Terraform
5. Re-run Prowler and verify all checks pass
6. Document the before-and-after

### Task 4: CI/CD Cloud Security Pipeline

Create `.github/workflows/cspm-scan.yml`:

```yaml
# This pipeline should:
# 1. Run Prowler against your AWS account on a schedule (daily)
# 2. Compare results to previous scan (detect NEW failures)
# 3. Generate HTML report and upload as artifact
# 4. Send Slack notification if new critical findings appear
# 5. Block Terraform apply if Prowler finds critical misconfigs in the plan
```

Also create a **pre-deploy gate**: before `terraform apply`, run Prowler checks on the Terraform plan to catch misconfigurations BEFORE they're deployed.

### Task 5: Custom Prowler Checks

Write custom Prowler checks for your organization's specific requirements:

1. **Check**: "All EC2 instances must have the company's approved AMI"
2. **Check**: "No IAM user should have inline policies (use groups/roles only)"
3. **Check**: "All RDS instances must have deletion protection enabled"
4. **Check**: "No Lambda functions should have environment variables containing 'PASSWORD' or 'SECRET'"

### Task 6: Multi-Account Cloud Security Dashboard

If you have multiple AWS accounts (or simulate with different profiles):

1. Run Prowler across all accounts
2. Aggregate results into a single dashboard
3. Track compliance posture per account over time
4. Create a "Cloud Security Scorecard" for each account:
   - Identity & Access: 85%
   - Encryption: 70%
   - Logging: 95%
   - Network: 60%
   - Overall: 77.5%

---

## 📝 Deliverables

1. `prowler-report.html` — full CIS benchmark scan report
2. `vulnerable-cloud/` — Terraform for misconfigured environment (before + after)
3. `.github/workflows/cspm-scan.yml` — automated CSPM pipeline
4. `custom-checks/` — organization-specific Prowler checks
5. `cloud-scorecard.md` — multi-account security scorecard
6. `remediation-guide.md` — how to fix each category of finding

---

## ❓ Questions to Answer

1. What is the difference between **CSPM** (Cloud Security Posture Management) and **CWPP** (Cloud Workload Protection Platform)? Give examples of each.
2. Prowler found 150 failures in your AWS account. Your manager says "fix them all this week." Why is this the wrong approach? How should you prioritize?
3. You fix a misconfigured S3 bucket. Two weeks later, a developer reconfigures it with public access. How do you prevent **configuration drift**?
4. What is the **shared responsibility model** and how does it determine which security controls are YOUR responsibility vs the cloud provider's?
5. A developer creates a personal AWS access key for their IAM user. What are the risks? What's the better alternative?

---

> 💡 **Cloud misconfiguration stat**: According to Gartner, through 2025, 99% of cloud security failures will be the customer's fault (misconfigurations), not the cloud provider's.

> 📋 **Multi-cloud**: Prowler supports AWS, GCP, and Azure. If you're multi-cloud, run Prowler against ALL your cloud accounts — attackers will find the weakest one.

---

## 🔗 Useful Links & References

- [Prowler Official Documentation](https://docs.prowler.com/)
- [Prowler GitHub Repository](https://github.com/prowler-cloud/prowler)
- [CIS AWS Foundations Benchmark](https://www.cisecurity.org/benchmark/amazon_web_services)
- [AWS Well-Architected Framework: Security Pillar](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html)
- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)
- [Checkov Bridgecrew Documentation](https://www.checkov.io/)
- [Cloud Security Alliance (CSA) Cloud Controls Matrix (CCM)](https://cloudsecurityalliance.org/research/cloud-controls-matrix)


