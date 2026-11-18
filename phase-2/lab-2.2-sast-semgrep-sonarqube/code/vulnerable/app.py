"""
INTENTIONALLY VULNERABLE Flask application for Lab 2.2 (SAST).

    !!! DO NOT DEPLOY. DO NOT EXPOSE TO A NETWORK. !!!

Every endpoint below contains a real, exploitable bug. Each one is tagged with:
  - the CWE (Common Weakness Enumeration) ID
  - the OWASP Top 10 (2021) category
  - how an attacker exploits it

Your job in the lab:
  1. Run Semgrep against this file and see which bugs it catches.
  2. Run the exploit tests (tests/test_exploits.py) to prove they are real.
  3. Compare with ../secure/app.py to see the fix for each one.

Run locally (binds to 127.0.0.1 only):
    pip install -r ../requirements.txt
    python app.py
"""

import base64
import hashlib
import os
import pickle
import sqlite3
import subprocess
import urllib.request

import yaml
from flask import Flask, redirect, render_template_string, request

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(BASE_DIR, "users.db")

# ---------------------------------------------------------------------------
# VULN 1 — Hardcoded secrets
# CWE-798: Use of Hard-coded Credentials | OWASP A07:2021
# Anyone with read access to the repo (or the container image, or a leaked
# backup) now has these. Rotating them requires a code change + redeploy.
# Detected by: Gitleaks, Semgrep (python.lang.security.audit.hardcoded-*)
# ---------------------------------------------------------------------------
app.config["SECRET_KEY"] = "my-super-secret-key-12345"
API_KEY = "sk-prod-9f8e7d6c5b4a3f2e1d0c"


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DROP TABLE IF EXISTS users")
    conn.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, password_hash TEXT)")
    conn.execute("INSERT INTO users VALUES (1, 'alice', ?)", (weak_hash("alice-pw"),))
    conn.execute("INSERT INTO users VALUES (2, 'bob', ?)", (weak_hash("bob-pw"),))
    conn.commit()
    conn.close()
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(os.path.join(DATA_DIR, "welcome.txt"), "w") as f:
        f.write("Welcome to the lab!\n")


# ---------------------------------------------------------------------------
# VULN 2 — Weak password hashing
# CWE-327 / CWE-916: Broken crypto / insufficient computational effort
# OWASP A02:2021 Cryptographic Failures
# MD5 is fast (billions/sec on a GPU) and unsalted -> rainbow tables work.
# ---------------------------------------------------------------------------
def weak_hash(password):
    return hashlib.md5(password.encode()).hexdigest()


# ---------------------------------------------------------------------------
# VULN 3 — SQL Injection
# CWE-89 | OWASP A03:2021 Injection
# Exploit: /user?id=1 OR 1=1         -> dumps every row
#          /user?id=1 UNION SELECT 1,name,password_hash FROM users
# ---------------------------------------------------------------------------
@app.route("/user")
def get_user():
    user_id = request.args.get("id")
    conn = sqlite3.connect(DB_PATH)
    query = f"SELECT id, name FROM users WHERE id = {user_id}"  # BAD
    result = conn.execute(query).fetchall()
    conn.close()
    return {"users": result}


# ---------------------------------------------------------------------------
# VULN 4 — OS Command Injection
# CWE-78 | OWASP A03:2021 Injection
# Exploit: /ping?host=127.0.0.1 %26 whoami      (%26 is "&")
#          /ping?host=127.0.0.1; cat /etc/passwd
# ---------------------------------------------------------------------------
@app.route("/ping")
def ping():
    host = request.args.get("host", "127.0.0.1")
    result = subprocess.run(  # BAD: shell=True + string interpolation
        f"ping -c 1 {host}", shell=True, capture_output=True, text=True, timeout=10
    )
    return {"output": result.stdout + result.stderr}


# ---------------------------------------------------------------------------
# VULN 5 — Server-Side Template Injection (SSTI) -> Remote Code Execution
# CWE-1336 | OWASP A03:2021 Injection
# Exploit: /hello?name={{7*7}}                       -> renders "49"
#          /hello?name={{config}}                    -> leaks SECRET_KEY
#          /hello?name={{cycler.__init__.__globals__.os.popen('id').read()}}
# ---------------------------------------------------------------------------
@app.route("/hello")
def hello():
    name = request.args.get("name", "World")
    template = f"<h1>Hello {name}!</h1>"  # BAD: user input becomes template code
    return render_template_string(template)


# ---------------------------------------------------------------------------
# VULN 6 — Path Traversal
# CWE-22 | OWASP A01:2021 Broken Access Control
# Exploit: /file?name=../app.py     -> reads the source code
#          /file?name=../../../../etc/passwd
# ---------------------------------------------------------------------------
@app.route("/file")
def read_file():
    filename = request.args.get("name", "welcome.txt")
    with open(os.path.join(DATA_DIR, filename)) as f:  # BAD: no containment check
        return f.read()


# ---------------------------------------------------------------------------
# VULN 7 — Insecure Deserialization
# CWE-502 | OWASP A08:2021 Software and Data Integrity Failures
# pickle.loads() on attacker data = arbitrary code execution. The attacker
# builds an object whose __reduce__ returns (os.system, ("id",)).
# ---------------------------------------------------------------------------
@app.route("/prefs", methods=["POST"])
def load_prefs():
    blob = base64.b64decode(request.get_data())
    prefs = pickle.loads(blob)  # BAD
    return {"prefs": str(prefs)}


# ---------------------------------------------------------------------------
# VULN 8 — Unsafe YAML loading
# CWE-502 | OWASP A08:2021
# yaml.load with the unsafe Loader can construct arbitrary Python objects:
#   !!python/object/apply:os.system ["id"]
# ---------------------------------------------------------------------------
@app.route("/import", methods=["POST"])
def import_config():
    data = yaml.load(request.get_data(as_text=True), Loader=yaml.UnsafeLoader)  # BAD
    return {"imported": str(data)}


# ---------------------------------------------------------------------------
# VULN 9 — Server-Side Request Forgery (SSRF)
# CWE-918 | OWASP A10:2021 SSRF
# Exploit: /fetch?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/
#          (the Capital One attack chain — see Lab 2.5 IMDSv2)
#          /fetch?url=file:///etc/passwd
# ---------------------------------------------------------------------------
@app.route("/fetch")
def fetch():
    url = request.args.get("url")
    with urllib.request.urlopen(url, timeout=5) as resp:  # BAD: any scheme, any host
        return resp.read()[:2000]


# ---------------------------------------------------------------------------
# VULN 10 — Open Redirect
# CWE-601 | OWASP A01:2021
# Exploit: /go?next=https://evil.example/login  -> phishing that starts on your domain
# ---------------------------------------------------------------------------
@app.route("/go")
def go():
    return redirect(request.args.get("next", "/"))  # BAD


if __name__ == "__main__":
    init_db()
    # VULN 11 — Debug mode: the Werkzeug debugger gives an interactive Python
    # console to anyone who can trigger an exception. CWE-489 | OWASP A05:2021
    app.run(host="127.0.0.1", port=5000, debug=True)  # BAD
