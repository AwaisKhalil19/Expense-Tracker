import { useEffect, useState } from "react";
import { AppDataContext } from "./appDataStore";
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS, STORAGE_KEYS, createId, readStorage, saveStorage } from "../utils/data";
import { translate } from "../utils/i18n";
import { useAuth } from "./useAuth";

export function AppDataProvider({ children }) {
  const { user } = useAuth();
  const scopedKeys = Object.fromEntries(Object.entries(STORAGE_KEYS).map(([key, value]) => [key, `${value}.${user.id}`]));
  const [transactions, setTransactions] = useState(() => {
    const stored = readStorage(scopedKeys.transactions, []);
    return Array.isArray(stored) ? stored : [];
  });
  const [budgets, setBudgets] = useState(() => {
    const stored = readStorage(scopedKeys.budgets, []);
    return Array.isArray(stored) ? stored : [];
  });
  const [categories, setCategories] = useState(() => {
    const raw = readStorage(scopedKeys.categories, DEFAULT_CATEGORIES);
    let stored = Array.isArray(raw) ? raw : DEFAULT_CATEGORIES;
    if (!readStorage(scopedKeys.categoryDefaultsRevision, false)) {
      const knownIds = new Set(stored.map((category) => category.id));
      stored = [...stored, ...DEFAULT_CATEGORIES.filter((category) => !knownIds.has(category.id))];
      saveStorage(scopedKeys.categories, stored);
      saveStorage(scopedKeys.categoryDefaultsRevision, true);
    }
    return stored;
  });
  const [settings, setSettings] = useState(() => {
    const raw = readStorage(scopedKeys.settings, {});
    const saved = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      name: saved.name === "Alex Morgan" || typeof saved.name !== "string" ? user.name : saved.name,
      email: saved.email === "alex@example.com" || typeof saved.email !== "string" ? user.email : saved.email,
    };
  });

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme === "dark" ? "dark" : "light";
  }, [settings.theme]);

  useEffect(() => {
    const language = settings.language || "en";
    document.documentElement.lang = language;
    document.documentElement.dir = ["ar", "ur"].includes(language) ? "rtl" : "ltr";
  }, [settings.language]);

  useEffect(() => {
    const stored = readStorage(STORAGE_KEYS.settings, {});
    if (stored.name === "Alex Morgan" || stored.email === "alex@example.com") {
      saveStorage(STORAGE_KEYS.settings, {
        ...stored,
        name: stored.name === "Alex Morgan" ? "" : stored.name,
        email: stored.email === "alex@example.com" ? "" : stored.email,
      });
    }
  }, []);

  const persist = (setter, key, value) => {
    setter(value);
    saveStorage(key, value);
  };

  const addTransaction = (entry) => {
    const next = [{ ...entry, id: createId(), amount: Number(entry.amount), createdAt: new Date().toISOString() }, ...transactions];
    persist(setTransactions, scopedKeys.transactions, next);
  };
  const updateTransaction = (id, changes) => persist(setTransactions, scopedKeys.transactions, transactions.map((item) => item.id === id ? { ...item, ...changes, amount: Number(changes.amount ?? item.amount), updatedAt: new Date().toISOString() } : item));
  const deleteTransaction = (id) => persist(setTransactions, scopedKeys.transactions, transactions.filter((item) => item.id !== id));
  const saveBudget = (budget) => {
    const duplicate = budgets.find((item) => item.month === budget.month && item.categoryId === (budget.categoryId || "") && item.id !== budget.id);
    const next = budget.id
      ? budgets.map((item) => item.id === budget.id ? { ...item, ...budget, amount: Number(budget.amount) } : item)
      : duplicate
        ? budgets.map((item) => item.id === duplicate.id ? { ...item, ...budget, id: duplicate.id, amount: Number(budget.amount) } : item)
        : [...budgets, { ...budget, id: createId(), amount: Number(budget.amount) }];
    persist(setBudgets, scopedKeys.budgets, next);
  };
  const deleteBudget = (id) => persist(setBudgets, scopedKeys.budgets, budgets.filter((item) => item.id !== id));
  const saveCategory = (category) => {
    const next = category.id ? categories.map((item) => item.id === category.id ? { ...item, ...category } : item) : [...categories, { ...category, id: createId() }];
    persist(setCategories, scopedKeys.categories, next);
  };
  const deleteCategory = (id) => persist(setCategories, scopedKeys.categories, categories.filter((item) => item.id !== id));
  const updateSettings = (changes) => {
    const next = { ...settings, ...changes };
    if (next.name === "Alex Morgan") next.name = "";
    if (next.email === "alex@example.com") next.email = "";
    persist(setSettings, scopedKeys.settings, next);
  };
  const clearAllData = () => {
    persist(setTransactions, scopedKeys.transactions, []);
    persist(setBudgets, scopedKeys.budgets, []);
    persist(setCategories, scopedKeys.categories, DEFAULT_CATEGORIES);
  };

  const importData = (data) => {
    if (!data || !Array.isArray(data.transactions) || !Array.isArray(data.budgets) || !Array.isArray(data.categories)) throw new Error("This file is not a valid Finch backup.");
    const hasUniqueIds = (items) => new Set(items.map((item) => item.id)).size === items.length;
    if (!hasUniqueIds(data.transactions) || !hasUniqueIds(data.budgets) || !hasUniqueIds(data.categories)) throw new Error("The backup contains duplicate record IDs.");
    if (data.transactions.some((item) => !item?.id || !["expense", "income"].includes(item.type) || !Number.isFinite(Number(item.amount)) || Number(item.amount) <= 0)) throw new Error("The backup contains an invalid transaction.");
    if (data.budgets.some((item) => !item?.id || !Number.isFinite(Number(item.amount)) || Number(item.amount) <= 0)) throw new Error("The backup contains an invalid budget.");
    if (data.categories.some((item) => !item?.id || !item.name || !["expense", "income"].includes(item.type))) throw new Error("The backup contains an invalid category.");
    if (data.settings !== undefined && (!data.settings || typeof data.settings !== "object" || Array.isArray(data.settings))) throw new Error("The backup contains invalid settings.");
    persist(setTransactions, scopedKeys.transactions, data.transactions);
    persist(setBudgets, scopedKeys.budgets, data.budgets);
    persist(setCategories, scopedKeys.categories, data.categories);
    if (data.settings) updateSettings(data.settings);
  };

  const value = { transactions, budgets, categories, settings, t: (text) => translate(text, settings.language), addTransaction, updateTransaction, deleteTransaction, saveBudget, deleteBudget, saveCategory, deleteCategory, updateSettings, clearAllData, importData };
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
