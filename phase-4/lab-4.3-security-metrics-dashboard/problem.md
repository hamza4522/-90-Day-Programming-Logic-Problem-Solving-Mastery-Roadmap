# Lab 4.3 — Security Metrics & KPI Dashboard
**Phase**: 4 — Pro / Leadership  
**Difficulty**: ⭐⭐⭐ Advanced  
**Estimated Time**: 3–4 hours  
**Category**: Security Metrics, Observability, Executive Reporting

---

## 🎯 Objective

Build a **Security Metrics Dashboard** that aggregates data from your DevSecOps tools (Trivy, Semgrep, Grype, Falco) into actionable KPIs. You'll measure what matters: Mean Time to Remediate (MTTR), vulnerability aging, security debt, and pipeline failure rates — then visualize them for both engineering teams and executive leadership.

---

## 📋 Problem Statement

Your DevSecOps program has been running for 6 months. The CISO asks: "Is it working?" You have data scattered across:
- Trivy scans producing JSON reports in CI/CD artifacts
- Semgrep findings in SARIF files
- Grype SBOM vulnerability scans
- Falco runtime alerts in Elasticsearch
- GitHub Security Advisories / Dependabot alerts

Nobody is aggregating this data. You can't answer basic questions:
1. How many critical vulnerabilities exist across all services RIGHT NOW?
2. What is our average time from vulnerability discovery to remediation?
3. Are we getting better or worse over time?
4. Which teams have the most security debt?
5. Are developers actually fixing findings before they hit production?

Your task: Build a metrics pipeline and dashboard that answers these questions.

---

## 🛠️ Prerequisites

- Docker and Docker Compose
- Completed Labs 2.2 (Semgrep), 2.3 (Trivy), 4.2 (SBOM) recommended
- Basic familiarity with Grafana (we'll set it up from scratch)

---

## 📋 Tasks

### Task 1: Define Your Security KPIs

Before building anything, define the metrics. Create `metrics-definition.md`:

| KPI | Definition | Target | Data Source |
|---|---|---|---|
| **MTTR (Critical)** | Avg days from critical CVE discovery to patch deployed | < 7 days | CI/CD scan timestamps |
| **MTTR (High)** | Avg days from high CVE discovery to patch deployed | < 30 days | CI/CD scan timestamps |
| **Open Critical Vulns** | Count of unresolved critical CVEs across all services | 0 | Grype/Trivy scans |
| **Vulnerability Aging** | % of vulns open > 90 days | < 5% | Scan history |
| **Pipeline Security Gate Pass Rate** | % of builds that pass security gates on first attempt | > 80% | CI/CD pipeline data |
| **SBOM Coverage** | % of production services with current SBOMs | 100% | SBOM inventory |
| **False Positive Rate** | % of findings marked as false positives | < 15% | Triage data |
| **Security Debt** | Total count of accepted-risk / deferred findings | Trending down | Triage data |

### Task 2: Deploy the Metrics Stack

Set up Prometheus + Grafana + a custom exporter:

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
      - prometheus-data:/prometheus

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=devsecops
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

  security-exporter:
    build: ./security-exporter
    ports:
      - "8080:8080"
    volumes:
      - ./scan-results:/data/scan-results

volumes:
  prometheus-data:
  grafana-data:
```

### Task 3: Build a Security Metrics Exporter

Create a custom Prometheus exporter that reads scan results and exposes metrics:

```python
# security-exporter/exporter.py (skeleton — implement the logic)

# Expose these Prometheus metrics:
# - devsecops_vulnerabilities_total{service, severity} — gauge
# - devsecops_mttr_days{service, severity} — histogram
# - devsecops_pipeline_pass_rate{service} — gauge
# - devsecops_sbom_age_days{service} — gauge
# - devsecops_findings_by_tool{tool, severity} — gauge

# The exporter should:
# 1. Read Grype/Trivy JSON reports from a directory
# 2. Parse vulnerability counts by severity
# 3. Calculate MTTR from first-seen → resolved timestamps
# 4. Expose as Prometheus metrics on :8080/metrics
```

### Task 4: Create Grafana Dashboards

Build two dashboards:

**Dashboard 1: Engineering Team View**
- Vulnerability counts by service (bar chart)
- MTTR trend over time (time series)
- Top 10 unresolved critical CVEs (table)
- Pipeline pass/fail rate (pie chart)
- New vs resolved vulnerabilities this week (stat panel)

**Dashboard 2: Executive / CISO View**
- Overall risk score (single stat — Green/Yellow/Red)
- Compliance posture (gauge — % controls passing)
- Month-over-month vulnerability trend (time series)
- MTTR by severity (bar chart)
- Top 3 riskiest services (table)

### Task 5: Alerting Rules

Configure Prometheus alerting rules for:

```yaml
# prometheus/alert-rules.yml
groups:
  - name: devsecops-alerts
    rules:
      - alert: CriticalVulnUnresolved7Days
        expr: # Write the PromQL
        for: 1h
        labels:
          severity: critical
        annotations:
          summary: "Critical vulnerability unresolved for > 7 days"

      - alert: HighVulnBacklog
        expr: # Write the PromQL
        for: 1h
        annotations:
          summary: "More than 20 high vulnerabilities across services"

      - alert: PipelinePassRateLow
        expr: # Write the PromQL
        for: 24h
        annotations:
          summary: "Security gate pass rate below 60%"
```

### Task 6: Generate Sample Data & Demo

1. Create a script that generates realistic historical scan data (30 days of history)
2. Load it into your metrics pipeline
3. Take screenshots of your dashboards showing:
   - A clear downward trend in vulnerabilities (your DevSecOps program is working!)
   - MTTR improving over time
   - One service that's an outlier (needs attention)

---

## 📝 Deliverables

1. `docker-compose.yml` — full metrics stack
2. `security-exporter/` — custom Prometheus exporter
3. `grafana/dashboards/` — exported Grafana dashboard JSON files
4. `prometheus/alert-rules.yml` — alerting configuration
5. `metrics-definition.md` — KPI definitions and targets
6. `generate-sample-data.sh` — script to produce realistic test data

---

## ❓ Questions to Answer

1. Your MTTR for critical vulnerabilities is 14 days. The CISO wants it under 7. What process and tooling changes would you recommend?
2. A team lead argues "we have zero critical CVEs — our security posture is excellent." What other metrics would you check before agreeing?
3. What is **Goodhart's Law** and how does it apply to security metrics? Give a specific DevSecOps example.
4. Should vulnerability count metrics be **public** within the org (visible to all teams) or **private** (only visible to the owning team)? What are the tradeoffs?
5. How do you handle the "denominator problem" — a team with 2 services and 5 vulns vs a team with 50 services and 5 vulns?

---

> 💡 **Goodhart's Law**: "When a measure becomes a target, it ceases to be a good measure." If you reward teams for zero vulnerabilities, they'll suppress findings rather than fix them. Measure **time to fix**, not **count of findings**.

> 📋 **DORA metrics**: DevSecOps metrics parallel the DORA (DevOps Research & Assessment) metrics. MTTR for security is analogous to DORA's "Time to Restore Service." The best DevSecOps programs track both.

---

## 🔗 Useful Links & References

- [Prometheus Documentation](https://prometheus.io/docs/introduction/overview/)
- [Grafana Documentation](https://grafana.com/docs/grafana/latest/)
- [Prometheus Python Client](https://github.com/prometheus/client_python)
- [DORA Metrics Overview](https://dora.dev/research/)
- [OpenSSF Scorecard](https://securityscorecards.dev/)
- [OWASP Vulnerability Management Guide](https://owasp.org/www-community/Vulnerability_Management_Guide)
- [PromQL Query Basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)


