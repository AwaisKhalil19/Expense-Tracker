import { useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { FiArrowDownLeft, FiArrowRight, FiArrowUpRight, FiCreditCard, FiTrendingUp } from "react-icons/fi";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppData } from "../../context/useAppData";
import { formatMoney, currentMonthKey, localDateString } from "../../utils/data";
import TransactionTable from "../../components/transactions/TransactionTable";
import ChartTooltip from "../../components/common/ChartTooltip";
import { localeFor } from "../../utils/i18n";

const CHART_COLORS = ["#6379dc", "#55a786", "#f1a06e", "#a17bd1", "#e1789a", "#58a6b2", "#e2ba5e", "#91a0b4"];
const toMonthKey = (date) => date.slice(0, 7);
const monthName = (date, language) => new Date(`${date}-15T12:00:00`).toLocaleDateString(localeFor(language), { month: "short" });

function EmptyChart({ children, title, description }) {
  return <div className="chart-area">{children ? children : <div className="chart-empty"><span className="chart-empty-icon"><FiTrendingUp/></span><b>{title}</b><p>{description}</p></div>}</div>;
}

export default function Home() {
  const { transactions, budgets, categories, settings, t } = useAppData();
  const { openTransaction } = useOutletContext();
  const month = currentMonthKey();
  const monthTransactions = transactions.filter((item) => toMonthKey(item.date || "") === month);
  const totalIncome = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
  const totalExpenses = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
  const monthExpenses = monthTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
  const monthBudget = budgets.filter((item) => !item.month || item.month === month).reduce((sum, item) => sum + Number(item.amount), 0);
  const remainingBudget = monthBudget - monthExpenses;
  const last7Days = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() - 6 + index);
    const dateKey = localDateString(date);
    return { date: dateKey, label: date.toLocaleDateString(localeFor(settings.language), { weekday: "short" }), amount: transactions.filter((item) => item.type === "expense" && item.date === dateKey).reduce((sum, item) => sum + Number(item.amount), 0) };
  }), [transactions, settings.language]);
  const sixMonths = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const date = new Date(); date.setDate(15); date.setMonth(date.getMonth() - 5 + index);
    const key = currentMonthKey(date);
    const rows = transactions.filter((item) => toMonthKey(item.date || "") === key);
    return { month: monthName(key, settings.language), expenses: rows.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0), income: rows.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0) };
  }), [transactions, settings.language]);
  const byCategory = useMemo(() => {
    const totals = new Map();
    monthTransactions.filter((item) => item.type === "expense").forEach((item) => {
      const category = categories.find((entry) => entry.id === item.categoryId);
      const name = category?.name || item.category || "Uncategorized";
      const current = totals.get(name) || { name, value: 0, color: category?.color || item.categoryColor || "#96a4b7" };
      current.value += Number(item.amount);
      totals.set(name, current);
    });
    return [...totals.values()].sort((a, b) => b.value - a.value);
  }, [categories, monthTransactions]);
  const cards = [
    { label: t("Total income"), value: totalIncome, when: t("All time"), icon: FiArrowDownLeft, tone: "green" },
    { label: t("Total expenses"), value: totalExpenses, when: t("All time"), icon: FiArrowUpRight, tone: "orange" },
    { label: t("Current balance"), value: totalIncome - totalExpenses, when: t("All time"), icon: FiCreditCard, tone: "blue" },
    { label: t("Monthly budget"), value: monthBudget, when: t("This month"), icon: FiCreditCard, tone: "purple" },
    { label: t("Remaining budget"), value: remainingBudget, when: monthBudget ? t("This month") : t("No budget set"), icon: FiArrowRight, tone: remainingBudget < 0 ? "orange" : "green" },
  ];
  const dateLabel = new Date().toLocaleDateString(localeFor(settings.language), { weekday: "long", month: "long", day: "numeric" });
  const firstName = (typeof settings.name === "string" ? settings.name.trim().split(/\s+/)[0] : "") || "there";
  const recent = transactions.slice().sort((a, b) => `${b.date}${b.createdAt || ""}`.localeCompare(`${a.date}${a.createdAt || ""}`)).slice(0, 5);
  return <div className="page-stack dashboard-page">
    <div className="welcome-row"><div><p className="eyebrow">{dateLabel}</p><h1>{t("Good day,")} {firstName}</h1><p className="page-description">{t("Here’s how your finances are looking this month.")}</p></div><button className="button button-primary" onClick={openTransaction}><FiArrowUpRight/> {t("Add expense")}</button></div>
    <div className="summary-grid">{cards.map(({ label, value, when, icon: Icon, tone }) => <article className="summary-card" key={label}><div className="summary-top"><span className={`summary-icon ${tone}`}><Icon/></span><span>{when}</span></div><h2>{label}</h2><strong className={label === "Remaining budget" && value < 0 ? "negative-value" : ""}>{formatMoney(value, settings.currency)}</strong></article>)}</div>
    <div className="dashboard-charts">
      <section className="surface chart-panel"><div className="surface-heading"><div><h2>{t("Daily expenses")}</h2><p>{t("Spending over the last 7 days")}</p></div><span className="heading-icon"><FiArrowUpRight/></span></div><EmptyChart title={t("No expenses this week")} description={t("Add an expense to start seeing your daily spending.")}>{transactions.some((item) => item.type === "expense" && last7Days.some((day) => day.date === item.date)) && <ResponsiveContainer width="100%" height="100%"><BarChart data={last7Days} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}><CartesianGrid vertical={false} stroke="#edf0f5"/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#94a0b1", fontSize: 12 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a0b1", fontSize: 11 }} tickFormatter={(value) => formatMoney(value, settings.currency, true)}/>      <Tooltip content={<ChartTooltip currency={settings.currency} t={t}/>} cursor={{ fill: "#f5f7fb" }}/><Bar dataKey="amount" name={t("Expenses")} fill="#6379dc" radius={[5, 5, 0, 0]} maxBarSize={26}/></BarChart></ResponsiveContainer>}</EmptyChart></section>
      <section className="surface chart-panel"><div className="surface-heading"><div><h2>{t("Expenses by category")}</h2><p>{t("This month")}</p></div><span className="heading-icon violet"><FiTrendingUp/></span></div><EmptyChart title={t("No category data yet")} description={t("Your monthly category breakdown will appear here.")}>{byCategory.length > 0 && <div className="donut-layout"><ResponsiveContainer width="52%" height="100%"><PieChart><Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={61} outerRadius={86} paddingAngle={3} stroke="none">{byCategory.map((item, index) => <Cell key={item.name} fill={item.color || CHART_COLORS[index % CHART_COLORS.length]}/>)}</Pie><Tooltip content={<ChartTooltip currency={settings.currency}/>} /></PieChart></ResponsiveContainer><div className="legend-list">{byCategory.slice(0, 5).map((item) => <div className="legend-item" key={item.name}><span><i style={{ background: item.color }}/>{item.name}</span><b>{formatMoney(item.value, settings.currency, true)}</b></div>)}</div></div>}</EmptyChart></section>
      <section className="surface chart-panel"><div className="surface-heading"><div><h2>{t("Monthly expenses")}</h2><p>{t("Six-month spending trend")}</p></div><span className="heading-icon orange"><FiTrendingUp/></span></div><EmptyChart title={t("No expense history")} description={t("Your monthly spending trend will appear here.")}>{transactions.some((item) => item.type === "expense") && <ResponsiveContainer width="100%" height="100%"><AreaChart data={sixMonths} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}><defs><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ed9a6a" stopOpacity={0.25}/><stop offset="95%" stopColor="#ed9a6a" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf0f5"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a0b1", fontSize: 12 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a0b1", fontSize: 11 }} tickFormatter={(value) => formatMoney(value, settings.currency, true)}/><Tooltip content={<ChartTooltip currency={settings.currency} t={t}/>} /><Area type="monotone" dataKey="expenses" name={t("Expenses")} stroke="#ed9a6a" strokeWidth={2.5} fill="url(#expenseFill)"/></AreaChart></ResponsiveContainer>}</EmptyChart></section>
      <section className="surface chart-panel"><div className="surface-heading"><div><h2>{t("Income vs expenses")}</h2><p>{t("Six-month comparison")}</p></div><span className="heading-icon green"><FiArrowDownLeft/></span></div><EmptyChart title={t("No comparison data yet")} description={t("Add income and expenses to compare your cash flow.")}>{transactions.length > 0 && <ResponsiveContainer width="100%" height="100%"><BarChart data={sixMonths} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}><CartesianGrid vertical={false} stroke="#edf0f5"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a0b1", fontSize: 12 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a0b1", fontSize: 11 }} tickFormatter={(value) => formatMoney(value, settings.currency, true)}/><Tooltip content={<ChartTooltip currency={settings.currency} t={t}/>} /><Bar dataKey="income" name={t("Income")} fill="#58ad88" radius={[4, 4, 0, 0]} maxBarSize={26}/><Bar dataKey="expenses" name={t("Expenses")} fill="#7187e8" radius={[4, 4, 0, 0]} maxBarSize={26}/></BarChart></ResponsiveContainer>}</EmptyChart></section>
    </div>
    <section className="surface recent-surface"><div className="surface-heading"><div><h2>{t("Recent transactions")}</h2><p>{t("Your latest income and spending")}</p></div><Link className="text-link" to="/transactions">{t("View all")} <FiArrowRight/></Link></div><TransactionTable transactions={recent} emptyTitle={t("Your story starts here")} emptyText={t("Add your first transaction to see it in your dashboard.")}/></section>
  </div>;
}
