export interface Customer {
  id: number;
  external_id: string;
  name: string;
  email: string;
  city: string;
  state: string;
  is_active: boolean;
  transaction_count: number;
}


export interface CustomerDetails extends Customer {
  created_at: string;
  updated_at: string;
}


export interface GetCustomersParams {
  page?: number;
  page_size?: number;
  search?: string;
  state?: string;
  is_active?: boolean;
  ordering?: string;
}
