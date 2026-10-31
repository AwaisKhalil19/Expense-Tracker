import { useState } from "react";
import { FiArrowDownLeft, FiBookOpen, FiCoffee, FiFilm, FiHeart, FiHome, FiMoreHorizontal, FiShoppingBag, FiTruck } from "react-icons/fi";
import { formatDate, formatMoney } from "../../utils/data";
import { useAppData } from "../../context/useAppData";
import TransactionModal from "./TransactionModal";
import { localeFor } from "../../utils/i18n";

const categoryIcons = { food: FiCoffee, transport: FiTruck, home: FiHome, shopping: FiShoppingBag, health: FiHeart, education: FiBookOpen, entertainment: FiFilm, income: FiArrowDownLeft };

export default function TransactionTable({ transactions, emptyTitle = "No transactions yet", emptyText = "Your activity will show up here once you add a transaction." }) {
  const { settings, deleteTransaction, categories, t } = useAppData();
  const [editing, setEditing] = useState(null);
  const [menu, setMenu] = useState(null);
  if (!transactions.length) return <div className="table-empty"><span className="empty-symbol"><FiShoppingBag/></span><h3>{emptyTitle}</h3><p>{emptyText}</p></div>;
  return <>
    <div className="table-scroll"><table className="data-table"><thead><tr><th>{t("Transaction")}</th><th>{t("Category")}</th><th>{t("Date")}</th><th>{t("Method / source")}</th><th className="amount-column">{t("Amount")}</th><th aria-label={t("Actions")}/></tr></thead><tbody>{transactions.map((item) => {
      const category = categories.find((entry) => entry.id === item.categoryId);
      const color = item.categoryColor || category?.color || "#7c8aa0";
      const CategoryIcon = categoryIcons[category?.icon] || (item.type === "income" ? FiArrowDownLeft : FiShoppingBag);
      return <tr key={item.id}><td><div className="transaction-title-cell"><span className="transaction-icon" style={{ color, background: `${color}18` }}><CategoryIcon/></span><span><b>{item.title}</b>{item.notes && <small>{item.notes}</small>}</span></div></td><td><span className="category-pill"><i style={{ background: color }}/>{item.category || category?.name || t("Uncategorized")}</span></td><td>{formatDate(item.date, undefined, localeFor(settings.language))}</td><td>{item.method || "—"}</td><td className={`amount-cell ${item.type}`}>{item.type === "income" ? "+" : "−"}{formatMoney(item.amount, settings.currency)}</td><td className="actions-cell"><div className="row-menu-wrap"><button className="row-menu-button" aria-label={`${t("Actions for")} ${item.title}`} onClick={() => setMenu(menu === item.id ? null : item.id)}><FiMoreHorizontal/></button>{menu === item.id && <div className="row-menu"><button onClick={() => { setEditing(item); setMenu(null); }}>{t("Edit")}</button><button className="danger-text" onClick={() => { if (window.confirm(`${t("Delete")} "${item.title}"? ${t("This cannot be undone.")}`)) deleteTransaction(item.id); setMenu(null); }}>{t("Delete")}</button></div>}</div></td></tr>;
    })}</tbody></table></div>
    {editing && <TransactionModal transaction={editing} onClose={() => setEditing(null)}/>}
  </>;
}
