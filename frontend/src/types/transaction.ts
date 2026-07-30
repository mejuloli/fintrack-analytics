export interface TransactionCustomer {
  id: number;
  external_id: string;
  name: string;
}

export interface Transaction {
  id: number;
  external_id: string;
  customer: TransactionCustomer;
  transaction_date: string;
  amount: string;
  category: string;
  category_label: string;
  transaction_type: string;
  transaction_type_label: string;
  channel: string;
  channel_label: string;
  status: string;
  status_label: string;
  city: string;
  state: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ChoiceOption {
  value: string;
  label: string;
}

export interface TransactionOptions {
  categories: ChoiceOption[];
  transaction_types: ChoiceOption[];
  channels: ChoiceOption[];
  statuses: ChoiceOption[];
}

export interface TransactionFilters {
  page: number;
  page_size: number;
  search?: string;
  customer?: string;
  status?: string;
  category?: string;
  channel?: string;
  transaction_type?: string;
  state?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: string;
  max_amount?: string;
  ordering?: string;
}
