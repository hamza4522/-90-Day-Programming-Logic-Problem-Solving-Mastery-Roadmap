# Lab 6.2 — Zero-Trust Workload Identity with SPIFFE & SPIRE
**Phase**: 6 — Capstone & Enterprise Architect  
**Difficulty**: ⭐⭐⭐⭐⭐ Expert  
**Estimated Time**: 6–8 hours  
**Category**: Zero Trust, Workload Attestation, mTLS, SPIFFE/SPIRE, Service Mesh

---

## 🎯 Objective

Implement a cryptographic **Zero-Trust Workload Identity** architecture using the CNCF graduated standards [SPIFFE (Secure Production Identity Framework for Everyone)](https://spiffe.io/) and [SPIRE (SPIFFE Runtime Environment)](https://spiffe.io/docs/latest/spire-about/spire-concepts/). Replace static credentials, API keys, and IP-based trust with automated workload attestation, dynamic short-lived X.509 SVIDs (SPIFFE Verifiable Identity Documents), and mutual TLS (mTLS).

---

## 📋 Problem Statement

In traditional infrastructure, services authenticate with shared database passwords, long-lived AWS IAM API keys saved in `.env` files, or network IP subnet allowlists. 

In a cloud-native Kubernetes environment, this architecture introduces catastrophic failure modes:
1. **IP spoofing & pod IP reuse**: Pod IPs change dynamically and can be reused by new workloads, breaking perimeter firewall assumptions.
2. **Secret sprawl**: Secrets mounted via Kubernetes Secret resources reside in memory or disk unrotated for months, easily exfiltrated during container compromise (as seen in [Lab 5.4 — Container Forensics](../phase-5/lab-5.4-container-forensics/problem.md)).
3. **Implicit trust**: Any service in the cluster can talk to the internal Redis or PostgreSQL instances if it knows the DNS name and password.

The Enterprise Security Architecture board has mandated:
- **No static secrets**: Workloads must dynamically prove *who they are* to the platform kernel before being granted cryptographic identity.
- **Micro-segmentation via Cryptographic mTLS**: Workload A can only communicate with Workload B if both present valid, unexpired SPIFFE identities signed by the organization's Trust Domain CA.
- **Automated credential rotation**: Certificates must have a lifespan of no more than 1 hour, rotating automatically without restarting applications.

Your task: Deploy SPIRE on Kubernetes, attest workloads using node and container properties, and enforce mTLS communication between frontend and backend services without static credentials.

---

## 🛠️ Prerequisites

- Kubernetes cluster (v1.26+) with administrative access
- Helm v3 installed
- `kubectl` configured
- OpenSSL CLI
- Familiarity with earlier labs:
  - [Lab 3.3 — Secrets Management with HashiCorp Vault](../phase-3/lab-3.3-secrets-vault/problem.md)
  - [Lab 3.4 — Runtime Security with Falco](../phase-3/lab-3.4-runtime-security-falco/problem.md)

---

## 📋 Tasks

### Task 1: Understand SPIFFE & SPIRE Architecture

Review the core SPIFFE concepts before installation:
- **SPIFFE ID**: A standardized URI identifying a workload (e.g., `spiffe://acme.org/ns/production/sa/payment-service`).
- **SVID (SPIFFE Verifiable Identity Document)**: The cryptographic certificate (X.509 or JWT) carrying the SPIFFE ID.
- **Trust Domain**: The boundary of cryptographic trust (e.g., `acme.org`).
- **SPIRE Server**: The authority that manages registration entries and signs SVIDs.
- **SPIRE Agent**: DaemonSet running on every node that interrogates node kernel and container runtime ([Workload Attestors](https://spiffe.io/docs/latest/spire-about/spire-concepts/#workload-attestor)) to verify calling processes.
- **Workload API**: Unix Domain Socket (`/run/spire/sockets/agent.sock`) through which applications fetch their certificates without needing credentials.

Document the workload attestation handshake flow in `architecture.md`.

### Task 2: Deploy SPIRE Server and SPIRE Agent

Deploy the SPIRE infrastructure into the `spire` namespace:

```bash
# Clone the official SPIRE Kubernetes deployment references or use Helm
helm repo add spiffe https://spiffe.github.io/helm-charts-hardened/
helm repo update
```

Configure:
1. `spire-server` StatefulSet with persistent storage and self-signed root CA for trust domain `devsecops.local`.
2. `spire-agent` DaemonSet with host mounts for `/run/spire/sockets` and Kubernetes container runtime socket (`/run/containerd/containerd.sock`).
3. SPIFFE CSI Driver to seamlessly mount the Workload API socket directly into application pods.

### Task 3: Workload Registration & Selectors

Register two workloads in SPIRE using precise Kubernetes selectors:

1. **Frontend Service**:
   - Trust Domain: `spiffe://devsecops.local/ns/default/sa/frontend-sa/app/web`
   - Selectors: `k8s:ns:default`, `k8s:sa:frontend-sa`, `k8s:pod-label:app:frontend`

2. **Backend Payment API**:
   - Trust Domain: `spiffe://devsecops.local/ns/default/sa/backend-sa/app/payment`
   - Selectors: `k8s:ns:default`, `k8s:sa:backend-sa`, `k8s:pod-label:app:backend`

Verify registration:
```bash
kubectl exec -n spire spire-server-0 -c spire-server -- \
  /opt/spire/bin/spire-server entry show
```

### Task 4: Implement Workload-to-Workload mTLS with SPIFFE SVIDs

Deploy a sample microservice architecture consisting of:
- **Client Pod (Frontend)**: Calls the backend API over TLS.
- **Server Pod (Backend)**: An HTTPS web service that validates incoming client certificates and rejects any request that doesn't present an SVID matching `spiffe://devsecops.local/ns/default/sa/frontend-sa/app/web`.
- Use the SPIFFE Workload API or an Envoy sidecar proxy (SPIFFE Helper / Envoy SDS) to automatically fetch and rotate SVID certificates without application restarts.

### Task 5: Zero-Trust Attestation Attack Simulation

Verify the Zero-Trust security model by attempting three bypass attacks:
1. **Namespace Hopping**: Deploy a pod with the same label (`app: frontend`) but in an unauthorized namespace (`attacker-ns`). Verify SPIRE refuses to issue the frontend SVID.
2. **Identity Impersonation**: Create a rogue pod trying to directly claim the `spiffe://devsecops.local/ns/default/sa/backend-sa/app/payment` identity. Verify the agent node attestation fails.
3. **mTLS Rejection**: Send an unauthenticated HTTP/TLS curl request to the backend service. Verify TLS handshake termination due to missing client certificate.

---

## 📝 Deliverables

1. `k8s/spire-server-config.yaml` & `k8s/spire-agent-config.yaml` — Complete SPIRE manifests.
2. `k8s/workload-registration.sh` — Script registering workloads with fine-grained selectors.
3. `k8s/services/frontend-and-backend.yaml` — Frontend and backend deployments consuming SPIFFE Workload API.
4. `zero-trust-verification.md` — Test evidence demonstrating workload attestation and successful mTLS communication.

---

## ❓ Questions to Answer

1. How does SPIRE's **Workload Attestation** prevent a compromised container from claiming another container's SPIFFE ID on the same node?
2. What are the key architectural differences between SPIFFE-based workload identity and Kubernetes ServiceAccount OIDC tokens?
3. How does short-lived certificate rotation (e.g., 30-60 minute lifetimes) change the incident response paradigm for compromised credentials?
4. How can SPIFFE identities be federated across multi-cloud environments (e.g., AWS EKS talking securely to GCP GKE without API keys)?

---

## 🔗 Useful Links & References

- [SPIFFE Official Website](https://spiffe.io/)
- [SPIRE Architecture & Concepts](https://spiffe.io/docs/latest/spire-about/spire-concepts/)
- [SPIRE Kubernetes Quickstart](https://spiffe.io/docs/latest/try/getting-started-k8s/)
- [CNCF SPIFFE/SPIRE Project](https://www.cncf.io/projects/spiffe-and-spire/)
- [SPIFFE Envoy Secret Discovery Service (SDS) Integration](https://spiffe.io/docs/latest/key-strategies/envoy/)
- [NIST SP 800-207: Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final)

