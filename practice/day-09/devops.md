# Day 9: DevOps & Cloud Infrastructure — DevOps & Cloud Infrastructure — Day 9

**Level**: Level 1  
**Track Focus**: Linux Systems, Networking & Docker Foundations

---

## 🎯 Engineering Objective
Day 9 delivers hands-on cloud and DevOps infrastructure knowledge with battle-tested automation configurations and production architectures.

---

## 🏗️ Cloud Infrastructure & Deployment Topology
```text
[ Developer Commit ] ──> [ GitHub Actions CI/CD ]
                                │ Build & Test
                                ▼
                       [ Container Registry (ECR/GHCR) ]
                                │ Immutable Image Digest
                                ▼
   [ Kubernetes Cluster (ArgoCD GitOps Sync) ]
     ├── Ingress Controller (TLS Termination)
     ├── Stateless Deployment (Auto-Scaled Pods)
     └── Cluster Monitoring (Prometheus + Grafana)
```

---

## 💻 Infrastructure as Code (Terraform / Kubernetes Manifest)
```yaml
# Production Deployment Manifest — Day 9
apiVersion: apps/v1
kind: Deployment
metadata:
  name: service-day-09
  labels:
    app: service-day-09
    track: devops
spec:
  replicas: 3
  selector:
    matchLabels:
      app: service-day-09
  template:
    metadata:
      labels:
        app: service-day-09
    spec:
      containers:
      - name: main
        image: ghcr.io/org/service:v1.0.9
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        readinessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
```

---

## ⚖️ SRE Trade-offs & Resilience Invariants
- **Resource Requests vs Limits**: Setting requests guarantees scheduling on nodes; setting limits prevents runaway memory leaks from triggering node-wide OOM kills.
- **Rollout Strategy**: Always configure `maxSurge` and `maxUnavailable` to guarantee zero downtime during rolling updates.
- **Observability**: Expose Prometheus metrics on `/metrics` for automated horizontal pod autoscaling (HPA).

---

## 🛠️ Hands-On DevOps Exercise
> **Challenge**:  
> Write the automated pipeline or deployment specification for **Linux Systems, Networking & Docker Foundations** with built-in health checks and rolling update safety.
