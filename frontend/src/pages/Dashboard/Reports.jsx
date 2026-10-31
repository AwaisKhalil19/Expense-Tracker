import { useMemo, useState } from "react";
import { FiArrowDownLeft, FiArrowUpRight, FiDownload, FiTrendingUp } from "react-icons/fi";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppData } from "../../context/useAppData";
import { currentMonthKey, downloadCsv, formatDate, formatMoney, localDateString } from "../../utils/data";
import ChartTooltip from "../../components/common/ChartTooltip";
import { localeFor } from "../../utils/i18n";

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date, amount) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
const monthLabel = (key, language) => new Date(`${key}-15T12:00:00`).toLocaleDateString(localeFor(language), { month: "short", year: "2-digit" });

export default function Reports() {
  const { transactions, categories, settings, t } = useAppData();
  const [range, setRange] = useState("thisMonth");
  const [customStart, setCustomStart] = useState(localDateString(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [customEnd, setCustomEnd] = useState(localDateString());
  const today = startOfDay(new Date());
  const { from, to } = useMemo(() => {
    let start = new Date(today);
    let end = new Date(today);
    if (range === "thisWeek") {
      const weekDayIndex = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(settings.weekStartsOn);
      const weekStartsOn = weekDayIndex < 0 ? 1 : weekDayIndex;
      start = addDays(start, -((start.getDay() - weekStartsOn + 7) % 7));
    } else if (range === "lastMonth") {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (range === "last3Months") start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    else if (range === "thisYear") start = new Date(today.getFullYear(), 0, 1);
    else if (range === "custom") {
      start = customStart ? new Date(`${customStart}T12:00:00`) : start;
      end = customEnd ? new Date(`${customEnd}T12:00:00`) : end;
    } else if (range === "thisMonth") start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: startOfDay(start), to: startOfDay(end) };
  }, [range, customStart, customEnd, settings.weekStartsOn, today]);
  const fromKey = localDateString(from);
  const toKey = localDateString(to);
  const periodTransactions = useMemo(() => transactions.filter((item) => item.date >= fromKey && item.date <= toKey), [transactions, fromKey, toKey]);
  const expenses = periodTransactions.filter((item) => item.type === "expense");
  const income = periodTransactions.filter((item) => item.type === "income");
  const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const incomeTotal = income.reduce((sum, item) => sum + Number(item.amount), 0);
  const dayCount = Math.max(1, Math.floor((to - from) / 86400000) + 1);
  const averageDaily = expenseTotal / dayCount;
  const highestExpense = expenses.reduce((highest, item) => Number(item.amount) > Number(highest?.amount || 0) ? item : highest, null);
  const categoryTotals = new Map();
  for (const item of expenses) {
    const category = categories.find((entry) => entry.id === item.categoryId);
    const name = category?.name || item.category || "Uncategorized";
    const current = categoryTotals.get(name) || { name, value: 0, color: category?.color || item.categoryColor || "#96a4b7" };
    current.value += Number(item.amount);
    categoryTotals.set(name, current);
  }
  const categoryData = [...categoryTotals.values()].sort((a, b) => b.value - a.value);
  const days = useMemo(() => {
    const output = [];
    const first = new Date(`${fromKey}T12:00:00`);
    const last = new Date(`${toKey}T12:00:00`);
    for (let date = first; date <= last; date = addDays(date, 1)) {
      const key = localDateString(date);
      const amount = periodTransactions.filter((item) => item.type === "expense" && item.date === key).reduce((sum, item) => sum + Number(item.amount), 0);
      output.push({ date: key, label: date.toLocaleDateString(localeFor(settings.language), { month: "short", day: "numeric" }), amount });
    }
    return output;
  }, [fromKey, toKey, periodTransactions, settings.language]);
  const monthlyData = useMemo(() => {
    const months = [];
    const firstDate = new Date(`${fromKey}T12:00:00`);
    const lastDate = new Date(`${toKey}T12:00:00`);
    const cursor = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    const last = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);
    while (cursor <= last) {
      const key = currentMonthKey(cursor);
      const rows = periodTransactions.filter((item) => item.date.slice(0, 7) === key);
      months.push({
        month: monthLabel(key, settings.language),
        expenses: rows.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0),
        income: rows.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0),
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return months;
  }, [fromKey, toKey, periodTransactions, settings.language]);
  const exportCsv = () => downloadCsv(`finch-report-${fromKey}-to-${toKey}.csv`, ["Date", "Type", "Description", "Category", "Method / source", "Amount", "Notes"], periodTransactions.map((item) => [item.date, item.type, item.title, item.category, item.method, item.amount, item.notes || ""]));
  const noData = (label) => <div className="chart-empty"><span className="chart-empty-icon"><FiTrendingUp/></span><b>{t(`No ${label} in this period`)}</b><p>{t("Choose another date range or add a transaction to see insights.")}</p></div>;
  return <div className="page-stack">
    <div className="page-title-row"><div><p className="eyebrow">{t("The bigger picture")}</p><h1>{t("Reports")}</h1><p className="page-description">{t("Explore your financial activity over a date range.")}</p></div><div className="title-actions"><select className="range-select" value={range} onChange={(event) => setRange(event.target.value)} aria-label={t("Report date range")}><option value="thisWeek">{t("This week")}</option><option value="thisMonth">{t("This month")}</option><option value="lastMonth">{t("Last month")}</option><option value="last3Months">{t("Last 3 months")}</option><option value="thisYear">{t("This year")}</option><option value="custom">{t("Custom range")}</option></select><button className="button button-secondary" onClick={exportCsv}><FiDownload/> {t("Export CSV")}</button></div></div>
    {range === "custom" && <div className="custom-date-range"><label className="field-label">{t("From")}<input type="date" value={customStart} max={customEnd || undefined} onChange={(event) => setCustomStart(event.target.value)}/></label><label className="field-label">{t("To")}<input type="date" value={customEnd} min={customStart || undefined} onChange={(event) => setCustomEnd(event.target.value)}/></label></div>}
    <p className="report-period-label">{formatDate(fromKey, undefined, localeFor(settings.language))} – {formatDate(toKey, undefined, localeFor(settings.language))}</p>
    <div className="report-stats">
      <article className="surface report-stat"><span className="summary-icon green"><FiArrowDownLeft/></span><p>{t("Total income")}</p><b>{formatMoney(incomeTotal, settings.currency)}</b></article>
      <article className="surface report-stat"><span className="summary-icon orange"><FiArrowUpRight/></span><p>{t("Total expenses")}</p><b>{formatMoney(expenseTotal, settings.currency)}</b></article>
      <article className="surface report-stat"><span className="summary-icon blue"><FiTrendingUp/></span><p>{t("Net balance")}</p><b className={incomeTotal - expenseTotal < 0 ? "negative-value" : ""}>{formatMoney(incomeTotal - expenseTotal, settings.currency)}</b></article>
      <article className="surface report-stat"><span className="summary-icon purple"><FiTrendingUp/></span><p>{t("Average daily spend")}</p><b>{formatMoney(averageDaily, settings.currency)}</b></article>
      <article className="surface report-stat"><span className="summary-icon orange"><FiArrowUpRight/></span><p>{t("Highest expense")}</p><b>{highestExpense ? formatMoney(highestExpense.amount, settings.currency) : formatMoney(0, settings.currency)}</b><small>{highestExpense?.title || t("No expenses")}</small></article>
      <article className="surface report-stat"><span className="summary-icon green"><FiTrendingUp/></span><p>{t("Top spending category")}</p><b className="report-category-value">{categoryData[0]?.name || "—"}</b><small>{categoryData[0] ? formatMoney(categoryData[0].value, settings.currency) : t("No expenses")}</small></article>
    </div>
    <div className="report-grid">
      <section className="surface chart-panel report-chart"><div className="surface-heading"><div><h2>{t("Income vs expenses")}</h2><p>{t("Monthly comparison for selected range")}</p></div></div><div className="report-chart-area">{periodTransactions.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyData} margin={{ top: 16, right: 12, left: -18, bottom: 0 }}><CartesianGrid vertical={false} stroke="#edf0f5"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a0b1", fontSize: 12 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a0b1", fontSize: 11 }} tickFormatter={(value) => formatMoney(value, settings.currency, true)}/><Tooltip content={<ChartTooltip currency={settings.currency} t={t}/>} /><Bar dataKey="income" name={t("Income")} fill="#58ad88" radius={[4, 4, 0, 0]} maxBarSize={26}/><Bar dataKey="expenses" name={t("Expenses")} fill="#7187e8" radius={[4, 4, 0, 0]} maxBarSize={26}/></BarChart></ResponsiveContainer> : noData("cash flow")}</div></section>
      <section className="surface chart-panel report-chart"><div className="surface-heading"><div><h2>{t("Expenses by category")}</h2><p>{t("Selected date range")}</p></div></div>{categoryData.length ? <div className="report-donut"><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={63} outerRadius={92} paddingAngle={3} stroke="none">{categoryData.map((item, index) => <Cell key={item.name} fill={item.color || ["#6379dc", "#58ad88", "#ed9a6a", "#a17bd1"][index % 4]}/>)}</Pie><Tooltip content={<ChartTooltip currency={settings.currency} t={t}/>} /></PieChart></ResponsiveContainer><div className="legend-list">{categoryData.slice(0, 6).map((item) => <div className="legend-item" key={item.name}><span><i style={{ background: item.color }}/>{t(item.name)}</span><b>{formatMoney(item.value, settings.currency)}</b></div>)}</div></div> : noData("spending")}</section>
      <section className="surface chart-panel report-chart"><div className="surface-heading"><div><h2>{t("Monthly expense trend")}</h2><p>{t("Spending by month")}</p></div></div><div className="report-chart-area">{expenses.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={monthlyData} margin={{ top: 16, right: 12, left: -18, bottom: 0 }}><defs><linearGradient id="reportExpenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ed9a6a" stopOpacity={0.25}/><stop offset="95%" stopColor="#ed9a6a" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf0f5"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a0b1", fontSize: 12 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a0b1", fontSize: 11 }} tickFormatter={(value) => formatMoney(value, settings.currency, true)}/><Tooltip content={<ChartTooltip currency={settings.currency} t={t}/>} /><Area type="monotone" dataKey="expenses" name={t("Expenses")} stroke="#ed9a6a" strokeWidth={2.5} fill="url(#reportExpenseFill)"/></AreaChart></ResponsiveContainer> : noData("expenses")}</div></section>
      <section className="surface chart-panel report-chart"><div className="surface-heading"><div><h2>{t("Daily expense trend")}</h2><p>{t("Daily spend across selected range")}</p></div></div><div className="report-chart-area">{expenses.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={days} margin={{ top: 16, right: 12, left: -18, bottom: 0 }}><defs><linearGradient id="dailyExpenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7187e8" stopOpacity={0.25}/><stop offset="95%" stopColor="#7187e8" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf0f5"/><XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={24} tick={{ fill: "#94a0b1", fontSize: 11 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a0b1", fontSize: 11 }} tickFormatter={(value) => formatMoney(value, settings.currency, true)}/><Tooltip content={<ChartTooltip currency={settings.currency} t={t}/>} /><Area type="monotone" dataKey="amount" name={t("Expenses")} stroke="#7187e8" strokeWidth={2.5} fill="url(#dailyExpenseFill)"/></AreaChart></ResponsiveContainer> : noData("expenses")}</div></section>
    </div>
  </div>;
}
