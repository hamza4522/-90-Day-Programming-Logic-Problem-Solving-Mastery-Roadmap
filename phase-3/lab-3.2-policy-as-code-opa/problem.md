# Lab 3.2 — Policy as Code with OPA & Conftest
**Phase**: 3 — Advanced DevSecOps  
**Difficulty**: ⭐⭐⭐ Advanced  
**Estimated Time**: 3–4 hours  
**Category**: Policy as Code, Governance, OPA

---

## 🎯 Objective

Implement **Policy as Code** using Open Policy Agent (OPA) and Conftest to enforce security and compliance rules on Terraform, Kubernetes manifests, and Dockerfiles. Policy as Code turns security rules into version-controlled, testable, automated gates — no more manual checklists.

---

## 📋 Problem Statement

Your company must comply with several security policies from the security team and auditors:
- "No S3 bucket may be publicly accessible"
- "All Kubernetes pods must have resource limits"
- "No container may run as root"
- "All images must come from the approved registry only"
- "SSH port 22 must never be open to 0.0.0.0/0"

Currently, these are just PDF documents that developers ignore. Your job is to encode these as **executable policies** that automatically enforce themselves in the CI/CD pipeline.

---

## 🛠️ Prerequisites

- Docker installed
- Conftest (for testing policies against config files)
- Basic understanding of JSON/YAML

---

## 📋 Tasks

### Task 1: Understand Rego (OPA's Policy Language)

Rego is a declarative language for expressing policies. Before writing policies, understand the basics:

**Study this simple example**:
```rego
package main

# Default: deny everything
default allow = false

# Allow only if user has admin role
allow {
    input.user.role == "admin"
}

# Deny with explanation
deny[msg] {
    not input.user.authenticated
    msg := "User must be authenticated"
}
```

**Your task**: Write a Rego policy (without any tools) that:
1. Denies if `input.environment` is `"production"` AND `input.debug` is `true`
2. Denies if `input.replicas` is less than 2 (for high availability)
3. Returns a descriptive error message for each denial

Test your logic by tracing through these inputs:
- `{"environment": "staging", "debug": true, "replicas": 1}` → should deny (replicas < 2)
- `{"environment": "production", "debug": true, "replicas": 3}` → should deny (debug in prod)
- `{"environment": "production", "debug": false, "replicas": 3}` → should allow

### Task 2: Terraform Policy with Conftest

Create security policies for Terraform that enforce your company's rules:

1. Install Conftest
2. Create `policies/terraform/aws_security.rego` with rules for:
   - Deny S3 buckets with public ACL
   - Deny security groups with SSH open to `0.0.0.0/0`
   - Deny RDS instances with `publicly_accessible = true`
   - Deny EC2 instances without IMDSv2 (http_tokens ≠ "required")
3. Test your policies against the insecure Terraform from Lab 2.5:
   ```bash
   terraform show -json plan.tfplan | conftest test --policy policies/ -
   ```

### Task 3: Kubernetes Manifest Policies

Create `policies/kubernetes/pod_security.rego` that enforces:
- Containers must have CPU and memory limits
- Containers must NOT run as root (`runAsUser != 0`)
- `allowPrivilegeEscalation` must be `false`
- `readOnlyRootFilesystem` must be `true`
- Images must come from `ghcr.io/YOUR_ORG/` only (no Docker Hub)
- No `hostNetwork: true`
- No `privileged: true`

Test against the insecure K8s manifest from Lab 2.5.

### Task 4: Dockerfile Policy

Create `policies/dockerfile/security.rego` that:
- Denies `FROM` with `latest` tag
- Denies any `RUN` command that uses `apt-get` without `--no-install-recommends`
- Warns if no `USER` instruction is present
- Denies `EXPOSE 22` (SSH should not be exposed from containers)

### Task 5: Custom Compliance Framework

Your company must comply with **CIS Kubernetes Benchmark**. Create policies that enforce:
- CIS 5.2.1: Do not admit privileged containers
- CIS 5.2.2: Do not admit containers wishing to share the host process ID namespace
- CIS 5.2.3: Do not admit containers wishing to share the host IPC namespace
- CIS 5.2.6: Do not admit containers with `allowPrivilegeEscalation`
- CIS 5.2.7: Do not admit root containers

### Task 6: CI/CD Integration

Create `.github/workflows/policy-check.yml` that:
- Runs Conftest against all Terraform files on PR
- Runs Conftest against all K8s manifests on PR
- Produces a summary of policy violations as a PR comment
- Blocks merge on any `deny` violations
- Reports `warn` violations as advisory (don't block)

---

## 📝 Deliverables

1. `policies/terraform/aws_security.rego`
2. `policies/kubernetes/pod_security.rego`
3. `policies/kubernetes/cis_benchmark.rego`
4. `policies/dockerfile/security.rego`
5. `policies/terraform/aws_security_test.rego` (unit tests for your policies)
6. `.github/workflows/policy-check.yml`
7. `policy-readme.md` — documentation of each policy and which compliance control it maps to

---

## ❓ Questions to Answer

1. What is the difference between **OPA** (the engine) and **Rego** (the language) and **Conftest** (the testing tool)?
2. Your policy correctly identifies a violation, but the developer says "this is a false positive for our use case." How do you handle exceptions in Conftest?
3. What is **OPA Gatekeeper** and how does it differ from Conftest? When would you use each?
4. How would you write a **unit test** for a Rego policy? Why is this important?
5. What is the risk of making ALL policy violations blocking (`deny`) vs making some advisory (`warn`)? How do you decide which is which?

---

> 💡 **Rego learning resources**:
> - [Rego Playground](https://play.openpolicyagent.org/) — test Rego interactively in browser
> - [OPA documentation](https://www.openpolicyagent.org/docs/latest/policy-language/)
> - [Conftest examples](https://github.com/open-policy-agent/conftest/tree/master/examples)

> 💡 **Tip**: Start with `warn` rules instead of `deny` when first rolling out policies. Measure violations for 2 weeks, fix them, then switch to `deny`.
