import {
  CloudSun,
  History,
  Leaf,
  LogOut,
  ScanLine,
  Settings,
  User,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

function Sidebar({ mobileMenuOpen, setMobileMenuOpen }) {
  const navigate = useNavigate();

  const goTo = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col bg-[#123521] text-white lg:flex">

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-7">

          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#9BD98E]/15 text-[#A9DD9B]">
            <Leaf size={20} strokeWidth={2.2} />
          </div>

          <span className="text-lg font-bold tracking-tight">
            AgriPredict
          </span>

        </div>

        {/* Main navigation */}
        <nav className="flex flex-col gap-1 px-4">

          <NavItem
            icon={<Leaf size={19} />}
            label="Dashboard"
            onClick={() => goTo("/dashboard")}
            active
          />

          

          <NavItem
            icon={<History size={19} />}
            label="History"
            onClick={() => goTo("/history")}
          />

          <NavItem
            icon={<CloudSun size={19} />}
            label="Weather"
            onClick={() => goTo("/weather")}
          />

          <NavItem
            icon={<User size={19} />}
            label="Profile"
            onClick={() => goTo("/profile")}
          />

        </nav>

        {/* Bottom navigation */}
        <div className="mt-auto flex flex-col gap-1 px-4 pb-6">

          <NavItem
            icon={<Settings size={19} />}
            label="Settings"
            onClick={() => goTo("/settings")}
          />

          <NavItem
            icon={<LogOut size={19} />}
            label="Logout"
            onClick={() => goTo("/login")}
          />

        </div>
      </aside>

      {/* =====================================================
          MOBILE SIDEBAR
      ===================================================== */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          <aside className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#123521] text-white lg:hidden">

            {/* Mobile header */}
            <div className="flex items-center justify-between px-6 py-7">

              <div className="flex items-center gap-3">

                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#9BD98E]/15 text-[#A9DD9B]">
                  <Leaf size={20} />
                </div>

                <span className="text-lg font-bold">
                  AgriPredict
                </span>

              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>

            </div>

            {/* Mobile navigation */}
            <nav className="flex flex-col gap-1 px-4">

              <NavItem
                icon={<Leaf size={19} />}
                label="Dashboard"
                onClick={() => goTo("/dashboard")}
                active
              />

              <NavItem
                icon={<ScanLine size={19} />}
                label="Scan"
                onClick={() => goTo("/scan")}
              />

              <NavItem
                icon={<History size={19} />}
                label="History"
                onClick={() => goTo("/history")}
              />

              <NavItem
                icon={<CloudSun size={19} />}
                label="Weather"
                onClick={() => goTo("/weather")}
              />

              <NavItem
                icon={<User size={19} />}
                label="Profile"
                onClick={() => goTo("/profile")}
              />

            </nav>

            {/* Mobile bottom navigation */}
            <div className="mt-auto flex flex-col gap-1 px-4 pb-6">

              <NavItem
                icon={<Settings size={19} />}
                label="Settings"
                onClick={() => goTo("/settings")}
              />

              <NavItem
                icon={<LogOut size={19} />}
                label="Logout"
                onClick={() => goTo("/login")}
              />

            </div>

          </aside>
        </>
      )}
    </>
  );
}


/* =========================================================
   NAVIGATION ITEM
========================================================= */

function NavItem({
  icon,
  label,
  active = false,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex w-full items-center gap-3 rounded-xl px-3 py-3
        text-sm font-medium transition
        ${
          active
            ? "bg-[#8EBE80]/20 text-white"
            : "text-white/65 hover:bg-white/[0.07] hover:text-white"
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default Sidebar;