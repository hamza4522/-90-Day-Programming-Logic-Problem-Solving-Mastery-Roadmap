# Lab 3.4 — Falco Runtime Security Solution Guide
**Phase**: 3 — Advanced DevSecOps

---

## Task 1: Falco Deployment

```bash
# Add Helm repo
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm repo update

# Install Falco with eBPF driver (no kernel module compile needed)
helm install falco falcosecurity/falco \
  --namespace falco \
  --create-namespace \
  --set driver.kind=modern_ebpf \
  --set falcosidekick.enabled=true \
  --set falcosidekick.webui.enabled=true \
  --set falco.json_output=true \
  --set falco.priority=WARNING \
  -f custom-falco-values.yaml

# Check pods
kubectl get pods -n falco -w

# Stream Falco logs (your security event stream)
kubectl logs -f \
  -l app.kubernetes.io/name=falco \
  -n falco \
  -c falco | jq .

# Port-forward Falcosidekick UI
kubectl port-forward svc/falco-falcosidekick-ui 2802:2802 -n falco &
echo "Open: http://localhost:2802"
```

---

## Task 3: Custom Falco Rules

```yaml
# falco-custom-rules.yaml
customRules:
  devsecops-lab-rules.yaml: |-
    # Rule 1: Detect curl/wget downloading files in containers
    - rule: Container Downloading Executable Content
      desc: >
        Detect when curl or wget is used inside a container to download files.
        This is a common attacker technique for downloading backdoors or C2 agents.
      condition: >
        spawned_process and container and
        (proc.name in (curl, wget)) and
        (proc.args contains "http://" or proc.args contains "https://") and
        not proc.args contains "--fail" and
        not k8s_containers
      output: >
        Executable download attempt in container
        (user=%user.name user_loginuid=%user.loginuid
         command=%proc.cmdline pid=%proc.pid
         container=%container.name image=%container.image.repository:%container.image.tag
         k8s_namespace=%k8s.ns.name k8s_pod=%k8s.pod.name)
      priority: ERROR
      tags: [container, network, attack, t1105_ingress_tool_transfer]

    # Rule 2: Access to Kubernetes service account token
    - rule: K8s ServiceAccount Token Read
      desc: >
        Detect when a process reads the Kubernetes service account token.
        Attackers use this to authenticate to the K8s API and escalate privileges.
      condition: >
        open_read and container and
        fd.name startswith "/var/run/secrets/kubernetes.io/serviceaccount" and
        not proc.name in (kubectl, kubeadm, kubelet) and
        not trusted_containers
      output: >
        K8s service account token accessed
        (user=%user.name command=%proc.cmdline pid=%proc.pid
         file=%fd.name container=%container.name
         image=%container.image.repository k8s_pod=%k8s.pod.name)
      priority: CRITICAL
      tags: [container, k8s, privilege_escalation, t1552_unsecured_credentials]

    # Rule 3: Detect crypto mining
    - list: miner_binaries
      items: [xmrig, ccminer, cpuminer, minerd, bfgminer, cgminer, minergate, nbminer]

    - list: miner_ports
      items: [3333, 4444, 5555, 7777, 14444, 45700, 3032, 3256]

    - rule: Crypto Mining Activity
      desc: >
        Detect cryptocurrency mining activity — either by binary name
        or by connections to common mining pool ports.
      condition: >
        container and
        (
          (spawned_process and proc.name in (miner_binaries)) or
          (outbound and fd.sport in (miner_ports))
        )
      output: >
        Cryptocurrency mining detected!
        (user=%user.name command=%proc.cmdline
         connection=%fd.name container=%container.name
         image=%container.image.repository k8s_pod=%k8s.pod.name)
      priority: CRITICAL
      tags: [container, cryptomining, malware, t1496_resource_hijacking]

    # Rule 4: Shell spawned in web server process
    - list: web_server_processes
      items: [nginx, apache, apache2, httpd, gunicorn, uvicorn, uwsgi, node, python, python3, ruby, php-fpm]

    - list: shell_binaries
      items: [bash, sh, zsh, ksh, fish, dash]

    - rule: Shell Spawned by Web Server
      desc: >
        Detect a shell spawned by a web server process.
        This is a strong indicator of Remote Code Execution (RCE) via web shell or injection.
      condition: >
        spawned_process and container and
        proc.name in (shell_binaries) and
        proc.pname in (web_server_processes)
      output: >
        ⚠️ Web shell/RCE detected! Shell spawned by web server.
        (user=%user.name shell=%proc.name parent=%proc.pname
         cmdline=%proc.cmdline pid=%proc.pid
         container=%container.name image=%container.image.repository
         k8s_pod=%k8s.pod.name k8s_namespace=%k8s.ns.name)
      priority: CRITICAL
      tags: [container, web, rce, t1505_003_web_shell]

    # Rule 5: Privilege escalation attempts
    - rule: Privilege Escalation Attempt in Container
      desc: >
        Detect privilege escalation attempts inside containers including
        sudo, su, setuid, and overly permissive chmod.
      condition: >
        spawned_process and container and
        (
          proc.name in (sudo, su, newgrp, sg) or
          (proc.name = chmod and proc.args contains "777") or
          (proc.name = chmod and proc.args contains "+s")
        )
      output: >
        Privilege escalation attempt in container
        (user=%user.name command=%proc.cmdline pid=%proc.pid
         container=%container.name image=%container.image.repository
         k8s_pod=%k8s.pod.name)
      priority: ERROR
      tags: [container, privilege_escalation, t1548_abuse_elevation_control]

    # Rule 6: Unexpected outbound connection (bonus)
    - rule: Unexpected Outbound Connection from Container
      desc: >
        Alert on any outbound connection from a container that is not
        to expected services. Tune the allowed_outbound_destinations list.
      condition: >
        outbound and container and
        not fd.sip in (allowed_outbound_ips) and
        fd.sport != 53 and  # Allow DNS
        fd.sport != 443 and  # Allow HTTPS
        fd.sport != 80      # Allow HTTP
      output: >
        Unexpected outbound connection from container
        (user=%user.name command=%proc.cmdline
         connection=%fd.name container=%container.name
         k8s_pod=%k8s.pod.name)
      priority: WARNING
      tags: [network, container, t1071_application_layer_protocol]

    # Macro: k8s system containers to exclude
    - macro: k8s_containers
      condition: >
        container.image.repository in (
          k8s.gcr.io/pause,
          k8s.gcr.io/kube-proxy,
          k8s.gcr.io/coredns
        )
```

---

## Task 4: Falcosidekick Configuration

```yaml
# falcosidekick-config.yaml
falcosidekick:
  enabled: true
  webui:
    enabled: true
  
  config:
    # Slack — Critical and Error alerts
    slack:
      webhookurl: "https://hooks.slack.com/services/XXX/YYY/ZZZ"
      channel: "#security-alerts"
      minimumpriority: "error"  # error and above (includes critical)
      messageformat: |
        🚨 *Security Alert: {{ .Rule }}*
        
        *Priority:* {{ .Priority }}
        *Container:* {{ index .OutputFields "container.name" }}
        *Pod:* {{ index .OutputFields "k8s.pod.name" }}
        *Namespace:* {{ index .OutputFields "k8s.ns.name" }}
        *Command:* `{{ index .OutputFields "proc.cmdline" }}`
        *User:* {{ index .OutputFields "user.name" }}
        
        {{ .Output }}

    # PagerDuty — Critical only
    pagerduty:
      routingkey: "YOUR_PAGERDUTY_INTEGRATION_KEY"
      minimumpriority: "critical"

    # Elasticsearch — All alerts for SIEM
    elasticsearch:
      hostport: "http://elasticsearch:9200"
      index: "falco-alerts"
      type: "_doc"
      minimumpriority: "notice"
      mutualtls: false

    # Custom webhook (for SOAR integration)
    webhook:
      address: "https://your-soar-platform.com/webhook/falco"
      minimumpriority: "warning"
      headers:
        Authorization: "Bearer YOUR_WEBHOOK_TOKEN"

    # Metrics
    prometheus:
      extralabels: "env:production,cluster:eks-prod"
```

---

## Task 6: Incident Response Playbook

```markdown
# Incident Response Playbook — Runtime Security Alerts

## Alert: Container Downloading Executable Content
**Trigger**: `curl` or `wget` downloading files inside a container

### Immediate Actions (< 5 minutes)
1. **Isolate the pod**: `kubectl label pod <POD> quarantine=true`
2. **Block egress**: Apply NetworkPolicy to deny all outbound from the pod
3. **Capture forensics BEFORE deleting**:
   ```bash
   kubectl exec <POD> -- ps aux > forensics/processes.txt
   kubectl exec <POD> -- netstat -tulpn > forensics/network.txt
   kubectl exec <POD> -- find / -newer /tmp -type f 2>/dev/null > forensics/new-files.txt
   kubectl exec <POD> -- cat /proc/net/tcp > forensics/tcp-connections.txt
   ```

### Investigation
- What was downloaded? Check Falco alert for the URL
- Is this a known malware domain? Check VirusTotal/URLhaus
- How did the attacker get command execution? (SAST miss? CVE exploit?)
- What else did this container talk to? Check network logs

### Remediation
- Delete the compromised pod
- Rebuild the image from clean base
- Rotate any credentials the pod had access to
- Patch the vulnerability that allowed the download

### Prevention
- Deny outbound network connections by default (NetworkPolicy)
- Run container as non-root (no write access to download)
- Use read-only root filesystem

---

## Alert: K8s ServiceAccount Token Read
**Trigger**: Non-system process reads service account token

### Immediate Actions (< 2 minutes — CRITICAL)
1. **Revoke the service account** (invalidates the token):
   ```bash
   kubectl delete serviceaccount <SA_NAME> -n <NAMESPACE>
   kubectl create serviceaccount <SA_NAME> -n <NAMESPACE>  # Recreate
   ```
2. **Isolate the pod** immediately
3. **Check API server audit logs** for requests using the token

### Investigation
- Was the token used to authenticate to K8s API? (check audit logs)
- What API calls were made with the token?
- Is the service account overly privileged? (`kubectl auth can-i --list --as=system:serviceaccount:NS:SA`)

### Remediation
- Rotate service account
- Implement least-privilege RBAC for the service account
- Enable K8s token request projection (bound tokens with short TTL)

### Prevention
- Mount service account tokens only where needed:
  ```yaml
  spec:
    automountServiceAccountToken: false  # Default deny
  ```
- Use short-lived projected tokens instead of long-lived SA tokens

---

## Alert: Cryptocurrency Mining
**Trigger**: Miner binary or mining pool connection

### Immediate Actions (< 1 minute — CRITICAL)
1. **Kill the pod immediately** — every second costs money
2. **Check all pods in the namespace** — likely a broad compromise
3. **Alert on-call** and finance team (cloud cost impact)

### Investigation
- How much have they mined? Check cloud billing
- Entry point: Look for recent deployments, CVEs exploited
- Lateral movement: Are other pods/namespaces affected?

### Prevention
- CPU limits on all pods (makes mining unprofitable)
- Block outbound to known mining pool IPs (threat intelligence feeds)
- Image scanning (don't let miners into your images)
```

---

## ✅ Answers to Reflection Questions

### 1. eBPF for Security Monitoring

**eBPF (extended Berkeley Packet Filter)** is a kernel technology that allows running sandboxed programs in the Linux kernel without changing kernel source code or loading kernel modules.

**Why eBPF for security**:
- **Kernel-level visibility**: Sees ALL syscalls, network events, file ops — attackers cannot hide at userspace level
- **No overhead of kernel modules**: eBPF is JIT-compiled and verified safe by the kernel before loading
- **Container-transparent**: Sees what happens inside all containers from outside — attackers inside containers can't disable it
- **Low performance impact**: eBPF programs are optimized by the kernel, run in ~nanoseconds
- **Rootkit-resistant**: Even a root container cannot disable eBPF monitoring

### 2. Falco Performance Impact

Typical overhead: **1-3% CPU, <50MB RAM** per node.

**Tuning to minimize impact**:
```yaml
# Reduce log verbosity
falco:
  priority: WARNING  # Skip NOTICE/DEBUG

# Exclude high-volume, low-risk namespaces
customRules:
  - macro: excluded_namespaces
    condition: k8s.ns.name in (kube-system, monitoring, logging)
  
  # Add to most rules:
  # and not excluded_namespaces

# Increase buffer size to prevent drops
falco:
  outputs:
    max_burst: 1000
    rate: 0.03333

# Use modern eBPF (lower overhead than kernel module)
driver:
  kind: modern_ebpf
```

### 3. Tuning False Positives

**Step 1**: Don't delete rules — **override** them with conditions:
```yaml
# Override a built-in rule to exclude your CI image
- rule: Launch Package Management Process in Container
  override:
    condition: append
    output: append
  condition: and not container.image.repository = "ci-builder"
```

**Step 2**: Use macros for trusted scenarios:
```yaml
- macro: trusted_operations
  condition: >
    (proc.name = curl and proc.args contains "health-check.sh") or
    (proc.name = apt-get and container.image.repository = "ci-tools")
```

**Step 3**: Track false positive rate:
- Use Falcosidekick to count alerts per rule
- Rules with >90% false positives need tuning
- Rules with 0 alerts in 30 days — are they even needed?

### 4. Falco vs Falcosidekick

| Component | Role |
|---|---|
| **Falco** | The detection engine — monitors kernel events, evaluates rules, generates alerts |
| **Falcosidekick** | The alerting router — receives Falco alerts and forwards to Slack, PagerDuty, Elasticsearch, etc. |

Can you use one without the other?
- **Falco without Falcosidekick**: Yes — Falco logs to stdout/file, you pipe to your SIEM separately
- **Falcosidekick without Falco**: No — it needs Falco alerts as input

### 5. Mean Time to Detect (MTTD)

In this lab simulation:
- Attack started at T+0 (curl command executed)
- Falco alert fired at T+0.3 seconds (sub-second detection!)
- Slack notification received at T+2 seconds (including routing)
- **MTTD: ~2 seconds**

**Industry comparison**:
- IBM X-Force 2024: Median MTTD = 197 days (down from 212)
- Verizon DBIR 2024: Most breaches discovered in weeks to months
- With Falco runtime security: **seconds to minutes**

This is the power of runtime security — you move from "months to detect" to "seconds to detect." The challenge is alert quality: 2-second detection is only valuable if the alert is actionable and the response is defined.
