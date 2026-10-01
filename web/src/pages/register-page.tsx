import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";

import { useAuth } from "../auth/auth-context";
import { signInHref, useNextDestination } from "../auth/next";
import { Button } from "../components/button";
import { Field } from "../components/field";
import { PageHead } from "../components/page-head";

export function RegisterPage() {
  const { status, user, register } = useAuth();
  const next = useNextDestination();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === "authenticated" && user) {
    return <Navigate to={next} replace />;
  }

  const tooShort = password.length > 0 && password.length < 8;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await register(email, password);
      navigate(next, { replace: true });
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Creating the account failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead
        title="Create an account"
        lede="An email address and a password, nothing else. No message arrives in your inbox, so pick something you will remember."
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
            <Link to={signInHref(next)} className="label text-accent underline">
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
