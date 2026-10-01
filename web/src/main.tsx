import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router";

import { AuthProvider } from "./auth/AuthContext";
import { queryClient } from "./query";
import { AppRoutes } from "./routes";
import "./styles/index.css";

const root = document.getElementById("root");
if (!root) throw new Error("No #root element in index.html.");

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
