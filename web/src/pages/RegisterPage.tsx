import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";

import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { PageHead } from "../components/PageHead";
import { safeNext } from "./LoginPage";

export function RegisterPage() {
  const { status, user, register } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === "authenticated" && user) {
    return <Navigate to={safeNext(params.get("next"))} replace />;
  }

  const tooShort = password.length > 0 && password.length < 8;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await register(email, password);
      navigate(safeNext(params.get("next")), { replace: true });
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Creating the account failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead
        line="new account"
        title="Create an account"
        lede="An email address and a password. There is no verification email and no password reset in this build — remember what you typed."
      />

      <form onSubmit={submit} className="page-gutter pb-16">
        <div className="frame flex max-w-[32rem] flex-col gap-6 p-6">
          <Field
            id="email"
            label="Email address"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            disabled={busy}
          />
          <Field
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            hint="At least 8 characters."
            error={tooShort ? "That password is shorter than 8 characters." : null}
            disabled={busy}
          />

          <div className="flex flex-wrap items-center gap-6">
            <Button type="submit" loading={busy} disabled={!email || password.length < 8}>
              Create account
            </Button>
            <Link
              to={`/login?next=${encodeURIComponent(safeNext(params.get("next")))}`}
              className="label text-muted"
            >
              Sign in instead
            </Link>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          ) : null}
        </div>
      </form>
    </>
  );
}
