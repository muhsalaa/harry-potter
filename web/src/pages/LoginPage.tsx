import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";

import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { PageHead } from "../components/PageHead";

/** Only same-site paths: a `next` that leaves the app is not honoured. */
export function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/favorites";
}

export function LoginPage() {
  const { status, user, signIn } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === "authenticated" && user) {
    return <Navigate to={safeNext(params.get("next"))} replace />;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await signIn(email, password);
      navigate(safeNext(params.get("next")), { replace: true });
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Signing in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead
        line="session"
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
            <Link to={`/register?next=${encodeURIComponent(safeNext(params.get("next")))}`} className="label text-muted">
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
