import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { FiArrowRight, FiLock, FiMail } from "react-icons/fi";
import AuthLayout from "../../components/layouts/AuthLayout";
import { useAuth } from "../../context/useAuth";

export default function Login() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace/>;

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await signIn(form);
      navigate(location.state?.from || "/", { replace: true });
    } catch (reason) {
      setError(reason.message || "Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return <AuthLayout>
    <div className="auth-card">
      <div className="auth-brand-mark">f</div>
      <p className="eyebrow">Welcome back</p>
      <h1>Sign in to Finch</h1>
      <p className="auth-description">Pick up where you left off with a clearer view of your finances.</p>
      <form className="auth-form" onSubmit={submit}>
        <label className="field-label">Email address<span className="auth-input-wrap"><FiMail/><input type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required/></span></label>
        <label className="field-label">Password<span className="auth-input-wrap"><FiLock/><input type="password" autoComplete="current-password" placeholder="Enter your password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={8}/></span></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary auth-submit" type="submit" disabled={submitting}>{submitting ? "Signing in…" : <>Sign in <FiArrowRight/></>}</button>
      </form>
      <p className="auth-switch">New to Finch? <Link to="/signup">Create an account</Link></p>
      <p className="auth-local-note">This frontend demo stores your account and data only in this browser. It is not production authentication.</p>
    </div>
  </AuthLayout>;
}
