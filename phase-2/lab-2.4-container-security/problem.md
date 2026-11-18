# Lab 2.4 — Container Image Security with Trivy, Hadolint & Docker Scout
**Phase**: 2 — CI/CD Security  
**Difficulty**: ⭐⭐ Intermediate  
**Estimated Time**: 3–4 hours  
**Category**: Container Security, Image Scanning

---

## 🎯 Objective

Learn to build **secure container images** by scanning for vulnerabilities, misconfigurations, and Dockerfile best practices violations. Containers are the primary deployment unit in modern DevOps — a vulnerable base image or a misconfigured Dockerfile can expose your entire application.

---

## 📋 Problem Statement

Your team is Dockerizing a Python Flask API. The initial Dockerfile was written quickly by a developer who prioritized speed over security. You've been asked to:

1. Identify all security issues in the existing Dockerfile
2. Scan the built image for CVEs in the OS and application layers
3. Fix the Dockerfile to eliminate all HIGH/CRITICAL findings
4. Integrate container scanning into the CI/CD pipeline
5. Implement image signing to ensure supply chain integrity

---

## 🛠️ Prerequisites

- Docker installed and running
- Python 3.x
- Trivy installed (from Lab 2.3)

---

## 📋 Tasks

### Task 1: Create the Vulnerable Dockerfile

Create a project with an intentionally insecure Dockerfile:

```bash
mkdir container-security-lab && cd container-security-lab
```

Create `app.py`:
```python
from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello():
    return {'status': 'running', 'version': '1.0'}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

Create `requirements.txt`:
```
flask==2.1.0
```

Create the **insecure** `Dockerfile`:
```dockerfile
# BAD DOCKERFILE - DO NOT USE IN PRODUCTION
# This Dockerfile has intentional security issues for this lab

# Issue 1: Using latest tag (unpinned, non-reproducible)
FROM python:latest

# Issue 2: Running as root (default)
# No USER instruction means we run as root

# Issue 3: Copying everything including secrets, .git, etc.
COPY . /app

WORKDIR /app

# Issue 4: No virtual environment, installing globally
RUN pip install -r requirements.txt

# Issue 5: Exposing unnecessary information
ENV DEBUG=true
ENV SECRET_KEY=mysupersecretkey123
ENV DATABASE_URL=postgresql://admin:password@db:5432/prod

# Issue 6: Port exposed but should document what it does
EXPOSE 5000

# Issue 7: Running as root in CMD
CMD ["python", "app.py"]
```

### Task 2: Lint the Dockerfile with Hadolint

1. Install and run Hadolint against the Dockerfile
2. Document all warnings and errors found
3. Research what each Hadolint rule means (they reference best practices)
4. Answer: Which issues are **security** related vs **best practice** related?

### Task 3: Build & Scan the Image with Trivy

1. Build the Docker image: `docker build -t myapp:insecure .`
2. Scan the built image: `trivy image myapp:insecure`
3. Answer these questions:
   - How many CVEs are in the **OS layer** (python base image)?
   - How many CVEs are in the **application layer** (your pip packages)?
   - What is the **oldest unfixed CVE** in the image?
4. Compare scanning `python:latest` vs `python:3.11-alpine` — what changes?

### Task 4: Fix the Dockerfile

Rewrite the Dockerfile to fix ALL the security issues identified. Your fixed Dockerfile must:

- [ ] Use a **pinned, specific base image version** (e.g., `python:3.11.7-slim-bookworm`)
- [ ] Run as a **non-root user** (create a dedicated user)
- [ ] Use **multi-stage builds** to minimize the attack surface
- [ ] Avoid copying secrets or unnecessary files (use `.dockerignore`)
- [ ] Remove secrets from ENV variables (use runtime injection instead)
- [ ] Pass Hadolint with **zero errors**
- [ ] Have **no CRITICAL CVEs** when scanned with Trivy

Create a `.dockerignore` file as well.

### Task 5: CI/CD Container Security Pipeline

Create `.github/workflows/container-security.yml` that:
1. **Lints** the Dockerfile with Hadolint (fail on error)
2. **Builds** the Docker image
3. **Scans** the image with Trivy (fail on CRITICAL)
4. Uploads scan results to GitHub Security tab
5. Pushes the image **only if all security gates pass**

### Task 6: Compare Base Images

Fill in this comparison table by scanning each base image:

| Base Image | Image Size | CVE Count (Critical) | CVE Count (High) |
|---|---|---|---|
| `python:latest` | ? | ? | ? |
| `python:3.11-slim` | ? | ? | ? |
| `python:3.11-alpine` | ? | ? | ? |
| `python:3.11-slim-bookworm` | ? | ? | ? |
| `gcr.io/distroless/python3` | ? | ? | ? |

**Conclusion**: Which base image would you recommend and why?

---

## 📝 Deliverables

1. `Dockerfile.insecure` — renamed original bad Dockerfile
2. `Dockerfile` — your fixed, secure Dockerfile
3. `.dockerignore` — file exclusion list
4. `hadolint-report.txt` — output of linting
5. `trivy-image-scan.json` — image scan results
6. `.github/workflows/container-security.yml` — CI pipeline
7. `base-image-comparison.md` — Task 6 table with your analysis

---

## ❓ Questions to Answer

1. Why is running a container as **root** dangerous even though it's isolated? What is a container escape?
2. What is a **distroless image** and what are its tradeoffs?
3. Trivy reports a CVE in the base OS that has **no fix available**. How do you handle this in your CI policy?
4. What is the difference between **image scanning** and **runtime security**? Can image scanning catch everything?
5. How does **multi-stage building** reduce the attack surface of your final image?

---

> 💡 **Tip**: After building your fixed image, run `docker run --rm myapp:secure id` — you should NOT see `uid=0(root)`.

> 💡 **Distroless images**: Google's distroless images (`gcr.io/distroless/python3`) contain only your app and its runtime — no shell, no package manager, no OS tools. Attackers have very little to work with if they get in.
