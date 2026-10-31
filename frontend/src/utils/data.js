export const STORAGE_KEYS = {
  transactions: "finch.transactions.v1",
  budgets: "finch.budgets.v1",
  categories: "finch.categories.v1",
  settings: "finch.settings.v1",
  categoryDefaultsRevision: "finch.category-defaults.v2",
};

export const DEFAULT_CATEGORIES = [
  { id: "food", name: "Food & dining", type: "expense", color: "#f39b72", icon: "food" },
  { id: "transport", name: "Transport", type: "expense", color: "#7187e8", icon: "transport" },
  { id: "home", name: "Housing", type: "expense", color: "#9a7bd2", icon: "home" },
  { id: "shopping", name: "Shopping", type: "expense", color: "#e7789c", icon: "shopping" },
  { id: "bills", name: "Bills", type: "expense", color: "#e7ba5a", icon: "home" },
  { id: "health", name: "Health", type: "expense", color: "#60ae8c", icon: "health" },
  { id: "education", name: "Education", type: "expense", color: "#e7ba5a", icon: "education" },
  { id: "entertainment", name: "Entertainment", type: "expense", color: "#52a8b4", icon: "entertainment" },
  { id: "travel", name: "Travel", type: "expense", color: "#52a8b4", icon: "transport" },
  { id: "other", name: "Other", type: "expense", color: "#96a4b7", icon: "other" },
  { id: "salary", name: "Salary", type: "income", color: "#56aa83", icon: "income" },
  { id: "freelance", name: "Freelance", type: "income", color: "#7187e8", icon: "income" },
  { id: "business", name: "Business", type: "income", color: "#52a8b4", icon: "income" },
  { id: "investment", name: "Investment", type: "income", color: "#9a7bd2", icon: "income" },
  { id: "gift", name: "Gift", type: "income", color: "#e7789c", icon: "income" },
  { id: "other-income", name: "Other income", type: "income", color: "#96a4b7", icon: "income" },
];

export const DEFAULT_SETTINGS = { currency: "USD", name: "", email: "", weekStartsOn: "Monday", language: "en", theme: "light" };
export const readStorage = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};
export const saveStorage = (key, value) => localStorage.setItem(key, JSON.stringify(value));
export const createId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const formatMoney = (value, currency = "USD", compact = false) => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, notation: compact ? "compact" : "standard", maximumFractionDigits: compact ? 1 : 2 }).format(Number(value) || 0);
  } catch {
    return `${currency} ${(Number(value) || 0).toFixed(2)}`;
  }
};
export const formatDate = (value, options = { month: "short", day: "numeric", year: "numeric" }, locale = ({ en: "en-US", fr: "fr-FR", es: "es-ES", ur: "ur-PK", ar: "ar-SA" })[globalThis.document?.documentElement?.lang] || undefined) => {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(locale, options);
};
export const localDateString = (date = new Date()) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 10);
};
export const currentMonthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export const downloadCsv = (filename, headers, records) => {
  const rows = [headers, ...records];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
