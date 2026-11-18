# Lab 4.3 — Security Metrics & KPI Dashboard Solution Guide
**Phase**: 4 — Pro / Leadership

---

## Task 1: Security KPI Definitions

```markdown
# metrics-definition.md — DevSecOps KPI Framework

## Lagging Indicators (Outcome Metrics)
| KPI | Formula | Target | Measured |
|---|---|---|---|
| MTTR Critical | avg(resolved_date - discovered_date) for critical CVEs | < 7 days | Weekly |
| MTTR High | avg(resolved_date - discovered_date) for high CVEs | < 30 days | Weekly |
| Open Critical Vulns | count(status=open AND severity=critical) | 0 | Daily |
| Vulnerability Aging | count(age > 90d) / count(all open) × 100 | < 5% | Weekly |
| Security Incidents from Known Vulns | count(incidents caused by unpatched CVEs) | 0 | Monthly |

## Leading Indicators (Process Metrics)
| KPI | Formula | Target | Measured |
|---|---|---|---|
| Pipeline Gate Pass Rate | count(passed) / count(total builds) × 100 | > 80% | Daily |
| SBOM Coverage | count(services with SBOM < 7d old) / count(all prod services) × 100 | 100% | Daily |
| Scan Coverage | count(repos with security scanning) / count(all repos) × 100 | 100% | Weekly |
| Pre-commit Hook Adoption | count(devs with pre-commit) / count(all devs) × 100 | > 90% | Monthly |
| False Positive Rate | count(FP findings) / count(all findings) × 100 | < 15% | Monthly |
| Time to First Scan | avg(first_commit_date - first_scan_date) for new repos | < 1 day | Monthly |
```

---

## Task 2: Metrics Stack Deployment

```yaml
# docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus/alert-rules.yml:/etc/prometheus/alert-rules.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=90d'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=devsecops
      - GF_DASHBOARDS_DEFAULT_HOME_DASHBOARD_PATH=/etc/grafana/provisioning/dashboards/engineering-overview.json
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
    depends_on:
      - prometheus

  security-exporter:
    build: ./security-exporter
    ports:
      - "8080:8080"
    volumes:
      - ./scan-results:/data/scan-results
    environment:
      - SCAN_DIR=/data/scan-results
      - PORT=8080
      - SCAN_INTERVAL=60

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./prometheus/alertmanager.yml:/etc/alertmanager/alertmanager.yml

volumes:
  prometheus-data:
  grafana-data:
```

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 30s
  evaluation_interval: 30s

rule_files:
  - alert-rules.yml

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

scrape_configs:
  - job_name: 'security-exporter'
    static_configs:
      - targets: ['security-exporter:8080']
    scrape_interval: 60s
```

```yaml
# grafana/datasources/prometheus.yml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
```

---

## Task 3: Security Metrics Exporter

```python
# security-exporter/exporter.py
"""
Custom Prometheus exporter that reads security scan results
and exposes DevSecOps metrics.
"""

import os
import json
import glob
import time
import hashlib
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
from prometheus_client import (
    Gauge, Histogram, Counter, CollectorRegistry,
    generate_latest, CONTENT_TYPE_LATEST
)

# ─── Configuration ───
SCAN_DIR = os.environ.get('SCAN_DIR', '/data/scan-results')
PORT = int(os.environ.get('PORT', '8080'))

# ─── Prometheus Metrics ───
registry = CollectorRegistry()

vuln_total = Gauge(
    'devsecops_vulnerabilities_total',
    'Total vulnerabilities by service and severity',
    ['service', 'severity'],
    registry=registry
)

vuln_fixable = Gauge(
    'devsecops_vulnerabilities_fixable',
    'Vulnerabilities with available fixes',
    ['service', 'severity'],
    registry=registry
)

mttr_histogram = Histogram(
    'devsecops_mttr_days',
    'Mean Time to Remediate in days',
    ['severity'],
    buckets=[1, 3, 7, 14, 30, 60, 90, 180, 365],
    registry=registry
)

pipeline_pass_rate = Gauge(
    'devsecops_pipeline_pass_rate',
    'Security gate pass rate (0-1)',
    ['service'],
    registry=registry
)

sbom_age_days = Gauge(
    'devsecops_sbom_age_days',
    'Days since last SBOM generation',
    ['service'],
    registry=registry
)

findings_by_tool = Gauge(
    'devsecops_findings_by_tool',
    'Security findings count by tool',
    ['tool', 'severity'],
    registry=registry
)

scan_timestamp = Gauge(
    'devsecops_last_scan_timestamp',
    'Unix timestamp of last scan',
    ['service', 'tool'],
    registry=registry
)

risk_score = Gauge(
    'devsecops_risk_score',
    'Calculated risk score (0-100) per service',
    ['service'],
    registry=registry
)


def parse_grype_report(filepath):
    """Parse a Grype JSON vulnerability report."""
    with open(filepath) as f:
        data = json.load(f)

    # Extract service name from filename
    service = os.path.basename(filepath).replace('-vulns.json', '').replace('-grype.json', '')

    severity_counts = {'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0, 'Negligible': 0}
    fixable_counts = {'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0, 'Negligible': 0}

    for match in data.get('matches', []):
        sev = match.get('vulnerability', {}).get('severity', 'Unknown')
        if sev in severity_counts:
            severity_counts[sev] += 1

            # Check if fix is available
            fix_versions = match.get('vulnerability', {}).get('fix', {}).get('versions', [])
            if fix_versions:
                fixable_counts[sev] += 1

    return service, severity_counts, fixable_counts


def parse_semgrep_report(filepath):
    """Parse a Semgrep SARIF report."""
    with open(filepath) as f:
        data = json.load(f)

    severity_map = {
        'error': 'High',
        'warning': 'Medium',
        'note': 'Low',
        'none': 'Low'
    }

    counts = {'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0}

    for run in data.get('runs', []):
        for result in run.get('results', []):
            level = result.get('level', 'warning')
            mapped_sev = severity_map.get(level, 'Medium')
            counts[mapped_sev] += 1

    return counts


def calculate_risk_score(severity_counts):
    """
    Calculate a risk score 0-100 based on vulnerability counts.
    Formula: (Critical×40 + High×10 + Medium×3 + Low×1), capped at 100.
    """
    score = (
        severity_counts.get('Critical', 0) * 40 +
        severity_counts.get('High', 0) * 10 +
        severity_counts.get('Medium', 0) * 3 +
        severity_counts.get('Low', 0) * 1
    )
    return min(score, 100)


def collect_metrics():
    """Scan all report files and update Prometheus metrics."""

    # Reset all metrics
    vuln_total._metrics.clear()
    vuln_fixable._metrics.clear()
    findings_by_tool._metrics.clear()
    risk_score._metrics.clear()

    # ── Grype reports ──
    for filepath in glob.glob(os.path.join(SCAN_DIR, '*-grype.json')) + \
                    glob.glob(os.path.join(SCAN_DIR, '*-vulns.json')):
        try:
            service, sev_counts, fix_counts = parse_grype_report(filepath)

            for severity, count in sev_counts.items():
                vuln_total.labels(service=service, severity=severity).set(count)
                findings_by_tool.labels(tool='grype', severity=severity).inc(count)

            for severity, count in fix_counts.items():
                vuln_fixable.labels(service=service, severity=severity).set(count)

            risk_score.labels(service=service).set(calculate_risk_score(sev_counts))

            # Record scan timestamp
            mtime = os.path.getmtime(filepath)
            scan_timestamp.labels(service=service, tool='grype').set(mtime)

        except Exception as e:
            print(f"Error parsing {filepath}: {e}")

    # ── Semgrep reports ──
    for filepath in glob.glob(os.path.join(SCAN_DIR, '*-semgrep.sarif')) + \
                    glob.glob(os.path.join(SCAN_DIR, '*-semgrep.json')):
        try:
            counts = parse_semgrep_report(filepath)
            for severity, count in counts.items():
                findings_by_tool.labels(tool='semgrep', severity=severity).inc(count)
        except Exception as e:
            print(f"Error parsing {filepath}: {e}")

    # ── SBOM age ──
    for filepath in glob.glob(os.path.join(SCAN_DIR, '*-sbom.json')):
        service = os.path.basename(filepath).replace('-sbom.json', '')
        mtime = os.path.getmtime(filepath)
        age_days = (time.time() - mtime) / 86400
        sbom_age_days.labels(service=service).set(round(age_days, 1))


class MetricsHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/metrics':
            collect_metrics()
            output = generate_latest(registry)
            self.send_response(200)
            self.send_header('Content-Type', CONTENT_TYPE_LATEST)
            self.end_headers()
            self.wfile.write(output)
        elif self.path == '/healthz':
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'OK')
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass  # Suppress request logs


if __name__ == '__main__':
    print(f"🔒 Security Metrics Exporter starting on :{PORT}")
    print(f"📁 Scan directory: {SCAN_DIR}")
    server = HTTPServer(('0.0.0.0', PORT), MetricsHandler)
    server.serve_forever()
```

```dockerfile
# security-exporter/Dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN pip install prometheus_client
COPY exporter.py .
EXPOSE 8080
CMD ["python", "exporter.py"]
```

---

## Task 4: Grafana Dashboard JSON (Engineering View)

```json
// grafana/dashboards/engineering-overview.json (simplified — key panels)
{
  "dashboard": {
    "title": "DevSecOps — Engineering Overview",
    "panels": [
      {
        "title": "Vulnerabilities by Service",
        "type": "barchart",
        "targets": [
          {
            "expr": "devsecops_vulnerabilities_total{severity=~\"Critical|High\"}",
            "legendFormat": "{{service}} ({{severity}})"
          }
        ]
      },
      {
        "title": "Risk Score by Service",
        "type": "gauge",
        "targets": [
          {
            "expr": "devsecops_risk_score",
            "legendFormat": "{{service}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "max": 100,
            "thresholds": {
              "steps": [
                {"color": "green", "value": 0},
                {"color": "yellow", "value": 30},
                {"color": "orange", "value": 60},
                {"color": "red", "value": 80}
              ]
            }
          }
        }
      },
      {
        "title": "Fixable vs Unfixable (Critical+High)",
        "type": "piechart",
        "targets": [
          {
            "expr": "sum(devsecops_vulnerabilities_fixable{severity=~\"Critical|High\"})",
            "legendFormat": "Fixable"
          },
          {
            "expr": "sum(devsecops_vulnerabilities_total{severity=~\"Critical|High\"}) - sum(devsecops_vulnerabilities_fixable{severity=~\"Critical|High\"})",
            "legendFormat": "No Fix Available"
          }
        ]
      },
      {
        "title": "SBOM Freshness",
        "type": "table",
        "targets": [
          {
            "expr": "devsecops_sbom_age_days",
            "legendFormat": "{{service}}"
          }
        ]
      }
    ]
  }
}
```

---

## Task 5: Alerting Rules

```yaml
# prometheus/alert-rules.yml
groups:
  - name: devsecops-security-alerts
    rules:
      - alert: CriticalVulnExists
        expr: devsecops_vulnerabilities_total{severity="Critical"} > 0
        for: 1h
        labels:
          severity: critical
          team: security
        annotations:
          summary: "🔴 Critical vulnerability in {{ $labels.service }}"
          description: "{{ $value }} critical vulnerabilities found. Requires remediation within 7 days per policy."
          runbook: "https://wiki.internal/runbooks/critical-vuln-response"

      - alert: HighVulnBacklog
        expr: sum(devsecops_vulnerabilities_total{severity="High"}) > 20
        for: 24h
        labels:
          severity: warning
        annotations:
          summary: "🟠 High vulnerability backlog exceeds threshold"
          description: "{{ $value }} high vulnerabilities across all services (threshold: 20)"

      - alert: PipelinePassRateLow
        expr: devsecops_pipeline_pass_rate < 0.6
        for: 24h
        labels:
          severity: warning
        annotations:
          summary: "⚠️ Security gate pass rate below 60% for {{ $labels.service }}"
          description: "Pass rate: {{ $value | humanizePercentage }}. Developers may need security training or tooling improvements."

      - alert: SBOMStale
        expr: devsecops_sbom_age_days > 30
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "📦 SBOM for {{ $labels.service }} is {{ $value }} days old"
          description: "SBOMs should be regenerated at least monthly. Check if CI pipeline is running."

      - alert: RiskScoreCritical
        expr: devsecops_risk_score > 80
        for: 4h
        labels:
          severity: critical
        annotations:
          summary: "🚨 Risk score critical for {{ $labels.service }}: {{ $value }}/100"
```

```yaml
# prometheus/alertmanager.yml
global:
  resolve_timeout: 5m

route:
  receiver: 'slack-default'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
    - match:
        severity: warning
      receiver: 'slack-default'

receivers:
  - name: 'slack-default'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK'
        channel: '#devsecops-alerts'
        title: '{{ .CommonAnnotations.summary }}'
        text: '{{ .CommonAnnotations.description }}'

  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
```

---

## Task 6: Sample Data Generator

```bash
#!/bin/bash
# generate-sample-data.sh — Create 30 days of realistic scan history

SCAN_DIR="./scan-results"
mkdir -p "$SCAN_DIR"

SERVICES=("user-service" "payment-api" "frontend" "auth-service" "notification-worker")

# Simulate improving security posture over 30 days
for day in $(seq 30 -1 0); do
    DATE=$(date -d "$day days ago" +%Y-%m-%d 2>/dev/null || date -v-${day}d +%Y-%m-%d)
    
    for service in "${SERVICES[@]}"; do
        # Vulnerabilities decrease over time (security program working)
        BASE_CRITICAL=$((RANDOM % 3 + (day / 10)))
        BASE_HIGH=$((RANDOM % 8 + (day / 5)))
        BASE_MEDIUM=$((RANDOM % 15 + day / 3))
        BASE_LOW=$((RANDOM % 20 + day / 2))
        
        # payment-api is the outlier — stays risky
        if [ "$service" = "payment-api" ]; then
            BASE_CRITICAL=$((BASE_CRITICAL + 3))
            BASE_HIGH=$((BASE_HIGH + 5))
        fi
        
        # Generate Grype-style JSON
        cat > "$SCAN_DIR/${service}-${DATE}-grype.json" << EOF
{
  "matches": [
    $(python3 -c "
import json, random
matches = []
for i in range($BASE_CRITICAL):
    matches.append({'vulnerability': {'id': f'CVE-2024-{random.randint(1000,9999)}', 'severity': 'Critical', 'fix': {'versions': [f'1.{random.randint(1,9)}.0'] if random.random() > 0.3 else []}}, 'artifact': {'name': f'pkg-{random.randint(1,20)}', 'version': f'0.{random.randint(1,9)}.0'}})
for i in range($BASE_HIGH):
    matches.append({'vulnerability': {'id': f'CVE-2024-{random.randint(1000,9999)}', 'severity': 'High', 'fix': {'versions': [f'2.{random.randint(1,9)}.0'] if random.random() > 0.2 else []}}, 'artifact': {'name': f'lib-{random.randint(1,30)}', 'version': f'1.{random.randint(1,9)}.0'}})
for i in range($BASE_MEDIUM):
    matches.append({'vulnerability': {'id': f'CVE-2024-{random.randint(1000,9999)}', 'severity': 'Medium', 'fix': {'versions': []}}, 'artifact': {'name': f'dep-{random.randint(1,50)}', 'version': f'3.{random.randint(1,9)}.0'}})
print(','.join(json.dumps(m) for m in matches))
" 2>/dev/null)
  ],
  "source": {"type": "image", "target": {"tags": ["$service:latest"]}},
  "descriptor": {"timestamp": "${DATE}T06:00:00Z"}
}
EOF
    done
done

echo "✅ Generated $(find $SCAN_DIR -name '*.json' | wc -l) scan result files"
echo "📁 Location: $SCAN_DIR"
```

---

## ✅ Answers to Reflection Questions

### 1. Reducing MTTR from 14 Days to 7 Days

**Process changes**:
- **Auto-create tickets**: Critical CVE → JIRA ticket auto-created, assigned to team lead, 7-day SLA
- **Dedicated security sprint capacity**: Reserve 20% of each sprint for security remediation
- **Daily triage**: Replace weekly vulnerability review with daily 15-min standup
- **Escalation policy**: > 3 days without action → auto-escalate to engineering manager

**Tooling changes**:
- **Auto-PR for dependency updates**: Dependabot/Renovate creates PRs with fix versions
- **Fix suggestions in scanner output**: Semgrep autofix, Grype fix version in CI comments
- **One-click remediation**: Dashboard links directly to PR that fixes the CVE
- **Break the build earlier**: Fail in PR (not just main) to catch before merge

### 2. "Zero Critical CVEs = Excellent Security"

Check these metrics before agreeing:
- **Scan coverage**: Are ALL repos/services being scanned? (0 CVEs from 0 scans = meaningless)
- **False positive suppression**: Are findings being suppressed/ignored? Check waiver/ignore file size
- **Scope of scanning**: Are you scanning dependencies, containers, IaC, AND runtime? Missing a category = blind spots
- **DAST results**: Static scans don't find business logic flaws, auth bypass, or IDOR
- **Runtime alerts**: Zero CVEs doesn't mean zero active threats
- **Security debt**: How many accepted-risk items exist?

### 3. Goodhart's Law in DevSecOps

**Goodhart's Law**: "When a measure becomes a target, it ceases to be a good measure."

**DevSecOps example**: You set a KPI: "Zero critical vulnerabilities in production."

What happens:
- Team A adds every critical finding to the `.trivyignore` file → "Zero critical CVEs!" (but they're still vulnerable)
- Team B downgrades findings from Critical to High → "Zero critical CVEs!" (gaming the system)
- Team C stops scanning a risky service → "Zero critical CVEs!" (because they stopped looking)

**Solution**: Measure MTTR (time to fix) and audit suppression rates. You can't game "how fast did you fix it" as easily as "how many do you have."

### 4. Public vs Private Vulnerability Metrics

| | Public (Org-Wide) | Private (Team-Only) |
|---|---|---|
| **Pro** | Peer pressure drives improvement; transparency builds trust | No "naming and shaming"; psychological safety |
| **Pro** | Cross-team learning from each other's issues | Teams more willing to report honestly |
| **Con** | Teams may suppress/hide findings to avoid embarrassment | No accountability; easy to ignore |
| **Con** | Can create unhealthy competition | Siloed knowledge; repeat mistakes |

**Best practice**: **Aggregate public, details private.**
- Public: "Team A's MTTR is 5 days" (good!) and "Team B's MTTR is 25 days" (needs help)
- Private: "Team B has 3 unpatched log4j instances in service X" (only visible to Team B + security team)

### 5. The Denominator Problem

A team with 2 services and 5 vulns is NOT equivalent to a team with 50 services and 5 vulns.

**Solution**: Normalize metrics per service:
- **Vulnerability density** = total vulns / number of services
- **Risk-weighted density** = (Critical×10 + High×5 + Medium×2 + Low×1) / number of services

| Team | Services | Vulns | Density | Risk Score |
|---|---|---|---|---|
| Team A | 2 | 5 Critical | 2.5 | 25.0 per service |
| Team B | 50 | 5 Medium | 0.1 | 0.2 per service |

Team A is clearly the higher risk despite having the same count.

