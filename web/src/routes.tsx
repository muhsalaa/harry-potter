import { Route, Routes } from "react-router";

import { App } from "./App";
import { CharacterPage } from "./pages/CharacterPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RegisterPage } from "./pages/RegisterPage";

/**
 * The route table, owned by ticket 01. Feature slices fill in the page they own
 * rather than adding routes, so two slices can be built at the same time
 * without touching the same file.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<App />}>
        <Route index element={<HomePage />} />
        <Route path="characters/:slug" element={<CharacterPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
