export type SolveResponse = {
  session_id: string;
  count: number;
  minimum_size: number;
  optimal_count: number;
  chosen_indices: number[] | null;
  execution: { explored_nodes: number; pruned_nodes: number; duration_ms: number };
};

export type Plan = {
  indices: number[];
  costs: number[];
  total_cost: number;
  selected_count: number;
  optimal: boolean;
};

export type PlansResponse = {
  session_id: string;
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  order: string;
  plans: Plan[];
};

export type TraceEvent = {
  id: number;
  parent_id: number | null;
  index: number;
  request_index: number | null;
  decision: string;
  current_sum: number;
  selected_indices: number[];
  remaining_target: number;
  depth: number;
  status: "exploring" | "pruned" | "valid" | "optimal" | "dead_end";
};

export type TraceResponse = {
  events: TraceEvent[];
  trace_truncated: boolean;
  detail_level: string;
  trace_cap: number;
  summary: {
    count: number;
    minimum_size: number;
    optimal_count: number;
    chosen_indices: number[] | null;
    explored_nodes: number;
    pruned_nodes: number;
    duration_ms: number;
  };
};

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = body?.detail;
    throw new Error(typeof detail === "string" ? detail : `Request failed (${response.status}).`);
  }
  return body as T;
}

export const chosenLabel = (indices: number[] | null): string =>
  indices === null ? "NONE" : indices.length === 0 ? "EMPTY" : indices.join(", ");
