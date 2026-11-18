# Lab 4.1 — Compliance as Code with Chef InSpec
**Phase**: 4 — Pro / Leadership  
**Difficulty**: ⭐⭐⭐⭐ Expert  
**Estimated Time**: 4–5 hours  
**Category**: Compliance Automation, Audit Evidence, CIS Benchmarks

---

## 🎯 Objective

Implement **Compliance as Code** using Chef InSpec to automate security compliance verification against CIS Benchmarks, SOC2 controls, and custom organizational policies. Instead of quarterly manual audits, generate continuous compliance evidence automatically.

---

## 📋 Problem Statement

Your company is undergoing a SOC2 Type II audit. The auditors need evidence that:
1. All Linux servers follow CIS Benchmark hardening
2. SSH is configured securely (no root login, key-only auth)
3. File permissions on sensitive files are correct
4. Firewall rules restrict unnecessary access
5. Logging is enabled and configured
6. Password policies meet requirements

Currently, this is verified manually by a system admin running 50+ commands on each server and documenting results in a spreadsheet. This takes 2 weeks and errors are common.

Your job: Automate this entirely with InSpec so compliance can be verified in minutes, evidence is machine-generated, and results are stored for audit purposes.

---

## 🛠️ Prerequisites

- A Linux VM or Docker container (Ubuntu 22.04)
- SSH access to the target (or Docker exec)
- Chef InSpec installed

---

## 📋 Tasks

### Task 1: Install InSpec and Explore

1. Install Chef InSpec:
   ```bash
   # Install via curl
   curl https://omnitruck.chef.io/install.sh | sudo bash -s -- -P inspec
   
   # Or via Docker
   docker pull chef/inspec
   
   # Verify
   inspec version
   ```

2. Run the CIS Distribution Linux Benchmark against a Docker container:
   ```bash
   # Run target container
   docker run -d --name audit-target ubuntu:22.04 sleep 3600
   
   # Run CIS profile against it
   inspec exec https://github.com/dev-sec/linux-baseline \
     -t docker://audit-target \
     --reporter html:/tmp/baseline-report.html cli
   ```

3. Explore the report: how many controls passed? Failed? What are the most critical failures?

### Task 2: Write Your First InSpec Profile

Create an InSpec profile called `company-linux-baseline`:

```bash
inspec init profile company-linux-baseline
cd company-linux-baseline
```

Write controls for these requirements:

**SSH Hardening Controls**:
```ruby
# controls/ssh_hardening.rb (template — fill in the checks)

control 'ssh-01' do
  impact 1.0
  title 'SSH: Disable root login'
  desc 'Root must not be able to log in via SSH directly'
  # Write the check using sshd_config resource
end

control 'ssh-02' do
  impact 1.0
  title 'SSH: Disable password authentication'
  desc 'Only SSH key authentication is permitted'
  # Write the check
end

control 'ssh-03' do
  impact 0.7
  title 'SSH: Set maximum authentication tries'
  desc 'MaxAuthTries must be <= 4'
  # Write the check
end

control 'ssh-04' do
  impact 0.7
  title 'SSH: Disable empty passwords'
  desc 'PermitEmptyPasswords must be no'
  # Write the check
end
```

**File Permission Controls**:
```ruby
# controls/file_permissions.rb

control 'file-01' do
  impact 1.0
  title '/etc/passwd file permissions'
  desc '/etc/passwd must be readable by all but writable only by root'
  # Check: mode 644, owner root, group root
end

control 'file-02' do
  impact 1.0
  title '/etc/shadow file permissions'
  desc '/etc/shadow must be readable only by root and shadow group'
  # Check: mode 640 or 000
end

control 'file-03' do
  impact 0.5
  title '/etc/crontab permissions'
  desc '/etc/crontab must not be world-writable'
  # Check: mode not world-writable
end
```

**OS Security Controls**:
```ruby
# controls/os_security.rb

control 'os-01' do
  impact 1.0
  title 'Ensure /tmp is mounted with noexec'
  desc 'The /tmp directory should be mounted with noexec option'
  # Check mount options
end

control 'os-02' do
  impact 0.7
  title 'Ensure auditd is installed and running'
  desc 'System auditing must be enabled'
  # Check package installed and service running
end

control 'os-03' do
  impact 1.0
  title 'Ensure no unauthorized SUID files exist'
  desc 'SUID programs can be used for privilege escalation'
  # Check: list of SUID files should match approved list
end
```

### Task 3: Map Controls to Compliance Frameworks

Create a `controls/cis_benchmark.rb` that implements CIS Level 1 controls from the CIS Ubuntu 22.04 Benchmark. Map each InSpec control to:
- The **CIS control number** (e.g., 5.2.1)
- The **SOC2 Trust Service Criteria** (e.g., CC6.1)
- The **NIST 800-53 control** (e.g., AC-2)

Use the InSpec `tags` feature:
```ruby
control 'cis-5-2-1' do
  impact 1.0
  title 'CIS 5.2.1 — Ensure permissions on /etc/ssh/sshd_config are configured'
  desc '...'
  tag cis_level: 1
  tag cis_control: '5.2.1'
  tag soc2: 'CC6.1'
  tag nist: 'AC-17'
  # ... checks
end
```

### Task 4: CI/CD Compliance Gate

Create `.github/workflows/compliance.yml` that:
1. Spins up a Docker container representing your "server"
2. Runs your InSpec profile against it
3. Generates an HTML report and JUnit XML
4. Uploads both as artifacts
5. Posts a compliance summary to the PR
6. **Fails the pipeline** if critical controls fail

### Task 5: Compliance Dashboard

Configure InSpec to output results to a format that can be ingested by:
1. **MITRE Heimdall** (free, OSS compliance dashboard)
2. Generate evidence bundle for auditors in JSON format

```bash
# Generate compliance evidence bundle
inspec exec company-linux-baseline \
  -t docker://audit-target \
  --reporter json:/tmp/compliance-$(date +%Y%m%d).json \
              html:/tmp/compliance-$(date +%Y%m%d).html \
              junit:/tmp/compliance-junit.xml \
              cli
```

### Task 6: Automated Remediation

For the 3 most common failures you find:
1. Write an InSpec control that detects the failure
2. Write a corresponding remediation script (bash or Ansible task) that fixes it
3. Run InSpec, fix with remediation, run InSpec again to verify

Document the before-and-after compliance score.

---

## 📝 Deliverables

1. `company-linux-baseline/` — complete InSpec profile
2. `.github/workflows/compliance.yml` — CI integration
3. `compliance-report.html` — HTML compliance report
4. `compliance-evidence.json` — JSON for audit submission
5. `remediation-playbook.yml` — Ansible playbook for auto-remediation
6. `compliance-mapping.md` — control mapping table (CIS → SOC2 → NIST)

---

## ❓ Questions to Answer

1. What is the difference between **InSpec** and **Ansible**? Could you use Ansible for compliance checking instead?
2. Your company is audited against **SOC2 Type II**. What does "Type II" mean and why does continuous compliance evidence (vs a point-in-time snapshot) matter?
3. A control fails on 3 out of 50 servers. How do you track the **exception** without failing the entire compliance report?
4. What is the **risk** of automating remediation? When should you remediate automatically vs alert and let a human fix it?
5. How does Compliance as Code fit into a **shift-left** security strategy? What's the difference between compliance checking at build time vs runtime?

---

> 💡 **Audit tip**: Auditors don't just want a compliance report — they want **evidence of continuous compliance**. A compliance pipeline that runs daily and stores historical results (with timestamps, signatures) is far more valuable than a manual spreadsheet.

> 📋 **CIS Benchmarks**: Available free at [cisecurity.org](https://www.cisecurity.org/cis-benchmarks). The Level 1 benchmark is appropriate for most environments. Level 2 is for high-security environments.
