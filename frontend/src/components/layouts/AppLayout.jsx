import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { FiArrowDownLeft, FiArrowUpRight, FiBarChart2, FiBriefcase, FiGrid, FiLogOut, FiMenu, FiPieChart, FiSettings, FiX } from "react-icons/fi";
import TransactionModal from "../transactions/TransactionModal";
import { useAppData } from "../../context/useAppData";
import { useAuth } from "../../context/useAuth";

const links = [
  { name: "Dashboard", to: "/", icon: FiGrid },
  { name: "Expenses", to: "/expenses", icon: FiArrowUpRight },
  { name: "Income", to: "/income", icon: FiArrowDownLeft },
  { name: "Budgets", to: "/budgets", icon: FiBriefcase },
  { name: "Categories", to: "/categories", icon: FiPieChart },
  { name: "Reports", to: "/reports", icon: FiBarChart2 },
];
const pageNames = { "/": "Dashboard", "/expenses": "Expenses", "/income": "Income", "/transactions": "Transactions", "/budgets": "Budgets", "/categories": "Categories", "/reports": "Reports", "/settings": "Settings" };

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState("expense");
  const { settings, t } = useAppData();
  const { signOut } = useAuth();
  const location = useLocation();
  const title = pageNames[location.pathname] || "Dashboard";
  const profileName = typeof settings.name === "string" ? settings.name.trim() : "";
  return <div className="app-shell">
    {menuOpen && <button className="mobile-scrim" aria-label={t("Close navigation")} onClick={() => setMenuOpen(false)} />}
    <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
      <div className="brand-row"><span className="brand-mark">f</span><span className="brand-name">finch<span>.</span></span><button className="mobile-close icon-button" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><FiX/></button></div>
      <p className="nav-label">{t("Workspace")}</p>
      <nav className="side-nav">{links.map(({ name, to, icon: Icon }) => <NavLink end={to === "/"} key={name} to={to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "selected" : ""}`}><Icon/><span>{t(name)}</span></NavLink>)}</nav>
      <div className="sidebar-spacer" />
      <NavLink to="/settings" onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link settings-nav ${isActive ? "selected" : ""}`}><FiSettings/><span>{t("Settings")}</span></NavLink>
      <div className="account-card"><span className="account-avatar">{profileName.charAt(0).toUpperCase() || "U"}</span><span className="account-info"><b>{profileName || t("Your profile")}</b><small>{settings.email || t("Personal workspace")}</small></span><button className="sign-out-button" type="button" aria-label={t("Sign out")} title={t("Sign out")} onClick={signOut}><FiLogOut/></button></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu icon-button" aria-label={t("Open navigation")} onClick={() => setMenuOpen(true)}><FiMenu/></button><div className="breadcrumbs"><span>{t("Workspace")}</span><i>/</i><b>{t(title)}</b></div><div className="topbar-actions"><div className="topbar-avatar">{profileName.charAt(0).toUpperCase() || "U"}</div></div></header>
      <div className="page-content"><Outlet context={{ openTransaction: (type = "expense") => { setTransactionType(typeof type === "string" ? type : "expense"); setModalOpen(true); } }}/></div>
    </main>
    {modalOpen && <TransactionModal initialType={transactionType} onClose={() => setModalOpen(false)}/>}
  </div>;
}
