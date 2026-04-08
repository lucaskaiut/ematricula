export type DashboardKpi = {
  count: number;
  amount_sum: string;
};

export type DashboardUpcomingInvoice = {
  id: number;
  amount: string | null;
  due_date: string | null;
  status: string;
  enrollment_id: number | null;
  student: { id: number; full_name: string } | null;
  plan: { id: number; name: string } | null;
};

export type DashboardDelinquentStudent = {
  student: { id: number; full_name: string };
  overdue: { count: number; amount_sum: string };
  next_due_date: string | null;
};

export type DashboardSummary = {
  range: { today: string; until: string; days: number };
  kpis: {
    overdue: DashboardKpi;
    due_soon: DashboardKpi;
    paid_this_month: DashboardKpi;
  };
  lists: {
    upcoming_invoices: DashboardUpcomingInvoice[];
    delinquent_students: DashboardDelinquentStudent[];
  };
};

