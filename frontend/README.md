# Finch Expense Tracker

A responsive personal finance frontend built with React 19, Vite, Tailwind CSS 4, React Router, React Icons, and Recharts. Accounts and finance records are stored in this browser with localStorage; no backend or external service is used.

Sign-up and sign-in are local frontend demo flows. Passwords are salted and hashed in the browser, and each local account gets a separate set of finance records. This is not a security boundary or production authentication; a real deployment should replace it with a trusted backend identity provider and server-side authorization.

## Run locally

```bash
cd "frontend/expense tracker"
npm install
npm run dev
```

Open the local URL printed by Vite. The dashboard is the default route at `/`.

## Features

- Dashboard summary cards, recent activity, and daily, monthly, category, and income-versus-expense charts
- Add, edit, search, filter by category/source, payment method and date, sort, and delete income and expense transactions
- Create category and overall monthly budgets with 75%, 90%, and 100% spending alerts
- Manage expense categories and income sources
- Filter reports by week, month, previous month, last three months, year, or a custom date range
- Export expenses and income as CSV, export the complete data set as JSON, and import a validated JSON backup
- Set profile, currency, appearance, and week-start preferences
- Responsive desktop and mobile navigation

Data stays in this browser. Use Settings to download a backup before clearing browser storage or moving to another device.
