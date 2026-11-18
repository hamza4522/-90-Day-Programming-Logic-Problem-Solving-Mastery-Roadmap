# Lab 3.2 — Policy as Code Solution Guide
**Phase**: 3 — Advanced DevSecOps

---

## Install Conftest

```bash
# Linux
curl -Lo conftest.tar.gz https://github.com/open-policy-agent/conftest/releases/latest/download/conftest_Linux_x86_64.tar.gz
tar xzf conftest.tar.gz && sudo mv conftest /usr/local/bin/

# macOS
brew install conftest

# Windows
choco install conftest

# Verify
conftest --version
```

---

## Task 1: Basic Rego Logic

```rego
# policies/basics.rego
package main

# Rule 1: Deny debug mode in production
deny[msg] {
    input.environment == "production"
    input.debug == true
    msg := sprintf("Debug mode must not be enabled in production environment. Got debug=%v in %v", [input.debug, input.environment])
}

# Rule 2: Deny insufficient replicas
deny[msg] {
    input.replicas < 2
    msg := sprintf("Replicas must be >= 2 for high availability. Got: %v", [input.replicas])
}

# Test the logic (inline — in Rego playground)
# Input 1: {"environment":"staging","debug":true,"replicas":1}
# → deny: "Replicas must be >= 2..." (only replicas fails)
#
# Input 2: {"environment":"production","debug":true,"replicas":3}
# → deny: "Debug mode must not be enabled..."
#
# Input 3: {"environment":"production","debug":false,"replicas":3}
# → no denies → allow
```

---

## Task 2: Terraform AWS Security Policies

```rego
# policies/terraform/aws_security.rego
package main

# Deny S3 buckets with public ACL
deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_s3_bucket"
    resource.change.after.acl == "public-read"
    msg := sprintf("S3 bucket '%v' must not have public-read ACL. Set acl to 'private'.", [resource.address])
}

deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_s3_bucket"
    resource.change.after.acl == "public-read-write"
    msg := sprintf("S3 bucket '%v' must not have public-read-write ACL.", [resource.address])
}

# Deny security groups with SSH open to internet
deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_security_group"
    ingress := resource.change.after.ingress[_]
    ingress.from_port <= 22
    ingress.to_port >= 22
    cidr := ingress.cidr_blocks[_]
    cidr == "0.0.0.0/0"
    msg := sprintf("Security group '%v' exposes SSH (port 22) to 0.0.0.0/0. Restrict to known IPs.", [resource.address])
}

# Deny RDS publicly accessible
deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_db_instance"
    resource.change.after.publicly_accessible == true
    msg := sprintf("RDS instance '%v' must not be publicly accessible.", [resource.address])
}

# Deny RDS without encryption
deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_db_instance"
    resource.change.after.storage_encrypted == false
    msg := sprintf("RDS instance '%v' must have storage encryption enabled.", [resource.address])
}

# Deny EC2 without IMDSv2
deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_instance"
    metadata := resource.change.after.metadata_options[_]
    metadata.http_tokens != "required"
    msg := sprintf("EC2 instance '%v' must enforce IMDSv2 (http_tokens = required). Got: %v", [resource.address, metadata.http_tokens])
}

# Warn (not block) on missing backup retention
warn[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_db_instance"
    resource.change.after.backup_retention_period < 7
    msg := sprintf("RDS instance '%v' has backup retention < 7 days. Consider increasing for production.", [resource.address])
}
```

### Test Against Terraform Plan

```bash
# Generate Terraform plan as JSON
cd your-terraform-dir
terraform init
terraform plan -out=plan.tfplan
terraform show -json plan.tfplan > plan.json

# Run Conftest
conftest test plan.json --policy policies/terraform/

# Expected output:
# FAIL - plan.json - main - S3 bucket 'aws_s3_bucket.data' must not have public-read ACL
# FAIL - plan.json - main - Security group 'aws_security_group.web' exposes SSH (port 22) to 0.0.0.0/0
# FAIL - plan.json - main - RDS instance 'aws_db_instance.main' must not be publicly accessible
# ...
# 7 tests, 0 passed, 0 warnings, 7 failures, 0 exceptions
```

---

## Task 3: Kubernetes Manifest Policies

```rego
# policies/kubernetes/pod_security.rego
package main

# Helper: get all containers (including initContainers)
containers[container] {
    container := input.spec.template.spec.containers[_]
}

containers[container] {
    container := input.spec.template.spec.initContainers[_]
}

# Deny containers without resource limits
deny[msg] {
    container := containers[_]
    not container.resources.limits.cpu
    msg := sprintf("Container '%v' must have a CPU limit set.", [container.name])
}

deny[msg] {
    container := containers[_]
    not container.resources.limits.memory
    msg := sprintf("Container '%v' must have a memory limit set.", [container.name])
}

# Deny root user
deny[msg] {
    container := containers[_]
    container.securityContext.runAsUser == 0
    msg := sprintf("Container '%v' must not run as root (runAsUser: 0).", [container.name])
}

# Deny privilege escalation
deny[msg] {
    container := containers[_]
    container.securityContext.allowPrivilegeEscalation == true
    msg := sprintf("Container '%v' must not allow privilege escalation.", [container.name])
}

# Deny writable root filesystem
deny[msg] {
    container := containers[_]
    container.securityContext.readOnlyRootFilesystem == false
    msg := sprintf("Container '%v' must use a read-only root filesystem.", [container.name])
}

# Deny images not from approved registry
approved_registries := {
    "ghcr.io/myorg/",
    "123456789.dkr.ecr.us-east-1.amazonaws.com/"
}

deny[msg] {
    container := containers[_]
    image := container.image
    not any_approved(image)
    msg := sprintf("Container '%v' uses unapproved image '%v'. Images must come from: %v", [container.name, image, approved_registries])
}

any_approved(image) {
    registry := approved_registries[_]
    startswith(image, registry)
}

# Deny host network
deny[msg] {
    input.spec.template.spec.hostNetwork == true
    msg := "Pods must not use hostNetwork."
}

# Deny privileged containers
deny[msg] {
    container := containers[_]
    container.securityContext.privileged == true
    msg := sprintf("Container '%v' must not be privileged.", [container.name])
}

# Warn on missing security context (rather than deny — be lenient initially)
warn[msg] {
    container := containers[_]
    not container.securityContext
    msg := sprintf("Container '%v' has no securityContext defined. Consider adding security constraints.", [container.name])
}
```

```bash
# Test against K8s manifest
conftest test kubernetes.yaml --policy policies/kubernetes/ --namespace main
```

---

## Task 4: Dockerfile Policy

```rego
# policies/dockerfile/security.rego
package main

# Deny 'latest' tag in FROM
deny[msg] {
    input[i].Cmd == "from"
    image := input[i].Value[0]
    endswith(image, ":latest")
    msg := sprintf("Dockerfile uses 'latest' tag in FROM: '%v'. Pin to a specific version.", [image])
}

deny[msg] {
    input[i].Cmd == "from"
    image := input[i].Value[0]
    not contains(image, ":")
    msg := sprintf("Dockerfile FROM '%v' has no tag. Pin to a specific version.", [image])
}

# Deny EXPOSE 22
deny[msg] {
    input[i].Cmd == "expose"
    port := input[i].Value[_]
    port == "22"
    msg := "Dockerfile exposes port 22 (SSH). Containers should not expose SSH."
}

# Deny apt-get without --no-install-recommends
deny[msg] {
    input[i].Cmd == "run"
    cmd := input[i].Value[0]
    contains(cmd, "apt-get install")
    not contains(cmd, "--no-install-recommends")
    msg := "apt-get install should use --no-install-recommends to minimize image size."
}

# Warn if no USER instruction
warn[msg] {
    not has_user_instruction
    msg := "Dockerfile has no USER instruction. Container will run as root."
}

has_user_instruction {
    input[i].Cmd == "user"
    input[i].Value[0] != "root"
    input[i].Value[0] != "0"
}
```

```bash
# Test Dockerfile policy
# Note: Need to parse Dockerfile to JSON first
conftest test --parser dockerfile Dockerfile --policy policies/dockerfile/
```

---

## Task 5: CIS Kubernetes Benchmark

```rego
# policies/kubernetes/cis_benchmark.rego
package main

# CIS 5.2.1: Do not admit privileged containers
deny[msg] {
    container := input.spec.template.spec.containers[_]
    container.securityContext.privileged == true
    msg := sprintf("[CIS 5.2.1] Container '%v' is privileged. This violates CIS Kubernetes Benchmark.", [container.name])
}

# CIS 5.2.2: Do not admit containers sharing host PID namespace
deny[msg] {
    input.spec.template.spec.hostPID == true
    msg := "[CIS 5.2.2] Pod must not share host PID namespace (hostPID: true)."
}

# CIS 5.2.3: Do not admit containers sharing host IPC namespace
deny[msg] {
    input.spec.template.spec.hostIPC == true
    msg := "[CIS 5.2.3] Pod must not share host IPC namespace (hostIPC: true)."
}

# CIS 5.2.6: Do not admit containers with allowPrivilegeEscalation
deny[msg] {
    container := input.spec.template.spec.containers[_]
    container.securityContext.allowPrivilegeEscalation != false
    msg := sprintf("[CIS 5.2.6] Container '%v' must set allowPrivilegeEscalation: false.", [container.name])
}

# CIS 5.2.7: Do not admit root containers
deny[msg] {
    container := input.spec.template.spec.containers[_]
    container.securityContext.runAsNonRoot != true
    msg := sprintf("[CIS 5.2.7] Container '%v' must set runAsNonRoot: true.", [container.name])
}
```

---

## Task 5b: Policy Unit Tests

```rego
# policies/terraform/aws_security_test.rego
package main

# Test: S3 public ACL should fail
test_deny_s3_public_read {
    deny[_] with input as {
        "resource_changes": [{
            "type": "aws_s3_bucket",
            "address": "aws_s3_bucket.test",
            "change": {"after": {"acl": "public-read"}}
        }]
    }
}

# Test: S3 private ACL should pass (no denies)
test_allow_s3_private {
    count(deny) == 0 with input as {
        "resource_changes": [{
            "type": "aws_s3_bucket",
            "address": "aws_s3_bucket.test",
            "change": {"after": {"acl": "private"}}
        }]
    }
}

# Test: SSH open to internet should fail
test_deny_ssh_open_to_internet {
    deny[_] with input as {
        "resource_changes": [{
            "type": "aws_security_group",
            "address": "aws_security_group.test",
            "change": {"after": {
                "ingress": [{
                    "from_port": 22,
                    "to_port": 22,
                    "protocol": "tcp",
                    "cidr_blocks": ["0.0.0.0/0"]
                }]
            }}
        }]
    }
}
```

```bash
# Run policy unit tests
conftest verify --policy policies/
# or
opa test policies/
```

---

## Task 6: GitHub Actions Policy Gate

```yaml
# .github/workflows/policy-check.yml
name: Policy as Code Checks

on:
  pull_request:
    paths:
      - '**.tf'
      - '**.yaml'
      - '**.yml'
      - 'Dockerfile*'
      - 'policies/**'

permissions:
  contents: read
  pull-requests: write

jobs:
  terraform-policy:
    name: Terraform Policy Gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Conftest
        run: |
          curl -Lo conftest.tar.gz https://github.com/open-policy-agent/conftest/releases/latest/download/conftest_Linux_x86_64.tar.gz
          tar xzf conftest.tar.gz && sudo mv conftest /usr/local/bin/

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3

      - name: Terraform Init & Plan
        run: |
          terraform init
          terraform plan -out=plan.tfplan
          terraform show -json plan.tfplan > plan.json
        working-directory: ./terraform

      - name: Run Policy Checks
        id: policy
        run: |
          conftest test plan.json \
            --policy policies/terraform/ \
            --output json > policy-results.json 2>&1 || true
          
          cat policy-results.json

          # Count failures
          FAILURES=$(cat policy-results.json | jq '[.[] | select(.failures | length > 0)] | length')
          WARNINGS=$(cat policy-results.json | jq '[.[] | select(.warnings | length > 0)] | length')
          echo "failures=$FAILURES" >> $GITHUB_OUTPUT
          echo "warnings=$WARNINGS" >> $GITHUB_OUTPUT

      - name: Post PR Comment
        uses: actions/github-script@v7
        if: always()
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('policy-results.json', 'utf8'));
            
            let failures = [], warnings = [];
            results.forEach(r => {
              failures = failures.concat(r.failures || []);
              warnings = warnings.concat(r.warnings || []);
            });
            
            const status = failures.length > 0 ? '❌' : '✅';
            let body = `## ${status} Policy as Code Results\n\n`;
            
            if (failures.length > 0) {
              body += `### 🚫 Policy Violations (${failures.length})\n`;
              failures.forEach(f => { body += `- ${f.msg}\n`; });
            }
            if (warnings.length > 0) {
              body += `\n### ⚠️ Warnings (${warnings.length})\n`;
              warnings.forEach(w => { body += `- ${w.msg}\n`; });
            }
            if (failures.length === 0) {
              body += `All policy checks passed! ✨\n`;
            }
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body
            });

      - name: Fail on Policy Violations
        if: steps.policy.outputs.failures != '0'
        run: |
          echo "❌ Pipeline blocked: ${{ steps.policy.outputs.failures }} policy violations found"
          exit 1

  kubernetes-policy:
    name: Kubernetes Policy Gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Conftest
        run: |
          curl -Lo conftest.tar.gz https://github.com/open-policy-agent/conftest/releases/latest/download/conftest_Linux_x86_64.tar.gz
          tar xzf conftest.tar.gz && sudo mv conftest /usr/local/bin/

      - name: Scan K8s Manifests
        run: |
          find . -name '*.yaml' -not -path './.git/*' | \
            xargs conftest test --policy policies/kubernetes/ || exit 1
```

---

## ✅ Answers to Reflection Questions

### 1. OPA vs Rego vs Conftest

| Component | What It Is |
|---|---|
| **OPA** (Open Policy Agent) | A general-purpose policy engine — evaluates Rego policies against JSON/YAML data |
| **Rego** | The policy language used to write rules for OPA |
| **Conftest** | A CLI tool that uses OPA to test configuration files (Terraform, K8s, Docker) against Rego policies |

Analogy: Rego = SQL, OPA = database engine, Conftest = query tool

### 2. Handling Exceptions in Conftest

```rego
# Exception approach 1: Annotation-based exceptions
deny[msg] {
    input.spec.template.spec.hostNetwork == true
    not has_exception
    msg := "hostNetwork not allowed"
}

has_exception {
    input.metadata.annotations["policy.company.com/exception"] == "approved-by-security-2024-12-31"
}
```

```bash
# Exception approach 2: Exception data file
conftest test manifest.yaml \
  --policy policies/ \
  --data exceptions.json  # JSON file with approved exceptions
```

```rego
# In your policy, reference the exceptions data
deny[msg] {
    input.metadata.name != data.exceptions.allowed_privileged_pods[_]
    container.securityContext.privileged == true
    msg := "..."
}
```

### 3. Conftest vs OPA Gatekeeper

| | Conftest | OPA Gatekeeper |
|---|---|---|
| **When it runs** | CI/CD pipeline (before deploy) | Kubernetes admission webhook (at deploy time) |
| **What it checks** | Files on disk | Live Kubernetes API requests |
| **Can it block deploys?** | Only if integrated in CI | Yes — real-time enforcement |
| **Use case** | Shift-left (catch early) | Last line of defense |
| **Setup complexity** | Simple (CLI tool) | Complex (CRDs, pods, webhooks) |

**Use both**: Conftest in CI (fast feedback) + Gatekeeper in K8s (enforcement).

### 4. Unit Testing Rego Policies

```bash
# Run OPA tests
opa test policies/ -v

# Coverage report
opa test policies/ --coverage
```

**Why it's important**:
- Policies are code — they have bugs too
- Ensures your "deny" rules actually deny what you think
- Ensures your "allow" rules don't accidentally block valid configs
- Catches regressions when policies are updated
- Required for code review — reviewers can trust tested policies

### 5. Blocking (deny) vs Advisory (warn)

| Approach | When to Use | Risk |
|---|---|---|
| **deny (blocking)** | Security-critical rules: public S3, root containers, SSH open to internet | Developer frustration if too many false positives → they circumvent |
| **warn (advisory)** | Best practices, gradual rollout, things being worked on | Warnings get ignored over time ("warning fatigue") |

**Decision framework**:
- **Always deny**: OWASP Top 10 violations, critical CVEs, publicly exposed data
- **Warn first, then deny**: New policies — warn for 2-4 weeks, measure violations, fix them, then switch to deny
- **Never deny**: Style preferences, opinionated best practices with valid alternatives

**Golden rule**: If a violation of this policy could cause a breach or data loss → `deny`. If it's a "should" not a "must" → `warn`.
