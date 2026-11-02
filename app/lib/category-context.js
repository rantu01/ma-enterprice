"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

// Context to hold categories from both route and expense modules
// Provides global synchronization so category name changes propagate everywhere
const CategoryContext = createContext({
  routeCategories: [],
  expenseCategories: [],
  // Update a category main name by ID (updates MongoDB + state globally)
  updateRouteCategoryName: (id, newMainCategory, newSubCategories) => {},
  // Update a category main name by ID (updates MongoDB + state globally)
  updateExpenseCategoryName: (id, newMainCategory, newSubCategories) => {},
  resolveRouteCategoryName: (category, categoryId) => category || "—",
  resolveExpenseCategoryName: (category, categoryId) => category || "—",
  // Add a new category to MongoDB + state globally
  addRouteCategory: (mainCategory, subCategories) => {},
  // Add a new category to MongoDB + state globally
  addExpenseCategory: (mainCategory, subCategories) => {},
  // Delete a category from MongoDB + state globally
  deleteRouteCategory: (id) => {},
  // Delete a category from MongoDB + state globally
  deleteExpenseCategory: (id) => {},
});

// Get context value (must be used within CategoryProvider)
export function useCategories() {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error("useCategories must be used within CategoryProvider");
  }
  return context;
}

// Provider component that fetches and manages category state
export const CategoryProvider = ({ children }) => {
  // State holds the authoritative category lists
  const [routeCategories, setRouteCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);

  // Fetch categories from MongoDB on mount
  useEffect(() => {
    async function fetchInitial() {
      try {
        const [routeRes, expenseRes] = await Promise.all([
          fetch("/api/data?collection=routeCategories", { cache: "no-store" }),
          fetch("/api/data?collection=expenseCategories", { cache: "no-store" }),
        ]);

        if (routeRes.ok) {
          const data = await routeRes.json();
          setRouteCategories(data.data || []);
        }
        if (expenseRes.ok) {
          const data = await expenseRes.json();
          setExpenseCategories(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch initial categories:", error);
      }
    }
    fetchInitial();
  }, []);

  // Update a route category name - updates MongoDB + state globally
  const updateRouteCategoryName = async (id, newMainCategory, newSubCategories) => {
    try {
      const res = await fetch("/api/categories/rename", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "route", categoryId: id, newMainCategory }),
      });
      if (!res.ok) throw new Error("update failed");
      const data = await res.json();
      // Update state immediately so consumers see the change
      setRouteCategories((prev) =>
        prev.map((c) => (String(c.id) === String(id) ? { ...c, mainCategory: newMainCategory } : c))
      );
      return data.data;
    } catch (error) {
      console.error("Failed to update route category:", error);
      throw error;
    }
  };

  // Update an expense category name - updates MongoDB + state globally
  const updateExpenseCategoryName = async (id, newMainCategory, newSubCategories) => {
    try {
      const res = await fetch("/api/categories/rename", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "expense", categoryId: id, newMainCategory }),
      });
      if (!res.ok) throw new Error("update failed");
      const data = await res.json();
      // Update state immediately so consumers see the change
      setExpenseCategories((prev) =>
        prev.map((c) => (String(c.id) === String(id) ? { ...c, mainCategory: newMainCategory } : c))
      );
      return data.data;
    } catch (error) {
      console.error("Failed to update expense category:", error);
      throw error;
    }
  };

  const resolveCategoryName = (categories, category, categoryId) => {
    const byId = categoryId
      ? categories.find((item) => String(item.id) === String(categoryId))
      : null;
    if (byId) return byId.mainCategory;
    const normalized = String(category || "").trim().toLowerCase();
    const byName = categories.find((item) => String(item.mainCategory || "").trim().toLowerCase() === normalized);
    return byName?.mainCategory || category || "—";
  };

  const resolveRouteCategoryName = useCallback(
    (category, categoryId) => resolveCategoryName(routeCategories, category, categoryId),
    [routeCategories]
  );
  const resolveExpenseCategoryName = useCallback(
    (category, categoryId) => resolveCategoryName(expenseCategories, category, categoryId),
    [expenseCategories]
  );

  // Add a new route category - MongoDB + state
  const addRouteCategory = async (mainCategory, subCategories) => {
    try {
      const res = await fetch("/api/data?collection=routeCategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mainCategory, subCategories, order: routeCategories.length + 1 }),
      });
      if (!res.ok) throw new Error("create failed");
      const data = await res.json();
      setRouteCategories((prev) => [data.data, ...prev]);
      return data.data;
    } catch (error) {
      console.error("Failed to add route category:", error);
      throw error;
    }
  };

  // Add a new expense category - MongoDB + state
  const addExpenseCategory = async (mainCategory, subCategories) => {
    try {
      const res = await fetch("/api/data?collection=expenseCategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mainCategory, subCategories, order: expenseCategories.length + 1 }),
      });
      if (!res.ok) throw new Error("create failed");
      const data = await res.json();
      setExpenseCategories((prev) => [data.data, ...prev]);
      return data.data;
    } catch (error) {
      console.error("Failed to add expense category:", error);
      throw error;
    }
  };

  // Delete a route category - MongoDB + state
  const deleteRouteCategory = async (id) => {
    try {
      const res = await fetch(`/api/data?id=${id}&collection=routeCategories`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setRouteCategories((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (error) {
      console.error("Failed to delete route category:", error);
      throw error;
    }
  };

  // Delete an expense category - MongoDB + state
  const deleteExpenseCategory = async (id) => {
    try {
      const res = await fetch(`/api/data?id=${id}&collection=expenseCategories`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setExpenseCategories((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (error) {
      console.error("Failed to delete expense category:", error);
      throw error;
    }
  };

  return (
    <CategoryContext.Provider
      value={{
        routeCategories,
        expenseCategories,
        updateRouteCategoryName,
        updateExpenseCategoryName,
        resolveRouteCategoryName,
        resolveExpenseCategoryName,
        addRouteCategory,
        addExpenseCategory,
        deleteRouteCategory,
        deleteExpenseCategory,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};