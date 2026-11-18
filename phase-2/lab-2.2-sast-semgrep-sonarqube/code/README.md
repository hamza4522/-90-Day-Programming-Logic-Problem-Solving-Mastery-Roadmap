# Lab 2.2 — Runnable Code

Working code for [problem.md](../problem.md). Read the problem first, try the tasks yourself, then use this folder to check your work.

```
code/
├── vulnerable/app.py          11 real, exploitable bugs (SQLi, RCE, SSTI, SSRF, ...)
├── secure/app.py              Same features, every bug fixed. FIX n matches VULN n
├── tests/test_exploits.py     Replays each attack against both apps
├── semgrep-rules/
│   ├── custom.yaml            5 custom rules: pattern, negation and taint-mode
│   └── custom.py              Rule unit tests (# ruleid: / # ok: annotations)
├── .semgrepignore
├── .github/workflows/sast.yml SARIF upload, diff-aware gate, PR comment
└── requirements.txt
```

## 1. Prove the bugs are real

```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pytest -v tests/
```

Every test runs twice. Against `vulnerable` the attack must **succeed**. Against `secure` it must be **blocked**. If you "fix" a bug in `vulnerable/` and the test starts failing, you have proved your fix works.

## 2. See what SAST catches and what it misses

```bash
pip install semgrep
semgrep --config p/python --config p/flask vulnerable/          # registry rules
semgrep --config semgrep-rules/ vulnerable/ secure/             # our custom rules
semgrep --test semgrep-rules/                                   # test the rules themselves
```

Fill in this table yourself. It shows why **one tool is never enough**:

| # | Vulnerability | CWE | Semgrep registry? | Custom rule? | Gitleaks? | DAST (Lab 2.6)? | Exploit test |
|---|---|---|:-:|:-:|:-:|:-:|:-:|
| 1 | Hardcoded secret | 798 | | | | | n/a |
| 2 | MD5 password hash | 916 | | | | | ✅ |
| 3 | SQL injection | 89 | | | | | ✅ |
| 4 | Command injection | 78 | | | | | ✅ |
| 5 | SSTI → RCE | 1336 | | | | | ✅ |
| 6 | Path traversal | 22 | | | | | ✅ |
| 7 | Pickle deserialization | 502 | | | | | ✅ |
| 8 | Unsafe YAML | 502 | | | | | ✅ |
| 9 | SSRF | 918 | | | | | ✅ |
| 10 | Open redirect | 601 | | | | | ✅ |
| 11 | Debug mode | 489 | | | | | n/a |

## 3. Exercises

1. **Write a rule:** add a rule to `custom.yaml` that flags `redirect(request.args.get(...))` (VULN 10). Add `# ruleid:` and `# ok:` cases to `custom.py` first, then make `semgrep --test` pass.
2. **Break the taint rule:** in `custom.py`, add a case where tainted data passes through a helper function before reaching `execute()`. Does Semgrep OSS still see it? (Inter-procedural taint is a Semgrep Pro feature, and this kind of gap is what limits SAST.)
3. **Find the bypass:** `secure/app.py` FIX 9 has a documented gap (DNS rebinding). Explain the attack, then sketch a fix.
4. **Suppress correctly:** `secure/app.py` has one `# nosemgrep:` comment. Why does it name a rule ID instead of being a bare `# nosemgrep`? What should code review require before accepting one?
5. **Shift further left:** add the custom rules to a `.pre-commit-config.yaml` (see Lab 2.1) so developers get feedback before they push.

## Key ideas

- **SAST finds patterns; tests prove exploitability.** Use both. A failing exploit test is unambiguous, and nobody can argue it's a false positive.
- **Taint mode** (source → sanitizer → sink) cuts false positives sharply compared with pure pattern matching. `int()` is a sanitizer because an integer can't carry SQL syntax.
- **Diff-aware gating** (`--baseline-commit`) is how you roll SAST out to a legacy codebase without blocking every PR on old debt.
- **Detection rules are code.** Version them, test them, review them.
