import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-stone-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-display font-semibold text-stone-800">Roommate Match</span>
          <nav className="flex items-center gap-1">
            <NavLink
              to="/swipe"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium ${isActive ? "bg-amber-100 text-amber-800" : "text-stone-600 hover:bg-stone-100"}`
              }
            >
              Swipe
            </NavLink>
            <NavLink
              to="/matches"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium ${isActive ? "bg-amber-100 text-amber-800" : "text-stone-600 hover:bg-stone-100"}`
              }
            >
              Matches
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium ${isActive ? "bg-amber-100 text-amber-800" : "text-stone-600 hover:bg-stone-100"}`
              }
            >
              Profile
            </NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 truncate max-w-[120px]">{user?.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-stone-500 hover:text-stone-700"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
