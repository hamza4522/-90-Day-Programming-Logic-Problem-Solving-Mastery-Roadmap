# Lab 3.3 — HashiCorp Vault Solution Guide
**Phase**: 3 — Advanced DevSecOps

---

## Task 2: Vault Policies (HCL Format)

```hcl
# policies/vault-dev-policy.hcl
path "secret/data/dev/*" {
  capabilities = ["read", "list"]
}

path "secret/metadata/dev/*" {
  capabilities = ["list"]
}

# Explicitly deny production
path "secret/data/prod/*" {
  capabilities = ["deny"]
}
```

```hcl
# policies/vault-ci-policy.hcl
# CI Pipeline: Read CI secrets, write artifacts
path "secret/data/ci/*" {
  capabilities = ["read", "list"]
}

path "secret/data/ci/artifacts/*" {
  capabilities = ["create", "update", "read"]
}

# Access dynamic database credentials
path "database/creds/ci-role" {
  capabilities = ["read"]
}

# Renew own token
path "auth/token/renew-self" {
  capabilities = ["update"]
}

# Look up own token
path "auth/token/lookup-self" {
  capabilities = ["read"]
}
```

```hcl
# policies/vault-app-policy.hcl
# Application: Read its own secrets only
path "secret/data/apps/myapp/*" {
  capabilities = ["read"]
}

path "secret/metadata/apps/myapp/*" {
  capabilities = ["list"]
}

# Dynamic DB creds for the app
path "database/creds/myapp-role" {
  capabilities = ["read"]
}
```

```bash
# Apply policies to Vault
vault policy write dev-policy policies/vault-dev-policy.hcl
vault policy write ci-policy policies/vault-ci-policy.hcl
vault policy write app-policy policies/vault-app-policy.hcl

# Test policy — create token with dev-policy
DEV_TOKEN=$(vault token create -policy=dev-policy -format=json | jq -r .auth.client_token)

# Should work — read dev secret
VAULT_TOKEN=$DEV_TOKEN vault kv get secret/dev/config

# Should FAIL — read prod secret
VAULT_TOKEN=$DEV_TOKEN vault kv get secret/prod/config
# Error: 1 error occurred: * permission denied
```

---

## Task 3: AppRole Authentication

```bash
# Enable AppRole auth
vault auth enable approle

# Create a role for CI
vault write auth/approle/role/ci-pipeline \
  token_policies="ci-policy" \
  token_ttl=1h \
  token_max_ttl=4h \
  secret_id_ttl=30m \
  secret_id_num_uses=1  # One-time use Secret ID

# Get the Role ID (not secret — can be stored in CI)
ROLE_ID=$(vault read -field=role_id auth/approle/role/ci-pipeline/role-id)
echo "Role ID: $ROLE_ID"

# Generate a Secret ID (this IS secret — generated per-run by CI admin)
SECRET_ID=$(vault write -field=secret_id -f auth/approle/role/ci-pipeline/secret-id)
echo "Secret ID: $SECRET_ID"
```

```bash
#!/bin/bash
# vault-auth-demo.sh — Authenticate and use secrets

set -euo pipefail

VAULT_ADDR="${VAULT_ADDR:-http://127.0.0.1:8200}"

# Step 1: Authenticate with AppRole
echo "🔐 Authenticating with Vault AppRole..."
VAULT_TOKEN=$(vault write -field=token auth/approle/login \
  role_id="$ROLE_ID" \
  secret_id="$SECRET_ID")

export VAULT_TOKEN

echo "✅ Authentication successful. Token TTL: 1 hour"

# Step 2: Read secrets
DB_PASSWORD=$(vault kv get -field=db_password secret/ci/config)
API_KEY=$(vault kv get -field=api_key secret/ci/config)

# Step 3: Use secrets (masked in output)
echo "📦 Retrieved secrets successfully"
echo "DB_PASSWORD: ${DB_PASSWORD:0:3}***${DB_PASSWORD: -3}"  # Show first/last 3 chars only

# Use in your build/deploy process
# export DB_PASSWORD
# deploy_app.sh uses it...

# Step 4: Revoke token when done (optional but best practice)
vault token revoke -self
echo "🔒 Vault token revoked"
```

---

## Task 4: GitHub Actions with JWT/OIDC

```bash
# Configure JWT auth for GitHub Actions
vault auth enable jwt

vault write auth/jwt/config \
  oidc_discovery_url="https://token.actions.githubusercontent.com" \
  bound_issuer="https://token.actions.githubusercontent.com"

# Create a role bound to your specific repo
vault write auth/jwt/role/github-ci \
  role_type="jwt" \
  bound_audiences="https://github.com/YOUR_ORG" \
  user_claim="actor" \
  bound_claims_type="glob" \
  bound_claims='{"repository":"YOUR_ORG/YOUR_REPO","ref":"refs/heads/main"}' \
  policies="ci-policy" \
  ttl=1h
```

```yaml
# .github/workflows/vault-secrets.yml
name: Vault Secrets Integration

on:
  push:
    branches: [main]

permissions:
  contents: read
  id-token: write  # Required for OIDC authentication to Vault

jobs:
  deploy-with-vault:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Import Secrets from Vault
        uses: hashicorp/vault-action@v3
        id: vault
        with:
          url: https://vault.your-company.com  # Your Vault URL
          method: jwt
          role: github-ci
          secrets: |
            secret/data/ci/config db_password | DB_PASSWORD ;
            secret/data/ci/config api_key | API_KEY ;
            secret/data/ci/docker registry_token | REGISTRY_TOKEN ;

      - name: Use Secrets in Build
        run: |
          # Secrets are available as env vars
          echo "Connecting to database..."
          # DB_PASSWORD is set — GitHub masks it in logs automatically
          
          # Docker login with Vault-retrieved token
          echo "${{ steps.vault.outputs.REGISTRY_TOKEN }}" | \
            docker login ghcr.io -u github-ci --password-stdin

      - name: Deploy Application
        env:
          DB_PASSWORD: ${{ steps.vault.outputs.DB_PASSWORD }}
          API_KEY: ${{ steps.vault.outputs.API_KEY }}
        run: |
          echo "Deploying with Vault-managed credentials..."
          # Credentials are available, will be garbage collected after job
```

---

## Task 5: Dynamic Database Credentials

```bash
# Start PostgreSQL
docker run -d \
  --name postgres-vault-lab \
  --network=host \
  -e POSTGRES_PASSWORD=vault-admin-pass \
  -e POSTGRES_DB=myapp \
  postgres:15

# Wait for postgres to be ready
sleep 5

# Create a Vault user in PostgreSQL
docker exec postgres-vault-lab psql -U postgres -c "
  CREATE USER vault_admin WITH CREATEROLE SUPERUSER PASSWORD 'vault-admin-pass';
"

# Enable Vault database secrets engine
vault secrets enable database

# Configure PostgreSQL connection
vault write database/config/my-postgresql-database \
  plugin_name=postgresql-database-plugin \
  allowed_roles="myapp-role,ci-role" \
  connection_url="postgresql://{{username}}:{{password}}@localhost:5432/myapp?sslmode=disable" \
  username="vault_admin" \
  password="vault-admin-pass"

# Rotate root credentials immediately (Vault now manages them)
vault write -force database/rotate-root/my-postgresql-database

# Create a dynamic role for the application
vault write database/roles/myapp-role \
  db_name=my-postgresql-database \
  creation_statements="
    CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';
    GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";
  " \
  revocation_statements="DROP ROLE IF EXISTS \"{{name}}\";" \
  default_ttl=1h \
  max_ttl=24h
```

```bash
#!/bin/bash
# demo-dynamic-creds.sh

echo "=== Dynamic Credentials Demo ==="

echo ""
echo "📤 Requesting credentials (first request)..."
CREDS_1=$(vault read -format=json database/creds/myapp-role)
USER_1=$(echo $CREDS_1 | jq -r .data.username)
PASS_1=$(echo $CREDS_1 | jq -r .data.password)
LEASE_1=$(echo $CREDS_1 | jq -r .lease_id)
echo "Username: $USER_1"
echo "Password: ${PASS_1:0:8}..."
echo "Lease ID: $LEASE_1"

echo ""
echo "📤 Requesting credentials (second request)..."
CREDS_2=$(vault read -format=json database/creds/myapp-role)
USER_2=$(echo $CREDS_2 | jq -r .data.username)
echo "Username: $USER_2"
echo "→ DIFFERENT credentials each time!"

echo ""
echo "🧪 Testing credentials work..."
PGPASSWORD=$PASS_1 psql -h localhost -U $USER_1 -d myapp -c "SELECT current_user, now();"

echo ""
echo "⏰ Revoking first lease manually (simulating expiry)..."
vault lease revoke $LEASE_1

echo ""
echo "🚫 Testing that revoked credentials no longer work..."
PGPASSWORD=$PASS_1 psql -h localhost -U $USER_1 -d myapp -c "SELECT 1;" || echo "❌ Access denied — credentials revoked!"
```

---

## Task 6: Kubernetes Vault Agent Injector

```bash
# Deploy Vault to K8s via Helm
helm repo add hashicorp https://helm.releases.hashicorp.com
helm install vault hashicorp/vault \
  --set "injector.enabled=true" \
  --set "server.dev.enabled=true" \
  --namespace vault \
  --create-namespace

# Configure Kubernetes auth in Vault
vault auth enable kubernetes

vault write auth/kubernetes/config \
  kubernetes_host="https://kubernetes.default.svc.cluster.local:443" \
  kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
  token_reviewer_jwt=@/var/run/secrets/kubernetes.io/serviceaccount/token

# Create K8s auth role
vault write auth/kubernetes/role/myapp \
  bound_service_account_names=myapp-sa \
  bound_service_account_namespaces=default \
  policies=app-policy \
  ttl=1h
```

```yaml
# k8s/vault-agent-deployment.yaml
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: myapp-sa
  namespace: default

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
      annotations:
        # Vault Agent Injector annotations
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "myapp"
        vault.hashicorp.com/agent-inject-secret-config: "secret/data/apps/myapp/config"
        vault.hashicorp.com/agent-inject-template-config: |
          {{- with secret "secret/data/apps/myapp/config" -}}
          export DB_PASSWORD="{{ .Data.data.db_password }}"
          export API_KEY="{{ .Data.data.api_key }}"
          {{- end }}
        # Auto-renew secrets (no pod restart needed)
        vault.hashicorp.com/agent-pre-populate-only: "false"
    spec:
      serviceAccountName: myapp-sa
      containers:
        - name: myapp
          image: ghcr.io/myorg/myapp:latest
          command: ["/bin/sh", "-c"]
          args:
            - |
              # Source the secrets file injected by Vault Agent
              source /vault/secrets/config
              # Now DB_PASSWORD and API_KEY are available
              python app.py
          resources:
            limits:
              cpu: "500m"
              memory: "256Mi"
          securityContext:
            runAsNonRoot: true
            runAsUser: 1001
```

---

## ✅ Answers to Reflection Questions

### 1. KV Secrets vs Dynamic Secrets

| Feature | KV Secrets | Dynamic Secrets |
|---|---|---|
| **What** | Static key-value pairs you store | Credentials generated on-demand by Vault |
| **Rotation** | Manual (or scripted) | Automatic — expires and revokes itself |
| **Uniqueness** | Same credentials for everyone | Unique credentials per request |
| **Blast radius** | One leaked secret affects all users | Leaked cred is already expired/revocable |
| **Use case** | API keys, config values, static secrets | Database passwords, cloud credentials, SSH certs |
| **Example** | `vault kv put secret/config key=value` | `vault read database/creds/myrole` |

### 2. The Secret Zero Problem

**Problem**: To get secrets from Vault, you need credentials to authenticate with Vault. Where do you store THOSE credentials? It's turtles all the way down.

**Solutions by environment**:
- **Cloud VMs (AWS/GCP/Azure)**: Use cloud IAM + Vault's AWS/GCP/Azure auth method. The VM's identity IS the credential (no stored secrets)
- **Kubernetes**: Use K8s service account tokens (projected volumes). Vault verifies with K8s API. No stored secrets.
- **GitHub Actions**: Use OIDC tokens (job identity). Vault verifies with GitHub. No stored secrets.
- **Local development**: Developer uses Vault CLI with their personal LDAP/OIDC credentials
- **Legacy/bare metal**: AppRole — Role ID (not secret) in code, Secret ID generated dynamically by a trusted party

### 3. Auth Methods Comparison

| Method | Mechanism | Best For |
|---|---|---|
| **AppRole** | Role ID + Secret ID (like username/password) | Applications, services, scripts |
| **JWT/OIDC** | Short-lived JWT from identity provider | GitHub Actions, GitLab CI, Google Workload Identity |
| **Kubernetes** | Pod service account token | Pods running in K8s |
| **AWS IAM** | AWS STS signed request | EC2, Lambda, ECS tasks |
| **LDAP** | Corporate directory credentials | Humans (developers) |

### 4. Why Root Token in GitHub Secrets Is Wrong

1. **Over-privileged**: Root token has full access to everything in Vault — if leaked, attacker gets all secrets
2. **Static/long-lived**: GitHub secrets last forever; root token has no TTL by default
3. **No audit trail**: Root token actions can't be attributed to a specific pipeline
4. **No rotation**: Rotating root token requires re-sealing Vault — operational nightmare
5. **Violates least privilege**: CI pipeline needs to read 3 secrets — not admin everything

**Correct approach**: AppRole or JWT/OIDC with a policy that grants only the specific paths the CI pipeline needs, with short TTLs.

### 5. Vault HA and Production Availability

**Vault HA options**:
- **Integrated Storage (Raft)**: Built-in consensus, 3-5 node cluster, no external dependency
- **Consul backend**: External Consul cluster handles storage

**What happens if Vault goes down**:
- **Application**: If secrets were already loaded → app keeps running with cached values
- **Vault Agent**: Caches secrets locally, serves from cache during outage
- **New deployments**: Blocked — can't retrieve new secrets
- **Existing dynamic credentials**: Continue to work until their lease expires

**Production requirements**:
- Minimum 3 Vault nodes (quorum)
- Auto-unseal via AWS KMS / Azure Key Vault / GCP Cloud KMS
- Regular snapshots: `vault operator raft snapshot save backup.snap`
- Monitoring: Vault metrics → Prometheus/Grafana
- Backup/DR: Cross-region snapshot replication
