import { api } from "./api";
import type {
  DashboardAnalytics,
} from "../types/dashboard";


export async function getDashboardAnalytics(
  days: number,
) {
  const response = await api.get<DashboardAnalytics>(
    "/dashboard/analytics/",
    {
      params: {
        days,
      },
    },
  );

  return response.data;
}
