# Lab 3.3 — Secrets Management with HashiCorp Vault
**Phase**: 3 — Advanced DevSecOps  
**Difficulty**: ⭐⭐⭐ Advanced  
**Estimated Time**: 4–5 hours  
**Category**: Secrets Management, Zero-Trust

---

## 🎯 Objective

Implement enterprise-grade secrets management using **HashiCorp Vault** to eliminate static, long-lived credentials from your CI/CD pipeline and application deployments. The goal is **Zero Standing Privileges** — credentials exist only when needed and expire automatically.

---

## 📋 Problem Statement

A security audit found the following issues in your organization:
1. AWS access keys are stored as GitHub Actions secrets (static, never rotated)
2. Database passwords are in Kubernetes ConfigMaps (not encrypted at rest)
3. API keys are hardcoded in application config files
4. Developers share service account credentials over Slack
5. No audit trail of who accessed which secret when

Your task: Implement Vault as the central secrets store, integrate it with GitHub Actions and Kubernetes, and eliminate all static credentials.

---

## 🛠️ Prerequisites

- Docker installed
- kubectl + Kubernetes cluster (Kind or Minikube)
- Helm installed
- GitHub Actions account
- Basic understanding of PKI/TLS

---

## 📋 Tasks

### Task 1: Deploy and Configure Vault

1. Deploy Vault in development mode using Docker:
   ```bash
   docker run --cap-add=IPC_LOCK -d \
     --name=dev-vault \
     -p 8200:8200 \
     -e 'VAULT_DEV_ROOT_TOKEN_ID=root-token' \
     -e 'VAULT_DEV_LISTEN_ADDRESS=0.0.0.0:8200' \
     hashicorp/vault
   ```

2. Set environment variables:
   ```bash
   export VAULT_ADDR='http://127.0.0.1:8200'
   export VAULT_TOKEN='root-token'
   ```

3. Explore the Vault UI at `http://localhost:8200`

4. Store your first secret:
   ```bash
   vault kv put secret/myapp/config \
     db_password="supersecret123" \
     api_key="sk-prod-abc123" \
     stripe_key="sk_live_test123"
   ```

5. Read it back:
   ```bash
   vault kv get secret/myapp/config
   vault kv get -field=db_password secret/myapp/config
   ```

### Task 2: Vault Policies (Least Privilege)

Create Vault policies that follow the **principle of least privilege**:

1. **Developer policy**: Read-only access to `secret/dev/*`
2. **CI pipeline policy**: Read-only access to `secret/ci/*`, write to `secret/ci/artifacts/*`
3. **Application policy**: Read-only access to `secret/apps/myapp/*`
4. **Admin policy**: Full access (restricted to security team)

For each policy:
- Create the policy in Vault
- Test that the policy allows what it should
- Test that the policy DENIES what it shouldn't (e.g., developer can't read production secrets)

### Task 3: AppRole Authentication for CI/CD

Configure **AppRole authentication** for your CI pipeline (non-OIDC approach):

1. Enable AppRole auth method
2. Create a role for your CI pipeline with:
   - Token TTL: 1 hour
   - Max TTL: 4 hours
   - Bound to CI policy
3. Generate a Role ID and Secret ID
4. Write a shell script that:
   - Authenticates with AppRole
   - Gets a Vault token
   - Retrieves a secret
   - Uses the secret (print masked)
   - Token expires automatically

### Task 4: JWT/OIDC Authentication for GitHub Actions

Integrate Vault with GitHub Actions using **JWT/OIDC** (no static credentials!):

1. Enable JWT auth in Vault
2. Configure GitHub Actions as a trusted OIDC provider
3. Create a Vault role bound to your specific GitHub repository
4. Create `.github/workflows/vault-secrets.yml` that:
   - Uses `hashicorp/vault-action` to authenticate
   - Retrieves secrets from Vault
   - Uses the secrets in subsequent steps
   - Never exposes secrets in logs

### Task 5: Dynamic Secrets — Auto-rotating Database Credentials

One of Vault's most powerful features: **credentials that are generated on-demand and automatically expire**.

1. Start a PostgreSQL database:
   ```bash
   docker run -d \
     --name postgres-vault-lab \
     -e POSTGRES_PASSWORD=vault-root-pass \
     -p 5432:5432 \
     postgres:15
   ```

2. Configure Vault's database secrets engine to manage PostgreSQL credentials

3. Create a database role that generates short-lived credentials

4. Demonstrate:
   - Each time you request credentials, you get different username/password
   - After the lease expires, the credentials are automatically revoked
   - Old credentials cannot be used after expiry

### Task 6: Kubernetes Integration with Vault Agent

1. Deploy Vault using Helm in your K8s cluster (or use the existing Docker Vault)
2. Enable Kubernetes auth in Vault
3. Configure the Vault Agent Injector
4. Deploy an application pod with Vault Agent sidecar that:
   - Authenticates using the pod's service account
   - Automatically injects secrets as files into the pod
   - Rotates secrets when they change (without restarting the pod)

---

## 📝 Deliverables

1. `vault-setup.sh` — shell script to configure Vault from scratch
2. `policies/vault-ci-policy.hcl` — CI pipeline Vault policy
3. `policies/vault-app-policy.hcl` — Application Vault policy
4. `.github/workflows/vault-secrets.yml` — GitHub Actions integration
5. `k8s/vault-agent-deployment.yaml` — K8s deployment with Vault Agent
6. `demo-dynamic-creds.sh` — script demonstrating dynamic DB credentials
7. `vault-architecture.md` — diagram and explanation of your Vault setup

---

## ❓ Questions to Answer

1. What is the difference between **Vault KV secrets** and **Vault dynamic secrets**? When would you use each?
2. What is **secret zero** (the bootstrap problem) and how does Vault solve it for different environments?
3. Compare **AppRole**, **JWT/OIDC**, and **Kubernetes** auth methods. When is each appropriate?
4. A developer asks: "Can I just store the Vault root token in GitHub Secrets and use that?" Why is this wrong?
5. What is **Vault HA (High Availability)** and why does it matter for production? What happens to your secrets if Vault goes down?

---

> 💡 **Key insight**: Vault's power isn't just storing secrets — it's the **audit log**, **dynamic secrets**, **lease management**, and **fine-grained ACLs**. A K8s Secret is just encrypted storage. Vault is a full secrets management platform.

> 🔒 **Production note**: Never use dev mode in production. Use Vault with:
> - Integrated storage (Raft) for HA
> - TLS everywhere  
> - Auto-unseal via AWS KMS or Azure Key Vault
> - Regular Vault snapshots for DR
