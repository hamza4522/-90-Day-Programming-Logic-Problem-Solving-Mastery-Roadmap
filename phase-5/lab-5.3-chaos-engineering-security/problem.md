# Lab 5.3 — Chaos Engineering for Security
**Phase**: 5 — Expert  
**Difficulty**: ⭐⭐⭐⭐ Expert  
**Estimated Time**: 4–5 hours  
**Category**: Chaos Engineering, Security Resilience, Game Days, Red Team

---

## 🎯 Objective

Apply **chaos engineering principles to security**: inject security failures into your system to verify that your detection, response, and recovery mechanisms actually work. Just as chaos engineering tests reliability (does the system survive a node failure?), **security chaos** tests resilience (does the system detect and respond to an attack?).

---

## 📋 Problem Statement

Your DevSecOps team has deployed every tool from the previous labs: Falco for runtime detection, Prowler for cloud posture, InSpec for compliance, automated incident response playbooks. The CISO asks a simple question:

**"Does any of this actually work in a real incident?"**

Nobody knows. The tools are deployed, alerts are configured, playbooks are written — but they've never been tested under realistic conditions. You have:
- Falco rules that have never triggered in production
- An incident response playbook that's never been executed
- NetworkPolicies that might have gaps
- A Security Champions program but no one has practiced responding to an incident

Your task: Design and execute **Security Game Days** — controlled chaos experiments that verify your security defenses work.

---

## 🛠️ Prerequisites

- Kubernetes cluster (Kind or Minikube — NOT production for initial tests)
- Falco deployed (Lab 3.4)
- Incident response automation (Lab 5.1)
- Network policies (Lab 3.3)
- A brave security team

---

## 📋 Tasks

### Task 1: Design Your Security Chaos Experiments

Create `experiments/experiment-catalog.md` defining at least 6 experiments:

| ID | Experiment | Hypothesis | Blast Radius | Safety |
|---|---|---|---|---|
| SEC-EXP-01 | Shell injection into container | "Falco will detect within 10s and alert Slack within 60s" | Single pod | Safe — test namespace |
| SEC-EXP-02 | Exfiltrate service account token | "Alert fires + token access logged in audit trail" | Single pod | Safe — test SA with no permissions |
| SEC-EXP-03 | Crypto miner process | "Falco detects miner binary name AND mining pool connection" | Single pod | Safe — fake binary, no actual mining |
| SEC-EXP-04 | Network policy bypass | "Pod CANNOT reach database pod directly — NetworkPolicy blocks" | Two pods | Safe — test namespace |
| SEC-EXP-05 | Privilege escalation attempt | "Container cannot gain host privileges; Falco alerts on attempt" | Single pod | Safe — security context blocks |
| SEC-EXP-06 | SSRF to cloud metadata | "Egress NetworkPolicy blocks IMDS endpoint 169.254.169.254" | Single pod | Safe — blocked by policy |

For each experiment, document:
- **Steady state**: What does "normal" look like?
- **Hypothesis**: What SHOULD happen when we inject the failure?
- **Method**: Exact commands to inject the failure
- **Abort criteria**: When to stop the experiment
- **Rollback**: How to restore normal state

### Task 2: Build the Chaos Toolkit

Create scripts that inject security failures on demand:

```bash
# chaos-toolkit/inject-shell.sh
# Simulates an attacker getting shell access to a container

# chaos-toolkit/inject-crypto-miner.sh
# Creates a fake process with a miner-like name and connects to mining pool port

# chaos-toolkit/inject-token-theft.sh
# Reads the Kubernetes service account token (simulating token exfiltration)

# chaos-toolkit/inject-network-escape.sh
# Attempts to reach services outside the pod's allowed NetworkPolicy

# chaos-toolkit/inject-privilege-escalation.sh
# Attempts to mount host filesystem, run as root, change capabilities

# chaos-toolkit/inject-ssrf.sh
# Attempts to reach cloud metadata endpoint (169.254.169.254)
```

Each script should:
1. Log what it's doing (for audit trail)
2. Have a `--dry-run` option
3. Clean up after itself
4. Return structured results (JSON)

### Task 3: Execute Experiments & Record Results

Run each experiment and document results in `experiments/results/`:

For each experiment:
```markdown
# Experiment: SEC-EXP-01 — Shell Injection Detection

## Hypothesis
Falco will detect a shell spawned in a container within 10 seconds
and send a Slack alert within 60 seconds.

## Execution
Date: 2024-06-15 14:00 UTC
Environment: kind-cluster (staging)
Executor: @security-engineer

## Steps
1. Created test pod: `kubectl run test-victim --image=nginx:latest`
2. Injected shell: `kubectl exec test-victim -- /bin/bash`
3. Started timer

## Results
- Falco detection time: ____ seconds
- Slack alert received: ____ seconds
- Alert contained correct pod name: YES / NO
- Alert contained process tree: YES / NO
- Automated response triggered: YES / NO

## Verdict
✅ PASS / ❌ FAIL / ⚠️ PARTIAL

## Follow-up Actions
- [ ] Fix: ___
- [ ] Retest on: ___
```

### Task 4: Game Day Planning

Plan a full **Security Game Day** — a scheduled event where the security team runs attack simulations while the engineering team responds:

Create `game-day-runbook.md`:

1. **Pre-game (1 week before)**:
   - Select attack scenarios (don't tell defenders which ones)
   - Brief participants on rules of engagement
   - Verify monitoring is working
   - Set up a "war room" communication channel
   - Identify abort criteria

2. **Game Day schedule** (4 hours):
   - Hour 1: Warm-up — known scenario, guided walkthrough
   - Hour 2: Attack phase — red team injects 3 scenarios simultaneously
   - Hour 3: Response phase — blue team detects, triages, responds
   - Hour 4: Debrief — what worked, what didn't, action items

3. **Post-game**:
   - Score each scenario (detected? how fast? correct response?)
   - Identify gaps in detection, playbooks, and communication
   - Create improvement tickets
   - Schedule the next game day (quarterly)

### Task 5: Continuous Security Validation

Instead of quarterly game days, implement **continuous security validation** — automated experiments that run on a schedule:

```yaml
# k8s/security-validation-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: security-validation
  namespace: security-testing
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: chaos-runner
              image: security-chaos-toolkit:latest
              command: ["python3", "run-experiments.py"]
              args: ["--experiments", "SEC-EXP-01,SEC-EXP-04,SEC-EXP-06"]
              # Only run safe, non-destructive experiments
          restartPolicy: Never
```

Create `run-experiments.py` that:
1. Runs a suite of security experiments
2. Checks if detection triggered (query Falco/alerting API)
3. Reports pass/fail
4. Sends daily security validation report to Slack
5. Fails loudly if a detection mechanism has stopped working

### Task 6: Measure Security Resilience

Define and track **security resilience metrics**:

| Metric | Definition | How to Measure |
|---|---|---|
| **Detection Coverage** | % of attack types detected by Falco/alerts | Experiments passed / total experiments |
| **MTTD (simulated)** | Average time to detect injected attacks | Timer from injection to first alert |
| **MTTC (simulated)** | Average time to contain injected attacks | Timer from alert to pod isolation |
| **False Negative Rate** | % of injected attacks that went undetected | Missed detections / total injections |
| **Playbook Accuracy** | % of incidents where automated response was correct | Correct responses / total responses |
| **Recovery Time** | Time to restore service after containment | Timer from isolation to service restored |

---

## 📝 Deliverables

1. `experiments/experiment-catalog.md` — catalog of security chaos experiments
2. `chaos-toolkit/` — scripts for injecting security failures
3. `experiments/results/` — documented results of each experiment
4. `game-day-runbook.md` — full Game Day planning guide
5. `k8s/security-validation-cronjob.yaml` — continuous validation CronJob
6. `security-resilience-report.md` — resilience metrics and scorecard

---

## ❓ Questions to Answer

1. What is the difference between **chaos engineering** (Netflix Chaos Monkey) and **penetration testing**? When would you use each?
2. Your CEO asks "why are we attacking ourselves?" How do you explain the value of security chaos experiments to a non-technical executive?
3. An experiment reveals that Falco didn't detect a particular attack. Is this a **Falco failure** or a **rule gap**? How do you fix each?
4. How do you prevent security chaos experiments from causing real incidents? What guardrails are essential?
5. You run a Game Day and the engineering team performs poorly — takes 2 hours to detect an attack. How do you present this to leadership without demoralizing the team?

---

> 💡 **Netflix principle**: "The best way to avoid failure is to fail constantly." — Netflix Chaos Engineering team. The same applies to security: test your defenses by attacking them.

> 📋 **Game Day rule #1**: Never surprise people with a Game Day. Participants must know it's happening (even if they don't know the scenarios). Surprise chaos creates panic, not learning.

---

## 🔗 Useful Links & References

- [Principles of Chaos Engineering](https://principlesofchaos.org/)
- [Chaos Mesh for Kubernetes](https://chaos-mesh.org/)
- [LitmusChaos (CNCF)](https://litmuschaos.io/)
- [MITRE ATT&CK Matrix for Containers](https://attack.mitre.org/matrices/enterprise/containers/)
- [Falco Event Generator](https://github.com/falcosecurity/event-generator)
- [AWS Fault Injection Simulator (FIS)](https://aws.amazon.com/fis/)
- [CNCF Cloud Native Security Whitepaper](https://github.com/cncf/tag-security/blob/main/security-whitepaper/cloud-native-security-whitepaper.md)


