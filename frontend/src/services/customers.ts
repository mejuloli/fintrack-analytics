import { api } from "./api";
import type {
  PaginatedResponse,
} from "../types/api";
import type {
  Customer,
  CustomerDetails,
  GetCustomersParams,
} from "../types/customer";


export async function getCustomers(
  params: GetCustomersParams,
) {
  const response = await api.get<
    PaginatedResponse<Customer>
  >(
    "/customers/",
    {
      params,
    },
  );

  return response.data;
}


export async function getCustomer(
  customerId: number,
) {
  const response = await api.get<CustomerDetails>(
    `/customers/${customerId}/`,
  );

  return response.data;
}
