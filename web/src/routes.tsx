import { Route, Routes } from "react-router";

import { App } from "./app";
import { CharacterPage } from "./pages/character-page";
import { FavoritesPage } from "./pages/favorites-page";
import { HomePage } from "./pages/home-page";
import { LoginPage } from "./pages/login-page";
import { NotFoundPage } from "./pages/not-found-page";
import { RegisterPage } from "./pages/register-page";

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
