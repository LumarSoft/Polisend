"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  applySteps,
  type ChatScenario,
  type ChatState,
} from "@/components/chat/types";

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCE_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCE_QUERY).matches,
    () => false,
  );
}

/** True while the element is on screen — used to pause offscreen loops. */
export function useInView<T extends Element>(rootMargin = "0px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return [ref, inView] as const;
}

/** Counter that cycles 0..length-1 every `ms` while active (frozen at the end for reduced motion). */
export function useTicker(length: number, ms: number, active: boolean) {
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active || reduce) return;
    const id = window.setInterval(() => setTick((t) => (t + 1) % length), ms);
    return () => window.clearInterval(id);
  }, [length, ms, active, reduce]);
  return reduce ? length - 1 : tick;
}

/**
 * Plays chat scenarios step by step on a timer and loops through them. With
 * reduced motion it shows the first scenario already finished.
 */
export function useChatPlayer(
  scenarios: ChatScenario[],
  active: boolean,
): { state: ChatState; scenario: ChatScenario; index: number } {
  const reduce = useReducedMotion();
  const [pos, setPos] = useState({ s: 0, n: 0 });

  useEffect(() => {
    if (!active || reduce) return;
    const scenario = scenarios[pos.s];
    const done = pos.n >= scenario.steps.length;
    const wait = done
      ? (scenario.hold ?? 3500)
      : (scenario.steps[pos.n].delay ?? 900);
    const timer = window.setTimeout(() => {
      setPos((p) =>
        done
          ? { s: (p.s + 1) % scenarios.length, n: 0 }
          : { s: p.s, n: p.n + 1 },
      );
    }, wait);
    return () => window.clearTimeout(timer);
  }, [pos, active, reduce, scenarios]);

  const s = reduce ? 0 : pos.s;
  const n = reduce ? scenarios[0].steps.length : pos.n;
  const state = useMemo(
    () => applySteps(scenarios[s].steps, n, scenarios[s].clock),
    [scenarios, s, n],
  );
  return { state, scenario: scenarios[s], index: s };
}
