import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokenFromSso } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const next = searchParams.get("next") || "/";
    if (!token) {
      setError("Missing sign-in token");
      return;
    }
    setTokenFromSso(token)
      .then(() => navigate(next, { replace: true }))
      .catch((e) => setError(e instanceof Error ? e.message : "Sign-in failed"));
  }, [searchParams, navigate, setTokenFromSso]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {error ? (
        <div className="card p-6 max-w-sm text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/login" className="btn-primary">
            Back to login
          </a>
        </div>
      ) : (
        <>
          <div className="animate-spin w-10 h-10 border-2 border-cmu-red border-t-transparent rounded-full mb-4" />
          <p className="text-stone-600">Completing CMU sign-in…</p>
        </>
      )}
    </div>
  );
}
