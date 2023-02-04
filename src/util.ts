import { useMemo } from "react";

export function cn(...args: Array<string | [string, boolean]>): string {
  return args
    .map((n) => (typeof n === "string" ? n : n[1] ? n[0] : null))
    .filter((n) => !!n)
    .join(" ");
}

export function range(from: number, to: number, step: number = 1) {
  const range: number[] = [];
  for (let i = from; i < to; i += step) {
    range.push(i);
  }
  return range;
}

export function setWith<T>(s: Set<T>, items: T[]): Set<T> {
  const ns = new Set(s);
  for (const item of items) {
    ns.add(item);
  }
  return ns;
}

export function setWithout<T>(s: Set<T>, items: T[]): Set<T> {
  const ns = new Set(s);
  for (const item of items) {
    ns.delete(item);
  }
  return ns;
}

export function useMapById<T>(list: T[], key: keyof T) {
  return useMemo(() => {
    const map: { [key: string]: T } = {};
    for (const item of list) {
      const k = item[key] as unknown as string;
      map[k] = item;
    }
    return map;
  }, [list]);
}
