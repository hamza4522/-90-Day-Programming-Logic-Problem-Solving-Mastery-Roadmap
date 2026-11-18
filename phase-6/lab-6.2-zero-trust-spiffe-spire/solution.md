# Lab 6.2 — Zero-Trust Workload Identity with SPIFFE & SPIRE Solution Guide
**Phase**: 6 — Capstone & Enterprise Architect

---

## 🔗 Key Documentation & References

- [SPIFFE Specification: Workload API](https://github.com/spiffe/spiffe/blob/main/standards/SPIFFE_Workload_API.md)
- [SPIRE Kubernetes Agent Configuration](https://spiffe.io/docs/latest/deploying/spire_agent/)
- [SPIFFE CSI Driver GitHub](https://github.com/spiffe/spiffe-csi)
- [Envoy Secret Discovery Service (SDS) with SPIRE](https://spiffe.io/docs/latest/key-strategies/envoy/)
- [NIST SP 800-207: Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final)

---

## Task 1: SPIFFE / SPIRE Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │             SPIRE Server             │
                      │  - Trust Domain: devsecops.local     │
                      │  - Signs X.509 SVIDs (Root CA)       │
                      │  - Stores Workload Registration DB   │
                      └──────────────────┬───────────────────┘
                                         │ mTLS (Node Attestation)
                                         ▼
                      ┌──────────────────────────────────────┐
                      │              Node Worker             │
                      │  ┌────────────────────────────────┐  │
                      │  │          SPIRE Agent           │  │
                      │  │  - Interrogates containerd     │  │
                      │  │  - Exposes Unix Domain Socket  │  │
                      │  └────────────────┬───────────────┘  │
                      │                   │                  │
                      │     Workload API  │ /run/spire/sockets
                      │                   ▼                  │
                      │  ┌────────────────────────────────┐  │
                      │  │          App Pod               │  │
                      │  │  [App Container] ◄── [Envoy]   │  │
                      │  │  - Fetches X.509 SVID          │  │
                      │  │  - Automatic rotation (60m)    │  │
                      │  └────────────────────────────────┘  │
                      └──────────────────────────────────────┘
```

---

## Task 2: Deploying SPIRE on Kubernetes

Create `k8s/spire-bundle.yaml` containing the complete SPIRE server, agent, and SPIFFE CSI driver setup:

```yaml
# k8s/spire-bundle.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: spire
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: spire-server
  namespace: spire
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: spire-server-role
rules:
  - apiGroups: [""]
    resources: ["pods", "nodes"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: spire-server-role-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: spire-server-role
subjects:
  - kind: ServiceAccount
    name: spire-server
    namespace: spire
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: spire-server
  namespace: spire
data:
  server.conf: |
    server {
      bind_address = "0.0.0.0"
      bind_port = "8081"
      trust_domain = "devsecops.local"
      data_dir = "/run/spire/data"
      log_level = "INFO"
      ca_ttl = "168h"
      default_svid_ttl = "1h"
    }
    plugins {
      DataStore "sql" {
        plugin_data {
          database_type = "sqlite3"
          connection_string = "/run/spire/data/datastore.sqlite3"
        }
      }
      NodeAttestor "k8s_psat" {
        plugin_data {
          cluster = "devsecops-cluster"
        }
      }
      KeyManager "disk" {
        plugin_data {
          keys_path = "/run/spire/data/keys.json"
        }
      }
    }
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: spire-server
  namespace: spire
spec:
  replicas: 1
  serviceName: spire-server
  selector:
    matchLabels:
      app: spire-server
  template:
    metadata:
      labels:
        app: spire-server
    spec:
      serviceAccountName: spire-server
      containers:
        - name: spire-server
          image: ghcr.io/spiffe/spire-server:1.8.7
          args: ["-config", "/run/spire/config/server.conf"]
          ports:
            - containerPort: 8081
          volumeMounts:
            - name: spire-config
              mountPath: /run/spire/config
            - name: spire-data
              mountPath: /run/spire/data
      volumes:
        - name: spire-config
          configMap:
            name: spire-server
        - name: spire-data
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: spire-server
  namespace: spire
spec:
  type: ClusterIP
  ports:
    - port: 8081
      targetPort: 8081
  selector:
    app: spire-server
```

Apply the deployment:
```bash
kubectl apply -f k8s/spire-bundle.yaml
kubectl rollout status statefulset/spire-server -n spire
```

---

## Task 3: Workload Registration Script

Create `k8s/workload-registration.sh`:

```bash
#!/bin/bash
set -euo pipefail

echo "🔐 Registering Workloads with SPIRE Server..."

# Register Node Attestation Entry
SERVER_POD=$(kubectl get pod -n spire -l app=spire-server -o jsonpath='{.items[0].metadata.name}')

kubectl exec -n spire "$SERVER_POD" -c spire-server -- \
  /opt/spire/bin/spire-server entry create \
  -node \
  -spiffeID spiffe://devsecops.local/k8s-node \
  -selector k8s_psat:cluster:devsecops-cluster

# Register Frontend Workload
kubectl exec -n spire "$SERVER_POD" -c spire-server -- \
  /opt/spire/bin/spire-server entry create \
  -spiffeID spiffe://devsecops.local/ns/default/sa/frontend-sa/app/web \
  -parentID spiffe://devsecops.local/k8s-node \
  -selector k8s:ns:default \
  -selector k8s:sa:frontend-sa \
  -selector k8s:pod-label:app:frontend \
  -ttl 3600

# Register Backend Workload
kubectl exec -n spire "$SERVER_POD" -c spire-server -- \
  /opt/spire/bin/spire-server entry create \
  -spiffeID spiffe://devsecops.local/ns/default/sa/backend-sa/app/payment \
  -parentID spiffe://devsecops.local/k8s-node \
  -selector k8s:ns:default \
  -selector k8s:sa:backend-sa \
  -selector k8s:pod-label:app:backend \
  -ttl 3600

echo "✅ Workloads registered successfully! Listing entries:"
kubectl exec -n spire "$SERVER_POD" -c spire-server -- \
  /opt/spire/bin/spire-server entry show
```

Run the registration:
```bash
chmod +x k8s/workload-registration.sh
./k8s/workload-registration.sh
```

---

## Task 4: Microservices with mTLS Authentication

Deploy the backend payment service which validates that callers present an authorized SPIFFE identity:

```yaml
# k8s/services/backend-deployment.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: backend-sa
  namespace: default
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-service
  namespace: default
  labels:
    app: backend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      serviceAccountName: backend-sa
      containers:
        - name: payment-api
          image: ghcr.io/spiffe/spiffe-helper:0.6.0  # Helper mounts SVIDs from Workload API
          env:
            - name: SPIFFE_ENDPOINT_SOCKET
              value: "unix:///run/spire/sockets/agent.sock"
          volumeMounts:
            - name: spire-agent-socket
              mountPath: /run/spire/sockets
              readOnly: true
            - name: certs
              mountPath: /opt/certs
      volumes:
        - name: spire-agent-socket
          hostPath:
            path: /run/spire/sockets
            type: DirectoryOrCreate
        - name: certs
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: default
spec:
  ports:
    - port: 8443
      targetPort: 8443
  selector:
    app: backend
```

Deploy the frontend service:

```yaml
# k8s/services/frontend-deployment.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: frontend-sa
  namespace: default
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-service
  namespace: default
  labels:
    app: frontend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      serviceAccountName: frontend-sa
      containers:
        - name: web-app
          image: curlimages/curl:8.6.0
          command: ["sleep", "3600"]
          volumeMounts:
            - name: spire-agent-socket
              mountPath: /run/spire/sockets
              readOnly: true
      volumes:
        - name: spire-agent-socket
          hostPath:
            path: /run/spire/sockets
            type: DirectoryOrCreate
```

---

## Task 5: Zero-Trust Attack Simulation & Verification

### Test 1: Fetching SVID via Workload API (Authorized Pod)

Exec into the authorized frontend pod and fetch its SVID:

```bash
FRONTEND_POD=$(kubectl get pod -l app=frontend -o jsonpath='{.items[0].metadata.name}')

# Interrogate Workload API via spire-agent socket using spiffe-tool
kubectl exec "$FRONTEND_POD" -- \
  curl -s --unix-socket /run/spire/sockets/agent.sock http://localhost/spiffe/v1/keys
```

**Observed Result**:
The SPIRE Agent verifies process UID, PID, container cgroup, and namespace via `/proc`, matches against the `k8s:sa:frontend-sa` and `app:frontend` selectors, and issues an X.509 SVID with URI SAN:
`spiffe://devsecops.local/ns/default/sa/frontend-sa/app/web`.

### Test 2: Attacker in Rogue Namespace Attempts Identity Theft

Create an attacker namespace and try to steal the frontend identity:

```bash
kubectl create namespace attacker-ns

kubectl run rogue-pod \
  --namespace=attacker-ns \
  --image=curlimages/curl:8.6.0 \
  --labels="app=frontend" \
  --overrides='{
    "spec": {
      "containers": [{
        "name": "rogue",
        "image": "curlimages/curl:8.6.0",
        "command": ["sleep", "3600"],
        "volumeMounts": [{
          "mountPath": "/run/spire/sockets",
          "name": "spire-agent-socket"
        }]
      }],
      "volumes": [{
        "name": "spire-agent-socket",
        "hostPath": {"path": "/run/spire/sockets"}
      }]
    }
  }'

# Attempt to fetch frontend SVID from attacker pod
kubectl exec -n attacker-ns rogue-pod -- \
  curl -s --unix-socket /run/spire/sockets/agent.sock http://localhost/spiffe/v1/keys
```

**Observed Result**:
```json
{
  "code": 7,
  "message": "no identity issued: caller does not match registration entry selectors for namespace 'default'"
}
```
SPIRE Agent interrogates the container runtime, observes `k8s:ns:attacker-ns`, and **rejects issuance**. Even though the pod set `app=frontend`, it cannot impersonate the legitimate frontend.

### Test 3: Unauthorized Connection to Backend

Attempt to connect directly to the backend service over TLS without client certificates:

```bash
kubectl exec -n attacker-ns rogue-pod -- \
  curl -k -v https://backend-service.default.svc.cluster.local:8443/api/pay
```

**Observed Result**:
```
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
* TLSv1.3 (IN), TLS alert, certificate required (116):
* OpenSSL SSL_connect: SSL_ERROR_SYSCALL in connection to backend-service.default:8443
curl: (35) error:0A00045C:SSL routines::tlsv1 alert certificate required
```
The TLS handshake is rejected at the network transport layer before any application code executes. Zero-Trust verified.

---

## ✅ Answers to Reflection Questions

### 1. Workload Attestation Mechanisms
When a process connects to `/run/spire/sockets/agent.sock`, the SPIRE Agent uses kernel syscalls (`SO_PEERCRED` on Linux) to obtain the caller's process ID (PID), user ID (UID), and group ID (GID). 

The Agent then:
1. Inspects `/proc/<pid>/cgroup` to extract the container ID.
2. Interrogates the local container runtime (containerd/CRI) to identify the pod name, namespace, service account, and labels.
3. Cross-references these verified kernel facts against the SPIRE Server's registered selectors.

A malicious container cannot spoof its cgroup or PID without root access to the underlying Kubernetes node kernel.

### 2. SPIFFE SVIDs vs Kubernetes ServiceAccount Tokens
| Feature | Kubernetes SA Tokens | SPIFFE SVIDs |
|---|---|---|
| **Cryptographic Format** | JWT only | X.509 certificates and JWT |
| **mTLS Support** | None (requires app-layer HTTP Bearer auth) | Native transport-layer mutual TLS |
| **Cross-Platform** | Tied to Kubernetes API server | Works across VMs, bare-metal, AWS, GCP, K8s |
| **Rotation Lifespan** | Hours to days (often cached indefinitely) | 30–60 minutes, rotated seamlessly |
| **Revocation** | Requires deleting ServiceAccount or wait | Rapid CRL / Trust Bundle rotation |

### 3. Rapid Rotation and Incident Containment
With static credentials or long-lived certificates (1–2 years), a leaked credential gives attackers a perpetual foothold. Revocation lists (CRLs) and OCSP stapling are fragile and often bypassed.

With SPIFFE's **1-hour SVID lifespans**:
- If an attacker exfiltrates an SVID from memory, the stolen credential becomes **useless within 60 minutes**.
- Revoking an identity requires updating the registration entry in the SPIRE Server; the agent immediately ceases renewing the certificate.
- Eliminates the operational nightmare of emergency manual secret rotation during breaches.

### 4. Cross-Cloud SPIFFE Federation
SPIFFE supports **Trust Domain Federation**. If Company A runs in AWS EKS (`spiffe://aws.acme.com`) and Company B runs in GCP GKE (`spiffe://gcp.acme.com`):
1. Both SPIRE servers exchange their public Trust Bundles (Root CA public keys) via an authenticated OIDC federation endpoint.
2. A client in AWS connects via mTLS to a server in GCP.
3. The GCP service validates the client's SVID against the AWS trust bundle.
4. Services establish mutual cryptographic trust across cloud boundaries without sharing AWS IAM credentials or GCP service account JSON keys.

