import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth as authApi } from "../api/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authConfig, setAuthConfig] = useState<{
    cmuSsoEnabled: boolean;
    cmuLoginUrl: string | null;
    devPasswordLogin: boolean;
  } | null>(null);
  const { login } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "cmu_login_failed") {
      setError("CMU sign-in failed. Try again or contact support.");
    }
    authApi.config().then(setAuthConfig).catch(() => setAuthConfig({ cmuSsoEnabled: false, cmuLoginUrl: null, devPasswordLogin: true }));
  }, [searchParams]);

  const handleCmuLogin = () => {
    window.location.href = authConfig?.cmuLoginUrl ?? "/api/auth/cmu/login";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50/40 to-stone-200">
      <div className="page-shell min-h-screen grid lg:grid-cols-2 gap-8 lg:gap-12 py-10 lg:py-16 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 chip bg-white border border-stone-200 text-stone-700">
            <span className="w-2 h-2 rounded-full bg-cmu-red" />
            Built for Carnegie Mellon
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-stone-900 leading-tight">
            Find your roommate.
            <span className="text-cmu-red"> Not your stress.</span>
          </h1>
          <p className="text-lg text-stone-600 max-w-lg">
            Rank dorms, match on lifestyle, and chat after a mutual like — whether you are on-campus or
            off-campus at CMU.
          </p>
          <ul className="grid sm:grid-cols-2 gap-3 text-sm text-stone-700">
            {[
              "Dorm ranking for on-campus",
              "Neighborhood + budget for off-campus",
              "Real compatibility scoring",
              "Chat after a mutual match",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 card px-3 py-2.5">
                <span className="text-cmu-red mt-0.5">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="card-elevated p-6 sm:p-8 w-full max-w-md mx-auto lg:ml-auto">
          <h2 className="font-display text-xl font-semibold text-stone-900 mb-1">Sign in</h2>
          <p className="text-sm text-stone-500 mb-6">Use your Andrew ID via CMU Web Login</p>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">
              {error}
            </div>
          )}

          <button type="button" onClick={handleCmuLogin} className="btn-primary w-full mb-4">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.2l7.5 3.75L12 11.7 4.5 7.95 12 4.2zM4 9.1l7 3.5V20l-7-3.5V9.1zm9 7.4V12.6l7-3.5V16.5l-7 3.5z" />
            </svg>
            Sign in with CMU
          </button>

          {authConfig?.devPasswordLogin && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-stone-500">Dev login only</span>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  placeholder="you@andrew.cmu.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-red-200 focus:border-cmu-red outline-none"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-red-200 focus:border-cmu-red outline-none"
                />
                <button type="submit" disabled={loading} className="btn-secondary w-full">
                  {loading ? "Signing in…" : "Dev sign in"}
                </button>
                <p className="text-xs text-stone-500 text-center">
                  Seeded: alice@cmu.edu / password123
                </p>
              </form>
            </>
          )}

          {!authConfig?.devPasswordLogin && (
            <p className="text-xs text-stone-500 text-center mt-4">
              Password login is disabled in production. Only CMU SSO is accepted.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
