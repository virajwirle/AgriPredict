import {
  Bell,
  Menu,
  User,
  LogIn,
  ChevronDown,
  LogOut,
} from "lucide-react";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function Topbar({ onMenuClick, onAuthClick }) {
  const { user, isAuthenticated, logout } = useAuth();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    setProfileMenuOpen(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#D9E1D6] bg-[#F3F5EF]/95 backdrop-blur">

      <div className="flex h-[72px] items-center justify-between px-5 sm:px-8">

        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <div className="flex items-center gap-3">

          {/* Mobile menu */}

          <button
            type="button"
            onClick={onMenuClick}
            className="grid h-10 w-10 place-items-center rounded-xl text-[#506056] transition hover:bg-[#E8EDE5] lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={21} />
          </button>

          {/* Mobile page branding */}

          <div className="flex items-center gap-2 lg:hidden">

            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#285C38] text-white">
              <span className="text-lg">🌿</span>
            </div>

            <div className="hidden sm:block">

              <p className="text-sm font-bold text-[#203126]">
                AgriPredict
              </p>

              <p className="text-[10px] text-[#77907D]">
                Agricultural Intelligence
              </p>

            </div>

          </div>

        </div>


        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div className="flex items-center gap-2 sm:gap-3">

          {/* =================================================
              NOT AUTHENTICATED
          ================================================= */}

          {!isAuthenticated && (
            <button
              type="button"
              onClick={onAuthClick}
              className="inline-flex items-center gap-2 rounded-xl bg-[#285C38] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#214D2F]"
            >

              <LogIn size={17} />

              <span>
                Login / Sign up
              </span>

            </button>
          )}


          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          <button
            type="button"
            className="relative grid h-10 w-10 place-items-center rounded-xl text-[#506056] transition hover:bg-[#E8EDE5]"
            aria-label="Notifications"
          >

            <Bell size={19} />

            {/* Notification indicator */}

            <span className="absolute right-[9px] top-[8px] h-2 w-2 rounded-full bg-[#D47B45]" />

          </button>


          {/* =================================================
              AUTHENTICATED PROFILE
          ================================================= */}

          {isAuthenticated && (
            <div className="relative">

              <button
                type="button"
                onClick={() =>
                  setProfileMenuOpen(
                    (previous) => !previous
                  )
                }
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-[#E8EDE5]"
              >

                {/* Avatar */}

                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#285C38] text-white">

                  <User size={17} />

                </div>


                {/* User name */}

                <div className="hidden text-left sm:block">

                  <p className="max-w-[130px] truncate text-xs font-bold text-[#203126]">
                    {user?.full_name || "User"}
                  </p>

                  <p className="max-w-[130px] truncate text-[10px] text-[#77907D]">
                    {user?.email || ""}
                  </p>

                </div>


                <ChevronDown
                  size={16}
                  className={`hidden text-[#748078] transition sm:block ${
                    profileMenuOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />

              </button>


              {/* =================================================
                  PROFILE DROPDOWN
              ================================================= */}

              {profileMenuOpen && (
                <div className="absolute right-0 top-[52px] w-64 overflow-hidden rounded-2xl border border-[#D9E1D6] bg-white shadow-lg">

                  {/* User information */}

                  <div className="border-b border-[#E6EBE3] p-4">

                    <div className="flex items-center gap-3">

                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#285C38] text-white">

                        <User size={18} />

                      </div>

                      <div className="min-w-0">

                        <p className="truncate text-sm font-bold text-[#203126]">
                          {user?.full_name || "User"}
                        </p>

                        <p className="truncate text-xs text-[#7A877F]">
                          {user?.email || ""}
                        </p>

                      </div>

                    </div>

                  </div>


                  {/* Profile option */}

                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      window.location.href = "/profile";
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-[#425248] transition hover:bg-[#F3F6F1]"
                  >

                    <User size={17} />

                    Profile

                  </button>


                  {/* Logout */}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 border-t border-[#E6EBE3] px-4 py-3 text-left text-sm font-semibold text-[#A84B3D] transition hover:bg-[#FFF5F2]"
                  >

                    <LogOut size={17} />

                    Logout

                  </button>

                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </header>
  );
}

export default Topbar;