import { api } from "./api";
import type { PaginatedResponse } from "../types/api";
import type {
  Transaction,
  TransactionFilters,
  TransactionOptions,
} from "../types/transaction";


function removeEmptyParameters(
  filters: TransactionFilters,
) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== "",
    ),
  );
}


export async function getTransactions(
  filters: TransactionFilters,
) {
  const response = await api.get<
    PaginatedResponse<Transaction>
  >("/transactions/", {
    params: removeEmptyParameters(filters),
  });

  return response.data;
}


export async function getTransactionOptions() {
  const response = await api.get<TransactionOptions>(
    "/transactions/options/",
  );

  return response.data;
}
