import { Router } from "express";

import type { Services } from "../../application/services.ts";
import { caller, clearSessionCookie, setSessionCookie, signedIn } from "../session.ts";

export function authRouter(services: Services): Router {
  const router = Router();

  router.post("/auth/register", async (req, res) => {
    const { user, token } = await services.accounts.register(
      String(req.body?.email ?? ""),
      String(req.body?.password ?? ""),
    );

    setSessionCookie(res, token);
    res.status(201).json({ user });
  });

  router.post("/auth/login", async (req, res) => {
    const { user, token } = await services.accounts.login(
      String(req.body?.email ?? ""),
      String(req.body?.password ?? ""),
    );

    setSessionCookie(res, token);
    res.json({ user });
  });

  router.post("/auth/logout", (req, res) => {
    services.accounts.logout(caller(req).token);
    clearSessionCookie(res);
    res.status(204).end();
  });

  router.get("/me", (req, res) => {
    res.json({ user: signedIn(req) });
  });

  return router;
}
