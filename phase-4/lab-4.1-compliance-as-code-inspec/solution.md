# Lab 4.1 — Compliance as Code Solution Guide
**Phase**: 4 — Pro / Leadership

---

## Task 1: InSpec Installation

```bash
# Install InSpec (Linux)
curl https://omnitruck.chef.io/install.sh | sudo bash -s -- -P inspec

# macOS
brew install chef/chef/inspec

# Windows (Chocolatey)
choco install inspec

# Via Docker (no install)
alias inspec="docker run -it --rm -v $(pwd):/share chef/inspec"

# Verify
inspec version

# Run CIS baseline against a Docker container
docker run -d --name audit-target ubuntu:22.04 sleep 3600

# Download and run the dev-sec linux-baseline profile
inspec exec https://github.com/dev-sec/linux-baseline \
  -t docker://audit-target \
  --reporter html:/tmp/report.html cli

# Or run the official CIS profile (requires license)
inspec exec https://github.com/dev-sec/cis-ubuntu22.04-benchmark \
  -t docker://audit-target \
  --reporter cli html:/tmp/cis-report.html
```

---

## Task 2: Complete InSpec Profile

```ruby
# controls/ssh_hardening.rb
title 'SSH Hardening Controls'

# SSH configuration file location
SSH_CONFIG = '/etc/ssh/sshd_config'

control 'ssh-01' do
  impact 1.0
  title 'SSH: Disable root login'
  desc <<~DESC
    The root user should never be able to log in via SSH.
    If an attacker compromises a user account, having PermitRootLogin disabled
    prevents direct root access and forces them to use privilege escalation,
    which can be detected and prevented.
  DESC
  tag cis_control: '5.2.10'
  tag soc2: 'CC6.1'
  tag remediation: "Set 'PermitRootLogin no' in #{SSH_CONFIG} and restart sshd"

  describe sshd_config do
    its('PermitRootLogin') { should eq 'no' }
  end
end

control 'ssh-02' do
  impact 1.0
  title 'SSH: Disable password authentication'
  desc 'Only SSH key authentication is permitted. Passwords are vulnerable to brute force.'
  tag cis_control: '5.2.12'
  tag soc2: 'CC6.1'
  tag nist: 'IA-2'

  describe sshd_config do
    its('PasswordAuthentication') { should eq 'no' }
    its('ChallengeResponseAuthentication') { should eq 'no' }
    its('KbdInteractiveAuthentication') { should eq 'no' }
  end
end

control 'ssh-03' do
  impact 0.7
  title 'SSH: Set maximum authentication tries to <= 4'
  desc 'Limiting auth tries prevents brute force attacks.'
  tag cis_control: '5.2.7'
  tag nist: 'AC-7'

  describe sshd_config do
    its('MaxAuthTries') { should cmp <= 4 }
  end
end

control 'ssh-04' do
  impact 1.0
  title 'SSH: Disable empty passwords'
  desc 'Empty passwords are a severe security risk.'
  tag cis_control: '5.2.11'

  describe sshd_config do
    its('PermitEmptyPasswords') { should eq 'no' }
  end
end

control 'ssh-05' do
  impact 0.5
  title 'SSH: Set idle timeout'
  desc 'Idle SSH sessions should be terminated after inactivity.'
  tag cis_control: '5.2.16'

  describe sshd_config do
    its('ClientAliveInterval') { should cmp <= 300 }
    its('ClientAliveCountMax') { should cmp <= 3 }
  end
end

control 'ssh-06' do
  impact 0.7
  title 'SSH: Use strong ciphers only'
  desc 'Weak ciphers can be broken, allowing MITM attacks on SSH sessions.'

  describe sshd_config do
    its('Ciphers') { should match /aes256-gcm/ }
    its('Ciphers') { should_not match /3des/ }
    its('Ciphers') { should_not match /arcfour/ }
  end
end
```

```ruby
# controls/file_permissions.rb
title 'File Permission Controls'

control 'file-01' do
  impact 1.0
  title '/etc/passwd permissions and ownership'
  desc '/etc/passwd: 644, root:root'
  tag cis_control: '6.1.2'
  tag soc2: 'CC6.1'

  describe file('/etc/passwd') do
    it { should exist }
    its('mode') { should cmp '0644' }
    its('owner') { should eq 'root' }
    its('group') { should eq 'root' }
  end
end

control 'file-02' do
  impact 1.0
  title '/etc/shadow permissions and ownership'
  desc '/etc/shadow should be readable only by root (and shadow group)'
  tag cis_control: '6.1.3'
  tag soc2: 'CC6.1'

  describe file('/etc/shadow') do
    it { should exist }
    its('owner') { should eq 'root' }
    its('mode') { should cmp '0640' }
  end
end

control 'file-03' do
  impact 0.5
  title '/etc/crontab is not world-writable'
  tag cis_control: '5.1.2'

  describe file('/etc/crontab') do
    it { should exist }
    its('owner') { should eq 'root' }
    it { should_not be_writable.by('group') }
    it { should_not be_writable.by('other') }
    it { should_not be_readable.by('other') }
  end
end

control 'file-04' do
  impact 1.0
  title 'No world-writable files exist outside /tmp'
  desc 'World-writable files can be modified by any user — a privilege escalation risk.'
  tag cis_control: '6.1.11'

  command("find / -xdev -type f -perm -0002 -not -path '/tmp/*' -not -path '/proc/*' 2>/dev/null").stdout.strip.split("\n").each do |f|
    next if f.empty?
    describe file(f) do
      it { should_not be_writable.by('other') }
    end
  end
end
```

```ruby
# controls/os_security.rb
title 'Operating System Security Controls'

control 'os-01' do
  impact 1.0
  title '/tmp mounted with noexec'
  desc 'The /tmp directory must be mounted with noexec to prevent running binaries from /tmp'
  tag cis_control: '1.1.3'
  tag nist: 'CM-7'

  describe mount('/tmp') do
    its('options') { should include 'noexec' }
    its('options') { should include 'nosuid' }
    its('options') { should include 'nodev' }
  end
end

control 'os-02' do
  impact 0.7
  title 'auditd is installed and running'
  desc 'System audit logging must be enabled and running.'
  tag cis_control: '4.1.1.1'
  tag soc2: 'CC7.2'
  tag nist: 'AU-2'

  describe package('auditd') do
    it { should be_installed }
  end

  describe service('auditd') do
    it { should be_enabled }
    it { should be_running }
  end
end

control 'os-03' do
  impact 1.0
  title 'Unapproved SUID binaries'
  desc 'Only approved SUID binaries are permitted.'
  tag cis_control: '6.1.13'
  tag nist: 'CM-7'

  approved_suid = %w[
    /usr/bin/sudo
    /usr/bin/passwd
    /usr/bin/newgrp
    /usr/bin/gpasswd
    /usr/bin/chfn
    /usr/bin/chsh
    /usr/bin/su
    /bin/ping
    /usr/bin/pkexec
    /usr/lib/openssh/ssh-keysign
  ]

  actual_suid = command("find / -xdev -type f -perm -4000 -not -path '/proc/*' 2>/dev/null").stdout.strip.split("\n")

  actual_suid.each do |f|
    describe file(f) do
      it "#{f} should be in the approved SUID list" do
        expect(approved_suid).to include(f)
      end
    end
  end
end

control 'os-04' do
  impact 0.7
  title 'Firewall (ufw or iptables) is active'
  desc 'A host-based firewall must be enabled.'
  tag cis_control: '3.4.1'
  tag nist: 'SC-7'

  # Check UFW (Ubuntu) or iptables
  describe.one do
    describe service('ufw') do
      it { should be_enabled }
      it { should be_running }
    end

    describe service('firewalld') do
      it { should be_enabled }
      it { should be_running }
    end
  end
end

control 'os-05' do
  impact 0.5
  title 'Core dumps are restricted'
  desc 'Core dumps may contain sensitive data from memory.'
  tag cis_control: '1.5.1'

  describe limits_conf do
    its('*') { should include ['hard', 'core', '0'] }
  end
end
```

---

## Task 4: GitHub Actions Compliance Pipeline

```yaml
# .github/workflows/compliance.yml
name: Compliance as Code

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * *'  # Daily compliance check at 6am

permissions:
  contents: read
  pull-requests: write

jobs:
  compliance-check:
    name: Linux Baseline Compliance
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Target Environment
        run: |
          # Create a "server" container to audit
          docker run -d \
            --name compliance-target \
            ubuntu:22.04 \
            sleep 3600

          # Apply intentional misconfigurations for testing
          docker exec compliance-target bash -c "
            apt-get update -qq && apt-get install -y openssh-server auditd -qq
            # Intentional: Leave some settings unconfigured for demo
            echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config
          "

      - name: Install InSpec
        run: |
          curl https://omnitruck.chef.io/install.sh | sudo bash -s -- -P inspec
          inspec version

      - name: Run Compliance Checks
        id: compliance
        run: |
          # Run company baseline
          inspec exec company-linux-baseline \
            -t docker://compliance-target \
            --reporter cli \
                        html:compliance-report.html \
                        json:compliance-report.json \
                        junit:compliance-junit.xml \
            --no-color || true  # Don't fail here, analyze below

          # Extract pass/fail counts
          PASSED=$(cat compliance-report.json | jq '[.profiles[].controls[] | select(.results[].status == "passed")] | length')
          FAILED=$(cat compliance-report.json | jq '[.profiles[].controls[] | select(.results[].status == "failed")] | length')
          CRITICAL_FAIL=$(cat compliance-report.json | jq '[.profiles[].controls[] | select(.impact == 1.0 and .results[].status == "failed")] | length')

          echo "passed=$PASSED" >> $GITHUB_OUTPUT
          echo "failed=$FAILED" >> $GITHUB_OUTPUT
          echo "critical_failed=$CRITICAL_FAIL" >> $GITHUB_OUTPUT

          echo "=== Compliance Summary ==="
          echo "✅ Passed: $PASSED"
          echo "❌ Failed: $FAILED"
          echo "🔴 Critical Failures: $CRITICAL_FAIL"

      - name: Post PR Comment
        uses: actions/github-script@v7
        if: github.event_name == 'pull_request'
        with:
          script: |
            const passed = '${{ steps.compliance.outputs.passed }}';
            const failed = '${{ steps.compliance.outputs.failed }}';
            const critical = '${{ steps.compliance.outputs.critical_failed }}';
            const total = parseInt(passed) + parseInt(failed);
            const score = total > 0 ? (parseInt(passed) / total * 100).toFixed(1) : 0;
            const status = parseInt(critical) > 0 ? '❌' : parseInt(failed) > 0 ? '⚠️' : '✅';

            const body = `## ${status} Compliance Report
            | Metric | Count |
            |---|---|
            | ✅ Passed Controls | ${passed} |
            | ❌ Failed Controls | ${failed} |
            | 🔴 Critical Failures | ${critical} |
            | 📊 Compliance Score | ${score}% |

            ${parseInt(critical) > 0 ? '❌ **Pipeline blocked** — fix critical compliance failures.' : '✅ No critical failures.'}

            _[Download full HTML report from pipeline artifacts]_`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body
            });

      - name: Upload Reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: compliance-reports-${{ github.run_number }}
          path: |
            compliance-report.html
            compliance-report.json
            compliance-junit.xml
          retention-days: 365  # Keep for 1 year (audit evidence)

      - name: Upload JUnit Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: compliance-junit
          path: compliance-junit.xml

      - name: Fail on Critical Failures
        if: steps.compliance.outputs.critical_failed != '0'
        run: |
          echo "❌ ${{ steps.compliance.outputs.critical_failed }} critical compliance failures found!"
          exit 1

      - name: Cleanup
        if: always()
        run: docker rm -f compliance-target || true
```

---

## Task 6: Remediation Playbook

```yaml
# remediation-playbook.yml (Ansible)
---
- name: Linux Security Baseline Remediation
  hosts: all
  become: yes
  
  tasks:
    # Fix: ssh-01 — Disable root login
    - name: "CIS 5.2.10 — Disable SSH root login"
      lineinfile:
        path: /etc/ssh/sshd_config
        regexp: '^#?PermitRootLogin'
        line: 'PermitRootLogin no'
        state: present
      notify: restart sshd

    # Fix: ssh-02 — Disable password auth
    - name: "CIS 5.2.12 — Disable SSH password authentication"
      lineinfile:
        path: /etc/ssh/sshd_config
        regexp: '^#?PasswordAuthentication'
        line: 'PasswordAuthentication no'
      notify: restart sshd

    # Fix: ssh-03 — MaxAuthTries
    - name: "CIS 5.2.7 — Set SSH MaxAuthTries"
      lineinfile:
        path: /etc/ssh/sshd_config
        regexp: '^#?MaxAuthTries'
        line: 'MaxAuthTries 4'
      notify: restart sshd

    # Fix: os-01 — /tmp noexec
    - name: "CIS 1.1.3 — Mount /tmp with noexec"
      mount:
        path: /tmp
        src: tmpfs
        fstype: tmpfs
        opts: "defaults,noexec,nosuid,nodev"
        state: mounted

    # Fix: os-02 — auditd
    - name: "CIS 4.1.1.1 — Install auditd"
      package:
        name: auditd
        state: present

    - name: "CIS 4.1.1.1 — Enable and start auditd"
      service:
        name: auditd
        enabled: yes
        state: started

    # Fix: file-01 — /etc/passwd permissions
    - name: "CIS 6.1.2 — Set /etc/passwd permissions"
      file:
        path: /etc/passwd
        owner: root
        group: root
        mode: '0644'

    # Fix: file-02 — /etc/shadow permissions
    - name: "CIS 6.1.3 — Set /etc/shadow permissions"
      file:
        path: /etc/shadow
        owner: root
        group: shadow
        mode: '0640'

  handlers:
    - name: restart sshd
      service:
        name: sshd
        state: restarted
```

---

## ✅ Answers to Reflection Questions

### 1. InSpec vs Ansible

| | InSpec | Ansible |
|---|---|---|
| **Purpose** | Audit/Verify (read-only) | Configure/Remediate (read-write) |
| **What it does** | Tests if a state IS correct | Makes the state correct |
| **Output** | Pass/Fail compliance report | Changed/OK task output |
| **Idempotent** | Yes (read-only, always safe) | Yes (designed for it) |
| **Use for compliance?** | Primary tool — verify state | Remediation — fix the state |

**Could you use Ansible for compliance checking?** 
Yes — via `--check` mode (dry run) or `assert` tasks. But InSpec is purpose-built for compliance testing with better reporting, compliance framework mapping (CIS, NIST), and audit trail features.

**Best practice**: Use **both** — Ansible to configure, InSpec to verify Ansible did the right thing.

### 2. SOC2 Type I vs Type II

| | Type I | Type II |
|---|---|---|
| **What it covers** | Point-in-time audit — controls EXIST | Period audit — controls WORK over time |
| **Duration** | Single day | Minimum 6 months of evidence |
| **Evidence** | "We have this policy" | "This policy worked from Jan-Jun 2024" |
| **Value to customers** | Low — easy to fake | High — proves ongoing effectiveness |

**Why continuous compliance matters for Type II**: Auditors for SOC2 Type II want 6 months of logs, evidence, and test results. A compliance pipeline that runs daily and stores results with timestamps provides automatic audit evidence. Manual quarterly audits provide a spreadsheet — far less convincing than 180 days of automated test results.

### 3. Handling Exceptions

```ruby
# InSpec exception tagging
control 'ssh-02' do
  impact 1.0
  title 'SSH: Disable password authentication'
  
  # Document the exception inline
  only_if('Exception: Legacy system ABC requires password auth until Q2 2025 — approved by CISO on 2024-01-15') do
    !system_has_exception?('ssh-02-password-auth')
  end

  describe sshd_config do
    its('PasswordAuthentication') { should eq 'no' }
  end
end
```

```bash
# Or use InSpec waiver file (exception management)
# waivers.yml
ssh-02:
  expiration_date: 2025-06-30
  run: false  # Skip this control
  justification: "Legacy integration requires password auth. Ticket: SEC-123. Approved: CISO 2024-01-15"
```

```bash
# Run with waivers
inspec exec company-baseline -t ssh://server --waiver-file waivers.yml
```

### 4. Risk of Automated Remediation

**Risks of full automation**:
- **Unintended outages**: Automatically restarting `sshd` during peak hours could disconnect admins
- **Breaking changes**: "Fixing" a setting that a legacy app depends on
- **Change management violation**: Most enterprises require change tickets for production changes
- **Cascading failures**: One fix triggers another service failure

**Decision framework**:
| Remediation Type | Approach |
|---|---|
| Low-risk, reversible (file permission) | Automate → log the change |
| Medium-risk (sshd_config) | Automate in off-hours → notify ops team |
| High-risk (firewall rules, service restart) | Alert only → human approval required |
| Critical production systems | NEVER automate → human review mandatory |

**Best approach**: Alert + Ansible "auto-remediation playbook" that humans can run one-click after reviewing.

### 5. Compliance as Code in Shift-Left

**Traditional (right)**: Compliance audited quarterly, post-deployment → fixing issues is expensive and slow.

**Shift-left compliance**:
- **Build time**: InSpec in CI checks if your Dockerfile/IaC generates a compliant image/infra
- **Deploy time**: Compliance check against the staging environment before production promotion
- **Runtime**: Continuous compliance drift detection (detect if prod drifts from policy)

```
Developer         CI/CD              Production
    │               │                    │
    │ Write code     │ Build + Scan       │ Runtime audit
    │               │ InSpec (fast)      │ InSpec (daily)
    │               │ ← catches 80%      │ ← catches drift
    │               │                    │
Cost to fix: $1   $10                  $100
```

Catching a missing audit log configuration at **code review time** costs minutes. Catching it during a SOC2 audit costs weeks of remediation + potential audit finding + legal exposure.
