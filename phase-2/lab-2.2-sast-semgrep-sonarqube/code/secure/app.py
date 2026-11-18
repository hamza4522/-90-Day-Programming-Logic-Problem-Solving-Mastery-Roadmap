"""
HARDENED version of ../vulnerable/app.py — Lab 2.2 (SAST).

Same endpoints, same features, every vulnerability fixed. Each fix is
labelled FIX <n> to match VULN <n> in the vulnerable file so you can diff
them side by side:

    git diff --no-index ../vulnerable/app.py app.py

Principles demonstrated:
  * Never build code (SQL, shell, templates) by concatenating user input.
  * Validate with ALLOWLISTS, not denylists.
  * Secrets come from the environment / a secret manager, never source.
  * Fail closed: if a check can't be performed, reject the request.
"""

import ipaddress
import json
import os
import re
import secrets
import socket
import sqlite3
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

import yaml
from flask import Flask, abort, redirect, render_template_string, request
from werkzeug.security import generate_password_hash

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = (BASE_DIR / "data").resolve()
DB_PATH = BASE_DIR / "users.db"

# ---------------------------------------------------------------------------
# FIX 1 — Secrets from the environment.
# In production these are injected by Vault / K8s Secrets / cloud secret
# manager (see Lab 3.3). For local dev we generate a random throwaway key
# rather than falling back to a hardcoded default.
# ---------------------------------------------------------------------------
app.config["SECRET_KEY"] = os.environ.get("APP_SECRET_KEY") or secrets.token_hex(32)
API_KEY = os.environ.get("API_KEY")  # None is fine; callers must handle absence


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DROP TABLE IF EXISTS users")
    conn.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, password_hash TEXT)")
    conn.execute("INSERT INTO users VALUES (1, 'alice', ?)", (strong_hash("alice-pw"),))
    conn.execute("INSERT INTO users VALUES (2, 'bob', ?)", (strong_hash("bob-pw"),))
    conn.commit()
    conn.close()
    DATA_DIR.mkdir(exist_ok=True)
    (DATA_DIR / "welcome.txt").write_text("Welcome to the lab!\n")


# ---------------------------------------------------------------------------
# FIX 2 — Slow, salted password hashing (scrypt/pbkdf2 via Werkzeug).
# argon2id (argon2-cffi) or bcrypt are also good choices.
# ---------------------------------------------------------------------------
def strong_hash(password):
    return generate_password_hash(password)


# ---------------------------------------------------------------------------
# FIX 3 — Parameterized query + type validation.
# The driver sends the value separately from the SQL, so it can never be
# interpreted as SQL syntax — no escaping required.
# ---------------------------------------------------------------------------
@app.route("/user")
def get_user():
    user_id = request.args.get("id", type=int)  # non-int -> None
    if user_id is None:
        abort(400, "id must be an integer")
    conn = sqlite3.connect(DB_PATH)
    result = conn.execute("SELECT id, name FROM users WHERE id = ?", (user_id,)).fetchall()
    conn.close()
    return {"users": result}


# ---------------------------------------------------------------------------
# FIX 4 — No shell, argument list, strict allowlist validation.
# Even with shell=False, validate: a value like "-f" could inject ping
# *options* (argument injection, CWE-88).
# ---------------------------------------------------------------------------
HOSTNAME_RE = re.compile(r"^(?=.{1,253}$)([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$")


def is_valid_host(value):
    try:
        ipaddress.ip_address(value)
        return True
    except ValueError:
        return bool(HOSTNAME_RE.match(value))


@app.route("/ping")
def ping():
    host = request.args.get("host", "127.0.0.1")
    if not is_valid_host(host):
        abort(400, "invalid host")
    count_flag = "-n" if os.name == "nt" else "-c"
    result = subprocess.run(  # list args, shell=False (the default)
        ["ping", count_flag, "1", host], capture_output=True, text=True, timeout=10
    )
    return {"output": result.stdout + result.stderr}


# ---------------------------------------------------------------------------
# FIX 5 — Template is a constant; user input is passed as DATA.
# Jinja2 autoescaping also neutralises reflected XSS.
# (Better still: use render_template() with a file in templates/.)
# ---------------------------------------------------------------------------
@app.route("/hello")
def hello():
    name = request.args.get("name", "World")
    return render_template_string("<h1>Hello {{ name }}!</h1>", name=name)


# ---------------------------------------------------------------------------
# FIX 6 — Resolve the final path and verify it is still inside DATA_DIR.
# resolve() collapses "../" and follows symlinks, which defeats tricks like
# URL-encoding or symlinked directories.
# ---------------------------------------------------------------------------
@app.route("/file")
def read_file():
    filename = request.args.get("name", "welcome.txt")
    target = (DATA_DIR / filename).resolve()
    if not target.is_relative_to(DATA_DIR) or not target.is_file():
        abort(404)
    return target.read_text()


# ---------------------------------------------------------------------------
# FIX 7 — Use a data-only format (JSON) for untrusted input.
# JSON can only produce dicts/lists/strings/numbers — never objects with code.
# If you *must* round-trip state through a client, sign it (itsdangerous).
# ---------------------------------------------------------------------------
@app.route("/prefs", methods=["POST"])
def load_prefs():
    try:
        prefs = json.loads(request.get_data(as_text=True))
    except ValueError:
        abort(400, "prefs must be JSON")
    if not isinstance(prefs, dict):
        abort(400, "prefs must be an object")
    return {"prefs": prefs}


# ---------------------------------------------------------------------------
# FIX 8 — yaml.safe_load only builds plain data types.
# ---------------------------------------------------------------------------
@app.route("/import", methods=["POST"])
def import_config():
    try:
        data = yaml.safe_load(request.get_data(as_text=True))
    except yaml.YAMLError:
        abort(400, "invalid YAML")
    return {"imported": data}


# ---------------------------------------------------------------------------
# FIX 9 — SSRF defence: scheme allowlist + host allowlist + block private
# address space after DNS resolution.
# Defence in depth: also enforce IMDSv2 (Lab 2.5) and egress NetworkPolicy.
# Known gap (for discussion): DNS rebinding between check and fetch. A
# production fix pins the resolved IP or routes through an egress proxy.
# ---------------------------------------------------------------------------
ALLOWED_FETCH_HOSTS = {"example.com", "api.github.com"}


def is_public_address(hostname):
    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        return False
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            return False
    return True


@app.route("/fetch")
def fetch():
    url = request.args.get("url", "")
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in ALLOWED_FETCH_HOSTS:
        abort(400, "url not allowed")
    if not is_public_address(parsed.hostname):
        abort(400, "url resolves to a non-public address")
    with urllib.request.urlopen(url, timeout=5) as resp:  # nosemgrep: dynamic-urllib-use-detected -- validated above
        return resp.read()[:2000]


# ---------------------------------------------------------------------------
# FIX 10 — Only allow relative, same-site redirect targets.
# Reject "//evil.example" (protocol-relative) and "/\evil.example" too.
# ---------------------------------------------------------------------------
@app.route("/go")
def go():
    target = request.args.get("next", "/")
    parsed = urllib.parse.urlparse(target)
    if parsed.scheme or parsed.netloc or not target.startswith("/") or target.startswith(("//", "/\\")):
        target = "/"
    return redirect(target)


# ---------------------------------------------------------------------------
# Security headers on every response (defence in depth; DAST in Lab 2.6
# will flag their absence).
# ---------------------------------------------------------------------------
@app.after_request
def set_security_headers(resp):
    resp.headers["Content-Security-Policy"] = "default-src 'self'"
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "no-referrer"
    return resp


if __name__ == "__main__":
    init_db()
    # FIX 11 — Debug off unless explicitly enabled; production uses a WSGI
    # server (gunicorn) rather than the Flask dev server.
    app.run(host="127.0.0.1", port=5000, debug=os.environ.get("FLASK_DEBUG") == "1")
