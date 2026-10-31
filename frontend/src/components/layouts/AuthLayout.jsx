

import { Link } from "react-router-dom";

export default function AuthLayout({ children }) {
  return <main className="auth-layout">
    <section className="auth-visual">
      <Link className="auth-logo" to="/login"><span className="brand-mark">f</span> finch<span>.</span></Link>
      <div className="auth-visual-copy"><span className="auth-overline">MONEY, MADE CLEAR</span><h2>A little more clarity.<br/>A lot more confidence.</h2><p>Bring your spending, saving, and goals together in one calm place.</p></div>
      <div className="auth-visual-footer"><span>Personal finance, thoughtfully organized.</span><span>Securely kept on this device</span></div>
    </section>
    <section className="auth-content">{children}</section>
  </main>;
}