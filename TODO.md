# FUNDWISE delivery outcomes

## 1. Shared product shell, design system, and home experience — Complete

- Deliver a responsive website with six pages: Home `/`, Solver `/solver`, Visualizer `/visualizer`, Algorithm Explorer `/explorer`, Test Lab `/tests`, Submission Studio `/submission`; use a consistent navigation system and responsive desktop, tablet, and mobile layouts, with desktop receiving the highest design attention.
- Follow the supplied premium futuristic cinematic dark identity: deep black/graphite, neon lime primary accent, subtle electric blue, glass panels, restrained luminous borders, ambient light, depth, editorial geometric typography, subtle grids and controlled gradients. Avoid generic white SaaS dashboards, excessive rounded cards, random gradients, unnecessary glow, excessive animation, generic AI dashboard layouts, fake statistics, oversized icons, and unnecessary charts.
- Home includes navigation/logo/Get Started; hero headline “Build the smallest team.”; supplied supporting text; working Try the Solver and Watch the Demo buttons; a sophisticated request/combination visualization communicating optimization; scroll-story sections for the problem, include/exclude decisions, smallest team, interactive decision-tree preview, six specified product features, and final CTA “Find your exact solution.” All links/buttons navigate or act. Any sample stats are explicitly labelled illustrative, never live/fabricated.
- Use Lenis for natural smooth scrolling/anchors and integrate with GSAP correctly; honor reduced-motion. Use GSAP + ScrollTrigger for restrained hero depth/parallax, story reveals/pinning and controlled 3D-style transitions. Use Motion for React for transitions, counters, button/card interactions, feedback, result/loading/completion states. Avoid conflicting controllers and scroll hijacking; solver usability takes precedence. Use selective real 3D only if performance permits and CSS 3D fallback otherwise.
- Implement meaningful loading, empty, validation, error, and success states; keyboard accessibility; clear navigation; confirmation before clearing; no dead buttons, placeholder links, fake data, or claims that unverified behavior works.

## 2. Solver, exact backtracking engine, and plan pagination — Complete

- Build usable request/target inputs: target integer 0–1,000,000; costs positive integers 1–1,000,000; n<=22. Add/edit/remove requests, stable internal IDs, original index display, preserve input order, duplicates remain distinct, request count visible. Never sort or deduplicate; after removal, preserve remaining order and never renumber the remaining original request labels. Append requests with new stable labels. Send remaining requests in their existing order as a new dense solver input instance and map returned positions back to the stable displayed labels.
- Initial input is requests `[5, 5, 10, 3, 7, 10]`, target `10`. Provide working Load Sample 1, Load Sample 2, Clear Inputs (with confirmation), and Run Solver controls.
- POST the actual problem to the real backend and display real results: total valid plans, minimum team size, number of optimal plans, chosen lexicographically smallest 1-based index list. Sample 1 outputs COUNT 4, MIN_SIZE 1, OPTIMAL_COUNT 2, CHOSEN 3. Clearly highlight all optimal plans.
- Implement genuine Python recursive Sum-of-Subsets include/exclude backtracking in original request order; include branch then exclude branch at each index; exact integers and Python integer counters. Precompute suffix sums; safely prune only current_sum>target or current_sum+remaining_suffix_sum<target; stop a branch when current_sum==target because all costs are positive. Do not prune due to current selected count exceeding current best. Track count/minimum size/optimal count/best list without storing every valid subset in primary counting pass. Compare increasing 1-based index lists explicitly for lexicographic tie-breaking. No floats, modulo, sorting, deduplication, DP, bitmask enumeration, or replacement algorithm.
- Special cases: target zero returns exactly one valid subset, minimum 0, optimal count 1, CHOSEN EMPTY. Impossible positive target returns count 0, minimum -1, optimal 0, CHOSEN NONE. Output field names and formatting are exact.
- Show every valid plan in an expandable section; each row has original indices, individual costs, total cost, number selected, and optimal indicator. Do not silently hide non-optimal valid plans. Use genuine server-side pagination, exact total count, adjustable page size, page navigation, practical search by index, optimal/non-optimal filter, lexicographical ordering. Return actual valid plans, never placeholders. Pagination may rerun the include/exclude traversal rather than retaining all combinations. Preserve active problem state when navigating Solver/Visualizer.

## 3. Genuine execution visualizer — Complete

- Use React Flow to render actual include/exclude decisions emitted by backend execution; never independently invent a frontend tree. Each request creates INCLUDE and EXCLUDE decisions.
- Node details: request index, decision, current sum, selected indices, remaining target, recursion depth, branch status. States: blue exploring, lime valid exact solution, grey unexplored/skipped, red safely pruned, purple optimal.
- Controls: Play, Pause, Previous, Next, Reset, playback speed, zoom in/out, fit view. Side panel: current request, current sum, target, remaining target, selected requests, recursion depth, valid plans, optimal plans, explored nodes, pruned nodes. Playback follows actual execution order.
- Small inputs support detailed step-by-step playback. Large inputs use condensed genuine execution summaries; do not render millions of nodes. Disclose when detailed trace is capped.

## 4. Algorithm Explorer — Complete

- Provide tabs Python Code, Pseudocode, How It Works, Correctness Proof, Complexity. Display the actual submitted Python implementation in read-only, syntax-highlighted Monaco with line numbers; allow copy and CODE.py download; highlight relevant sections.
- Explain base conditions, include branch, exclude branch, safe pruning, solution discovery, minimum-size tracking, optimal-plan counting, and lexicographical comparison.
- Correctness proof explains why exhaustive include/exclude considers every valid subset unless safely pruned, why every recorded subset is valid, why minimum-size and optimal-count are correct, and why tuple/list comparison yields the required lexicographical choice.
- Complexity: worst-case O(2^n), auxiliary recursion space O(n); explain pruning can reduce actual work but not worst-case bound.

## 5. Test Lab and verification suite — Complete

- Genuine executable test categories: provided samples, target zero, impossible target, duplicate costs, unsorted input, multiple minimum-size plans, lexicographical tie-breaking, maximum n, randomized testing. Run All Tests. For each show input, expected output, actual output, execution status, and duration. Do not claim tests passed without executing.
- Required sample 1: n=6, T=10, costs `[5,5,10,3,7,10]` => COUNT 4, MIN_SIZE 1, OPTIMAL_COUNT 2, CHOSEN 3.
- Required sample 2: n=3, T=1, costs `[2,4,6]` => COUNT 0, MIN_SIZE -1, OPTIMAL_COUNT 0, CHOSEN NONE.
- Required sample 3: n=4, T=0, costs `[1,2,3,4]` => COUNT 1, MIN_SIZE 0, OPTIMAL_COUNT 1, CHOSEN EMPTY.
- Add duplicate, unsorted, tie-breaking, maximum n and independent brute-force cross-checks for deterministic randomized small-n inputs. Verify all required output formatting and edge cases, including n=22.

## 6. Submission Studio and deliverables — Complete

- Generate standalone `CODE.py`: reads standard input n and T then request costs; implements include/exclude backtracking; computes exact COUNT, MIN_SIZE, OPTIMAL_COUNT and lexicographically smallest 1-based index list; prints exact required format, with CHOSEN EMPTY and CHOSEN NONE special cases; no unnecessary dependencies or debug stdout.
- Generate `CODE-DOC.pdf` professionally with title page, problem statement, input/output specification, algorithm explanation, include/exclude approach, pseudocode, Python implementation, correctness proof, safe pruning, time and space complexity, sample cases, edge-case testing, conclusion; readable typography, spacing, page numbers, formatted code and readable diagrams.
- Do not invent requirements for the unavailable official first-page checklist; keep document adaptable until that checklist is supplied.
- Working download buttons for both files. Validate each generated file exists, and execute CODE.py correctly before enabling/reporting successful download status. PDF must be generated and openable before claiming success.

## 7. API, validation, and delivery integrity — Complete

- FastAPI backend with validation/error handling, no arbitrary code execution endpoint. `POST /api/solve` accepts costs/target and returns count, minimum size, optimal count, chosen indices, and execution statistics. `GET /api/plans` accepts problem/session ID, page, page size, optional optimal-only filter and returns genuine solver plans. `POST /api/visualize` accepts costs/target/detail and returns genuine events or honestly-labelled condensed representation. `GET /api/code` returns actual submission source. `POST /api/generate-submission` generates CODE.py and CODE-DOC.pdf. `POST /api/tests/run` executes the verification suite.
- Same-origin frontend/API operation, proper input bounds and errors, honest runtime/session behavior. No fabricated test results/statistics, simulated solver results, placeholder plan combinations, or invented visualizer events. At completion state project URL or local run instructions, project structure, features, actual test results, downloadable CODE.py/PDF and remaining limitations without claiming an unpublished site is published.
