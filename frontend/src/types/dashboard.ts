export interface DashboardPeriod {
  days: number;
  start_date: string;
  end_date: string;
}


export interface DashboardSummary {
  total_customers: number;
  active_customers: number;
  customers_with_transactions: number;
  total_transactions: number;
  total_amount: string;
  approved_transactions: number;
  approved_amount: string;
  average_ticket: string;
  approval_rate: number;
}


export interface DashboardDistributionItem {
  value: string;
  label: string;
  count: number;
  amount: string;
}


export interface DashboardDailyItem {
  date: string;
  count: number;
  amount: string;
}


export interface DashboardAnalytics {
  period: DashboardPeriod;
  summary: DashboardSummary;
  by_status: DashboardDistributionItem[];
  by_category: DashboardDistributionItem[];
  daily: DashboardDailyItem[];
}
