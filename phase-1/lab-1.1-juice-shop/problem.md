# Lab 1.1 — OWASP Juice Shop: Attack Before You Defend
**Phase**: 1 — Security Foundation  
**Difficulty**: ⭐ Beginner  
**Estimated Time**: 3–4 hours  
**Category**: Offensive Security Awareness

---

## 🎯 Objective

As a DevOps engineer transitioning to DevSecOps, you need to understand **how attackers exploit vulnerabilities** before you can build effective defenses. In this lab, you will attack a deliberately vulnerable web application called **OWASP Juice Shop**.

Understanding the attacker's perspective is the foundation of DevSecOps — you cannot secure what you don't understand.

---

## 📋 Problem Statement

Your organization has deployed a new e-commerce application. You've been tasked with performing a **security assessment** before it goes to production. The staging environment is running and you have permission to test it.

Your job is to:
1. Set up the Juice Shop application locally using Docker
2. Discover and exploit **at least 5 vulnerabilities** from the following categories
3. Document each finding with: **vulnerability type**, **steps to reproduce**, **risk level**, and **recommended fix**

---

## 🔍 Required Vulnerabilities to Find

You must find and document vulnerabilities in these categories:

| # | Category | Challenge |
|---|---|---|
| 1 | **Injection** | Perform a SQL Injection on the login page to bypass authentication |
| 2 | **XSS** | Execute a Cross-Site Scripting (XSS) attack in the search bar |
| 3 | **Broken Auth** | Access another user's basket without their credentials |
| 4 | **Sensitive Data Exposure** | Find a hidden API endpoint that exposes internal data |
| 5 | **Security Misconfiguration** | Access a page that should be restricted to admin users |

---

## 🛠️ Prerequisites

- Docker installed and running
- A web browser
- Browser developer tools (F12)
- Basic understanding of HTTP requests

---

## 📝 Deliverables

Create a file called `findings-report.md` in this folder with the following structure for each vulnerability:

```markdown
## Finding #1: [Vulnerability Name]
- **OWASP Category**: 
- **Severity**: Critical / High / Medium / Low
- **Steps to Reproduce**:
  1. Step 1
  2. Step 2
- **Evidence**: (screenshot description or output)
- **Business Impact**: What damage could an attacker do?
- **Recommended Fix**: How would you prevent this in code/config?
```

---

## ❓ Questions to Answer After the Lab

1. Which vulnerability was easiest to find? Why does that matter from a DevSecOps perspective?
2. How would a CI/CD pipeline have helped catch any of these vulnerabilities before deployment?
3. Which OWASP Top 10 categories did your findings map to?
4. If you were a developer, what coding practices would prevent the SQL Injection you found?

---

> 💡 **Hint**: Juice Shop has a built-in score board. Open browser devtools, look at the JavaScript source files, and search for "score-board" to find it. It shows all available challenges.

> ⚠️ **Ethics Reminder**: Only run these attacks against your own local Juice Shop instance. Never test against systems you don't own or have explicit permission to test.
