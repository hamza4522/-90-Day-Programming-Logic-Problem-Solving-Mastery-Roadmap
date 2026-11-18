"""
The RIGHT way to handle configuration secrets — Lab 2.1.

Compare with the `config.py` that setup-lab-repo.sh commits to history.

Principles (12-factor app, factor III "Config"):
  1. Secrets live OUTSIDE the codebase: env vars, mounted files, or a secret
     manager (Vault - Lab 3.3, AWS Secrets Manager, K8s Secrets + CSI driver).
  2. FAIL FAST: a missing secret crashes at startup with a clear message,
     instead of silently using a default like "changeme".
  3. Secrets are never logged. The Secret wrapper redacts itself in
     repr()/str(), so `logger.info(config)` can't leak it.
  4. Support *file-based* secrets (KEY_FILE=/run/secrets/key). Env vars are
     visible in /proc/<pid>/environ, `docker inspect`, and crash dumps;
     tmpfs-mounted files are generally safer.
"""

import os
from dataclasses import dataclass
from pathlib import Path


class MissingSecretError(RuntimeError):
    pass


class Secret:
    """A string that refuses to print itself."""

    __slots__ = ("_value",)

    def __init__(self, value: str):
        self._value = value

    def reveal(self) -> str:
        """Explicit, greppable call site every time the raw value is used."""
        return self._value

    def __repr__(self) -> str:
        return "Secret('********')"

    __str__ = __repr__

    def __eq__(self, other):  # avoid accidental equality leaks in logs/asserts
        return NotImplemented


def read_secret(name: str, required: bool = True) -> Secret | None:
    """
    Look up NAME_FILE first (Docker/K8s secret mount), then NAME.
    """
    file_path = os.environ.get(f"{name}_FILE")
    if file_path:
        return Secret(Path(file_path).read_text().strip())
    value = os.environ.get(name)
    if value:
        return Secret(value)
    if required:
        raise MissingSecretError(
            f"Required secret {name} is not set. Provide {name} or {name}_FILE. "
            f"Locally: copy .env.example to .env and fill it in (.env is gitignored)."
        )
    return None


@dataclass(frozen=True)
class Settings:
    database_url: Secret
    aws_access_key_id: Secret | None
    aws_secret_access_key: Secret | None
    github_token: Secret | None
    app_name: str = "MySecureApp"
    debug: bool = False


def load_settings() -> Settings:
    return Settings(
        database_url=read_secret("DATABASE_URL"),
        # In AWS, prefer IAM roles (instance profile / IRSA) over static keys:
        # no long-lived credential exists to leak in the first place.
        aws_access_key_id=read_secret("AWS_ACCESS_KEY_ID", required=False),
        aws_secret_access_key=read_secret("AWS_SECRET_ACCESS_KEY", required=False),
        github_token=read_secret("GITHUB_TOKEN", required=False),
        debug=os.environ.get("APP_DEBUG", "0") == "1",
    )


if __name__ == "__main__":
    os.environ.setdefault("DATABASE_URL", "postgresql://app@localhost/dev")
    s = load_settings()
    print(s)  # -> database_url=Secret('********') ... nothing leaks
