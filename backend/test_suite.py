"""Executable solver verification suite with an independent small-n oracle."""
from __future__ import annotations

import random
import time
from typing import Any

from backend.solver import format_output, solve_problem


def brute_force(costs: list[int], target: int) -> dict[str, Any]:
    """Independent oracle for small test inputs; intentionally not used in app solving."""
    plans: list[list[int]] = []
    for mask in range(1 << len(costs)):
        chosen = [i + 1 for i in range(len(costs)) if mask & (1 << i)]
        if sum(costs[i - 1] for i in chosen) == target:
            plans.append(chosen)
    if not plans:
        return {"count": 0, "minimum_size": -1, "optimal_count": 0, "chosen_indices": None}
    min_size = min(len(plan) for plan in plans)
    optimal = [plan for plan in plans if len(plan) == min_size]
    return {
        "count": len(plans),
        "minimum_size": min_size,
        "optimal_count": len(optimal),
        "chosen_indices": min(optimal),
    }


FIXED_CASES = [
    {"name": "Provided sample 1", "costs": [5, 5, 10, 3, 7, 10], "target": 10,
     "expected": {"count": 4, "minimum_size": 1, "optimal_count": 2, "chosen_indices": [3]}},
    {"name": "Impossible target", "costs": [2, 4, 6], "target": 1,
     "expected": {"count": 0, "minimum_size": -1, "optimal_count": 0, "chosen_indices": None}},
    {"name": "Target zero", "costs": [1, 2, 3, 4], "target": 0,
     "expected": {"count": 1, "minimum_size": 0, "optimal_count": 1, "chosen_indices": []}},
    {"name": "Duplicate costs remain distinct", "costs": [2, 2, 3], "target": 4,
     "expected": {"count": 1, "minimum_size": 2, "optimal_count": 1, "chosen_indices": [1, 2]}},
    {"name": "Unsorted input", "costs": [7, 2, 5, 3], "target": 5,
     "expected": {"count": 2, "minimum_size": 1, "optimal_count": 1, "chosen_indices": [3]}},
    {"name": "Multiple minimum-size plans", "costs": [1, 2, 3, 4], "target": 5,
     "expected": {"count": 2, "minimum_size": 2, "optimal_count": 2, "chosen_indices": [1, 4]}},
    {"name": "Lexicographical tie", "costs": [2, 1, 1, 2], "target": 3,
     "expected": {"count": 4, "minimum_size": 2, "optimal_count": 4, "chosen_indices": [1, 2]}},
    {"name": "Maximum n", "costs": [1] * 22, "target": 1,
     "expected": {"count": 22, "minimum_size": 1, "optimal_count": 22, "chosen_indices": [1]}},
]


def run_test_suite(random_cases: int = 32, seed: int = 20261031) -> dict[str, Any]:
    cases: list[dict[str, Any]] = []
    started_all = time.perf_counter()
    passed = 0

    for item in FIXED_CASES:
        started = time.perf_counter()
        result = solve_problem(item["costs"], item["target"])
        actual = {key: result[key] for key in ("count", "minimum_size", "optimal_count", "chosen_indices")}
        ok = actual == item["expected"]
        passed += int(ok)
        cases.append({
            "name": item["name"],
            "input": {"n": len(item["costs"]), "target": item["target"], "costs": item["costs"]},
            "expected": item["expected"],
            "actual": actual,
            "expected_output": format_output(item["expected"]),
            "actual_output": format_output(result),
            "status": "passed" if ok else "failed",
            "duration_ms": round((time.perf_counter() - started) * 1000, 3),
        })

    rng = random.Random(seed)
    random_ok = True
    random_started = time.perf_counter()
    random_detail = ""
    for case_index in range(random_cases):
        n = rng.randint(0, 11)
        costs = [rng.randint(1, 16) for _ in range(n)]
        target = rng.randint(0, sum(costs) + 3)
        result = solve_problem(costs, target)
        actual = {key: result[key] for key in ("count", "minimum_size", "optimal_count", "chosen_indices")}
        expected = brute_force(costs, target)
        if actual != expected:
            random_ok = False
            random_detail = f"Mismatch at randomized case {case_index + 1}: {costs=} {target=} {expected=} {actual=}"
            break
    random_duration = round((time.perf_counter() - random_started) * 1000, 3)
    passed += int(random_ok)
    cases.append({
        "name": f"Randomized brute-force cross-check ({random_cases} cases, seed {seed})",
        "input": {"cases": random_cases, "seed": seed, "n_max": 11},
        "expected": "Every solver result equals independent brute-force oracle",
        "actual": "All comparisons matched" if random_ok else random_detail,
        "status": "passed" if random_ok else "failed",
        "duration_ms": random_duration,
    })

    return {
        "passed": passed,
        "total": len(cases),
        "status": "passed" if passed == len(cases) else "failed",
        "duration_ms": round((time.perf_counter() - started_all) * 1000, 3),
        "cases": cases,
    }


if __name__ == "__main__":
    import json
    print(json.dumps(run_test_suite(), indent=2))
