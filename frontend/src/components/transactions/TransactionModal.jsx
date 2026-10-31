import { useState } from "react";
import { FiX } from "react-icons/fi";
import { useAppData } from "../../context/useAppData";
import { localDateString } from "../../utils/data";

const expenseMethods = ["Cash", "Bank", "Credit Card", "Debit Card", "Other"];
const incomeSources = ["Salary", "Freelancing", "Business", "Investment", "Gift", "Other"];
const blank = (type) => ({ type, title: "", amount: "", date: localDateString(), categoryId: "", method: type === "expense" ? "Debit Card" : "Bank", notes: "" });

export default function TransactionModal({ onClose, initialType = "expense", transaction = null }) {
  const { addTransaction, updateTransaction, categories, t } = useAppData();
  const [form, setForm] = useState(() => {
    const initial = transaction ? { ...transaction, amount: String(transaction.amount) } : blank(initialType);
    return { ...initial, categoryId: initial.categoryId || categories.find((category) => category.type === initial.type)?.id || "" };
  });
  const availableCategories = categories.filter((category) => category.type === form.type);
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(t("Enter an amount greater than zero."));
      return;
    }
    if (!form.title.trim() || !form.date || !form.categoryId || !form.method) {
      setError(t("Complete all required fields before saving."));
      return;
    }
    const selected = categories.find((category) => category.id === form.categoryId);
    const entry = { ...form, title: form.title.trim(), amount, category: selected?.name || "Uncategorized", categoryColor: selected?.color || "#96a4b7" };
    if (transaction) updateTransaction(transaction.id, entry); else addTransaction(entry);
    onClose();
  };
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="modal-card" onSubmit={submit}>
      <div className="modal-heading"><div><span className="eyebrow">{t(transaction ? "Update your records" : "Keep your finances in sync")}</span><h2>{t(transaction ? "Edit transaction" : "Add transaction")}</h2></div><button type="button" className="icon-button close-modal" onClick={onClose} aria-label={t("Close dialog")}><FiX/></button></div>
      <div className="type-switch"><button type="button" className={form.type === "expense" ? "active expense-active" : ""} onClick={() => setForm({ ...form, type: "expense", method: "Card", categoryId: categories.find((category) => category.type === "expense")?.id || "" })}>{t("Expense")}</button><button type="button" className={form.type === "income" ? "active income-active" : ""} onClick={() => setForm({ ...form, type: "income", method: "Bank transfer", categoryId: categories.find((category) => category.type === "income")?.id || "" })}>{t("Income")}</button></div>
      <label className="field-label">{t("Description")}<input autoFocus maxLength="80" placeholder={t("e.g. Weekly groceries")} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label>
      <div className="field-grid"><label className="field-label">{t("Amount")}<input type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required /></label><label className="field-label">{t("Date")}<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></label></div>
      <div className="field-grid"><label className="field-label">{t("Category")}<select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} required>{availableCategories.map((category) => <option value={category.id} key={category.id}>{t(category.name)}</option>)}</select></label><label className="field-label">{t(form.type === "expense" ? "Payment method" : "Income source")}<select value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })}>{(form.type === "expense" ? expenseMethods : incomeSources).map((method) => <option key={method}>{t(method)}</option>)}</select></label></div>
      <label className="field-label">{t("Notes")} <span className="optional-label">{t("Optional")}</span><textarea rows="2" placeholder={t("Add a note...")} value={form.notes || ""} onChange={(event) => setForm({ ...form, notes: event.target.value })}/></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-footer"><button type="button" className="button button-quiet" onClick={onClose}>{t("Cancel")}</button><button type="submit" className="button button-primary">{transaction ? t("Save changes") : t(form.type === "expense" ? "Add expense" : "Add income")}</button></div>
    </form>
  </div>;
}
