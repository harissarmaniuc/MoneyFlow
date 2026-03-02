import { createTRPCRouter } from "./index";
import { billsRouter } from "./routers/bills";
import { budgetsRouter } from "./routers/budgets";
import { expensesRouter } from "./routers/expenses";
import { debtsRouter } from "./routers/debts";
import { subscriptionsRouter } from "./routers/subscriptions";
import { contactsRouter } from "./routers/contacts";
import { giftsRouter } from "./routers/gifts";
import { vehiclesRouter } from "./routers/vehicles";
import { remindersRouter } from "./routers/reminders";
import { notificationsRouter } from "./routers/notifications";
import { settingsRouter } from "./routers/settings";
import { analyticsRouter } from "./routers/analytics";

export const appRouter = createTRPCRouter({
  bills: billsRouter,
  budgets: budgetsRouter,
  expenses: expensesRouter,
  debts: debtsRouter,
  subscriptions: subscriptionsRouter,
  contacts: contactsRouter,
  gifts: giftsRouter,
  vehicles: vehiclesRouter,
  reminders: remindersRouter,
  notifications: notificationsRouter,
  settings: settingsRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
