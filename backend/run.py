"""Production ASGI entrypoint; honor the platform's supplied listener port."""
from __future__ import annotations

import os

import uvicorn


def main() -> None:
    uvicorn.run("backend.app:app", host="0.0.0.0", port=int(os.environ.get("PORT", "3000")))


if __name__ == "__main__":
    main()
