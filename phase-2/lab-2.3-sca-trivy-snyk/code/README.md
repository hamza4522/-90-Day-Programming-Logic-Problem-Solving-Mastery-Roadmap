# Lab 2.3 — Runnable Code

Working code for [problem.md](../problem.md).

```
code/
├── vulnerable/            package.json pinned to CVE-laden versions + index.js
├── secure/                upgraded deps, removed unused deps, overrides, .npmrc hardening
├── exploits/prototype-pollution.js   Proves the lodash CVE works, offline
├── scripts/
│   ├── compare_findings.py           npm audit vs Trivy diff → findings-comparison.md
│   ├── sbom_license_check.py         License policy gate over a CycloneDX SBOM
│   └── testdata/                     Sample outputs, so the scripts run before you install anything
├── trivy.yaml             Shared scanner config (local == CI)
├── .trivyignore.yaml      Risk acceptance with justification + expiry
└── .github/
    ├── workflows/sca.yml  npm audit + Trivy gates, SARIF, SBOMs, license gate
    └── dependabot.yml     Continuous fix PRs, grouped
```

## Walkthrough

```bash
# 1. Prove a dependency CVE is exploitable, then prove the upgrade fixes it
cd vulnerable && npm install --ignore-scripts && node ../exploits/prototype-pollution.js   # POLLUTED
cd ../secure  && npm install                 && node ../exploits/prototype-pollution.js   # Not polluted

# 2. Scan
cd ../vulnerable
npm audit --json > ../npm-audit.json
trivy fs --format json --output ../trivy.json .
cd ..
python scripts/compare_findings.py npm-audit.json trivy.json > findings-comparison.md

# 3. SBOM + license gate
trivy fs --format cyclonedx --output sbom.cdx.json vulnerable/
python scripts/sbom_license_check.py sbom.cdx.json

# No tools yet? Run the scripts on the bundled samples:
python scripts/compare_findings.py scripts/testdata/npm-audit.sample.json scripts/testdata/trivy.sample.json
python scripts/sbom_license_check.py scripts/testdata/sbom.sample.cdx.json
```

## What changed between `vulnerable/` and `secure/`

| Change | Kind | Why |
|---|---|---|
| lodash 4.17.4 → ^4.17.21 | Upgrade | Fixes 5+ prototype pollution CVEs |
| jsonwebtoken 8 → 9 | **Major** upgrade | Breaking change, so it needs code changes (pinned `algorithms`) |
| axios 0.18 → 1.x | **Major** upgrade | Same, and the SSRF-prone `/proxy` endpoint was removed |
| `node-fetch`, `minimist` removed | Remove | Unused deps are pure attack surface, the cheapest fix |
| `overrides.minimist` | Transitive pin | How you patch a dep **you don't directly depend on** |
| `.npmrc ignore-scripts` | Hardening | Blocks `postinstall` malware (event-stream, ua-parser-js…) |
| Allowlist fields, `Object.create(null)` | Code | Upgrading the library doesn't fix the unsafe **pattern** |

## Exercises

1. **Reachability:** `vulnerable/` has CVEs in `minimist`, but is the vulnerable function actually reachable from `index.js`? Write your answer as a `.trivyignore.yaml` entry with a statement and an expiry date.
2. **Breaking upgrade:** upgrade `jsonwebtoken` in `vulnerable/` to v9 *without* changing the code. What breaks? (This is the "we can't upgrade" conversation from Question 4.)
3. **Severity disagreement:** in the comparison output, find an advisory both tools report with different severities. Which do you trust, and why?
4. **Dependency confusion:** add `"@acme/internal-utils": "^1.0.0"` to `package.json`. What would `npm install` do if a public package with that name existed? How do `.npmrc` scoped registries prevent it?
5. **Flip the gate:** set `APP_DIR: vulnerable` in `sca.yml` and list which gates fail, in order.

## Key ideas

- **Scan the lockfile, ship the lockfile.** `npm ci`, not `npm install`, in CI.
- **"Secure" decays.** `secure/` has no known CVEs *today*. The nightly scheduled scan is what tells you when that changes.
- **Gate on fixable criticals; report everything else.** A gate devs can't satisfy gets disabled.
- **Risk acceptance needs a reason, an owner, and an expiry date.**
