export const BILL_CATEGORIES = [
  { value: "ELECTRIC", label: "Electric" },
  { value: "WATER", label: "Water" },
  { value: "GAS", label: "Gas" },
  { value: "INTERNET", label: "Internet" },
  { value: "PHONE", label: "Phone" },
  { value: "RENT", label: "Rent" },
  { value: "MORTGAGE", label: "Mortgage" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "CUSTOM", label: "Custom" },
] as const;

export const DEBT_TYPES = [
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "STUDENT_LOAN", label: "Student Loan" },
  { value: "MORTGAGE", label: "Mortgage" },
  { value: "CAR_LOAN", label: "Car Loan" },
  { value: "PERSONAL_LOAN", label: "Personal Loan" },
  { value: "MEDICAL", label: "Medical" },
  { value: "OTHER", label: "Other" },
] as const;

export const SUB_CATEGORIES = [
  { value: "ENTERTAINMENT", label: "Entertainment" },
  { value: "PRODUCTIVITY", label: "Productivity" },
  { value: "HEALTH", label: "Health" },
  { value: "EDUCATION", label: "Education" },
  { value: "NEWS", label: "News" },
  { value: "CLOUD", label: "Cloud" },
  { value: "OTHER", label: "Other" },
] as const;

export const MAINTENANCE_TYPES = [
  { value: "OIL_CHANGE", label: "Oil Change" },
  { value: "TIRE_ROTATION", label: "Tire Rotation" },
  { value: "BRAKE_SERVICE", label: "Brake Service" },
  { value: "INSPECTION", label: "Inspection" },
  { value: "REGISTRATION", label: "Registration" },
  { value: "TUNE_UP", label: "Tune Up" },
  { value: "CUSTOM", label: "Custom" },
] as const;

export const REMINDER_CATEGORIES = [
  { value: "CAR", label: "Car" },
  { value: "HOME", label: "Home" },
  { value: "HEALTH", label: "Health" },
  { value: "PET", label: "Pet" },
  { value: "DOCUMENT", label: "Document" },
  { value: "FINANCIAL", label: "Financial" },
  { value: "CUSTOM", label: "Custom" },
] as const;

export const RECURRENCE_OPTIONS = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Bi-Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
  { value: "CUSTOM", label: "Custom" },
] as const;

export const BUDGET_PERIODS = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Bi-Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "CUSTOM", label: "Custom" },
] as const;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/bills", label: "Bills", icon: "FileText" },
  { href: "/budget", label: "Budget", icon: "PiggyBank" },
  { href: "/debts", label: "Debts", icon: "CreditCard" },
  { href: "/subscriptions", label: "Subscriptions", icon: "RefreshCw" },
  { href: "/spending", label: "Spending", icon: "TrendingUp" },
  { href: "/birthdays", label: "Birthdays", icon: "Cake" },
  { href: "/vehicles", label: "Vehicles", icon: "Car" },
  { href: "/reminders", label: "Reminders", icon: "Bell" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const;
