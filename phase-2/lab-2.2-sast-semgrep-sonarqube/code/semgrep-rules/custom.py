# Test cases for custom.yaml — run with:  semgrep --test semgrep-rules/
#
#   # ruleid: <id>   -> the NEXT line MUST be flagged by <id>   (true positive)
#   # ok: <id>       -> the NEXT line must NOT be flagged      (true negative)
#
# When you tune a rule to remove a false positive, add an `ok:` case here
# first; when you find a missed bug, add a `ruleid:` case. Then fix the rule.
# ruff: noqa
import hashlib
import os
import pickle
import sqlite3
import subprocess

import yaml
from flask import Flask, render_template_string, request

app = Flask(__name__)


def shell_cases(host):
    # ruleid: no-shell-true
    subprocess.run(f"ping -c 1 {host}", shell=True)
    # ruleid: no-shell-true
    subprocess.Popen("ls " + host, shell=True, stdout=subprocess.PIPE)
    # ruleid: no-shell-true
    os.system("ping " + host)
    # ok: no-shell-true
    subprocess.run(["ping", "-c", "1", host])
    # ok: no-shell-true
    subprocess.run(["ls"], shell=False)


def hash_cases(pw, data):
    # ruleid: weak-password-hash
    hashlib.md5(pw.encode()).hexdigest()
    # ruleid: weak-password-hash
    hashlib.sha1(pw.encode())
    # ok: weak-password-hash
    hashlib.md5(data, usedforsecurity=False)
    # ok: weak-password-hash
    hashlib.sha256(data)


@app.route("/t1")
def template_cases():
    name = request.args.get("name")
    # ruleid: flask-render-template-string-fstring
    render_template_string(f"<h1>Hello {name}</h1>")
    # ruleid: flask-render-template-string-fstring
    render_template_string("<h1>Hello " + name + "</h1>")
    # ok: flask-render-template-string-fstring
    return render_template_string("<h1>Hello {{ name }}</h1>", name=name)


@app.route("/t2")
def sqli_cases():
    conn = sqlite3.connect(":memory:")
    uid = request.args.get("id")
    # ruleid: flask-sqli-taint
    conn.execute(f"SELECT * FROM users WHERE id = {uid}")
    # ruleid: flask-sqli-taint
    conn.execute("SELECT * FROM users WHERE id = " + uid)
    query = "SELECT * FROM users WHERE name = '%s'" % request.args["name"]
    # ruleid: flask-sqli-taint
    conn.execute(query)
    # ok: flask-sqli-taint
    conn.execute("SELECT * FROM users WHERE id = ?", (uid,))
    # ok: flask-sqli-taint
    conn.execute(f"SELECT * FROM users WHERE id = {int(uid)}")
    return "ok"


@app.route("/t3", methods=["POST"])
def deser_cases():
    raw = request.get_data()
    # ruleid: untrusted-deserialization
    pickle.loads(raw)
    # ruleid: untrusted-deserialization
    yaml.load(raw, Loader=yaml.UnsafeLoader)
    # ok: untrusted-deserialization
    yaml.load(raw, Loader=yaml.SafeLoader)
    # ok: untrusted-deserialization
    yaml.safe_load(raw)
    # ok: untrusted-deserialization
    return pickle.loads(open("trusted-local-cache.pkl", "rb").read())
