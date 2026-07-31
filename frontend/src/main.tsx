import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
} from "react-router-dom";
import {
  App as AntApp,
  ConfigProvider,
} from "antd";
import ptBR from "antd/locale/pt_BR";

import App from "./App";
import { AuthProvider } from "./contexts/AuthProvider";

import "./index.css";


createRoot(
  document.getElementById("root")!,
).render(
  <StrictMode>
    <ConfigProvider
      locale={ptBR}
      theme={{
        token: {
          colorPrimary: "#2563eb",
          colorInfo: "#2563eb",
          colorSuccess: "#16a34a",
          colorWarning: "#d97706",
          colorError: "#dc2626",
          colorText: "#0f172a",
          colorTextSecondary: "#64748b",
          colorBorder: "#dbe3ee",
          colorBgLayout: "#f4f7fb",
          colorBgContainer: "#ffffff",
          borderRadius: 10,
          borderRadiusLG: 14,
          controlHeight: 40,
          fontFamily: [
            "Inter",
            "system-ui",
            "-apple-system",
            "BlinkMacSystemFont",
            '"Segoe UI"',
            "sans-serif",
          ].join(", "),
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
);
