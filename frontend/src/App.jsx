import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layouts/AppLayout";
import RequireAuth from "./components/layouts/RequireAuth";
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import { AuthProvider } from "./context/AuthContext";
import { AppDataProvider } from "./context/AppDataContext";

const Home = lazy(() => import("./pages/Dashboard/Home"));
const Expense = lazy(() => import("./pages/Dashboard/Expense"));
const Income = lazy(() => import("./pages/Dashboard/Income"));
const TransactionsPage = lazy(() => import("./pages/Dashboard/TransactionsPage"));
const Budgets = lazy(() => import("./pages/Dashboard/Budgets"));
const Categories = lazy(() => import("./pages/Dashboard/Categories"));
const Reports = lazy(() => import("./pages/Dashboard/Reports"));
const Settings = lazy(() => import("./pages/Dashboard/Settings"));

export default function App() {
  return <AuthProvider><BrowserRouter><Suspense fallback={<div className="route-loading" role="status">Loading your workspace…</div>}><Routes>
    <Route path="/login" element={<Login/>}/>
    <Route path="/signup" element={<SignUp/>}/>
    <Route element={<RequireAuth><AppDataProvider><AppLayout/></AppDataProvider></RequireAuth>}>
    <Route path="/" element={<Home/>}/>
    <Route path="/expenses" element={<Expense/>}/>
    <Route path="/income" element={<Income/>}/>
    <Route path="/transactions" element={<TransactionsPage type="all"/>}/>
    <Route path="/budgets" element={<Budgets/>}/>
    <Route path="/categories" element={<Categories/>}/>
    <Route path="/reports" element={<Reports/>}/>
    <Route path="/settings" element={<Settings/>}/>
    <Route path="/expense" element={<Navigate to="/expenses" replace/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Route></Routes></Suspense></BrowserRouter></AuthProvider>;
}
