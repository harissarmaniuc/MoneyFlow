# MoneyFlows - Finance Tracker App

## Project Overview

MoneyFlows is a dual-mode personal finance tracker mobile app. The core innovation is a **Simple Mode / Detailed Mode** system that adapts the interface complexity to the user's needs and situation.

- **Simple Mode**: 4 screens, minimal fields, low cognitive load — for students, busy parents, low-income users
- **Detailed Mode**: 12+ screens, full analytics, charts, tax features — for freelancers, power users, professionals

Users select their situation (student, parent, freelancer, etc.) and their preferred mode during a 5-step onboarding flow. They can switch modes anytime from Settings without losing data.

---

## Tech Stack

### Frontend
- **Framework**: React Native with Expo
- **Language**: JavaScript (TypeScript preferred)
- **Navigation**: React Navigation (bottom tabs + native stack)
- **State Management**: Context API (AuthContext, ModeContext, AccessibilityContext)
- **Forms**: Formik + Yup validation
- **Charts**: react-native-svg-charts / Victory Native
- **HTTP**: Axios
- **Storage**: AsyncStorage (JWT tokens)
- **i18n**: i18next + react-i18next

### Backend
- **Runtime**: Node.js + Express.js
- **Auth**: JWT (short-lived 15m access token + refresh token)
- **Password hashing**: bcrypt
- **Database client**: pg (node-postgres)

### Database
- **Primary**: PostgreSQL
- **Cache**: Redis (sessions, fast lookups)
- **Host options**: Local / Supabase (free tier) / Railway / AWS RDS

### External Services
- **OCR / Receipt Scanning**: Google Vision API or AWS Textract
- **File Storage**: Firebase Cloud Storage or AWS S3
- **Email**: SendGrid
- **Payment settlement**: Stripe Connect
- **Push Notifications**: Firebase Cloud Messaging (FCM)

### Deployment
- **Backend**: Heroku / Railway / DigitalOcean
- **Mobile**: Expo Go (dev) → App Store + Google Play (production)

---

## Project Directory Structure

```
MoneyFlows/
├── frontend/
│   └── src/
│       ├── App.js                        # Root component, wraps all providers
│       ├── screens/
│       │   ├── auth/
│       │   │   ├── LoginScreen.js
│       │   │   ├── SignupScreen.js        # 5-step onboarding
│       │   │   └── UserTypeSelection.js
│       │   ├── simple/                   # Simple Mode screens
│       │   │   ├── SimpleDashboard.js
│       │   │   ├── SimpleAddTransaction.js
│       │   │   ├── SimpleBudget.js
│       │   │   └── SimpleSettings.js
│       │   ├── detailed/                 # Detailed Mode screens
│       │   │   ├── DetailedDashboard.js
│       │   │   ├── DetailedAddTransaction.js
│       │   │   ├── DetailedTransactionsList.js
│       │   │   ├── DetailedBudget.js
│       │   │   ├── GoalsScreen.js
│       │   │   ├── SubscriptionsScreen.js
│       │   │   ├── GroupExpensesScreen.js
│       │   │   ├── SharedBudgetsScreen.js
│       │   │   ├── AnalyticsScreen.js
│       │   │   ├── InsightsScreen.js
│       │   │   └── ExportScreen.js
│       │   └── shared/
│       │       ├── SettingsScreen.js
│       │       └── ProfileScreen.js
│       ├── navigation/
│       │   ├── RootNavigator.js          # Decides: auth vs simple vs detailed
│       │   ├── SimpleNavigator.js        # 4-tab bottom navigator
│       │   ├── DetailedNavigator.js      # 5+ tab + More menu
│       │   ├── AuthNavigator.js          # Login/Signup flow
│       │   └── LinkingConfig.js
│       ├── context/
│       │   ├── AuthContext.js            # user, token, login(), logout()
│       │   ├── ModeContext.js            # mode, userTypes, switchMode()
│       │   ├── AccessibilityContext.js   # fontSize, darkMode, etc.
│       │   ├── AppSettingsContext.js
│       │   └── UserTypeContext.js
│       ├── hooks/
│       │   ├── useMode.js
│       │   ├── useAuth.js
│       │   ├── useAccessibility.js
│       │   ├── useTransaction.js
│       │   └── useDashboard.js
│       ├── components/
│       │   ├── common/                   # Shared across both modes
│       │   │   ├── Button.js
│       │   │   ├── Input.js
│       │   │   ├── Card.js
│       │   │   ├── ProgressBar.js
│       │   │   ├── Header.js
│       │   │   └── TabNavigation.js
│       │   ├── simple/
│       │   │   ├── SimpleBudgetCard.js
│       │   │   ├── SimpleTransactionItem.js
│       │   │   ├── SimpleCategoryPicker.js
│       │   │   └── SimpleAlerts.js
│       │   └── detailed/
│       │       ├── DetailedBudgetCard.js
│       │       ├── PieChart.js
│       │       ├── LineChart.js
│       │       ├── DetailedCategoryPicker.js
│       │       └── InsightCard.js
│       ├── services/
│       │   ├── api.js                    # Axios instance with auth headers
│       │   ├── authService.js
│       │   ├── transactionService.js
│       │   ├── budgetService.js
│       │   ├── dashboardService.js
│       │   └── analyticsService.js
│       ├── utils/
│       │   ├── modeHelpers.js            # IfSimpleMode, IfDetailedMode components
│       │   ├── formatters.js
│       │   ├── validators.js
│       │   ├── calculations.js
│       │   └── constants.js
│       ├── i18n/
│       │   ├── en.json
│       │   ├── es.json
│       │   ├── fr.json
│       │   └── ar.json
│       └── styles/
│           ├── colors.js
│           ├── spacing.js
│           ├── typography.js
│           ├── simpleTheme.js
│           ├── detailedTheme.js
│           └── darkMode.js
│
├── backend/
│   └── src/
│       ├── server.js
│       ├── routes/
│       │   ├── auth.js
│       │   ├── transactions.js
│       │   ├── budgets.js
│       │   ├── goals.js
│       │   ├── subscriptions.js
│       │   ├── groupExpenses.js
│       │   ├── sharedBudgets.js
│       │   ├── dashboard.js
│       │   ├── analytics.js
│       │   ├── insights.js
│       │   ├── exports.js
│       │   └── users.js
│       ├── controllers/
│       ├── models/
│       ├── middleware/
│       │   ├── authMiddleware.js         # JWT verification
│       │   └── modeMiddleware.js         # Attach req.userMode
│       └── config/
│           └── db.js
│
├── docs/                                 # All planning documents
├── CLAUDE.md                             # This file
└── IMPLEMENTATION_GUIDE.md              # Step-by-step build guide
```

---

## Database Schema (15 Tables)

| Table | Purpose |
|---|---|
| `users` | Auth, mode preference, user types, accessibility settings |
| `categories` | Default + custom categories with icon/color |
| `subcategories` | Subcategories under each category |
| `transactions` | All income/expense records |
| `budgets` | Monthly budget limits per category |
| `goals` | Savings or spending reduction goals |
| `subscriptions` | Recurring payments (Netflix, etc.) |
| `group_expenses` | Shared expense splitting header |
| `group_expense_members` | Who participates + amounts owed |
| `group_expense_items` | Individual items in a split |
| `shared_budgets` | Multi-user shared budget |
| `shared_budget_members` | Members of a shared budget |
| `shared_budget_transactions` | Transactions linked to shared budget |
| `insights` | Pre-computed personalized insights |
| `export_requests` | Track CSV/PDF/Excel export jobs |

**Key fields on `users` table**:
- `preferred_mode` — `'simple'` or `'detailed'`
- `user_types` — JSONB array e.g. `['student', 'freelancer']`
- `accessibility_settings` — JSONB: fontSize, darkMode, highContrast, screenReader, voiceInput
- `language` — `'en'`, `'es'`, `'fr'`, `'ar'`

---

## API Endpoints

### Auth
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh-token`

### User/Settings
- `GET /users/profile`
- `PUT /users/profile`
- `PUT /users/settings/mode`
- `PUT /users/settings/user-types`
- `PUT /users/settings/accessibility`

### Transactions
- `POST /transactions`
- `GET /transactions` (with filters, pagination)
- `PUT /transactions/:id`
- `DELETE /transactions/:id`
- `POST /transactions/upload-receipt`
- `GET /transactions/recurring`

### Categories
- `GET /categories`
- `POST /categories`
- `GET /subcategories/:categoryId`

### Budgets
- `POST /budgets`
- `GET /budgets`
- `PUT /budgets/:id`
- `DELETE /budgets/:id`
- `GET /budgets/:id/progress`

### Dashboard & Analytics
- `GET /dashboard` — mode-aware response (simple vs detailed)
- `GET /insights`
- `GET /analytics/spending-patterns`
- `GET /analytics/category-trends`

### Goals
- `POST /goals` | `GET /goals` | `PUT /goals/:id` | `DELETE /goals/:id`

### Group Expenses
- `POST /group-expenses`
- `GET /group-expenses`
- `POST /group-expenses/:id/add-member`
- `POST /group-expenses/:id/settle`
- `GET /group-expenses/:id/calculations`

### Shared Budgets
- `POST /shared-budgets`
- `GET /shared-budgets`
- `POST /shared-budgets/:id/invite`
- `GET /shared-budgets/:id/summary`

### Subscriptions
- `POST /subscriptions` | `GET /subscriptions` | `PUT /subscriptions/:id` | `DELETE /subscriptions/:id`

### Exports
- `POST /exports/csv` | `POST /exports/pdf` | `POST /exports/excel`
- `GET /exports/:id/download`

---

## Mode System — Core Rules

### Simple Mode
- Navigation: 4 tabs — Home, Add, Budget, Settings
- Dashboard: Total spent, budget remaining, last 5 transactions, one CTA
- Add Transaction: Amount + Category only (3 fields max)
- No charts, no trends, no goals, no analytics

### Detailed Mode
- Navigation: 5+ tabs + More menu (12 screens total)
- Dashboard: Pie chart, budget per category, 6-month trend, insights, goals
- Add Transaction: Amount, date, category+subcategory, merchant, payment method, receipt, notes, recurring
- Full analytics, goals, subscriptions, group expenses, exports

### Mode-Aware Backend
The `GET /dashboard` endpoint returns different payloads depending on `?mode=simple|detailed`. The `modeMiddleware.js` attaches `req.userMode` to every request from the user's saved preference or query param.

### Switching Modes
- User can switch anytime in Settings
- No data is deleted on switch — only UI changes
- The `RootNavigator` re-renders `<SimpleNavigator>` or `<DetailedNavigator>` based on `ModeContext`

---

## User Types & Personas

Defined during onboarding (multi-select). Controls which user-type-specific features show up even within Simple/Detailed mode:

| User Type | Special Features |
|---|---|
| Student | Basic budget, group expense splitting |
| Parent | Kid tracking, chore rewards, parent controls |
| Self-Employed / Freelancer | Tax estimation, deductible expenses, mileage log, invoice tracking |
| Gig Worker | Multi-income source tracking |
| Retired / Fixed Income | Medical expense tracking, fraud alerts |
| Low Income | Bill reminders, free resource links |
| Immigrating | Multi-currency, guidance features |
| Debt Focus | Debt payoff strategy |

---

## Onboarding Flow (5 Steps)

1. **Create Account** — name, email, password, confirm password
2. **Select User Types** — multi-select checkboxes
3. **Choose Mode** — Simple vs Detailed (with descriptions)
4. **Accessibility Preferences** — font size, dark mode, high contrast, voice
5. **Language & First Budget** — language selector, monthly budget amount

---

## Security Requirements

- Passwords hashed with bcrypt (salt rounds: 10)
- JWT access tokens expire in 15 minutes; use refresh tokens
- HTTPS only in production
- Rate limiting on all API routes
- SQL injection prevention (parameterized queries)
- No secrets in source code — use `.env`
- Secure AsyncStorage for tokens on device
- GDPR compliance: no sensitive data in logs

---

## Accessibility Standards

- WCAG AA compliance
- Minimum touch target: 44×44px (buttons: 56–60px)
- Minimum font size: 14pt (scalable to 24pt+)
- High contrast mode
- Screen reader support
- Works without color alone (icons + labels)
- Voice input option

---

## Default Categories (Seeded)

Groceries, Dining Out, Shopping, Transportation, Entertainment, Health, Utilities, Other

Each has sub-categories (e.g., Groceries → Produce, Dairy, Meat, Snacks)

---

## Development Commands

```bash
# Frontend
cd frontend
npm install          # install deps (already done)
npx expo start       # start Expo dev server

# Backend
cd backend
npm install          # install deps (already done)
cp .env.example .env # then edit .env with your DB password
npm run dev          # start with nodemon (auto-restart)
# or: node src/server.js

# Database
createdb finance_tracker                         # create DB
psql -d finance_tracker -f database/schema.sql   # create 15 tables
psql -d finance_tracker -f database/seed.sql     # seed categories
```

## Build Progress

### ✅ Phase 1 — Foundation (Weeks 1–2) — COMPLETE
- Expo project scaffolded, all folders created
- All Context providers: AuthContext, ModeContext, AccessibilityContext
- Navigation: RootNavigator, SimpleNavigator, DetailedNavigator, AuthNavigator
- Styles: colors.js, spacing.js, typography.js
- Services: api.js (Axios + JWT interceptor + auto token refresh)
- Utils: constants.js, formatters.js

### ✅ Phase 2 — Auth & Onboarding (Weeks 3–4) — COMPLETE
- **Frontend**: LoginScreen + 5-step SignupScreen (all steps functional)
- **Backend**: Full Express server on port 5000
  - `POST /auth/signup` — bcrypt hash, JWT + refresh token
  - `POST /auth/login` — bcrypt compare, token pair
  - `POST /auth/logout` — clears refresh token
  - `POST /auth/refresh-token` — issues new token pair
  - Auth middleware (JWT verify), Mode middleware (attaches req.userMode)
  - `GET/PUT /users/profile`, `PUT /users/settings/mode|user-types|accessibility`
- **Database**: All 15 tables, indexes, materialized views, seeded categories

### ✅ Phase 3 — Transactions & Categories (Weeks 5–6) — COMPLETE
- **Backend**:
  - `POST/GET/PUT/DELETE /transactions` (pagination, filters, search)
  - `GET /transactions/recurring`
  - `GET/POST /categories` (system defaults + user custom)
  - `GET /categories/subcategories/:id`
  - Auto budget-exceeded insight on transaction save
- **Frontend**:
  - SimpleAddTransaction → calls `POST /transactions`
  - transactionService.js, categoryService.js, dashboardService.js, budgetService.js

### ✅ Phase 4 — Dashboard & Budget (Weeks 7–8) — COMPLETE
- **Backend**:
  - `GET /dashboard` — mode-aware (simple vs detailed response)
  - `POST/GET/PUT/DELETE /budgets`, `GET /budgets/:id/progress`
  - Goals, Subscriptions, Group Expenses, Analytics, Exports routes (full CRUD)
- **Frontend**:
  - SimpleDashboard → calls `GET /dashboard?mode=simple` (real data)
  - SimpleBudget → calls `GET/POST/PUT /budgets` (real data)
  - API interceptor with automatic JWT refresh on 401

### ✅ Phase 5 — Goals, Insights, Analytics (Weeks 9–10) — COMPLETE
- **Frontend** (all wired to real API):
  - DetailedDashboard → `GET /dashboard?mode=detailed` (summary, categories, goals strip, trend, recent txns)
  - DetailedAddTransaction → `POST /transactions` + live categories from `GET /categories`
  - DetailedBudget → `GET/PUT /budgets` + add category budget form
  - GoalsScreen → `GET/POST/PUT/DELETE /goals` + contribute modal
  - SubscriptionsScreen → `GET/POST/PUT/DELETE /subscriptions` + add modal + pause/resume
  - AnalyticsScreen → `GET /analytics/spending-patterns` (period selector: 3M/6M/1Y/All)
- **New services**: goalsService.js, subscriptionsService.js, analyticsService.js

### 🔜 Phase 6 — Group Expenses, Exports, Deploy (Weeks 11–12)
- GroupExpensesScreen → real API
- Export jobs (CSV/PDF/Excel)
- Receipt OCR (Google Vision)
- Production deployment

---

## MVP Scope (Weeks 1–12)

**Phase 1 (MVP) — Build These First**:
1. User authentication (signup, login, JWT)
2. Manual transaction entry (Simple + Detailed forms)
3. Receipt photo upload + OCR extraction
4. Category + subcategory system
5. Basic dashboard (both modes)
6. Budget creation and progress tracking

**Phase 2 — After MVP**:
- Goals, subscriptions, insights, recurring transactions, advanced analytics

**Phase 3 — Advanced**:
- Group expense splitting, shared budgets, exports, bank integration (Plaid)

---

## Success Metrics

- App loads < 3 seconds
- Dashboard loads < 1 second
- Add transaction < 30 seconds
- Signup < 2 minutes
- No crashes in beta testing
- NPS score > 7
- Simple Mode confusion rate < 5%
