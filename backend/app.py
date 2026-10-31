"""FastAPI service for the FUNDWISE solver and generated deliverables."""
from __future__ import annotations

import subprocess
import sys
import threading
import uuid
from collections import OrderedDict
from pathlib import Path
from typing import Annotated, Literal

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse, PlainTextResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field, StrictInt

from backend.solver import format_output, paginate_plans, solve_problem, validate_problem
from backend.submission import generate_submission
from backend.test_suite import run_test_suite

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"
OUT = ROOT / ".next-build"
app = FastAPI(title="FUNDWISE API", version="1.0.0")

class ProblemInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    costs: list[StrictInt] = Field(max_length=22)
    target: Annotated[StrictInt, Field(ge=0, le=1_000_000)]

class VisualizeInput(ProblemInput):
    detail_level: Literal["detailed", "condensed"] = "detailed"

sessions: OrderedDict[str, dict] = OrderedDict()
session_lock = threading.Lock()
SESSION_LIMIT = 256


def get_session(session_id: str) -> dict:
    with session_lock:
        record = sessions.get(session_id)
        if record is None:
            raise HTTPException(status_code=404, detail="This solver session is no longer available. Run the solver again to refresh it.")
        sessions.move_to_end(session_id)
        return record

@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "fundwise"}

@app.post("/api/solve")
def solve(problem: ProblemInput) -> dict:
    try:
        validate_problem(problem.costs, problem.target)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    result = solve_problem(problem.costs, problem.target)
    session_id = str(uuid.uuid4())
    public_result = {key: value for key, value in result.items() if key not in ("events", "trace_truncated")}
    record = {"costs": list(problem.costs), "target": problem.target, "result": public_result}
    with session_lock:
        sessions[session_id] = record
        while len(sessions) > SESSION_LIMIT:
            sessions.popitem(last=False)
    return {"session_id": session_id, **public_result}

@app.get("/api/plans")
def plans(
    session_id: str = Query(min_length=1, max_length=64),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    optimal_only: bool | None = None,
    search_index: int | None = Query(default=None, ge=1, le=22),
) -> dict:
    record = get_session(session_id)
    if search_index is not None and search_index > len(record["costs"]):
        raise HTTPException(status_code=422, detail="Search index exceeds the number of requests.")
    result = record["result"]
    try:
        page_result = paginate_plans(
            record["costs"], record["target"], result["minimum_size"], page, page_size,
            optimal_only, search_index,
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    plans_with_costs = []
    for indices in page_result.pop("plans"):
        selected_costs = [record["costs"][index - 1] for index in indices]
        total_cost = sum(selected_costs)
        plans_with_costs.append({
            "indices": indices,
            "costs": selected_costs,
            "total_cost": total_cost,
            "selected_count": len(indices),
            "optimal": len(indices) == result["minimum_size"],
        })
    return {"session_id": session_id, **page_result, "plans": plans_with_costs}

@app.post("/api/visualize")
def visualize(problem: VisualizeInput) -> dict:
    try:
        validate_problem(problem.costs, problem.target)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    cap = 5_000 if problem.detail_level == "detailed" else 150
    result = solve_problem(problem.costs, problem.target, trace_limit=cap)
    return {
        "events": result["events"],
        "trace_truncated": result["trace_truncated"],
        "detail_level": problem.detail_level,
        "trace_cap": cap,
        "summary": {
            "count": result["count"],
            "minimum_size": result["minimum_size"],
            "optimal_count": result["optimal_count"],
            "chosen_indices": result["chosen_indices"],
            **result["execution"],
        },
    }

@app.get("/api/code", response_class=PlainTextResponse)
def get_code() -> PlainTextResponse:
    return PlainTextResponse((ROOT / "backend" / "solver.py").read_text(encoding="utf-8"))

@app.post("/api/tests/run")
def run_tests() -> dict:
    return run_test_suite()

@app.post("/api/generate-submission")
def create_submission() -> dict:
    try:
        paths = generate_submission(ROOT)
        sample = subprocess.run(
            [sys.executable, str(paths["code"])],
            input="6 10\n5 5 10 3 7 10\n", text=True, capture_output=True,
            timeout=10, check=False,
        )
        expected = "COUNT 4\nMIN_SIZE 1\nOPTIMAL_COUNT 2\nCHOSEN 3"
        if sample.returncode != 0 or sample.stdout.strip() != expected:
            raise RuntimeError("Generated CODE.py failed its sample execution check.")
        if not paths["pdf"].is_file() or paths["pdf"].stat().st_size < 1_000:
            raise RuntimeError("Generated CODE-DOC.pdf is missing or unexpectedly small.")
        pdf_bytes = paths["pdf"].read_bytes()
        if not pdf_bytes.startswith(b"%PDF-") or b"%%EOF" not in pdf_bytes[-2_048:]:
            raise RuntimeError("Generated CODE-DOC.pdf did not pass the PDF structure check.")
        return {
            "status": "success",
            "files": [
                {"name": "CODE.py", "url": "/api/download/CODE.py", "size": paths["code"].stat().st_size},
                {"name": "CODE-DOC.pdf", "url": "/api/download/CODE-DOC.pdf", "size": paths["pdf"].stat().st_size},
            ],
            "validation": {"code_executes": True, "sample_output": sample.stdout.strip(), "pdf_exists": True},
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Submission generation or validation failed: {error}") from error

@app.get("/api/download/{filename}")
def download(filename: str) -> FileResponse:
    if filename not in {"CODE.py", "CODE-DOC.pdf"}:
        raise HTTPException(status_code=404, detail="Unknown submission file.")
    file_path = ARTIFACTS / filename
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Generate and validate the submission before downloading.")
    media_type = "application/pdf" if filename.endswith(".pdf") else "text/x-python"
    return FileResponse(file_path, filename=filename, media_type=media_type)

# Exported Next pages are served by FastAPI for the single-process production runtime.
# In the development workflow the Next dev server listens on port 3000 and proxies /api.
if (OUT / "_next").is_dir():
    app.mount("/_next", StaticFiles(directory=OUT / "_next"), name="next-assets")

@app.get("/{page_path:path}")
def frontend(page_path: str) -> Response:
    if page_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found.")
    if not OUT.is_dir():
        raise HTTPException(status_code=503, detail="Frontend export is not built yet.")
    clean = page_path.strip("/")
    candidates = [OUT / (clean + ".html")] if clean else [OUT / "index.html"]
    if clean:
        candidates.append(OUT / clean / "index.html")
    for candidate in candidates:
        if candidate.is_file() and candidate.resolve().is_relative_to(OUT.resolve()):
            return FileResponse(candidate, media_type="text/html")
    static_candidate = OUT / clean
    if static_candidate.is_file() and static_candidate.resolve().is_relative_to(OUT.resolve()):
        return FileResponse(static_candidate)
    raise HTTPException(status_code=404, detail="Page not found.")
