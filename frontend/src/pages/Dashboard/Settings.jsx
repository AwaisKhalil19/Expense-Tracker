import { useRef, useState } from "react";
import { FiCheck, FiDownload, FiEdit2, FiGlobe, FiHardDrive, FiSun, FiUpload, FiUser, FiX } from "react-icons/fi";
import { useAppData } from "../../context/useAppData";
import { useAuth } from "../../context/useAuth";
import { downloadCsv } from "../../utils/data";

export default function Settings() {
  const { settings, updateSettings, transactions, budgets, categories, importData, clearAllData, t } = useAppData();
  const { updateProfile } = useAuth();
  const [form, setForm] = useState(() => ({ ...settings, name: typeof settings.name === "string" ? settings.name : "", email: typeof settings.email === "string" ? settings.email : "" }));
  const [editingProfile, setEditingProfile] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const save = (event) => { event.preventDefault(); if (editingProfile) return saveProfile(); updateSettings({ currency: form.currency, weekStartsOn: form.weekStartsOn, language: form.language }); setSaved(true); window.setTimeout(() => setSaved(false), 2200); };
  const saveProfile = () => {
    try {
      const profile = updateProfile({ name: form.name, email: form.email });
      updateSettings({ name: profile.name, email: profile.email });
      setForm((current) => ({ ...current, name: profile.name, email: profile.email }));
      setEditingProfile(false);
      setError("");
      setProfileSaved(true);
      window.setTimeout(() => setProfileSaved(false), 2200);
    } catch (reason) {
      setError(reason.message || "Could not update your profile.");
    }
  };
  const cancelProfileEdit = () => {
    setForm((current) => ({ ...current, name: settings.name || "", email: settings.email || "" }));
    setEditingProfile(false);
    setError("");
  };
  const exportTransactions = (type) => {
    const records = transactions.filter((item) => item.type === type);
    downloadCsv(`finch-${type}s-${new Date().toISOString().slice(0, 10)}.csv`, ["Date", "Description", "Category", "Payment method / source", "Amount", "Notes"], records.map((item) => [item.date, item.title, item.category, item.method, item.amount, item.notes || ""]));
  };
  const downloadBackup = () => {
    const backup = { version: 1, exportedAt: new Date().toISOString(), transactions, budgets, categories, settings };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = `finch-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
  };
  const readBackup = async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    try { const data = JSON.parse(await file.text()); importData(data); setError(""); if (data.settings) setForm((current) => ({ ...current, ...data.settings })); }
    catch (e) { setError(e.message || "Could not read this backup file."); }
    event.target.value = "";
  };
  const reset = () => { if (window.confirm("Delete all transactions, budgets, and custom categories from this browser? Your preferences will be kept. This cannot be undone.")) clearAllData(); };
  return <div className="page-stack"><div className="page-title-row"><div><p className="eyebrow">{t("Your space, your rules")}</p><h1>{t("Settings")}</h1><p className="page-description">{t("Personalize Finch and keep your data safe.")}</p></div></div><form onSubmit={save} className="settings-layout">
    <section className="surface settings-card">
      <div className="settings-heading"><span className="settings-icon"><FiUser/></span><div><h2>{t("Profile")}</h2><p>{t("Your account information and how you appear in Finch.")}</p></div>{!editingProfile && <button className="button button-secondary profile-edit-button" type="button" onClick={() => { setError(""); setEditingProfile(true); }}><FiEdit2/> {t("Edit profile")}</button>}</div>
      {editingProfile ? <div className="settings-fields profile-edit-fields"><label className="field-label">{t("Name")}<input autoComplete="name" placeholder={t("Your name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required/></label><label className="field-label">{t("Email address")}<input type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required/></label><div className="profile-actions"><button className="button button-quiet" type="button" onClick={cancelProfileEdit}><FiX/> {t("Cancel")}</button><button className="button button-primary" type="button" onClick={saveProfile}><FiCheck/> {t("Save profile")}</button></div></div> : <div className="profile-details"><div><span>{t("Name")}</span><strong>{settings.name || t("Not set")}</strong></div><div><span>{t("Email address")}</span><strong>{settings.email || t("Not set")}</strong></div>{profileSaved && <p className="profile-saved-message" role="status"><FiCheck/> {t("Profile saved")}</p>}</div>}
      {error && <p className="form-error" role="alert">{t(error)}</p>}
    </section>
    <section className="surface settings-card"><div className="settings-heading"><span className="settings-icon violet"><FiGlobe/></span><div><h2>{t("Preferences")}</h2><p>{t("Set the defaults that feel right to you.")}</p></div></div><div className="settings-fields"><label className="field-label">{t("Currency")}<select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>{[["USD", "US Dollar · $"], ["PKR", "Pakistani Rupee · Rs"], ["INR", "Indian Rupee · ₹"], ["EUR", "Euro · €"], ["GBP", "British Pound · £"], ["AED", "UAE Dirham · د.إ"], ["SAR", "Saudi Riyal · ر.س"], ["CAD", "Canadian Dollar · CA$"], ["AUD", "Australian Dollar · A$"]].map(([code, name]) => <option value={code} key={code}>{name}</option>)}</select></label><label className="field-label">{t("Language")}<select value={form.language || "en"} onChange={(e) => setForm({ ...form, language: e.target.value })}><option value="en">English</option><option value="ur">اردو (Urdu)</option><option value="ar">العربية (Arabic)</option><option value="fr">Français (French)</option><option value="es">Español (Spanish)</option></select></label><label className="field-label">{t("Week starts on")}<select value={form.weekStartsOn || "Monday"} onChange={(e) => setForm({ ...form, weekStartsOn: e.target.value })}>{["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => <option key={day} value={day}>{new Intl.DateTimeFormat(settings.language ? ({ en: "en", fr: "fr", es: "es", ur: "ur", ar: "ar" }[settings.language]) : "en", { weekday: "long" }).format(new Date(2024, 0, 7 + ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(day)))}</option>)}</select></label></div><div className="settings-actions"><button type="submit" className="button button-primary">{saved ? <><FiCheck/> {t("Saved")}</> : t("Save preferences")}</button></div></section>
    </form>
    <section className="surface settings-card"><div className="settings-heading"><span className="settings-icon"><FiSun/></span><div><h2>{t("Appearance")}</h2><p>{t("Choose the look that works best for you.")}</p></div></div><div className="settings-fields"><label className="field-label">{t("Theme")}<select value={settings.theme || "light"} onChange={(event) => updateSettings({ theme: event.target.value })}><option value="light">{t("Light mode")}</option><option value="dark">{t("Dark mode")}</option></select></label></div></section>
    <section className="surface settings-card data-settings"><div className="settings-heading"><span className="settings-icon green"><FiHardDrive/></span><div><h2>{t("Your data")}</h2><p>{t("Your information stays in this browser and is never sent to a server.")}</p></div></div><div className="data-summary"><span><b>{transactions.length}</b> {t("transactions")}</span><span><b>{budgets.length}</b> {t("budgets")}</span><span><b>{categories.length}</b> {t("categories")}</span></div><div className="data-buttons"><button className="button button-secondary" type="button" onClick={() => exportTransactions("expense")}><FiDownload/> {t("Export expenses CSV")}</button><button className="button button-secondary" type="button" onClick={() => exportTransactions("income")}><FiDownload/> {t("Export income CSV")}</button><button className="button button-secondary" type="button" onClick={downloadBackup}><FiDownload/> {t("Export all data JSON")}</button><button className="button button-secondary" type="button" onClick={() => fileRef.current?.click()}><FiUpload/> {t("Import JSON")}</button><input ref={fileRef} className="hidden-input" type="file" accept="application/json,.json" onChange={readBackup}/><button className="button button-danger-quiet" type="button" onClick={reset}>{t("Clear all data")}</button></div>{error && <p className="form-error" role="alert">{t(error)}</p>}</section>
    <p className="local-data-note">{t("Finch stores this data in your browser’s local storage. Clearing browser data will remove it, so download a backup from time to time.")}</p>
  </div>;
}
