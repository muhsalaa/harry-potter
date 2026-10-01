import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import { AuthProvider } from "./auth/AuthContext";
import { AppRoutes } from "./routes";
import "./styles/index.css";

const root = document.getElementById("root");
if (!root) throw new Error("No #root element in index.html.");

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
