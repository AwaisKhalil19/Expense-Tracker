import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FiArrowRight, FiLock, FiMail, FiUser } from "react-icons/fi";
import AuthLayout from "../../components/layouts/AuthLayout";
import { useAuth } from "../../context/useAuth";

export default function SignUp() {
  const { user, signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace/>;

  const submit = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) return setError("Enter a name with at least two characters.");
    if (form.password.length < 8) return setError("Use a password with at least 8 characters.");
    if (form.password !== form.confirmPassword) return setError("The passwords do not match.");
    setSubmitting(true);
    setError("");
    try {
      await signUp(form);
      navigate("/", { replace: true });
    } catch (reason) {
      setError(reason.message || "Unable to create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return <AuthLayout>
    <div className="auth-card">
      <div className="auth-brand-mark">f</div>
      <p className="eyebrow">A better relationship with money</p>
      <h1>Create your account</h1>
      <p className="auth-description">Start tracking your spending, setting budgets, and building better habits.</p>
      <form className="auth-form" onSubmit={submit}>
        <label className="field-label">Full name<span className="auth-input-wrap"><FiUser/><input type="text" autoComplete="name" placeholder="Your name" maxLength={70} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required/></span></label>
        <label className="field-label">Email address<span className="auth-input-wrap"><FiMail/><input type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required/></span></label>
        <label className="field-label">Password<span className="auth-input-wrap"><FiLock/><input type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required/></span></label>
        <label className="field-label">Confirm password<span className="auth-input-wrap"><FiLock/><input type="password" autoComplete="new-password" placeholder="Re-enter your password" minLength={8} value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} required/></span></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary auth-submit" type="submit" disabled={submitting}>{submitting ? "Creating account…" : <>Create account <FiArrowRight/></>}</button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      <p className="auth-local-note">This frontend demo stores your account and data only in this browser. It is not production authentication.</p>
    </div>
  </AuthLayout>;
}
