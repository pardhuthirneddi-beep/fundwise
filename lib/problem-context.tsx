"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SolveResponse } from "@/lib/api";

export type RequestDraft = { id: string; value: string; originalIndex: number };
type ProblemState = {
  requests: RequestDraft[];
  setRequests: (next: RequestDraft[] | ((current: RequestDraft[]) => RequestDraft[])) => void;
  target: string;
  setTarget: (value: string) => void;
  solution: SolveResponse | null;
  setSolution: (value: SolveResponse | null) => void;
};

const initialRequests = [5, 5, 10, 3, 7, 10].map((value, index) => ({ id: `request-${index + 1}`, value: String(value), originalIndex: index + 1 }));
const Context = createContext<ProblemState | null>(null);

export function ProblemProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<RequestDraft[]>(initialRequests);
  const [target, setTarget] = useState("10");
  const [solution, setSolution] = useState<SolveResponse | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fundwise-problem-v1");
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<{ requests: RequestDraft[]; target: string; solution: SolveResponse | null }>;
        if (Array.isArray(parsed.requests) && parsed.requests.length <= 22) setRequests(parsed.requests.map((request, index) => ({
          id: typeof request?.id === "string" ? request.id : `restored-${index + 1}`,
          value: typeof request?.value === "string" ? request.value : String(request?.value ?? ""),
          originalIndex: Number.isInteger(request?.originalIndex) && request.originalIndex > 0 ? request.originalIndex : index + 1,
        })));
        if (typeof parsed.target === "string") setTarget(parsed.target);
        if (parsed.solution && typeof parsed.solution.session_id === "string") setSolution(parsed.solution);
      }
    } catch {
      localStorage.removeItem("fundwise-problem-v1");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("fundwise-problem-v1", JSON.stringify({ requests, target, solution }));
  }, [requests, target, solution, hydrated]);

  const value = useMemo(() => ({ requests, setRequests, target, setTarget, solution, setSolution }), [requests, target, solution]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useProblem() {
  const value = useContext(Context);
  if (!value) throw new Error("useProblem must be used inside ProblemProvider");
  return value;
}
