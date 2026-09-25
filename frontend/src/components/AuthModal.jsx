import { useState } from "react";
import {
  X,
  Leaf,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();

  // =====================================================
  // AUTH MODE
  // =====================================================

  const [mode, setMode] = useState("login");

  // =====================================================
  // FORM DATA
  // =====================================================

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    preferred_language: "en",
  });

  // =====================================================
  // UI STATES
  // =====================================================

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const handleClose = () => {
    if (loading) {
      return;
    }

    setError("");
    setShowPassword(false);

    onClose();
  };

  // =====================================================
  // CHANGE LOGIN / REGISTER MODE
  // =====================================================

  const switchMode = (newMode) => {
    setMode(newMode);
    setError("");
  };

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    // -----------------------------------------------------
    // BASIC VALIDATION
    // -----------------------------------------------------

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    if (mode === "register" && !formData.full_name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    try {
      setLoading(true);

      // ===================================================
      // LOGIN
      // ===================================================

      if (mode === "login") {
        await login(
          formData.email,
          formData.password
        );

        // AuthContext stores:
        // access_token
        // user

        handleClose();

        return;
      }

      // ===================================================
      // REGISTER
      // ===================================================

      await register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        preferred_language: formData.preferred_language,
      });

      // ---------------------------------------------------
      // Registration successful
      // ---------------------------------------------------

      // Switch to login so user can sign in.
      setMode("login");

      setError("");

      setFormData((previous) => ({
        ...previous,
        password: "",
      }));

    } catch (err) {
      console.error("Authentication error:", err);

      setError(
        err?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // DON'T RENDER WHEN CLOSED
  // =====================================================

  if (!isOpen) {
    return null;
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >

      {/* =================================================
          MODAL
      ================================================= */}

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#D9E1D6] bg-white shadow-2xl">

        {/* =================================================
            CLOSE BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-xl text-[#748078] transition hover:bg-[#F1F4EF] hover:text-[#203126] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Close authentication"
        >
          <X size={19} />
        </button>


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="px-6 pb-5 pt-7 sm:px-8">

          {/* Logo */}

          <div className="flex items-center gap-3">

            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#285C38] text-white">
              <Leaf size={22} />
            </div>

            <div>

              <p className="text-base font-bold text-[#203126]">
                AgriPredict
              </p>

              <p className="text-[10px] font-medium text-[#77907D]">
                Agricultural Intelligence
              </p>

            </div>

          </div>


          {/* Heading */}

          <div className="mt-6">

            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#77907D]">
              {mode === "login"
                ? "Welcome back"
                : "Get started"}
            </p>

            <h2 className="mt-1.5 text-2xl font-bold tracking-[-0.03em] text-[#203126]">

              {mode === "login"
                ? "Sign in to your account"
                : "Create your account"}

            </h2>

            <p className="mt-2 text-sm leading-6 text-[#748078]">

              {mode === "login"
                ? "Sign in to access your crop analysis and scan history."
                : "Create an account to save your plant scans and predictions."}

            </p>

          </div>

        </div>


        {/* =================================================
            LOGIN / SIGNUP TABS
        ================================================= */}

        <div className="px-6 sm:px-8">

          <div className="flex rounded-xl bg-[#F1F4EF] p-1">

            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-white text-[#285C38] shadow-sm"
                  : "text-[#748078] hover:text-[#405148]"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === "register"
                  ? "bg-white text-[#285C38] shadow-sm"
                  : "text-[#748078] hover:text-[#405148]"
              }`}
            >
              Sign up
            </button>

          </div>

        </div>


        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="px-6 pb-7 pt-6 sm:px-8"
        >

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#F1D5B8] bg-[#FFF8ED] p-3.5">

              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#FCEBCF] text-[#B97828]">
                <AlertCircle size={17} />
              </div>

              <div>

                <p className="text-sm font-bold text-[#79521E]">
                  {mode === "login"
                    ? "Login failed"
                    : "Registration failed"}
                </p>

                <p className="mt-1 text-xs leading-5 text-[#98764A]">
                  {error}
                </p>

              </div>

            </div>
          )}


          {/* =================================================
              FULL NAME — REGISTER ONLY
          ================================================= */}

          {mode === "register" && (
            <div className="mb-4">

              <label
                htmlFor="auth-full-name"
                className="mb-2 block text-sm font-semibold text-[#33463A]"
              >
                Full name
              </label>

              <div className="relative">

                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9A8E]"
                />

                <input
                  id="auth-full-name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className="w-full rounded-xl border border-[#D9E1D6] bg-white py-3.5 pl-11 pr-4 text-sm text-[#203126] outline-none transition placeholder:text-[#A0AAA3] focus:border-[#4E8755] focus:ring-2 focus:ring-[#4E8755]/10"
                />

              </div>

            </div>
          )}


          {/* =================================================
              EMAIL
          ================================================= */}

          <div className="mb-4">

            <label
              htmlFor="auth-email"
              className="mb-2 block text-sm font-semibold text-[#33463A]"
            >
              Email
            </label>

            <div className="relative">

              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9A8E]"
              />

              <input
                id="auth-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                autoComplete="email"
                className="w-full rounded-xl border border-[#D9E1D6] bg-white py-3.5 pl-11 pr-4 text-sm text-[#203126] outline-none transition placeholder:text-[#A0AAA3] focus:border-[#4E8755] focus:ring-2 focus:ring-[#4E8755]/10"
              />

            </div>

          </div>


          {/* =================================================
              PASSWORD
          ================================================= */}

          <div className="mb-5">

            <label
              htmlFor="auth-password"
              className="mb-2 block text-sm font-semibold text-[#33463A]"
            >
              Password
            </label>

            <div className="relative">

              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9A8E]"
              />

              <input
                id="auth-password"
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete={
                  mode === "login"
                    ? "current-password"
                    : "new-password"
                }
                className="w-full rounded-xl border border-[#D9E1D6] bg-white py-3.5 pl-11 pr-12 text-sm text-[#203126] outline-none transition placeholder:text-[#A0AAA3] focus:border-[#4E8755] focus:ring-2 focus:ring-[#4E8755]/10"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (previous) => !previous
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A9A8E] transition hover:text-[#285C38]"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >

                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}

              </button>

            </div>

          </div>


          {/* =================================================
              REGISTER LANGUAGE
          ================================================= */}

          {mode === "register" && (
            <div className="mb-5">

              <label
                htmlFor="auth-language"
                className="mb-2 block text-sm font-semibold text-[#33463A]"
              >
                Preferred language
              </label>

              <select
                id="auth-language"
                name="preferred_language"
                value={formData.preferred_language}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#D9E1D6] bg-white px-4 py-3.5 text-sm text-[#203126] outline-none transition focus:border-[#4E8755] focus:ring-2 focus:ring-[#4E8755]/10"
              >

                <option value="en">
                  English
                </option>

              </select>

            </div>
          )}


          {/* =================================================
              SUBMIT BUTTON
          ================================================= */}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#285C38] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#214D2F] disabled:cursor-not-allowed disabled:opacity-60"
          >

            {loading ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />

                {mode === "login"
                  ? "Signing in..."
                  : "Creating account..."}
              </>
            ) : (
              mode === "login"
                ? "Sign In"
                : "Create Account"
            )}

          </button>


          {/* =================================================
              SWITCH MODE
          ================================================= */}

          <p className="mt-5 text-center text-xs text-[#748078]">

            {mode === "login" ? (
              <>
                Don't have an account?{" "}

                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="font-bold text-[#285C38] hover:text-[#214D2F]"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}

                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-bold text-[#285C38] hover:text-[#214D2F]"
                >
                  Login
                </button>
              </>
            )}

          </p>

        </form>

      </div>

    </div>
  );
}

export default AuthModal;