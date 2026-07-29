import {
  lazy,
  Suspense,
} from "react";
import {
  Flex,
  Spin,
} from "antd";
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AppLayout } from "./components/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";


const DashboardPage = lazy(
  () => import("./pages/DashboardPage"),
);

const TransactionsPage = lazy(
  () => import("./pages/TransactionsPage"),
);


function PageLoader() {
  return (
    <Flex
      align="center"
      justify="center"
      style={{
        minHeight: 240,
      }}
    >
      <Spin size="large" />
    </Flex>
  );
}


function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />

            <Route
              path="/transactions"
              element={<TransactionsPage />}
            />
          </Route>
        </Route>

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
      </Routes>
    </Suspense>
  );
}


export default App;
