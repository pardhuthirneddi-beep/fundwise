# FUNDWISE implementation plan

## Goal and scope

Build FUNDWISE as the requested practical exact-budget optimizer and transparent algorithm demonstration. Deliver the six routes `/`, `/solver`, `/visualizer`, `/explorer`, `/tests`, and `/submission`; preserve the supplied dark cinematic visual direction, algorithm constraints, functional controls, and downloadable submission artifacts. This plan retains the attached specification as the product source of truth. No database, user accounts, or persistent server-side history are specified, so the active problem will be shared across the client routes using browser session/local state, while a server-side solve result is retained in a bounded in-memory session cache for genuine paginated plan requests. That cache is runtime-scoped and will be described honestly; refreshing/restarting the backend may require solving again.

## Implementation approach

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS, and Lucide. Build six responsive pages with a shared navigation, state provider, dark design tokens, keyboard-accessible controls, empty/loading/error/success states, and practical solver-first information hierarchy.
- **Backend:** Python FastAPI on the managed server. Use a single frontend origin and a same-origin `/api/*` interface. Build the Next.js frontend as static output and have FastAPI serve those files and API endpoints from one configured listener, avoiding fragile cross-origin assumptions and retaining the requested Python algorithm backend. Confirm framework/runtime feasibility during setup; if the platform cannot run this combined deployment shape, surface the blocker rather than silently replacing FastAPI or faking API behavior.
- **Algorithm:** one reusable Python implementation performs recursive include-first/exclude-second subset backtracking in original order, with exact integer arithmetic, suffix-sum and over-target pruning, immediate target success for positive costs, count/minimum-size/optimal-count tracking, and explicit lexicographic tie-break. Do not prune on current selection size. Primary solve pass does not retain all solutions. Plan pagination reruns a genuine traversal with filters/order and returns only the requested page. Validation caps inputs at `n<=22`, target 0–1,000,000, and positive costs 1–1,000,000.
- **Visualization:** a backend trace endpoint returns genuine traversal events for small inputs. Cap detailed event emission and disclose the cap; for larger cases return genuine execution summaries, not a fabricated full tree. React Flow renders the returned trace and exposes playback controls.
- **Submission:** serve the exact standalone Python source from the same solver module or a synchronized canonical source. Generate CODE.py and a ReportLab PDF from real source and solver documentation, validate files, and execute the Python artifact before reporting successful generation.
- **Tests:** expose and run a genuine backend test suite including supplied samples, zero, impossible, duplicates, unsorted, tie-breaking, maximum n, and deterministic randomized brute-force comparisons on small n. UI displays actual results only.
- **Motion and home:** use Lenis for smooth scrolling, GSAP/ScrollTrigger for restrained scroll storytelling, and Motion for component-level interaction. Respect reduced-motion preferences. Build hero geometry with lightweight CSS 3D first; add Three.js only if it is safe within the implementation time and does not compromise core workflows. Use sample statistics only when explicitly labeled illustrative.

## Design direction

**Design Movement:** cinematic near-future technical instrument, using the user-specified premium dark palette and controlled luminous accents.

**Core Principles:** rigorous before decorative; high contrast and legible data; restrained motion; every visual state maps to real solver state.

**Color Philosophy:** graphite and near-black establish focus; acid lime identifies selected/optimal outcomes; electric blue denotes active exploration; red is reserved for errors and safely pruned branches. Preserve the supplied palette: #07090B, #101419, #141A20, #B9F36B, #8EB8FF, #F4F6F2, #929BA5, #9BE66B, #FF6464.

**Layout Paradigm:** editorial, asymmetric, instrument-panel composition with generous negative space on the home page and dense but structured workbench layouts on functional pages; avoid a generic uniform card dashboard.

**Signature Elements:** a thin lime “decision path” line; request-index chips styled as discrete funding units; fine perspective grid and sparse orbital geometry on the home page only.

**Interaction Philosophy:** direct manipulation, immediate validation, explicit result provenance, and controls that remain usable without animation. Never let motion obscure solver data.

**Animation:** Lenis and GSAP/ScrollTrigger own page-level scroll effects; Motion owns component transitions and micro-interactions; CSS handles simple state styling. Keep animation subtle, disable/reduce movement when requested, and avoid scroll hijacking.

**Typography System:** geometric sans-serif for headings and interface, with a highly legible monospace for indices, code, and algorithm values; large editorial hero scale, compact uppercase labels, tabular numerals for output metrics.

**Brand Essence:** an exact-budget planning instrument for coordinators and technical evaluators, distinct because it reveals every valid plan and proves how the smallest one is chosen; precise, composed, exploratory.

**Brand Voice:** crisp, confident, evidence-led. Example lines: “Every combination matters.” “Exact target reached. Here are the plans that prove it.”

**Wordmark & Logo:** FUNDWISE wordmark paired with a small branching two-path mark that converges on a lime square, representing include/exclude decisions and an optimal selection.

**Signature Brand Color:** luminous acid lime #B9F36B.

## Project structure

```text
fundwise/
├── app/                         # Next.js route pages, global dark theme and metadata
│   ├── page.tsx                 # Cinematic home
│   ├── solver/page.tsx          # Input, results, plan pagination
│   ├── visualizer/page.tsx      # Backend trace playback / React Flow
│   ├── explorer/page.tsx        # Source, pseudocode, proof, complexity
│   ├── tests/page.tsx           # Real test-runner results
│   └── submission/page.tsx      # CODE.py and PDF generation/downloads
├── components/                  # Shared nav, Lenis/GSAP/Motion effects, trace preview and UI primitives
├── lib/                         # Typed API client, stable request IDs and shared problem state
├── public/                      # Brand favicon, wordmark asset and six-route manifest
├── backend/app.py               # FastAPI routes, production static serving and validation
├── backend/run.py               # Single production listener honoring PORT (default 3000)
├── backend/solver.py            # Canonical recursive solver, pagination and trace events
├── backend/submission.py         # Standalone CODE.py and full technical PDF generation
├── backend/test_suite.py        # Fixed cases and independent randomized oracle checks
├── artifacts/CODE.py            # Executable standalone deliverable
├── artifacts/CODE-DOC.pdf       # Generated technical document with the complete source
├── .next-build/                 # Production Next static export, generated by `pnpm build`
├── README.md                    # Local run, architecture, checks and deliverables
├── plan.md                      # Approved implementation/design plan
└── TODO.md                      # Outcome-based feature criteria and progress
```

## Material constraints and decisions

- The request requires Next.js and FastAPI together. The implementation will serve a statically exported Next.js frontend from FastAPI on one server port, with relative `/api` calls; this keeps both named frameworks in use without requiring an unsupported second listener. Verify the managed project can build and run Python dependencies before investing in the full application.
- The required include/exclude approach is exponential in the worst case. At `n=22`, the solver explores up to 2^22 states; avoid storing all plans in the primary pass and cap visual trace output. Paginated enumeration may rerun the traversal as required by the specification.
- A report generated at runtime may depend on ReportLab availability. If deployment/runtime dependency installation prevents PDF creation, preserve honest error handling and provide the verified downloadable artifact only after actual generation; do not claim a successful download prematurely.
- Do not enable a database: user requirements do not call for durable user or session records. Enable the managed server because FastAPI endpoints are required.
- The site will not claim publication until a publication result confirms it. A working project preview and source checkpoint are distinct from publication.
