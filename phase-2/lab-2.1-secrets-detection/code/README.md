# Lab 2.1 — Runnable Code

Working code for [problem.md](../problem.md).

```
code/
├── setup-lab-repo.sh                  Builds a sandbox repo with fake secrets hidden in history
├── .gitleaks.toml                     Default rules + 2 custom rules + a narrow allowlist
├── .gitleaksignore                    Fingerprint-based suppression (the right way)
├── .pre-commit-config.yaml            gitleaks + detect-secrets + filename blocklist
├── .github/workflows/secrets-scan.yml Full-history CI scan, checksum-verified install, SARIF
├── scripts/purge-secret-from-history.sh  Incident runbook: rotate → audit → purge → re-clone
└── secure/
    ├── config.py                      Fail-fast, redacting, file-or-env secret loading
    ├── .env.example                   Documents variables without values
    └── .gitignore                     Keeps secret files out of git
```

## Walkthrough

```bash
cd code
bash setup-lab-repo.sh                 # creates ./secrets-lab-sandbox
cd secrets-lab-sandbox
ls                                     # looks clean...
git log --all --oneline                # ...but history isn't

gitleaks git . -v                                  # default rules
gitleaks git . -v --config ../.gitleaks.toml       # + custom rules
```

The sandbox is built so that each scan teaches something:

| Planted item | Where | Lesson |
|---|---|---|
| AWS key + secret | `config.py`, deleted in a later commit | `git rm` doesn't remove history |
| GitHub PAT, Slack webhook | same | Default rules cover public providers |
| `acme_live_…` token | same | **Only the custom rule catches it.** Your org's own formats need your own rules |
| `DB_PASSWORD` | same | Generic passwords are hard; entropy + keyword rules help |
| RSA private key | `feature/deploy` branch only | Scanning only `main`/HEAD misses it. Use `--all` |
| AWS docs example key | `tests/` | A false positive, so allowlist **that one finding**, not the folder |

## Exercises

1. **Gap analysis:** run gitleaks with and without `--config ../.gitleaks.toml` and diff the findings. Which rule found what?
2. **Hook bypass:** install the pre-commit hooks (`pre-commit install`), try to commit a file containing `acme_live_` + 32 hex chars, then bypass with `--no-verify`. Which control still catches it?
3. **Fingerprint suppression:** take the `tests/test_config.py` fingerprint from the scan and add it to `.gitleaksignore`. Then add a *new* fake key to the same file. Is the new key still caught? (It should be.)
4. **Incident drill:** run `scripts/purge-secret-from-history.sh secrets-lab-sandbox config.py`. Re-scan. Then explain why this alone would **not** have been enough if the repo were public.
5. **Run `secure/config.py`** with and without `DATABASE_URL` set. Print the settings object, and confirm the secret never appears.

## Key ideas

- **Rotate first, purge second.** History rewriting is hygiene. Rotation is the remediation.
- **Layered controls:** pre-commit (fast, but skippable), then CI (can't be skipped), then nightly full-history scans (new rules catch old leaks), then provider-side push protection.
- **Prefer credentials that can't leak:** IAM roles, OIDC federation for CI (no stored cloud keys), short-lived Vault leases (Lab 3.3).
- **Design detectable tokens:** a unique prefix such as `acme_live_` makes your secrets trivially scannable.
