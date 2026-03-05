# MoneyFlows — Implementation Guide

This guide explains exactly what I (Claude) will do when building this project, in what order, and why. It covers every major decision, file, and feature from setup through launch.

---

## What I Will Build

A dual-mode personal finance tracker mobile app called **MoneyFlows**:
- **React Native + Expo** frontend (iOS + Android)
- **Node.js + Express** backend REST API
- **PostgreSQL** database (15 tables)
- **Simple Mode** (4 screens, minimal complexity) and **Detailed Mode** (12+ screens, full analytics)

---

## Phase 1 — Foundation & Architecture (Weeks 1–2)

### Step 1.1 — Project Scaffolding

**What I'll do**:
1. Create the Expo React Native app with `npx create-expo-app`
2. Create the backend Node.js project with proper folder structure
3. Set up Git repository with `.gitignore` (node_modules, .env, build artifacts)
4. Create `.env.example` templates for both frontend and backend

**Folder structure I'll create** (see CLAUDE.md for the full tree):
- `frontend/src/` with all subdirectories: screens, navigation, context, hooks, components, services, utils, styles, i18n
- `backend/src/` with: routes, controllers, models, middleware, config

**Files I'll create first**:
- `frontend/src/App.js` — root component with all Context providers wrapped
- `backend/src/server.js` — Express app with CORS, JSON parsing, routes mounted
- `backend/src/config/db.js` — PostgreSQL connection pool

### Step 1.2 — Database Setup

**What I'll create**:
All 15 tables in order of dependency:
1. `users` (no foreign keys — base table)
2. `categories` (references users)
3. `subcategories` (references categories + users)
4. `transactions` (references users, categories, subcategories)
5. `budgets` (references users, categories)
6. `goals` (references users, categories)
7. `subscriptions` (references users, categories)
8. `group_expenses` (references users)
9. `group_expense_members` (references group_expenses, users)
10. `group_expense_items` (references group_expenses, users)
11. `shared_budgets` (references users)
12. `shared_budget_members` (references shared_budgets, users)
13. `shared_budget_transactions` (references shared_budgets, transactions, users)
14. `insights` (references users, categories)
15. `export_requests` (references users)

**Plus**:
- All indexes for performance-critical columns (user_id, date, status)
- Two materialized views: `monthly_spending_summary` and `budget_status`
- Seed data for default categories and subcategories

**Why this order**: Tables with foreign keys must be created after the tables they reference.

### Step 1.3 — Context & State Architecture

**What I'll build**:

`AuthContext.js`:
- State: `user`, `token`, `isLoading`, `error`
- Actions: `login(email, password)`, `logout()`, `register(data)`
- On app start: reads JWT from AsyncStorage, verifies with `/users/profile`, auto-logs in if valid

`ModeContext.js`:
- State: `mode` (`'simple'` | `'detailed'`), `userTypes` (array), `isLoading`
- Actions: `switchMode(newMode)`, `updateUserTypes(types)`, `hasUserType(type)`, `isSimpleMode()`
- Persists to backend on every change via `PUT /users/settings/mode`

`AccessibilityContext.js`:
- State: `{ fontSize, darkMode, highContrast, screenReader, voiceInput, voiceOutput }`
- Action: `updateAccessibility(newSettings)` — saves to backend

**Why Context over Redux**: The app has a small global state surface (mode, auth, accessibility). Context with custom hooks is simpler, easier to test, and sufficient for this scale.

### Step 1.4 — Navigation Architecture

**RootNavigator.js** logic:
```
if (isLoading) → SplashScreen
if (!isAuthenticated) → AuthNavigator (Login/Signup)
if (mode === 'simple') → SimpleNavigator
if (mode === 'detailed') → DetailedNavigator
```

**SimpleNavigator.js**: Bottom tab navigator with exactly 4 tabs:
- Home (SimpleDashboard)
- Add (SimpleAddTransaction)
- Budget (SimpleBudget)
- Settings (SettingsScreen)

**DetailedNavigator.js**: Bottom tab navigator with 5 visible tabs + "More" overflow:
- Home (DetailedDashboard)
- Add (DetailedAddTransaction)
- Transactions (DetailedTransactionsList)
- Budget (DetailedBudget)
- More → Goals, Subscriptions, Group Expenses, Shared Budgets, Analytics, Insights, Export

**AuthNavigator.js**: Stack navigator:
- LoginScreen
- SignupScreen (handles all 5 steps internally with local state)

---

## Phase 2 — Authentication & Onboarding (Weeks 3–4)

### Step 2.1 — Backend Authentication

**What I'll implement**:

`POST /auth/signup`:
- Validate email format, password strength (min 8 chars)
- Hash password with `bcrypt.hash(password, 10)`
- Insert user into DB
- Return `{ token, refreshToken, user }`

`POST /auth/login`:
- Find user by email
- Compare password with `bcrypt.compare(password, hash)`
- Generate JWT: `jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' })`
- Generate refresh token (longer-lived, stored in DB or Redis)
- Return `{ token, refreshToken, user }`

`POST /auth/refresh-token`:
- Verify refresh token
- Issue new access token

`authMiddleware.js`:
- Extracts `Bearer <token>` from `Authorization` header
- Verifies with `jwt.verify(token, JWT_SECRET)`
- Attaches `req.user = { userId, ... }` for downstream controllers
- Returns 401 if missing or invalid

`modeMiddleware.js`:
- Reads `req.query.mode` or falls back to `req.user.preferredMode` from DB
- Attaches `req.userMode` for controllers to use in response filtering

### Step 2.2 — Settings Endpoints

`PUT /users/settings/mode` — update `preferred_mode` in `users` table
`PUT /users/settings/user-types` — update `user_types` JSONB in `users` table
`PUT /users/settings/accessibility` — update `accessibility_settings` JSONB in `users` table
`GET /users/profile` — return full user object (used for auth restore on app start)

### Step 2.3 — Frontend Onboarding (5-Step Flow)

`SignupScreen.js` manages a local `step` state (1–5) and collects all data before final API call.

**Step 1 — Basic Info**:
- Fields: full name, email, password, confirm password
- Validation: email format, passwords match, min 8 chars
- Progress: `[● ○ ○ ○ ○]`

**Step 2 — User Type**:
- Multi-select checkboxes: Student, Parent, Self-Employed, Gig Worker, Retired, Low Income, New to Country, Debt Focus, Just Tracking
- At least one must be selected

**Step 3 — Mode Selection**:
- Two large cards: Simple Mode vs Detailed Mode with descriptions
- Default: Simple Mode

**Step 4 — Accessibility**:
- Font size slider (preview text updates live)
- Toggle: Dark Mode, High Contrast, Screen Reader, Voice Input

**Step 5 — Language & First Budget**:
- Language dropdown: English, Spanish, French, Arabic
- Monthly budget input (optional, can skip)
- "Get Started" submits everything to `/auth/signup` + `/users/settings/*`

**Why 5 steps**: Reduces overwhelm. Each step is one focused decision. Progress indicator shows users they're almost done.

---

## Phase 3 — Core Transactions (Weeks 5–6)

### Step 3.1 — Backend Transaction Endpoints

**`POST /transactions`**:
- Accepts: amount, description, category_id, subcategory_id, transaction_date, payment_method, merchant_name, is_recurring, recurring_frequency, notes
- Validates: amount > 0, category exists and belongs to user (or is default), date is valid
- After insert: checks if any budget is now exceeded → creates an insight/alert if so

**`GET /transactions`**:
- Supports query params: `?category_id=`, `?month=YYYY-MM`, `?page=`, `?limit=`, `?search=`
- Returns paginated results with total count
- Mode does not filter this endpoint (both modes see all their transactions)

**`POST /transactions/upload-receipt`**:
- Accepts multipart/form-data with `image` field
- Uploads to Firebase Cloud Storage
- Sends image URL to Google Vision API for OCR
- Parses response: extracts items, amounts, merchant name, date
- Returns structured JSON for the frontend form to pre-fill
- User reviews and submits the actual transaction separately

**Auto-categorization rules engine** (`categorizeTransaction.js`):
```
merchant name → category mapping:
"Whole Foods", "Trader Joe's", "Kroger" → Groceries
"Starbucks", "McDonald's", "Chipotle" → Dining Out
"Uber", "Lyft", "Metro" → Transportation
"Netflix", "Spotify", "Hulu" → Entertainment (also adds to Subscriptions)
"CVS", "Walgreens" → Health
```
Returns `{ suggestedCategory, confidence }`. User can override.

### Step 3.2 — Frontend Transaction Forms

**SimpleAddTransaction.js** — 3 fields only:
1. Amount (large number input, numeric keyboard)
2. Category picker (flat list with emoji icons, 8 options max)
3. SAVE button

No date (defaults to today), no merchant, no receipt. Fast and frictionless.

**DetailedAddTransaction.js** — full form:
1. Amount
2. Date picker (defaults to today)
3. Category dropdown
4. Subcategory dropdown (loads based on selected category)
5. Merchant name text input
6. Payment method: Cash / Card / Online (radio buttons)
7. Receipt photo button → triggers camera → uploads → OCR → pre-fills form
8. Notes text area
9. Recurring toggle → if ON, show frequency: Daily / Weekly / Monthly / Yearly
10. SAVE button + SAVE & ADD ANOTHER button

**CategoryPicker component** passes a `simple` prop:
- `simple={true}`: flat 8-item list, emoji icons, large touch targets
- `simple={false}`: grouped by parent category, shows subcategories inline

### Step 3.3 — Transaction List

**SimpleTransactionItem.js**: One line — `[emoji] Category — $amount — date`

**DetailedTransactionsList.js**:
- Grouped by date header
- Each item: emoji + category + merchant + amount + receipt thumbnail (if any)
- Sort options: date, amount, category
- Filter drawer: by category, date range
- Search bar
- Swipe left to delete (with confirmation)
- Tap to open edit form

---

## Phase 4 — Budgets & Dashboards (Weeks 7–8)

### Step 4.1 — Budget Backend

**`GET /dashboard?mode=simple|detailed`**:

Simple response:
```json
{
  "spent": 427,
  "budget": 500,
  "remaining": 73,
  "percentage": 85,
  "recentTransactions": [ ...5 items ]
}
```

Detailed response (adds):
```json
{
  "categoryBreakdown": [{ "category": "Groceries", "amount": 294, "percentage": 35 }, ...],
  "budgets": [{ "category": "Groceries", "limit": 300, "spent": 294, "status": "warning" }, ...],
  "sixMonthTrend": [{ "month": "2025-10", "total": 1200 }, ...],
  "goals": [...],
  "insights": [...],
  "recentTransactions": [ ...10 items ]
}
```

**`GET /budgets/:id/progress`**: Returns `{ spent, limit, remaining, percentage, status: 'good'|'warning'|'over' }`

Alert threshold: warn at 80%, alert at 100%.

### Step 4.2 — Dashboard Screens

**SimpleDashboard.js**:
- Greeting: "Good to see you, [Name]!"
- Large budget card: Spent / Budget / Left / progress bar with status color
- Recent transactions: last 5, grouped by today/yesterday/date
- Big "Add Transaction" CTA button
- Empty state with friendly message + CTA if no transactions yet

**DetailedDashboard.js**:
- Overview card (total spent / budget / percentage)
- PieChart (category breakdown, tappable slices show tooltip)
- Budget status cards per category (color-coded: green/yellow/red)
- LineChart (6-month trend, swipeable timeframe)
- Insights section (2–3 dismissable cards)
- Goals progress bars
- Recent transactions list (10 items, "View All" link)

**Why two separate screen files**: Conditional rendering inside one component adds complexity and makes both versions harder to maintain. Separate files are cleaner.

### Step 4.3 — Budget Management Screens

**SimpleBudget.js**:
- Single monthly budget amount input
- Current spent + remaining displayed
- One progress bar
- Alert toggle (on/off)

**DetailedBudget.js**:
- One card per category with individual budget
- Edit any budget inline
- "Add Budget" for new categories
- Alert threshold slider per category (default 80%)
- "Copy from last month" convenience button
- Monthly vs annual toggle view

---

## Phase 5 — Advanced Features (Weeks 9–10)

### Step 5.1 — Goals System (Detailed Mode Only)

**Three goal types**:
1. **Savings goal**: "Save $500 by end of March" — progress = (income - expenses) in period
2. **Spending reduction**: "Spend under $100 on Dining Out this month" — progress = (100 - spent) / 100
3. **Frequency limit**: "Dine out max 5 times per week" — tracks count of transactions in category

Backend auto-calculates `progress` (0–100) whenever transactions are added or updated.

GoalsScreen shows each goal as a card with progress bar, days remaining, and completion status (active/completed/failed).

### Step 5.2 — Subscriptions Tracker

Subscriptions are separate from transactions. They represent known recurring charges.

The `next_billing_date` field is used to:
- Show upcoming charges in a calendar-style view
- Send push notification reminders 3 days before billing
- Flag if a subscription transaction hasn't appeared (possible cancellation)

Both modes show subscriptions, but:
- **Simple Mode**: shows total monthly cost only in Settings
- **Detailed Mode**: full list with names, amounts, next dates, cancel buttons

### Step 5.3 — Insights Generation

Run via a scheduled background job (daily or after each transaction batch):

**Insight types**:
- `pattern`: "You spend most on Fridays" / "Your biggest category is Dining Out (28%)"
- `recommendation`: "You could save $80/month by reducing coffee spending"
- `alert`: "You're 119% over your Dining Out budget" / "Netflix hasn't been used in 60 days"

Each insight has: `type`, `title`, `description`, `metric_value`, `metric_unit`, `category_id`, `is_dismissed`.

Users can dismiss insights. Dismissed insights are not shown again.

### Step 5.4 — Analytics Screen (Detailed Mode Only)

Charts:
- **Spending trend**: line chart, last 6 months, total per month
- **Category trends**: stacked bar chart — each category's monthly spend
- **Top merchants**: ranked list with amounts
- **Day of week patterns**: bar chart showing which days you spend most
- **Forecast**: "At this rate, you'll spend $1,100 this month (budget: $1,000)"

All charts are interactive — tapping a data point shows a tooltip with details.

### Step 5.5 — Recurring Transactions

When a transaction is marked `is_recurring = true` with a `recurring_frequency`:
- A backend cron job runs daily
- It checks for recurring transactions whose `next_occurrence` date is today
- Creates a new transaction automatically (copy of parent with today's date)
- Sends a push notification: "Auto-recorded: Netflix - $15.99"

Users can modify or skip individual occurrences without affecting the recurring series.

---

## Phase 6 — Social Features & Polish (Weeks 11–12)

### Step 6.1 — Group Expense Splitting (Detailed Mode Only)

**Create flow**:
1. User creates a group expense (title, total, date)
2. Takes receipt photo → OCR extracts itemized list
3. Assigns items to each participant (self + others invited by email)
4. App calculates: who owes whom
5. Members confirm their items
6. Settlement shown: "Person B owes you $20"

**Settlement calculation**:
```
For each member:
  balance = amountPaid - amountOwed
Members with positive balance are owed money
Members with negative balance owe money
Minimize transactions: greedy algorithm
```

Settlement options:
- Mark as "paid manually" (Venmo, cash)
- Pay via Stripe Connect (in-app transfer)

Each settled amount creates a transaction in the member's personal transaction history.

### Step 6.2 — Shared Budgets (Detailed Mode Only)

A shared budget is a group budget where multiple users track their combined spending.

- Owner creates a shared budget (name, monthly limit)
- Invites members by email
- Each member can add transactions to the shared budget
- Dashboard shows total spent by the group, breakdown per member
- Settlement works same as group expenses

### Step 6.3 — Export Functionality (Both Modes)

**CSV export**:
- Headers: Date, Description, Category, Subcategory, Merchant, Amount, Payment Method, Notes
- One row per transaction
- Filtered by date range

**PDF export**:
- Summary page: total income, total expenses, net, top categories
- Charts (pie chart, bar chart)
- Full transaction list
- Generated with `pdfkit` or `jsPDF`

**Excel export**:
- Sheet 1: Summary + charts
- Sheet 2: All transactions
- Sheet 3: Budget status
- Generated with `xlsx` library

Files are generated in the backend, uploaded to Firebase/S3, and the URL is returned. Expires after 24 hours.

### Step 6.4 — User Testing (Week 12)

**Recruit 8–12 beta testers** across personas:
- 2 Simple Mode users (student + parent)
- 2 Detailed Mode users (freelancer + professional)
- 1 user with accessibility needs
- 2-3 users of diverse age/income

**Testing protocol**:
1. Signup flow — can they complete onboarding without help?
2. Add first transaction — how long does it take?
3. Read the dashboard — do they understand what they see?
4. Switch modes — is it confusing?
5. Find the settings — is it where they expect?

**Collect**: task completion rate, confusion moments (think-aloud), NPS score (0–10 "would you recommend?")

**Fix priority**:
- Critical (crash, data loss): fix immediately
- High (blocks core task): fix before launch
- Medium (confusion, friction): fix if time allows
- Low (nice to have): log for Phase 2

### Step 6.5 — Final Polish Checklist

**Consistency**:
- All buttons same height (56px), same border radius
- All error messages follow same pattern: red text below field
- All loading states: spinner with descriptive text ("Saving transaction...")
- All empty states: friendly message + illustration + CTA

**Performance**:
- FlatList virtualization for transaction lists (never render off-screen items)
- Memoize expensive components with `React.memo`
- Debounce search inputs (300ms)
- Cache dashboard data in `useDashboard` hook (refresh on pull-to-refresh or 5-min interval)
- All DB queries use indexed columns in WHERE clauses

**Security review**:
- No plaintext passwords anywhere
- No API keys in frontend source code
- All endpoints behind `authMiddleware`
- Rate limiting: 100 requests/15 minutes per IP on auth endpoints
- SQL injection: all queries use parameterized values, never string concatenation

**Accessibility audit**:
- Screen reader labels on all interactive elements (`accessibilityLabel`)
- Focus order is logical (top-to-bottom, left-to-right)
- No information conveyed by color alone (always add icon or text)
- Minimum contrast ratio 4.5:1 for normal text, 3:1 for large text

### Step 6.6 — Deployment

**Backend**:
1. Deploy to Railway or Heroku (free tier available)
2. Set all env vars: `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, `GOOGLE_VISION_API_KEY`, etc.
3. Run database migrations on production DB
4. Set up Sentry for error monitoring
5. Set up daily DB backups

**Frontend**:
1. Update API base URL to production backend URL
2. Run `expo build` (or `eas build` for Expo Application Services)
3. Test on physical iOS + Android devices
4. Submit to App Store + Google Play (if desired)
5. Write privacy policy + terms of service (required for stores)

---

## Key Implementation Decisions

### Why Context API instead of Redux
Redux adds boilerplate and complexity. The app's global state is small: auth (user + token), mode (simple/detailed), accessibility settings. Context with custom hooks (`useMode()`, `useAuth()`) is sufficient and easier to understand.

### Why Two Separate Navigator Files
`SimpleNavigator.js` and `DetailedNavigator.js` are separate. When mode changes, the `RootNavigator` unmounts one and mounts the other. This is cleaner than trying to conditionally render tabs within one navigator, and avoids navigation state getting confused across mode switches.

### Why Two Dashboard Files
`SimpleDashboard.js` and `DetailedDashboard.js` are separate screen files. The detailed dashboard has pie charts, line charts, goals, insights — if combined into one file with conditionals, it would be 600+ lines and hard to maintain. Separation allows each to be optimized independently.

### Why Mode-Aware API Responses
The backend `GET /dashboard` returns different JSON structures based on `mode`. This avoids sending unnecessary data to Simple Mode users (who never see charts or insights). It keeps API responses lean and reduces mobile data usage.

### Why PostgreSQL over MongoDB
The data is highly relational: users → transactions → categories → budgets → group expenses → members. PostgreSQL handles JOINs efficiently and enforces foreign key constraints that prevent orphaned records. The materialized views for `monthly_spending_summary` and `budget_status` would be significantly harder to implement correctly in MongoDB.

### Why Formik + Yup
Formik handles form state, touched/error state, and submission without manual state management. Yup provides declarative schema-based validation that is easy to read and extend. Together they handle the complex 5-step signup form and the detailed transaction form cleanly.

---

## What Claude Will NOT Do (Scope Boundaries)

The following are explicitly **Phase 2 or later** — I will not implement these in the 12-week scope:

- Bank account integration (Plaid API)
- Investment / stock portfolio tracking
- Cryptocurrency tracking
- Machine learning auto-categorization (will use rule-based approach in MVP)
- Desktop/web version
- Tax filing integration
- White-label version

If these come up during development, I will log them and defer — not implement them unless explicitly requested.

---

## How to Work With Claude on This Project

When asking Claude to work on a feature, specify:
1. **Which mode** — Simple, Detailed, or both
2. **Which layer** — frontend screen, backend endpoint, database schema, or all
3. **What already exists** — if a related file already has starter code
4. **The acceptance criteria** — what "done" looks like

Example: "Build the `SimpleAddTransaction.js` screen. It should have 3 fields: amount (numeric input), category picker (8 default categories), and a Save button. On save it calls `POST /transactions`. Show a success toast, then reset the form."

Claude will:
- Read relevant existing files before writing any code
- Follow the folder structure in CLAUDE.md exactly
- Not add features beyond what is requested
- Ask if requirements are ambiguous
- Point out security issues immediately
