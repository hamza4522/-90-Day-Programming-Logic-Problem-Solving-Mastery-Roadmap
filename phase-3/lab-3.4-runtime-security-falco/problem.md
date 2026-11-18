# Lab 3.4 — Kubernetes Runtime Security with Falco
**Phase**: 3 — Advanced DevSecOps  
**Difficulty**: ⭐⭐⭐ Advanced  
**Estimated Time**: 3–4 hours  
**Category**: Runtime Security, Threat Detection, SIEM

---

## 🎯 Objective

Implement **runtime security monitoring** using Falco to detect threats and anomalous behavior in a running Kubernetes cluster. Image scanning and policy checks protect you before deployment — but what happens AFTER an attacker gets in? Falco watches everything that happens at runtime and alerts on suspicious behavior.

---

## 📋 Problem Statement

A security incident occurred: a compromised web application was used to gain shell access to a container. The attacker:
- Executed `curl` to download a backdoor from the internet
- Read `/etc/passwd` and `/etc/shadow`
- Attempted to read Kubernetes service account tokens
- Installed a cryptocurrency miner

None of this was detected until a monthly cloud bill review showed $40,000 in unexpected compute charges.

Your task: Deploy Falco and configure rules that would have detected each of these attacks in real-time.

---

## 🛠️ Prerequisites

- Kubernetes cluster (Kind, Minikube, or cloud)
- Helm installed
- kubectl configured

---

## 📋 Tasks

### Task 1: Deploy Falco

1. Deploy Falco via Helm with the UI and Falcosidekick:
   ```bash
   helm repo add falcosecurity https://falcosecurity.github.io/charts
   helm repo update
   
   helm install falco falcosecurity/falco \
     --namespace falco \
     --create-namespace \
     --set falcosidekick.enabled=true \
     --set falcosidekick.webui.enabled=true \
     --set driver.kind=modern_ebpf \  # No kernel module needed
     --set "falcosidekick.config.slack.webhookurl=YOUR_SLACK_WEBHOOK"
   ```

2. Verify Falco is running:
   ```bash
   kubectl get pods -n falco
   kubectl logs -f -l app.kubernetes.io/name=falco -n falco
   ```

3. Access Falcosidekick UI:
   ```bash
   kubectl port-forward svc/falco-falcosidekick-ui 2802:2802 -n falco
   # Access at http://localhost:2802
   ```

### Task 2: Trigger Built-in Falco Rules

Falco comes with many built-in rules. Test them by triggering alerts:

**In a running pod, execute these commands and observe Falco alerts**:

```bash
# Create a test pod
kubectl run test-pod --image=ubuntu:22.04 --restart=Never -- sleep 3600
kubectl exec -it test-pod -- bash

# Inside the pod, trigger Falco rules:

# Trigger: "Read sensitive file untrusted"
cat /etc/shadow

# Trigger: "Terminal shell in container"
# (Just opening the shell triggers this!)

# Trigger: "Launch Package Management Process in Container"
apt-get update

# Trigger: "Outbound Connection to C2 Servers"
curl -s http://169.254.169.254/latest/meta-data/  # IMDS endpoint

# Trigger: "Create Sensitive Mount"
# (From outside the pod)
kubectl exec test-pod -- mount /dev /mnt
```

For each triggered alert:
- Note the **rule name**
- Note the **priority** (CRITICAL, ERROR, WARNING, NOTICE)
- Note the **output fields** (what information was captured)

### Task 3: Write Custom Falco Rules

Write custom rules that detect the attack scenario from the problem statement:

1. **Rule: Detect curl/wget downloading files** — Alert when curl/wget is used inside a container to download executable content

2. **Rule: Detect access to K8s service account token** — Alert when a process reads `/var/run/secrets/kubernetes.io/serviceaccount/token`

3. **Rule: Detect crypto mining** — Alert when processes with known miner names (xmrig, ccminer, minergate) are spawned, or when connections to mining pool ports (3333, 4444, 5555, 14444, 45700) are made

4. **Rule: Detect shell spawned in web server process** — Alert when apache/nginx/gunicorn/uvicorn spawns a shell (bash/sh) — classic webshell indicator

5. **Rule: Detect privilege escalation attempts** — Alert when `sudo`, `su`, `setuid`, or `chmod 777` are executed inside a container

### Task 4: Alert Routing with Falcosidekick

Configure Falcosidekick to route alerts to multiple destinations:

1. **Slack**: Send CRITICAL and ERROR alerts to `#security-alerts` channel
2. **PagerDuty**: Page on-call for CRITICAL alerts only
3. **Elasticsearch**: Send all alerts for SIEM storage and analysis
4. **Webhook**: Send to your SIEM or SOAR platform

Create `falcosidekick-config.yaml` with the routing configuration.

### Task 5: Simulate an Attack and Detect It

Using a deliberately vulnerable application (DVWA or similar):

1. Deploy a vulnerable application
2. Simulate a successful web shell exploit (RCE via file upload)
3. From the web shell, execute reconnaissance commands
4. Verify that Falco detected and alerted on each step
5. Document the **detection timeline** — how quickly did Falco alert?

### Task 6: Incident Response Playbook

Based on your Falco alerts, create an **incident response playbook** (`incident-response-playbook.md`) that defines:

For each rule you created:
- Alert fired: What does this mean?
- Immediate actions: (e.g., isolate pod, capture forensics)
- Investigation steps: How to determine scope
- Remediation: How to fix
- Prevention: What control prevents this next time

---

## 📝 Deliverables

1. `falco-custom-rules.yaml` — your custom Falco rules
2. `falcosidekick-config.yaml` — alert routing configuration
3. `alert-samples.json` — sample Falco alerts you triggered (anonymized)
4. `incident-response-playbook.md` — IR playbook
5. `detection-timeline.md` — from attack to alert timing

---

## ❓ Questions to Answer

1. Falco uses **eBPF** (or kernel module) — what is eBPF and why is it used for security monitoring instead of user-space tools?
2. What is the **performance impact** of Falco on a production cluster? What tuning would you do to minimize it?
3. A developer argues "Falco generates too many false positives." How do you tune rules without reducing security coverage?
4. What is the difference between **Falco** (runtime detection) and **Falco Sidekick** (alerting)? Can you use one without the other?
5. In your attack simulation, what is the **mean time to detect (MTTD)**? How does this compare to the industry average (median: 21 days according to IBM X-Force)?

---

> 💡 **eBPF advantage**: Falco using eBPF means it monitors at kernel level — even if an attacker gets root inside a container, they cannot disable Falco (which runs outside the container in the kernel).

> 💡 **Alert fatigue**: Start with high-priority rules only. Add more rules gradually as you tune false positives. A Falco dashboard with 500 ignored alerts is worthless — 10 actionable alerts per week is gold.
