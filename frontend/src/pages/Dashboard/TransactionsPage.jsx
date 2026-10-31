import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { FiArrowDownLeft, FiArrowUpRight, FiSearch } from "react-icons/fi";
import TransactionTable from "../../components/transactions/TransactionTable";
import { useAppData } from "../../context/useAppData";
import { formatMoney } from "../../utils/data";

export default function TransactionsPage({ type }) {
  const { transactions, categories, settings, t } = useAppData();
  const { openTransaction } = useOutletContext();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(10);
  const filtered = useMemo(() => transactions.filter((item) => {
    if (type !== "all" && item.type !== type) return false;
    if (query && !`${item.title} ${item.category} ${item.method} ${item.notes || ""}`.toLowerCase().includes(query.trim().toLowerCase())) return false;
    if (categoryFilter !== "all" && (type === "income" ? item.method !== categoryFilter : item.categoryId !== categoryFilter)) return false;
    if (methodFilter !== "all" && item.method !== methodFilter) return false;
    if (startDate && item.date < startDate) return false;
    if (endDate && item.date > endDate) return false;
    return true;
  }).sort((a, b) => {
    if (sort === "oldest") return `${a.date}${a.createdAt || ""}`.localeCompare(`${b.date}${b.createdAt || ""}`);
    if (sort === "highest") return Number(b.amount) - Number(a.amount);
    if (sort === "lowest") return Number(a.amount) - Number(b.amount);
    return `${b.date}${b.createdAt || ""}`.localeCompare(`${a.date}${a.createdAt || ""}`);
  }), [transactions, type, query, categoryFilter, methodFilter, startDate, endDate, sort]);
  const total = filtered.reduce((sum, item) => sum + Number(item.amount), 0);
  const visible = filtered.slice(0, visibleCount);
  const Icon = type === "income" ? FiArrowDownLeft : FiArrowUpRight;
  const title = type === "income" ? "Income" : type === "all" ? "Transactions" : "Expenses";
  const translatedTitle = t(title);
  const methods = [...new Set(transactions.filter((item) => type === "all" || item.type === type).map((item) => item.method).filter(Boolean))].sort();
  const categoriesForType = categories.filter((item) => type === "all" || item.type === type);
  return <div className="page-stack">
    <div className="page-title-row"><div><p className="eyebrow">{t("Your money, in focus")}</p><h1>{translatedTitle}</h1><p className="page-description">{type === "income" ? t("Track, review, and manage your earnings in one place.") : t("Track, review, and manage your spending in one place.")}</p></div><button className="button button-primary" onClick={() => openTransaction(type)}><Icon/> {t(type === "income" ? "Add income" : "Add expense")}</button></div>
    <div className="stat-strip"><div><span>{t("Total")} {translatedTitle.toLowerCase()}</span><b>{formatMoney(total, settings.currency)}</b></div><div><span>{t("Transactions")}</span><b>{filtered.length}</b></div><div><span>{t("Categories used")}</span><b>{new Set(filtered.map((item) => item.categoryId)).size}</b></div></div>
    <section className="surface table-surface"><div className="surface-heading"><div><h2>{t("All")} {translatedTitle.toLowerCase()}</h2><p>{filtered.length} {t("records")}</p></div><div className="table-filters">
      <label className="search-field"><FiSearch/><input aria-label={`${t("Search")} ${translatedTitle.toLowerCase()}`} placeholder={t("Search transactions")} value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(10); }}/></label>
      <select aria-label={t(type === "income" ? "Filter by source" : "Filter by category")} value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setVisibleCount(10); }}><option value="all">{t(type === "income" ? "All sources" : "All categories")}</option>{type === "income" ? methods.map((method) => <option value={method} key={method}>{t(method)}</option>) : categoriesForType.map((item) => <option value={item.id} key={item.id}>{t(item.name)}</option>)}</select>
      {type !== "income" && <select aria-label={t(type === "all" ? "Filter by method or source" : "Filter by payment method")} value={methodFilter} onChange={(event) => { setMethodFilter(event.target.value); setVisibleCount(10); }}><option value="all">{t(type === "all" ? "All methods / sources" : "All payment methods")}</option>{methods.map((method) => <option value={method} key={method}>{t(method)}</option>)}</select>}
      <input aria-label={t("Start date")} type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setVisibleCount(10); }}/>
      <input aria-label={t("End date")} type="date" value={endDate} min={startDate || undefined} onChange={(event) => { setEndDate(event.target.value); setVisibleCount(10); }}/>
      <select aria-label={t("Sort transactions")} value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">{t("Newest first")}</option><option value="oldest">{t("Oldest first")}</option><option value="highest">{t("Highest amount")}</option><option value="lowest">{t("Lowest amount")}</option></select>
    </div></div><TransactionTable transactions={visible} emptyTitle={query || categoryFilter !== "all" || methodFilter !== "all" || startDate || endDate ? t("No matching transactions") : t(type === "income" ? "No income yet" : "No expenses yet")} emptyText={t("Add a transaction to start building your financial history.")}/>
    {filtered.length > visible.length && <div className="load-more-row"><button type="button" className="button button-secondary" onClick={() => setVisibleCount((count) => count + 10)}>{t("Load more")} ({filtered.length - visible.length} {t("remaining")})</button></div>}</section>
  </div>;
}
