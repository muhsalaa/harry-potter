import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";

import { useAuth } from "../auth/auth-context";
import { signUpHref, useNextDestination } from "../auth/next";
import { Button } from "../components/button";
import { Field } from "../components/field";
import { PageHead } from "../components/page-head";

export function LoginPage() {
  const { status, user, signIn } = useAuth();
  const next = useNextDestination();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === "authenticated" && user) {
    return <Navigate to={next} replace />;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await signIn(email, password);
      navigate(next, { replace: true });
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Signing in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead
        title="Sign in"
        lede="An account exists here for one reason: a favorite and a note need an owner. Nothing you mark is ever shown to anyone else."
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
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            disabled={busy}
          />

          <div className="flex flex-wrap items-center gap-6">
            <Button type="submit" loading={busy} disabled={!email || !password}>
              Sign in
            </Button>
            <Link to={signUpHref(next)} className="label text-accent underline">
              Create an account
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
