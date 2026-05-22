import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Swipe from "./pages/Swipe";
import Matches from "./pages/Matches";
import Likes from "./pages/Likes";
import Chat from "./pages/Chat";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="animate-spin w-10 h-10 border-2 border-cmu-red border-t-transparent rounded-full" />
        <p className="text-sm text-stone-500">Loading your session…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user && !user.onboardingComplete) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />
      <Route path="/" element={<Protected><OnboardingGate><Layout /></OnboardingGate></Protected>}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="swipe" element={<Swipe />} />
        <Route path="likes" element={<Likes />} />
        <Route path="matches" element={<Matches />} />
        <Route path="matches/:matchId/chat" element={<Chat />} />
        <Route path="profile" element={<Dashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
