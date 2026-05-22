import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const nav = [
  { to: "/home", label: "Home" },
  { to: "/swipe", label: "Swipe" },
  { to: "/likes", label: "Likes" },
  { to: "/matches", label: "Matches" },
  { to: "/profile", label: "Profile" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-100">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-stone-200 shadow-sm">
        <div className="page-shell h-16 flex items-center justify-between gap-4">
          <NavLink to="/home" className="flex items-center gap-2 shrink-0">
            <span className="w-8 h-8 rounded-lg bg-cmu-red flex items-center justify-center text-white text-xs font-bold">
              RM
            </span>
            <span className="font-display font-semibold text-stone-900 hidden sm:inline">Roommate Match</span>
          </NavLink>
          <nav className="flex items-center gap-0.5 sm:gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive ? "bg-red-50 text-cmu-red" : "text-stone-600 hover:bg-stone-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-stone-500 truncate max-w-[100px] sm:max-w-[160px] hidden md:inline">
              {user?.email}
            </span>
            <button type="button" onClick={handleLogout} className="text-sm text-stone-500 hover:text-cmu-red px-2">
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 page-shell py-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="border-t border-stone-200 bg-white py-4 text-center text-xs text-stone-500">
        Roommate Match · For CMU students
      </footer>
    </div>
  );
}
