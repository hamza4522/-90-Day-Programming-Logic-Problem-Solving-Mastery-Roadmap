# Lab 5.3 — Chaos Engineering for Security Solution Guide
**Phase**: 5 — Expert

---

## Task 1: Experiment Catalog

```markdown
# experiments/experiment-catalog.md

## Experiment Registry

### SEC-EXP-01: Shell Injection Detection
**Category**: Runtime Detection
**Steady state**: No shell processes running in application containers
**Hypothesis**: Falco detects shell spawn within 10s; Slack alert within 60s
**Method**:
  ```bash
  kubectl exec $POD -- /bin/bash -c "echo 'shell test'"
  ```
**Abort**: If pod becomes unresponsive
**Rollback**: Delete test pod
**Risk**: None — read-only test

---

### SEC-EXP-02: Service Account Token Exfiltration
**Category**: Runtime Detection
**Steady state**: SA token file is accessible but not read by application
**Hypothesis**: Falco alerts when process reads /var/run/secrets/kubernetes.io/serviceaccount/token
**Method**:
  ```bash
  kubectl exec $POD -- cat /var/run/secrets/kubernetes.io/serviceaccount/token
  ```
**Abort**: N/A (instant command)
**Rollback**: None needed
**Risk**: Low — test SA has no RBAC permissions

---

### SEC-EXP-03: Crypto Miner Detection
**Category**: Runtime Detection
**Steady state**: No mining processes, no connections to mining pools
**Hypothesis**: Falco detects process named "xmrig" AND connection to port 3333
**Method**:
  ```bash
  # Simulate miner process (not actually mining)
  kubectl exec $POD -- bash -c "cp /bin/sleep /tmp/xmrig && /tmp/xmrig 10 &"
  # Simulate mining pool connection
  kubectl exec $POD -- bash -c "curl -s --connect-timeout 3 http://pool.example.com:3333 || true"
  ```
**Abort**: Kill process if it consumes resources
**Rollback**: `kubectl exec $POD -- rm /tmp/xmrig`
**Risk**: Low — sleep binary renamed, no actual mining

---

### SEC-EXP-04: Network Policy Bypass
**Category**: Network Controls
**Steady state**: Pods can only reach services allowed by NetworkPolicy
**Hypothesis**: Pod in namespace-a CANNOT reach database in namespace-b
**Method**:
  ```bash
  # From app pod, try to reach database pod directly
  kubectl exec app-pod -n namespace-a -- curl -s --connect-timeout 5 db-svc.namespace-b:5432
  # Expected: connection timeout or refused
  ```
**Abort**: N/A
**Rollback**: None
**Risk**: None — read-only network test

---

### SEC-EXP-05: Privilege Escalation
**Category**: Container Security
**Steady state**: Containers run as non-root with dropped capabilities
**Hypothesis**: Container cannot gain root, mount host filesystem, or change capabilities
**Method**:
  ```bash
  # Try to become root
  kubectl exec $POD -- sudo su - 2>&1
  # Try to mount host filesystem
  kubectl exec $POD -- mount /dev/sda1 /mnt 2>&1
  # Try to load kernel module
  kubectl exec $POD -- insmod /tmp/test.ko 2>&1
  # All should FAIL
  ```
**Abort**: If any command succeeds — CRITICAL finding
**Rollback**: Delete pod if compromised
**Risk**: Medium — if controls fail, attacker gains host access

---

### SEC-EXP-06: SSRF to Cloud Metadata
**Category**: Network Controls
**Steady state**: Pods cannot reach cloud metadata endpoint
**Hypothesis**: Egress NetworkPolicy blocks 169.254.169.254
**Method**:
  ```bash
  kubectl exec $POD -- curl -s --connect-timeout 5 http://169.254.169.254/latest/meta-data/
  # Expected: timeout (blocked by NetworkPolicy)
  ```
**Abort**: If metadata is accessible — CRITICAL finding
**Rollback**: None
**Risk**: Low — only reading metadata, not modifying
```

---

## Task 2: Chaos Toolkit Scripts

```bash
#!/bin/bash
# chaos-toolkit/inject-shell.sh
# Injects a shell into a container and measures detection time

set -euo pipefail

POD="${1:?Usage: $0 <pod-name> <namespace> [--dry-run]}"
NS="${2:?Usage: $0 <pod-name> <namespace> [--dry-run]}"
DRY_RUN="${3:-}"

EXPERIMENT_ID="SEC-EXP-01"
START_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
START_EPOCH=$(date +%s)

echo "{"
echo "  \"experiment\": \"${EXPERIMENT_ID}\","
echo "  \"description\": \"Shell injection detection test\","
echo "  \"target_pod\": \"${POD}\","
echo "  \"target_namespace\": \"${NS}\","
echo "  \"start_time\": \"${START_TIME}\","

if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "  \"mode\": \"dry-run\","
    echo "  \"actions\": [\"Would exec /bin/sh in ${NS}/${POD}\"],"
    echo "  \"status\": \"skipped\""
    echo "}"
    exit 0
fi

echo "  \"mode\": \"live\","

# Inject: exec a shell and run a distinctive command
echo "  \"injection_time\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
kubectl exec "$POD" -n "$NS" -- /bin/sh -c \
  "echo 'CHAOS-TEST-${EXPERIMENT_ID}' > /dev/null; whoami; id; cat /etc/hostname" \
  2>/dev/null

INJECT_EPOCH=$(date +%s)

# Wait for Falco alert (poll Falcosidekick API or check logs)
echo "  \"waiting_for_detection\": true,"
DETECTED=false
DETECT_TIME=0

for i in $(seq 1 60); do
    # Check Falco logs for our pod
    ALERT=$(kubectl logs -l app.kubernetes.io/name=falco -n falco --since=120s 2>/dev/null | \
            grep -c "${POD}" || true)

    if [ "$ALERT" -gt 0 ]; then
        DETECT_EPOCH=$(date +%s)
        DETECT_TIME=$((DETECT_EPOCH - INJECT_EPOCH))
        DETECTED=true
        break
    fi
    sleep 1
done

echo "  \"detected\": ${DETECTED},"
echo "  \"detection_time_seconds\": ${DETECT_TIME},"

if $DETECTED; then
    if [ "$DETECT_TIME" -le 10 ]; then
        echo "  \"verdict\": \"PASS\","
        echo "  \"message\": \"Detected in ${DETECT_TIME}s (target: <10s)\""
    else
        echo "  \"verdict\": \"PARTIAL\","
        echo "  \"message\": \"Detected in ${DETECT_TIME}s (target: <10s) — slow detection\""
    fi
else
    echo "  \"verdict\": \"FAIL\","
    echo "  \"message\": \"NOT DETECTED within 60s — Falco rule gap!\""
fi

echo "}"
```

```bash
#!/bin/bash
# chaos-toolkit/inject-network-escape.sh
# Tests if NetworkPolicies properly block unauthorized traffic

set -euo pipefail

POD="${1:?Usage: $0 <pod-name> <namespace>}"
NS="${2:?Usage: $0 <pod-name> <namespace>}"

TARGETS=(
    "169.254.169.254:80:IMDS metadata"
    "kubernetes.default.svc:443:K8s API"
    "10.96.0.1:443:K8s API ClusterIP"
)

echo "{"
echo "  \"experiment\": \"SEC-EXP-04/06\","
echo "  \"description\": \"Network policy bypass test\","
echo "  \"target_pod\": \"${POD}\","
echo "  \"results\": ["

FIRST=true
ALL_BLOCKED=true

for target_info in "${TARGETS[@]}"; do
    IFS=':' read -r HOST PORT DESC <<< "$target_info"

    $FIRST || echo "    ,"
    FIRST=false

    # Try to connect
    RESULT=$(kubectl exec "$POD" -n "$NS" -- \
        timeout 5 sh -c "echo > /dev/tcp/${HOST}/${PORT}" 2>&1 && echo "OPEN" || echo "BLOCKED")

    BLOCKED=true
    if echo "$RESULT" | grep -q "OPEN"; then
        BLOCKED=false
        ALL_BLOCKED=false
    fi

    echo "    {"
    echo "      \"target\": \"${HOST}:${PORT}\","
    echo "      \"description\": \"${DESC}\","
    echo "      \"blocked\": ${BLOCKED},"
    echo "      \"verdict\": \"$($BLOCKED && echo 'PASS' || echo 'FAIL')\""
    echo "    }"
done

echo "  ],"
echo "  \"all_blocked\": ${ALL_BLOCKED},"
echo "  \"verdict\": \"$($ALL_BLOCKED && echo 'PASS' || echo 'FAIL')\""
echo "}"
```

```bash
#!/bin/bash
# chaos-toolkit/inject-privilege-escalation.sh
# Tests container security context restrictions

set -euo pipefail

POD="${1:?Usage: $0 <pod-name> <namespace>}"
NS="${2:?Usage: $0 <pod-name> <namespace>}"

echo "{"
echo "  \"experiment\": \"SEC-EXP-05\","
echo "  \"description\": \"Privilege escalation prevention test\","
echo "  \"tests\": ["

# Test 1: Running as non-root
WHOAMI=$(kubectl exec "$POD" -n "$NS" -- whoami 2>/dev/null || echo "error")
echo "    {\"test\": \"non-root user\", \"result\": \"$WHOAMI\", \"pass\": $([ "$WHOAMI" != "root" ] && echo true || echo false)},"

# Test 2: Cannot sudo
SUDO_RESULT=$(kubectl exec "$POD" -n "$NS" -- sudo id 2>&1 || echo "denied")
SUDO_BLOCKED=$(echo "$SUDO_RESULT" | grep -qiE "denied|not found|not allowed" && echo true || echo false)
echo "    {\"test\": \"sudo blocked\", \"pass\": $SUDO_BLOCKED},"

# Test 3: Cannot mount filesystems
MOUNT_RESULT=$(kubectl exec "$POD" -n "$NS" -- mount -t tmpfs none /mnt 2>&1 || echo "denied")
MOUNT_BLOCKED=$(echo "$MOUNT_RESULT" | grep -qiE "denied|not permitted|operation not" && echo true || echo false)
echo "    {\"test\": \"mount blocked\", \"pass\": $MOUNT_BLOCKED},"

# Test 4: Read-only root filesystem (if configured)
WRITE_RESULT=$(kubectl exec "$POD" -n "$NS" -- touch /test-write 2>&1 || echo "read-only")
READONLY=$(echo "$WRITE_RESULT" | grep -qiE "read-only|denied" && echo true || echo false)
echo "    {\"test\": \"read-only rootfs\", \"pass\": $READONLY},"

# Test 5: Cannot access host PID namespace
HOST_PROCS=$(kubectl exec "$POD" -n "$NS" -- ls /proc/ 2>/dev/null | wc -l)
ISOLATED=$([ "$HOST_PROCS" -lt 50 ] && echo true || echo false)
echo "    {\"test\": \"PID namespace isolated\", \"process_count\": $HOST_PROCS, \"pass\": $ISOLATED}"

echo "  ]"
echo "}"
```

---

## Task 3: Experiment Results Template

```markdown
# experiments/results/SEC-EXP-01-results.md

# Experiment: SEC-EXP-01 — Shell Injection Detection

## Metadata
| Field | Value |
|---|---|
| **Date** | 2024-06-15 14:00 UTC |
| **Environment** | kind-cluster (staging) |
| **Executor** | @sarah-security |
| **Duration** | 5 minutes |

## Hypothesis
> Falco will detect a shell spawned inside an application container within 10 seconds
> and trigger a Slack alert within 60 seconds.

## Execution Log

| Time | Action | Result |
|---|---|---|
| 14:00:00 | Created test pod `nginx-test` in `chaos-testing` namespace | Pod running |
| 14:00:15 | Exec'd into pod: `kubectl exec nginx-test -- /bin/bash` | Shell opened |
| 14:00:16 | Timer started | - |
| 14:00:19 | Falco log entry: "Terminal shell in container" | **Detected in 3 seconds** ✅ |
| 14:00:22 | Falcosidekick processed event | - |
| 14:00:25 | Slack alert received in #security-alerts | **Alert in 9 seconds** ✅ |
| 14:00:25 | Automated playbook triggered | Evidence collection started |
| 14:00:47 | Pod isolated via automated response | **Contained in 31 seconds** ✅ |

## Measurements

| Metric | Target | Actual | Verdict |
|---|---|---|---|
| Detection time (Falco) | < 10s | **3s** | ✅ PASS |
| Alert time (Slack) | < 60s | **9s** | ✅ PASS |
| Containment time (auto-response) | < 120s | **31s** | ✅ PASS |
| Alert accuracy (correct pod) | Yes | **Yes** | ✅ PASS |
| Process tree in alert | Yes | **Yes** | ✅ PASS |

## Verdict: ✅ PASS

## Observations
- Falco eBPF detection is near-instantaneous (3s)
- Falcosidekick → Slack adds ~6s latency (acceptable)
- Automated evidence collection adds ~22s but is thorough
- Alert message included full process tree: `nginx (PID 1) → bash (PID 15)`

## Follow-up Actions
- [x] No issues found — detection and response working as designed
- [ ] Consider adding container image hash to alert message
```

---

## Task 4: Game Day Runbook

```markdown
# game-day-runbook.md — Security Game Day Planning Guide

## Overview
A Security Game Day is a scheduled event (4 hours) where the red team (security engineers)
runs controlled attack simulations while the blue team (engineering + champions) detects
and responds. The goal is LEARNING, not blame.

## Pre-Game Checklist (T minus 1 week)

### Red Team Prep
- [ ] Select 3-5 attack scenarios from the experiment catalog
- [ ] Verify all chaos scripts work in staging environment
- [ ] Prepare "hints" for blue team if they get stuck (30-min, 60-min, 90-min reveals)
- [ ] Create scoring rubric for each scenario
- [ ] Set up dedicated "red team" Slack channel (private)
- [ ] Brief red team on safety rules and abort criteria

### Blue Team Prep
- [ ] Announce Game Day date to all participants (no surprise game days!)
- [ ] Confirm monitoring dashboards are accessible
- [ ] Verify alerting channels are working (Slack, PagerDuty)
- [ ] Brief blue team: "You will be tested. Use your existing tools and playbooks."
- [ ] Set up "war room" Slack channel for blue team coordination
- [ ] Ensure incident response documentation is accessible

### Safety
- [ ] Game Day runs in STAGING environment only (never production for first attempt)
- [ ] All participants have the "ABORT" keyword — anyone can stop the exercise
- [ ] Red team has rollback scripts for every injection
- [ ] Security engineer is monitoring staging to catch unexpected effects
- [ ] Production team is NOT participating (they watch prod for real incidents)

## Game Day Schedule

### 13:00 — Kickoff (30 min)
- Welcome and ground rules
- Review: what tools are available (Falco, Grafana, kubectl, playbooks)
- Warm-up scenario: guided walkthrough of SEC-EXP-01 (shell detection)
- Blue team practices: find alert, read it, determine next step

### 13:30 — Attack Phase (90 min)
Red team injects scenarios at staggered intervals:
- 13:30 → Scenario A (detection-focused)
- 13:45 → Scenario B (network-focused)
- 14:15 → Scenario C (multi-step attack chain)

Blue team works to:
1. Detect each scenario
2. Assess severity
3. Execute appropriate playbook
4. Contain the threat
5. Document actions taken

### 15:00 — Reveal & Debrief (60 min)
- Red team reveals all scenarios (including any undetected ones!)
- Walk through each timeline: injection → detection → response
- Score each scenario:
  - Detected: +2 points
  - Correctly classified: +1 point
  - Contained within SLA: +2 points
  - Evidence collected: +1 point
  - Playbook followed: +1 point
  - Undetected: 0 points (not a punishment — a learning opportunity)
- Identify gaps: what wasn't detected? Why?
- Celebrate wins: what worked well?

### 16:00 — Action Items (30 min)
- Create JIRA tickets for each gap found
- Assign owners and due dates
- Schedule next Game Day (quarterly recommended)
- Send summary to leadership

## Scoring Rubric

| Scenario | Detected | Time to Detect | Classified | Contained | Evidence | Playbook | Total |
|---|---|---|---|---|---|---|---|
| A | /2 | /2 | /1 | /2 | /1 | /1 | /9 |
| B | /2 | /2 | /1 | /2 | /1 | /1 | /9 |
| C | /2 | /2 | /1 | /2 | /1 | /1 | /9 |
| **Total** | | | | | | | **/27** |

### Score interpretation:
- 23-27: Excellent — your defenses are strong
- 18-22: Good — minor gaps to address
- 12-17: Fair — significant improvements needed
- < 12: Concerning — fundamental gaps in detection/response

## Post-Game Day Report Template

### Executive Summary
- Date: ___
- Participants: ___ blue team, ___ red team
- Score: ___ / 27
- Key finding: ___
- Top action item: ___

### Detailed Results
(Per scenario results from scoring table)

### Gaps Identified
1. ___
2. ___
3. ___

### Action Items
| Item | Owner | Priority | Due Date |
|---|---|---|---|
| | | | |
```

---

## ✅ Answers to Reflection Questions

### 1. Chaos Engineering vs Penetration Testing

| | Chaos Engineering | Penetration Testing |
|---|---|---|
| **Goal** | Verify DEFENSES work | Find VULNERABILITIES |
| **Who runs it** | Internal team (collaborative) | External experts (adversarial) |
| **Scope** | Known attack patterns, test detection/response | Unknown — find what you missed |
| **Frequency** | Continuous / quarterly game days | Annual / biannual |
| **Output** | Detection gap analysis, MTTD/MTTC metrics | Vulnerability report, exploit proof |
| **Mindset** | "Does our alarm system work?" | "Can I break in?" |

Use **chaos engineering** to validate your defenses continuously. Use **pen testing** to find vulnerabilities you don't know about.

### 2. Explaining to CEO

"We test our fire alarms and run fire drills regularly — not because we expect a fire every week, but because when one happens, we need to know our systems work and our people know what to do.

Security chaos experiments are fire drills for cyberattacks. We deploy expensive security tools — we need to verify they actually detect threats. We write incident response playbooks — we need to practice them before a real incident.

The alternative is discovering our defenses don't work during an actual breach. The cost of a breach averages $4.45M (IBM 2023). The cost of a game day is one afternoon."

### 3. Falco Failure vs Rule Gap

**Falco failure**: Falco is running but its eBPF probe isn't working, logs aren't shipping, or Falcosidekick isn't forwarding alerts. **Diagnosis**: Check `kubectl logs -l app.kubernetes.io/name=falco -n falco` and verify the alert pipeline end-to-end.

**Rule gap**: Falco is working but doesn't have a rule for this specific attack pattern. **Diagnosis**: The attack doesn't match any existing rule's condition.

**Fix for each**:
- Falco failure → infrastructure fix (restart Falco, fix eBPF, fix Sidekick config)
- Rule gap → write a new Falco rule that matches the attack pattern, test it, deploy

### 4. Guardrails for Security Chaos

Essential guardrails:
1. **Dedicated namespace**: All experiments run in `chaos-testing` namespace, never production
2. **No destructive actions**: Experiments observe and test — never delete data, modify configs, or impact real users
3. **Abort mechanism**: Any participant can stop with the "ABORT" keyword
4. **Rollback scripts**: Every injection has a tested rollback
5. **Monitoring**: An observer watches for unexpected side effects
6. **Time-bounded**: Experiments have a maximum duration (5 minutes) with auto-cleanup
7. **Audit trail**: Every action is logged for post-analysis

### 5. Presenting Poor Results Positively

**Bad approach**: "The team failed. They took 2 hours to detect an attack."

**Good approach**: "Our Game Day was successful — it identified three critical gaps in our detection pipeline that we can now fix BEFORE a real incident:

1. We discovered that Falco rule X doesn't cover attack pattern Y → we're writing a new rule (1-day fix)
2. Our incident response playbook was missing step Z → we're updating it (1-hour fix)
3. The team wasn't familiar with the Grafana security dashboard → we're scheduling training (1-week fix)

Had this been a real attack, these gaps could have cost us $X. Finding them in a controlled game day cost us 4 hours. That's a strong ROI.

The team's engagement was excellent — they're motivated to improve for next quarter's game day."

