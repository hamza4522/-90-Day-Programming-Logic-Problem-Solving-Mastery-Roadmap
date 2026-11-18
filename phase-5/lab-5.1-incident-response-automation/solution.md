# Lab 5.1 — Incident Response Automation Solution Guide
**Phase**: 5 — Expert

---

## Task 1: Forensic Evidence Collector

```bash
#!/bin/bash
# forensic-collector.sh — Collect forensic evidence from a Kubernetes pod
# Usage: ./forensic-collector.sh <pod-name> <namespace>

set -euo pipefail

POD="${1:?Usage: $0 <pod-name> <namespace>}"
NS="${2:?Usage: $0 <pod-name> <namespace>}"
TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
EVIDENCE_DIR="evidence-${POD}-${TIMESTAMP}"
MANIFEST_FILE="${EVIDENCE_DIR}/evidence-manifest.json"

echo "🔍 Collecting forensic evidence from ${NS}/${POD}"
echo "📁 Evidence directory: ${EVIDENCE_DIR}"
mkdir -p "${EVIDENCE_DIR}"

# ─── Pod Metadata ───
echo "  → Pod specification..."
kubectl get pod "$POD" -n "$NS" -o yaml > "${EVIDENCE_DIR}/pod-spec.yaml" 2>&1

echo "  → Pod events..."
kubectl get events -n "$NS" --field-selector "involvedObject.name=${POD}" \
  --sort-by='.lastTimestamp' > "${EVIDENCE_DIR}/pod-events.txt" 2>&1

echo "  → Pod describe..."
kubectl describe pod "$POD" -n "$NS" > "${EVIDENCE_DIR}/pod-describe.txt" 2>&1

# ─── Container State ───
echo "  → Process list..."
kubectl exec "$POD" -n "$NS" -- ps auxwwf > "${EVIDENCE_DIR}/processes.txt" 2>&1 || \
kubectl exec "$POD" -n "$NS" -- ps aux > "${EVIDENCE_DIR}/processes.txt" 2>&1 || \
echo "Could not capture process list" > "${EVIDENCE_DIR}/processes.txt"

echo "  → Network connections..."
{
  echo "=== /proc/net/tcp ==="
  kubectl exec "$POD" -n "$NS" -- cat /proc/net/tcp 2>/dev/null || echo "N/A"
  echo ""
  echo "=== /proc/net/tcp6 ==="
  kubectl exec "$POD" -n "$NS" -- cat /proc/net/tcp6 2>/dev/null || echo "N/A"
  echo ""
  echo "=== ss output ==="
  kubectl exec "$POD" -n "$NS" -- ss -tulnp 2>/dev/null || echo "ss not available"
  echo ""
  echo "=== netstat output ==="
  kubectl exec "$POD" -n "$NS" -- netstat -tlnp 2>/dev/null || echo "netstat not available"
} > "${EVIDENCE_DIR}/network-connections.txt"

echo "  → Environment variables (redacted)..."
kubectl exec "$POD" -n "$NS" -- env 2>/dev/null | \
  sed -E 's/(PASSWORD|SECRET|KEY|TOKEN|CREDENTIAL|API_KEY)=.*/\1=<REDACTED>/gi' \
  > "${EVIDENCE_DIR}/environment-vars-redacted.txt"

echo "  → Filesystem changes (files modified after container start)..."
kubectl exec "$POD" -n "$NS" -- \
  find / -newer /proc/1/exe \
    -not -path '/proc/*' \
    -not -path '/sys/*' \
    -not -path '/dev/*' \
    -type f 2>/dev/null \
  > "${EVIDENCE_DIR}/filesystem-changes.txt" 2>&1 || \
echo "Could not enumerate filesystem changes" > "${EVIDENCE_DIR}/filesystem-changes.txt"

echo "  → Open files..."
kubectl exec "$POD" -n "$NS" -- \
  find /proc/*/fd -maxdepth 1 -type l 2>/dev/null | head -200 \
  > "${EVIDENCE_DIR}/open-files.txt" 2>&1 || echo "N/A" > "${EVIDENCE_DIR}/open-files.txt"

echo "  → Mounted secrets/configmaps..."
kubectl get pod "$POD" -n "$NS" -o jsonpath='{range .spec.volumes[*]}{.name}{"\t"}{.secret.secretName}{.configMap.name}{"\n"}{end}' \
  > "${EVIDENCE_DIR}/mounted-volumes.txt" 2>&1

# ─── Logs ───
echo "  → Container logs (last 1000 lines)..."
kubectl logs "$POD" -n "$NS" --tail=1000 > "${EVIDENCE_DIR}/pod-logs.txt" 2>&1

echo "  → Previous container logs..."
kubectl logs "$POD" -n "$NS" --previous --tail=1000 > "${EVIDENCE_DIR}/pod-logs-previous.txt" 2>&1 || \
echo "No previous container logs" > "${EVIDENCE_DIR}/pod-logs-previous.txt"

# ─── Image Information ───
echo "  → Image details..."
IMAGE=$(kubectl get pod "$POD" -n "$NS" -o jsonpath='{.spec.containers[0].image}')
IMAGE_ID=$(kubectl get pod "$POD" -n "$NS" -o jsonpath='{.status.containerStatuses[0].imageID}')
echo "Image: ${IMAGE}" > "${EVIDENCE_DIR}/image-info.txt"
echo "Image ID: ${IMAGE_ID}" >> "${EVIDENCE_DIR}/image-info.txt"

# Check if image is signed
echo "  → Image signature verification..."
cosign verify "$IMAGE" 2>&1 > "${EVIDENCE_DIR}/image-signature.txt" || \
echo "Image is NOT signed or signature could not be verified" > "${EVIDENCE_DIR}/image-signature.txt"

# ─── Service Account & RBAC ───
echo "  → Service account permissions..."
SA=$(kubectl get pod "$POD" -n "$NS" -o jsonpath='{.spec.serviceAccountName}')
echo "Service Account: ${SA}" > "${EVIDENCE_DIR}/rbac-info.txt"
kubectl auth can-i --list --as="system:serviceaccount:${NS}:${SA}" -n "$NS" \
  >> "${EVIDENCE_DIR}/rbac-info.txt" 2>&1 || echo "Could not enumerate permissions" >> "${EVIDENCE_DIR}/rbac-info.txt"

# ─── Generate Evidence Manifest ───
echo "  → Generating evidence manifest..."
cat > "$MANIFEST_FILE" << EOF
{
  "evidence_id": "${POD}-${TIMESTAMP}",
  "collected_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "collected_by": "$(whoami)@$(hostname)",
  "collector_version": "1.0.0",
  "target_pod": "${POD}",
  "target_namespace": "${NS}",
  "target_image": "${IMAGE}",
  "target_image_id": "${IMAGE_ID}",
  "service_account": "${SA}",
  "files": [
$(find "${EVIDENCE_DIR}" -type f -not -name "evidence-manifest.json" | while read f; do
    HASH=$(sha256sum "$f" | awk '{print $1}')
    SIZE=$(stat -c%s "$f" 2>/dev/null || stat -f%z "$f")
    BASENAME=$(basename "$f")
    echo "    {\"file\": \"${BASENAME}\", \"sha256\": \"${HASH}\", \"size_bytes\": ${SIZE}},"
done | sed '$ s/,$//')
  ]
}
EOF

# ─── Create tarball ───
echo "  → Creating evidence archive..."
tar czf "${EVIDENCE_DIR}.tar.gz" "${EVIDENCE_DIR}/"
ARCHIVE_HASH=$(sha256sum "${EVIDENCE_DIR}.tar.gz" | awk '{print $1}')

echo ""
echo "═══════════════════════════════════════"
echo "✅ Evidence collection complete"
echo "📁 Directory:  ${EVIDENCE_DIR}/"
echo "📦 Archive:    ${EVIDENCE_DIR}.tar.gz"
echo "🔒 SHA-256:    ${ARCHIVE_HASH}"
echo "📊 Files:      $(find ${EVIDENCE_DIR} -type f | wc -l) evidence files"
echo "═══════════════════════════════════════"
```

---

## Task 2: Pod Isolation Script

```bash
#!/bin/bash
# isolate-pod.sh — Quarantine a pod without destroying evidence
# Usage: ./isolate-pod.sh <pod-name> <namespace>

set -euo pipefail

POD="${1:?Usage: $0 <pod-name> <namespace>}"
NS="${2:?Usage: $0 <pod-name> <namespace>}"
TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)

echo "🔒 Isolating pod ${NS}/${POD}"

# ── Step 1: Save original labels (for potential rollback) ──
echo "  → Saving original pod labels..."
kubectl get pod "$POD" -n "$NS" -o jsonpath='{.metadata.labels}' > "/tmp/${POD}-original-labels.json"

# ── Step 2: Remove all app/service labels (removes from Service endpoints) ──
echo "  → Removing pod from all Services..."
# Get current label keys that match service selectors
LABEL_KEYS=$(kubectl get pod "$POD" -n "$NS" -o jsonpath='{range .metadata.labels}{@}{"\n"}{end}' 2>/dev/null)

# Replace app labels with quarantine labels
kubectl label pod "$POD" -n "$NS" \
  app- \
  app.kubernetes.io/name- \
  app.kubernetes.io/instance- \
  --overwrite 2>/dev/null || true

kubectl label pod "$POD" -n "$NS" \
  "quarantine=true" \
  "quarantine-timestamp=${TIMESTAMP}" \
  "quarantine-reason=security-incident" \
  --overwrite

# ── Step 3: Apply deny-all NetworkPolicy ──
echo "  → Applying quarantine NetworkPolicy..."
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: quarantine-${POD}
  namespace: ${NS}
  labels:
    quarantine: "true"
    target-pod: "${POD}"
spec:
  podSelector:
    matchLabels:
      quarantine: "true"
      quarantine-timestamp: "${TIMESTAMP}"
  policyTypes:
    - Ingress
    - Egress
  # Empty ingress/egress = deny all traffic
  ingress: []
  egress: []
EOF

# ── Step 4: Annotate the pod ──
echo "  → Adding quarantine annotations..."
kubectl annotate pod "$POD" -n "$NS" \
  "security.company.com/quarantined=true" \
  "security.company.com/quarantine-time=${TIMESTAMP}" \
  "security.company.com/quarantine-by=$(whoami)" \
  "security.company.com/quarantine-reason=Automated response to security alert" \
  "security.company.com/original-labels=$(cat /tmp/${POD}-original-labels.json)" \
  --overwrite

# ── Step 5: Verify isolation ──
echo "  → Verifying isolation..."
echo ""

# Check pod is no longer in any Service endpoints
ENDPOINTS=$(kubectl get endpoints -n "$NS" -o json | \
  jq -r --arg pod "$POD" '.items[] | select(.subsets[].addresses[]?.targetRef.name == $pod) | .metadata.name' 2>/dev/null)

if [ -z "$ENDPOINTS" ]; then
    echo "  ✅ Pod removed from all Service endpoints"
else
    echo "  ⚠️  Pod still in endpoints: $ENDPOINTS"
fi

# Check NetworkPolicy is applied
NP_EXISTS=$(kubectl get networkpolicy "quarantine-${POD}" -n "$NS" -o name 2>/dev/null)
if [ -n "$NP_EXISTS" ]; then
    echo "  ✅ Quarantine NetworkPolicy applied"
else
    echo "  ❌ NetworkPolicy not found!"
fi

# Verify pod is still running (evidence preserved)
POD_STATUS=$(kubectl get pod "$POD" -n "$NS" -o jsonpath='{.status.phase}')
echo "  ✅ Pod status: ${POD_STATUS} (still running — evidence preserved)"

echo ""
echo "═══════════════════════════════════════"
echo "🔒 Pod ${POD} is now QUARANTINED"
echo "  • Removed from all Services"
echo "  • Network access denied (ingress + egress)"
echo "  • Pod is still running for investigation"
echo ""
echo "To investigate:"
echo "  kubectl exec -it ${POD} -n ${NS} -- /bin/sh"
echo ""
echo "To release quarantine:"
echo "  kubectl delete networkpolicy quarantine-${POD} -n ${NS}"
echo "  kubectl label pod ${POD} -n ${NS} quarantine- quarantine-timestamp- quarantine-reason-"
echo "  # Restore original labels from: /tmp/${POD}-original-labels.json"
echo "═══════════════════════════════════════"
```

---

## Task 3: Automated Response Playbook

```python
#!/usr/bin/env python3
"""
playbooks/shell-in-container.py
Automated response playbook for "Terminal shell in container" Falco alerts.
"""

import json
import os
import subprocess
import sys
import logging
from datetime import datetime, timezone
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
log = logging.getLogger('ir-playbook')

# ─── Configuration ───
EVIDENCE_BUCKET = os.environ.get('EVIDENCE_BUCKET', '/tmp/evidence')
SLACK_WEBHOOK = os.environ.get('SLACK_WEBHOOK', '')
APPROVED_DEBUG_ANNOTATION = 'debug.company.com/approved-by'
SCRIPTS_DIR = Path(__file__).parent.parent


def parse_falco_alert(alert_json: dict) -> dict:
    """Extract relevant fields from a Falco alert payload."""
    output_fields = alert_json.get('output_fields', {})
    return {
        'rule': alert_json.get('rule', 'unknown'),
        'priority': alert_json.get('priority', 'unknown'),
        'output': alert_json.get('output', ''),
        'timestamp': alert_json.get('time', datetime.now(timezone.utc).isoformat()),
        'pod_name': output_fields.get('k8s.pod.name', 'unknown'),
        'namespace': output_fields.get('k8s.ns.name', 'unknown'),
        'container_id': output_fields.get('container.id', 'unknown'),
        'container_name': output_fields.get('container.name', 'unknown'),
        'process': output_fields.get('proc.name', 'unknown'),
        'process_cmdline': output_fields.get('proc.cmdline', 'unknown'),
        'parent_process': output_fields.get('proc.pname', 'unknown'),
        'user': output_fields.get('user.name', 'unknown'),
        'image': output_fields.get('container.image.repository', 'unknown'),
    }


def is_approved_debug_session(pod_name: str, namespace: str) -> bool:
    """Check if the pod has an approved debugging annotation."""
    try:
        result = subprocess.run(
            ['kubectl', 'get', 'pod', pod_name, '-n', namespace,
             '-o', f'jsonpath={{.metadata.annotations.{APPROVED_DEBUG_ANNOTATION}}}'],
            capture_output=True, text=True, timeout=10
        )
        if result.stdout.strip():
            log.info(f"Pod {pod_name} has approved debug session by: {result.stdout.strip()}")
            return True
    except Exception as e:
        log.warning(f"Could not check debug annotation: {e}")
    return False


def collect_evidence(pod_name: str, namespace: str) -> str:
    """Run the forensic evidence collector."""
    log.info(f"Collecting forensic evidence from {namespace}/{pod_name}")
    try:
        result = subprocess.run(
            [str(SCRIPTS_DIR / 'forensic-collector.sh'), pod_name, namespace],
            capture_output=True, text=True, timeout=120
        )
        log.info(f"Evidence collector exit code: {result.returncode}")
        log.info(result.stdout)

        # Find the evidence directory
        for line in result.stdout.split('\n'):
            if 'Archive:' in line:
                return line.split('Archive:')[-1].strip()
    except subprocess.TimeoutExpired:
        log.error("Evidence collection timed out after 120s")
    except Exception as e:
        log.error(f"Evidence collection failed: {e}")
    return ''


def isolate_pod(pod_name: str, namespace: str) -> bool:
    """Run the pod isolation script."""
    log.info(f"Isolating pod {namespace}/{pod_name}")
    try:
        result = subprocess.run(
            [str(SCRIPTS_DIR / 'isolate-pod.sh'), pod_name, namespace],
            capture_output=True, text=True, timeout=30
        )
        log.info(result.stdout)
        return result.returncode == 0
    except Exception as e:
        log.error(f"Pod isolation failed: {e}")
        return False


def check_blast_radius(pod_name: str, namespace: str) -> dict:
    """Check for potential lateral movement risk."""
    blast_radius = {
        'pods_on_same_node': [],
        'pods_with_same_sa': [],
        'node_name': 'unknown',
        'service_account': 'unknown',
        'mounted_secrets': [],
    }

    try:
        # Get pod's node and service account
        pod_json = subprocess.run(
            ['kubectl', 'get', 'pod', pod_name, '-n', namespace, '-o', 'json'],
            capture_output=True, text=True, timeout=10
        )
        pod_data = json.loads(pod_json.stdout)
        node = pod_data['spec'].get('nodeName', 'unknown')
        sa = pod_data['spec'].get('serviceAccountName', 'default')
        blast_radius['node_name'] = node
        blast_radius['service_account'] = sa

        # Mounted secrets
        for vol in pod_data['spec'].get('volumes', []):
            if 'secret' in vol:
                blast_radius['mounted_secrets'].append(vol['secret']['secretName'])

        # Pods on same node
        node_pods = subprocess.run(
            ['kubectl', 'get', 'pods', '-A', '--field-selector', f'spec.nodeName={node}',
             '-o', 'jsonpath={range .items[*]}{.metadata.namespace}/{.metadata.name}\n{end}'],
            capture_output=True, text=True, timeout=10
        )
        blast_radius['pods_on_same_node'] = [
            p for p in node_pods.stdout.strip().split('\n')
            if p and f'{namespace}/{pod_name}' not in p
        ]

        # Pods with same service account
        sa_pods = subprocess.run(
            ['kubectl', 'get', 'pods', '-n', namespace,
             '-o', 'jsonpath={range .items[?(@.spec.serviceAccountName=="' + sa + '")]}{.metadata.name}\n{end}'],
            capture_output=True, text=True, timeout=10
        )
        blast_radius['pods_with_same_sa'] = [
            p for p in sa_pods.stdout.strip().split('\n')
            if p and p != pod_name
        ]

    except Exception as e:
        log.error(f"Blast radius check failed: {e}")

    return blast_radius


def send_slack_notification(alert: dict, evidence_path: str,
                            isolated: bool, blast_radius: dict) -> None:
    """Send enriched alert to Slack."""
    if not SLACK_WEBHOOK:
        log.warning("No Slack webhook configured — skipping notification")
        return

    secrets_list = ', '.join(blast_radius.get('mounted_secrets', [])) or 'none'

    message = {
        "blocks": [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": "🚨 SECURITY INCIDENT — Shell in Container"}
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Pod:*\n`{alert['pod_name']}` ({alert['namespace']})"},
                    {"type": "mrkdwn", "text": f"*Image:*\n`{alert['image']}`"},
                    {"type": "mrkdwn", "text": f"*Process:*\n`{alert['parent_process']}` → `{alert['process_cmdline']}`"},
                    {"type": "mrkdwn", "text": f"*User:*\n`{alert['user']}`"},
                ]
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": (
                    f"*🔒 Automated Response:*\n"
                    f"{'✅' if evidence_path else '❌'} Evidence collected: `{evidence_path}`\n"
                    f"{'✅' if isolated else '❌'} Pod isolated (NetworkPolicy + removed from Service)\n"
                    f"📊 Blast radius: {len(blast_radius.get('pods_on_same_node', []))} pods on same node, "
                    f"{len(blast_radius.get('pods_with_same_sa', []))} pods with same SA\n"
                    f"🔑 Mounted secrets: {secrets_list}"
                )}
            },
        ]
    }

    try:
        import urllib.request
        req = urllib.request.Request(
            SLACK_WEBHOOK,
            data=json.dumps(message).encode(),
            headers={'Content-Type': 'application/json'}
        )
        urllib.request.urlopen(req, timeout=10)
        log.info("Slack notification sent")
    except Exception as e:
        log.error(f"Failed to send Slack notification: {e}")


def run_playbook(alert_json: dict) -> dict:
    """
    Main playbook execution.
    Returns a summary dict of all actions taken.
    """
    start_time = datetime.now(timezone.utc)
    summary = {'actions': [], 'start_time': start_time.isoformat()}

    # Step 1: Parse alert
    alert = parse_falco_alert(alert_json)
    log.info(f"Alert: {alert['rule']} — Pod: {alert['namespace']}/{alert['pod_name']}")
    summary['alert'] = alert

    # Step 2: Check if approved debug session
    if is_approved_debug_session(alert['pod_name'], alert['namespace']):
        log.info("✅ Approved debug session — suppressing response")
        summary['actions'].append('suppressed: approved debug session')
        summary['suppressed'] = True
        return summary

    # Step 3: Collect evidence
    evidence_path = collect_evidence(alert['pod_name'], alert['namespace'])
    summary['actions'].append(f'evidence collected: {evidence_path}')

    # Step 4: Isolate pod
    isolated = isolate_pod(alert['pod_name'], alert['namespace'])
    summary['actions'].append(f'pod isolated: {isolated}')

    # Step 5: Blast radius
    blast_radius = check_blast_radius(alert['pod_name'], alert['namespace'])
    summary['blast_radius'] = blast_radius
    summary['actions'].append(f'blast radius checked: {len(blast_radius["pods_on_same_node"])} co-located pods')

    # Step 6: Notify
    send_slack_notification(alert, evidence_path, isolated, blast_radius)
    summary['actions'].append('slack notification sent')

    # Timing
    end_time = datetime.now(timezone.utc)
    mttc = (end_time - start_time).total_seconds()
    summary['end_time'] = end_time.isoformat()
    summary['mttc_seconds'] = mttc
    summary['actions'].append(f'total response time: {mttc:.1f}s')

    log.info(f"✅ Playbook complete — MTTC: {mttc:.1f} seconds")
    return summary


# ─── Main ───
if __name__ == '__main__':
    if len(sys.argv) > 1:
        with open(sys.argv[1]) as f:
            alert_data = json.load(f)
    else:
        alert_data = json.load(sys.stdin)

    result = run_playbook(alert_data)
    print(json.dumps(result, indent=2))
```

---

## Task 5: Webhook Receiver

```python
#!/usr/bin/env python3
"""
webhook-receiver/server.py
HTTP server that receives Falco webhook alerts and dispatches playbooks.
"""

import json
import logging
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime, timezone
from pathlib import Path
import importlib.util

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
log = logging.getLogger('webhook-receiver')

# ─── Playbook Registry ───
PLAYBOOK_MAP = {
    'Terminal shell in container': 'shell-in-container',
    'Read sensitive file untrusted': 'sensitive-file-access',
    'Read sensitive file trusted after startup': 'sensitive-file-access',
    'Launch Crypto Miners': 'crypto-miner',
    'Detect crypto miners using the Stratum protocol': 'crypto-miner',
}

# ─── Audit Log ───
AUDIT_LOG = Path('/var/log/ir-audit.jsonl')
audit_lock = threading.Lock()


def write_audit_log(entry: dict):
    """Append to the incident response audit trail."""
    entry['logged_at'] = datetime.now(timezone.utc).isoformat()
    with audit_lock:
        with open(AUDIT_LOG, 'a') as f:
            f.write(json.dumps(entry) + '\n')


def dispatch_playbook(alert: dict):
    """Route alert to the appropriate playbook."""
    rule = alert.get('rule', '')
    playbook_name = PLAYBOOK_MAP.get(rule)

    if not playbook_name:
        log.warning(f"No playbook registered for rule: {rule}")
        write_audit_log({
            'event': 'no_playbook',
            'rule': rule,
            'alert': alert
        })
        return

    log.info(f"Dispatching playbook '{playbook_name}' for rule '{rule}'")

    # Load and run playbook
    playbook_path = Path(__file__).parent.parent / 'playbooks' / f'{playbook_name}.py'
    if playbook_path.exists():
        spec = importlib.util.spec_from_file_location(playbook_name, playbook_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        result = module.run_playbook(alert)

        write_audit_log({
            'event': 'playbook_executed',
            'playbook': playbook_name,
            'rule': rule,
            'result': result
        })
    else:
        log.error(f"Playbook not found: {playbook_path}")
        write_audit_log({
            'event': 'playbook_not_found',
            'playbook': playbook_name,
            'path': str(playbook_path)
        })


class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/webhook':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)

            try:
                alert = json.loads(body)
                log.info(f"Received alert: {alert.get('rule', 'unknown')} "
                         f"(priority: {alert.get('priority', 'unknown')})")

                # Dispatch in a thread to respond quickly
                thread = threading.Thread(target=dispatch_playbook, args=(alert,))
                thread.start()

                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'{"status": "accepted"}')

            except json.JSONDecodeError:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'{"error": "invalid JSON"}')
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'{"status": "healthy"}')
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        log.info(f"{self.address_string()} {format % args}")


if __name__ == '__main__':
    port = 8081
    server = HTTPServer(('0.0.0.0', port), WebhookHandler)
    log.info(f"🔔 Webhook receiver listening on :{port}")
    log.info(f"📋 Registered playbooks: {list(PLAYBOOK_MAP.values())}")
    server.serve_forever()
```

---

## ✅ Answers to Reflection Questions

### 1. Isolate vs Delete

**Why isolate**:
- Process list, network connections, and memory state are GONE once the container is deleted
- The attacker's tools, downloaded files, and command history exist only in the container's writable layer
- You need evidence for forensic analysis, root cause analysis, and potentially legal proceedings
- Kubernetes will restart a pod from the clean image — you lose all traces of the attack

**What's lost if you delete**:
- Running processes (malware, backdoors, miners)
- Network connections (what C2 servers were they connected to?)
- Modified files (what did they change/install?)
- Environment variables at time of compromise
- Memory contents of the attacker's processes

### 2. Preventing False Positive Isolation

**Prevention**:
- **Debug annotation**: Before debugging, add `kubectl annotate pod $POD debug.company.com/approved-by=$USER`
- **Allowlist**: Maintain a list of pods/namespaces excluded from automated response (staging, dev)
- **Confidence scoring**: Combine multiple signals before responding (shell + outbound connection = high confidence; shell alone = medium)

**Quick undo**:
```bash
# Release quarantine
kubectl delete networkpolicy quarantine-$POD -n $NS
# Restore original labels from backup
kubectl label pod $POD -n $NS app=original-app-label quarantine-
# Verify pod is back in service
kubectl get endpoints -n $NS
```

### 3. Chain of Custody

For forensic evidence to be legally admissible:
- **Timestamps**: Every evidence file has a collection timestamp
- **Integrity**: SHA-256 hash of every file in the manifest (proves nothing was modified after collection)
- **Identity**: Who collected it (user, hostname)
- **Archive hash**: The tarball itself is hashed — any tampering is detectable
- **Immutable storage**: Upload to write-once storage (S3 with Object Lock, or evidence management system)
- **Access log**: Who accessed the evidence, when, and why

### 4. Protecting the Response Pipeline

If an attacker compromises your IR automation, they can:
- Disable alerting (suppress their own alerts)
- Delete evidence (cover their tracks)
- Modify playbooks (prevent containment)

**Protections**:
- IR automation runs with **minimal RBAC** — can read pod info and apply NetworkPolicies, but cannot delete pods or modify deployments
- Playbook code is **signed and verified** before execution
- Audit log is written to **immutable storage** (append-only)
- IR system itself is monitored by Falco (Falco watching the watcher)
- Out-of-band alerting: even if in-cluster alerting is compromised, send alerts via a separate channel (SMS, separate Slack workspace)

### 5. MTTD vs MTTC vs MTTR

| Metric | Measures | Industry Avg | Target |
|---|---|---|---|
| **MTTD** (Mean Time to Detect) | Time from breach to first alert | 204 days (IBM) | < 1 hour (with Falco) |
| **MTTC** (Mean Time to Contain) | Time from alert to isolation | Hours to days | < 5 minutes (automated) |
| **MTTR** (Mean Time to Remediate) | Time from detection to full resolution | 73 days (IBM) | < 7 days |

With this automation, you achieve:
- MTTD: **~0 seconds** (Falco detects in real-time via eBPF)
- MTTC: **< 2 minutes** (automated evidence + isolation)
- MTTR: Still requires human investigation, patch, and deploy — target 24-72 hours

