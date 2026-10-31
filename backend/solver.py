"""Exact subset-sum solver using include/exclude recursive backtracking.

This module is also the standalone submission source. It intentionally uses no
non-standard dependencies and keeps the original request order throughout.
"""
from __future__ import annotations

import sys
import time
from typing import Any, Iterator

MAX_N = 22
MAX_TARGET = 1_000_000
MAX_COST = 1_000_000


def validate_problem(costs: list[int], target: int) -> None:
    if type(target) is not int or not 0 <= target <= MAX_TARGET:
        raise ValueError("Target must be an integer from 0 to 1,000,000.")
    if len(costs) > MAX_N:
        raise ValueError("At most 22 requests are allowed.")
    for index, cost in enumerate(costs, start=1):
        if type(cost) is not int or not 1 <= cost <= MAX_COST:
            raise ValueError(f"Request #{index} cost must be an integer from 1 to 1,000,000.")


def solve_problem(costs: list[int], target: int, trace_limit: int = 0) -> dict[str, Any]:
    """Count all exact subsets and optimal subsets in input-index order.

    Every visited state is reached by recursive include/exclude choices. The
    only pruning rules are over-target and insufficient remaining suffix sum.
    A bounded optional event list records genuine visited states.
    """
    validate_problem(costs, target)
    started = time.perf_counter()
    n = len(costs)
    suffix = [0] * (n + 1)
    for index in range(n - 1, -1, -1):
        suffix[index] = suffix[index + 1] + costs[index]

    count = 0
    min_size: int | None = None
    optimal_count = 0
    best_indices: list[int] | None = None
    explored_nodes = 0
    pruned_nodes = 0
    events: list[dict[str, Any]] = []
    trace_cap = max(0, min(int(trace_limit), 5_000))

    def visit(index: int, current_sum: int, chosen: list[int], parent_id: int | None,
              decision: str, depth: int) -> None:
        nonlocal count, min_size, optimal_count, best_indices
        nonlocal explored_nodes, pruned_nodes

        explored_nodes += 1
        event_id = explored_nodes - 1
        status = "exploring"
        remaining = target - current_sum
        if current_sum > target:
            status = "pruned"
            pruned_nodes += 1
        elif current_sum == target:
            count += 1
            size = len(chosen)
            candidate = chosen.copy()
            if min_size is None or size < min_size:
                min_size = size
                optimal_count = 1
                best_indices = candidate
            elif size == min_size:
                optimal_count += 1
                if best_indices is None or candidate < best_indices:
                    best_indices = candidate
            status = "valid"
        elif current_sum + suffix[index] < target:
            status = "pruned"
            pruned_nodes += 1
        elif index >= n:
            status = "dead_end"

        if len(events) < trace_cap:
            events.append({
                "id": event_id,
                "parent_id": parent_id,
                "index": index,
                "request_index": index + 1 if index < n else None,
                "decision": decision,
                "current_sum": current_sum,
                "selected_indices": chosen.copy(),
                "remaining_target": remaining,
                "depth": depth,
                "status": status,
            })

        if status in ("pruned", "valid", "dead_end"):
            return

        # Include first, then exclude. Costs are not sorted or deduplicated.
        chosen.append(index + 1)
        visit(index + 1, current_sum + costs[index], chosen, event_id, "INCLUDE", depth + 1)
        chosen.pop()
        visit(index + 1, current_sum, chosen, event_id, "EXCLUDE", depth + 1)

    visit(0, 0, [], None, "START", 0)

    if events and min_size is not None:
        for event in events:
            if event["status"] == "valid":
                event["status"] = "optimal" if len(event["selected_indices"]) == min_size else "valid"

    elapsed_ms = (time.perf_counter() - started) * 1000
    return {
        "count": count,
        "minimum_size": min_size if min_size is not None else -1,
        "optimal_count": optimal_count,
        "chosen_indices": best_indices,
        "execution": {
            "explored_nodes": explored_nodes,
            "pruned_nodes": pruned_nodes,
            "duration_ms": round(elapsed_ms, 3),
        },
        "events": events,
        "trace_truncated": bool(trace_cap and explored_nodes > len(events)),
    }


def iter_matching_plans(costs: list[int], target: int, minimum_size: int,
                        optimal_only: bool | None = None,
                        search_index: int | None = None) -> Iterator[list[int]]:
    """Yield exact plans in lexicographic index-list order without storing all."""
    validate_problem(costs, target)
    n = len(costs)
    suffix = [0] * (n + 1)
    for index in range(n - 1, -1, -1):
        suffix[index] = suffix[index + 1] + costs[index]
    chosen: list[int] = []

    def walk(index: int, current_sum: int) -> Iterator[list[int]]:
        if current_sum > target or current_sum + suffix[index] < target:
            return
        if current_sum == target:
            is_optimal = len(chosen) == minimum_size
            if optimal_only is None or is_optimal == optimal_only:
                if search_index is None or search_index in chosen:
                    yield chosen.copy()
            return
        if index >= n:
            return
        chosen.append(index + 1)
        yield from walk(index + 1, current_sum + costs[index])
        chosen.pop()
        yield from walk(index + 1, current_sum)

    yield from walk(0, 0)


def paginate_plans(costs: list[int], target: int, minimum_size: int,
                   page: int, page_size: int, optimal_only: bool | None = None,
                   search_index: int | None = None) -> dict[str, Any]:
    """Re-run the traversal, count exact matches, and retain only one page."""
    if page < 1:
        raise ValueError("Page must be at least 1.")
    if not 1 <= page_size <= 100:
        raise ValueError("Page size must be from 1 to 100.")
    start = (page - 1) * page_size
    end = start + page_size
    matches: list[list[int]] = []
    total = 0
    for plan in iter_matching_plans(costs, target, minimum_size, optimal_only, search_index):
        if start <= total < end:
            matches.append(plan)
        total += 1
    return {
        "plans": matches,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": (total + page_size - 1) // page_size,
        "order": "lexicographic",
    }


def format_output(result: dict[str, Any]) -> str:
    chosen = result["chosen_indices"]
    if chosen is None:
        chosen_text = "NONE"
    elif not chosen:
        chosen_text = "EMPTY"
    else:
        chosen_text = " ".join(str(index) for index in chosen)
    return "\n".join((
        f"COUNT {result['count']}",
        f"MIN_SIZE {result['minimum_size']}",
        f"OPTIMAL_COUNT {result['optimal_count']}",
        f"CHOSEN {chosen_text}",
    ))


def main() -> None:
    tokens = sys.stdin.read().split()
    if len(tokens) < 2:
        raise SystemExit("Expected n T followed by n request costs.")
    try:
        n = int(tokens[0])
        target = int(tokens[1])
        if n < 0 or n > MAX_N or len(tokens) != n + 2:
            raise ValueError("Input must contain n, T, and exactly n costs (0 <= n <= 22).")
        costs = [int(token) for token in tokens[2:]]
        print(format_output(solve_problem(costs, target)))
    except ValueError as error:
        raise SystemExit(str(error)) from error


if __name__ == "__main__":
    main()
