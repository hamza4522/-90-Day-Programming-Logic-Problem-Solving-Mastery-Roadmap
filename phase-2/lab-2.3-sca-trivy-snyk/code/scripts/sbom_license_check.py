#!/usr/bin/env python3
"""
License policy gate over a CycloneDX SBOM — Lab 2.3, Task 6.

    trivy fs --format cyclonedx --output sbom.cdx.json vulnerable/
    python sbom_license_check.py sbom.cdx.json
    python sbom_license_check.py testdata/sbom.sample.cdx.json

Exit code 1 if any component uses a DENIED license -> usable as a CI gate.

Why security teams care about licenses: an SBOM is the inventory that
answers BOTH "are we affected by CVE-X?" and "are we allowed to ship this?".
AGPL in a SaaS backend can legally oblige you to publish your source.

THIS POLICY IS AN EXAMPLE, NOT LEGAL ADVICE. Real policies come from legal.
"""

import json
import sys

# SPDX identifiers. Prefix match, so "GPL-3.0" covers GPL-3.0-only/-or-later.
DENY = ("AGPL-", "GPL-2.0", "GPL-3.0", "SSPL-", "BUSL-", "CC-BY-NC")
REVIEW = ("LGPL-", "MPL-", "EPL-", "CDDL-", "CC-BY-SA")


def licenses_of(component):
    found = []
    for entry in component.get("licenses", []) or []:
        if "expression" in entry:                 # e.g. "MIT OR Apache-2.0"
            found.append(entry["expression"])
        lic = entry.get("license", {})
        if lic.get("id"):
            found.append(lic["id"])
        elif lic.get("name"):
            found.append(lic["name"])
    return found


def classify(lics):
    if not lics:
        return "UNKNOWN"
    joined = " ".join(lics)
    # "X OR Y" lets us pick the permissive option; only flag if ALL choices are bad.
    if " OR " in joined:
        options = [o.strip("() ") for o in joined.split(" OR ")]
        if any(not o.startswith(DENY + REVIEW) for o in options):
            return "ALLOW"
    if any(l.startswith(DENY) for l in lics):
        return "DENY"
    if any(l.startswith(REVIEW) for l in lics):
        return "REVIEW"
    return "ALLOW"


def main(path):
    sbom = json.load(open(path, encoding="utf-8"))
    if sbom.get("bomFormat") != "CycloneDX":
        sys.exit("Not a CycloneDX JSON SBOM")
    rows, counts = [], {"ALLOW": 0, "REVIEW": 0, "DENY": 0, "UNKNOWN": 0}
    for c in sbom.get("components", []):
        lics = licenses_of(c)
        verdict = classify(lics)
        counts[verdict] += 1
        rows.append((verdict, c.get("name", "?"), c.get("version", "?"), ", ".join(lics) or "-", c.get("purl", "")))

    order = {"DENY": 0, "UNKNOWN": 1, "REVIEW": 2, "ALLOW": 3}
    print(f"{'VERDICT':8} {'COMPONENT':30} {'VERSION':12} LICENSE")
    for verdict, name, ver, lic, _ in sorted(rows, key=lambda r: (order[r[0]], r[1])):
        print(f"{verdict:8} {name[:30]:30} {ver[:12]:12} {lic}")
    print(f"\n{len(rows)} components: " + ", ".join(f"{k}={v}" for k, v in counts.items()))

    if counts["UNKNOWN"]:
        print("[WARN] UNKNOWN licenses need manual review: no license is NOT permission to use.")
    if counts["DENY"]:
        print("[FAIL] Denied licenses present.")
        return 1
    print("[OK] License policy passed.")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    sys.exit(main(sys.argv[1]))
