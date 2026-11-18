#!/usr/bin/env python3
"""
Compare `npm audit --json` with `trivy fs --format json` — Lab 2.3, Task 3/7.

    python compare_findings.py npm-audit.json trivy.json > findings-comparison.md
    python compare_findings.py testdata/npm-audit.sample.json testdata/trivy.sample.json

Why the tools disagree (the point of the exercise):
  * Different DATABASES. npm audit uses the GitHub Advisory DB (GHSA IDs);
    Trivy merges NVD, GHSA, OSV and distro feeds (CVE IDs mostly).
  * Different ID SCHEMES. One advisory can be GHSA-xxxx in one tool and
    CVE-yyyy in another, so a naive ID diff overstates the difference.
    We match on any shared ID (Trivy lists GHSA links in References).
  * Different SCOPE. npm audit only knows npm; Trivy also scans OS packages,
    other ecosystems, secrets and misconfig in the same pass.
  * Different SEVERITY sources (vendor vs NVD CVSS) -> same bug, two ratings.

Standard library only, so it runs anywhere.
"""

import json
import re
import sys
from collections import Counter

GHSA_RE = re.compile(r"GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}", re.I)
SEVERITIES = ["critical", "high", "moderate", "medium", "low", "info", "unknown"]


def norm_sev(s):
    s = (s or "unknown").lower()
    return "medium" if s == "moderate" else s


def load_npm(path):
    """npm audit v7+ JSON -> list of {pkg, ids, severity, title}."""
    data = json.load(open(path, encoding="utf-8"))
    findings = []
    for pkg, vuln in data.get("vulnerabilities", {}).items():
        for via in vuln.get("via", []):
            if isinstance(via, str):
                continue  # "via": ["other-pkg"] = inherited through a dependency
            ids = set(GHSA_RE.findall(via.get("url", "")))
            if via.get("source"):
                ids.add(f"npm:{via['source']}")
            findings.append({
                "pkg": via.get("name", pkg),
                "ids": {i.upper() for i in ids},
                "severity": norm_sev(via.get("severity")),
                "title": via.get("title", ""),
            })
    return findings


def load_trivy(path):
    """trivy fs/image --format json -> list of {pkg, ids, severity, title}."""
    data = json.load(open(path, encoding="utf-8"))
    findings = []
    for result in data.get("Results", []) or []:
        for v in result.get("Vulnerabilities", []) or []:
            ids = {v["VulnerabilityID"].upper()}
            ids |= {i.upper() for i in v.get("VendorIDs", []) or []}
            for ref in v.get("References", []) or []:
                ids |= {g.upper() for g in GHSA_RE.findall(ref)}
            findings.append({
                "pkg": v.get("PkgName", "?"),
                "ids": ids,
                "severity": norm_sev(v.get("Severity")),
                "title": v.get("Title", "") or v["VulnerabilityID"],
                "fixed": v.get("FixedVersion", ""),
            })
    return findings


def match(npm, trivy):
    both, only_npm = [], []
    matched_trivy = set()
    for n in npm:
        hit = next((i for i, t in enumerate(trivy) if t["pkg"] == n["pkg"] and t["ids"] & n["ids"]), None)
        if hit is None:
            only_npm.append(n)
        else:
            matched_trivy.add(hit)
            both.append((n, trivy[hit]))
    only_trivy = [t for i, t in enumerate(trivy) if i not in matched_trivy]
    return both, only_npm, only_trivy


def sev_table(name, findings):
    c = Counter(f["severity"] for f in findings)
    cells = " | ".join(str(c.get(s, 0)) for s in ["critical", "high", "medium", "low"])
    return f"| {name} | {cells} | {len(findings)} |"


def main(npm_path, trivy_path):
    npm, trivy = load_npm(npm_path), load_trivy(trivy_path)
    both, only_npm, only_trivy = match(npm, trivy)

    out = ["# SCA Findings Comparison", "",
           "| Tool | Critical | High | Medium | Low | Total |", "|---|---|---|---|---|---|",
           sev_table("npm audit", npm), sev_table("Trivy", trivy), "",
           f"**Found by both:** {len(both)} | **Only npm audit:** {len(only_npm)} | **Only Trivy:** {len(only_trivy)}", ""]

    sev_mismatch = [(n, t) for n, t in both if n["severity"] != t["severity"]]
    if sev_mismatch:
        out += ["## Same advisory, different severity", "", "| Package | IDs | npm | Trivy |", "|---|---|---|---|"]
        out += [f"| {n['pkg']} | {', '.join(sorted(t['ids']))} | {n['severity']} | {t['severity']} |" for n, t in sev_mismatch]
        out.append("")

    for title, items in [("Only in npm audit", only_npm), ("Only in Trivy", only_trivy)]:
        out += [f"## {title}", ""]
        if not items:
            out += ["_none_", ""]
            continue
        out += ["| Package | Severity | IDs | Title |", "|---|---|---|---|"]
        for f in sorted(items, key=lambda f: SEVERITIES.index(f["severity"])):
            out.append(f"| {f['pkg']} | {f['severity']} | {', '.join(sorted(f['ids']))} | {f['title'][:70]} |")
        out.append("")

    print("\n".join(out))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
