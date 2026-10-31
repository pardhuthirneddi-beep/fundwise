# FUNDWISE

FUNDWISE is an exact-budget optimizer and algorithm-evaluation workbench. Its Python FastAPI service owns the include/exclude backtracking solver, plan pagination, trace events, test runner, and submission generation. The Next.js frontend is statically exported for production serving by FastAPI; local development uses Next.js on port 3000 and FastAPI on port 8000, with Next rewriting same-origin `/api/*` requests to the backend.

## Run locally

Requirements: Node.js 22+, pnpm 11, Python 3.10+, and the packages in `requirements.txt`.

```bash
pnpm install
python3 -m pip install -r requirements.txt
pnpm dev
```

Open `http://localhost:3000`. The backend API is at `http://localhost:8000/api/health`.
Request rows preserve their original display index after another row is removed; the solver receives remaining requests in their unchanged order and the interface maps returned positions back to those stable labels.
`pnpm build` writes the production static export to `.next-build/`. After a build, `pnpm start` serves the exported pages and API from one listener on port 3000, or the supplied `PORT` value.

## Checks and artifacts

```bash
python3 -m backend.test_suite
pnpm exec tsc --noEmit
pnpm build
```

Generate verified files through the app's Submission Studio or directly:

```bash
python3 - <<'PY'
from pathlib import Path
from backend.submission import generate_submission
print(generate_submission(Path.cwd()))
PY
```

Generated files are written to `artifacts/CODE.py` and `artifacts/CODE-DOC.pdf`. `CODE.py` is the standalone source of the same solver implementation; the PDF contains the explanation, proof, complexity discussion, test cases, and complete line-numbered Python source.

## Routes

- `/` — Cinematic product introduction
- `/solver` — Inputs, exact backend results, and paginated plan browsing
- `/visualizer` — Playback of genuine backend execution events
- `/explorer` — Canonical source, pseudocode, explanation, proof, complexity
- `/tests` — Actual fixed and randomized verification results
- `/submission` — Generated and validated source/PDF downloads

The API keeps solve sessions in a bounded in-memory cache. Plan pagination is genuine and lexicographically ordered, but server restarts or cache eviction require a new solver run; no database-backed history is configured.
