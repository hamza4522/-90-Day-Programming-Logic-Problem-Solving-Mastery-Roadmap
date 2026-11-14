# Day 54: DevOps & Cloud Infrastructure — DevOps & Cloud Infrastructure — Day 54

**Level**: Level 5  
**Track Focus**: Kubernetes Advanced (StatefulSets, GitOps with ArgoCD)

---

## 🎯 Engineering Objective
Day 54 delivers hands-on cloud and DevOps infrastructure knowledge with battle-tested automation configurations and production architectures.

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
# Production Deployment Manifest — Day 54
apiVersion: apps/v1
kind: Deployment
metadata:
  name: service-day-54
  labels:
    app: service-day-54
    track: devops
spec:
  replicas: 3
  selector:
    matchLabels:
      app: service-day-54
  template:
    metadata:
      labels:
        app: service-day-54
    spec:
      containers:
      - name: main
        image: ghcr.io/org/service:v1.0.54
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
> Write the automated pipeline or deployment specification for **Kubernetes Advanced (StatefulSets, GitOps with ArgoCD)** with built-in health checks and rolling update safety.
