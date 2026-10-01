"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Employee department options, loaded from the `departments` collection so the
 * list is managed on /employee-management/departments instead of being hardcoded.
 * Returns Select-ready options: [{ value, label }].
 */
export default function useDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/data?collection=departments", { cache: "no-store" });
      if (!res.ok) throw new Error("failed");
      setDepartments((await res.json()).data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function fetchDepartments() {
      setError(false);
      try {
        const res = await fetch("/api/data?collection=departments", { cache: "no-store" });
        if (!res.ok) throw new Error("failed");
        setDepartments((await res.json()).data || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchDepartments();
  }, []);

  const options = departments
    .map((d) => ({ value: d.name, label: d.name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return { departments, options, loading, error, reload: load };
}