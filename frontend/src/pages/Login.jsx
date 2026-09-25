import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Leaf,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  // =====================================================
  // FORM STATE
  // =====================================================

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // =====================================================
  // UI STATE
  // =====================================================

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  // =====================================================
  // REGISTER SUCCESS MESSAGE
  // =====================================================

  const [registerMessage, setRegisterMessage] = useState(
    location.state?.registered
      ? "Account created successfully. Please sign in."
      : ""
  );

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Clear errors while typing
    if (error) {
      setError("");
    }
  };

  // =====================================================
  // LOGIN
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setRegisterMessage("");

    // ---------------------------------------------------
    // BASIC VALIDATION
    // ---------------------------------------------------

    if (!formData.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!formData.password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      // -------------------------------------------------
      // CALL AUTH CONTEXT
      // -------------------------------------------------

      await login(
        formData.email.trim(),
        formData.password
      );

      // -------------------------------------------------
      // LOGIN SUCCESS
      // -------------------------------------------------

      navigate("/dashboard", {
        replace: true,
      });

    } catch (err) {
      console.error("Login error:", err);

      setError(
        err?.message ||
          "Unable to login. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F5EF]">

      <div className="grid min-h-screen lg:grid-cols-2">

        {/* =================================================
            LEFT BRAND SECTION
        ================================================= */}

        <div className="hidden bg-[#17442A] lg:flex">

          <div className="relative flex w-full flex-col justify-between overflow-hidden p-12 text-white">

            {/* Decorative circles */}

            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#3E7650]/30" />

            <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[#8DB58D]/10" />


            {/* Logo */}

            <div className="relative z-10 flex items-center gap-3">

              <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10">

                <Leaf size={23} />

              </div>

              <div>

                <p className="text-lg font-bold">
                  AgriPredict
                </p>

                <p className="text-xs text-[#C8D8CB]">
                  Agricultural Intelligence
                </p>

              </div>

            </div>


            {/* Main message */}

            <div className="relative z-10 max-w-lg">

              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#B9D3BD]">
                AI Plant Intelligence
              </p>

              <h1 className="text-4xl font-bold leading-tight xl:text-5xl">

                Smarter crop decisions,
                powered by AI.

              </h1>

              <p className="mt-5 max-w-md text-sm leading-7 text-[#C8D8CB]">

                Detect plant diseases, understand crop
                health, and receive intelligent recommendations
                from your agricultural AI assistant.

              </p>

            </div>


            {/* Footer */}

            <p className="relative z-10 text-xs text-[#AFC4B3]">

              AI-powered agricultural intelligence

            </p>

          </div>

        </div>


        {/* =================================================
            LOGIN SECTION
        ================================================= */}

        <div className="flex items-center justify-center p-6 sm:p-10">

          <div className="w-full max-w-md">

            {/* =================================================
                MOBILE LOGO
            ================================================= */}

            <div className="mb-10 flex items-center gap-3 lg:hidden">

              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#285C38] text-white">

                <Leaf size={23} />

              </div>

              <div>

                <p className="text-lg font-bold text-[#203126]">
                  AgriPredict
                </p>

                <p className="text-xs text-[#77907D]">
                  Agricultural Intelligence
                </p>

              </div>

            </div>


            {/* =================================================
                HEADING
            ================================================= */}

            <div className="mb-8">

              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#77907D]">

                Welcome back

              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-[#203126]">

                Sign in to AgriPredict

              </h2>

              <p className="mt-2 text-sm leading-6 text-[#748078]">

                Sign in to access your crop analysis,
                predictions, and scan history.

              </p>

            </div>


            {/* =================================================
                REGISTRATION SUCCESS
            ================================================= */}

            {registerMessage && (

              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#CFE2D1] bg-[#F0F8F1] p-4">

                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#DDEEDF] text-[#397347]">

                  <CheckCircle size={17} />

                </div>

                <div>

                  <p className="text-sm font-bold text-[#315E38]">

                    Registration successful

                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#5D7B62]">

                    {registerMessage}

                  </p>

                </div>

              </div>

            )}


            {/* =================================================
                LOGIN ERROR
            ================================================= */}

            {error && (

              <div
                className="mb-5 flex items-start gap-3 rounded-2xl border border-[#F1D5B8] bg-[#FFF8ED] p-4"
                role="alert"
              >

                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#FCEBCF] text-[#B97828]">

                  <AlertCircle size={17} />

                </div>

                <div>

                  <p className="text-sm font-bold text-[#79521E]">

                    Login failed

                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#98764A]">

                    {error}

                  </p>

                </div>

              </div>

            )}


            {/* =================================================
                LOGIN FORM
            ================================================= */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* =================================================
                  EMAIL
              ================================================= */}

              <div>

                <label
                  htmlFor="email"
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
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    autoComplete="email"
                    disabled={loading}
                    className="w-full rounded-xl border border-[#D9E1D6] bg-white py-3.5 pl-11 pr-4 text-sm text-[#203126] outline-none transition placeholder:text-[#A0AAA3] focus:border-[#4E8755] focus:ring-2 focus:ring-[#4E8755]/10 disabled:cursor-not-allowed disabled:bg-[#F3F5EF]"
                  />

                </div>

              </div>


              {/* =================================================
                  PASSWORD
              ================================================= */}

              <div>

                <label
                  htmlFor="password"
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
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full rounded-xl border border-[#D9E1D6] bg-white py-3.5 pl-11 pr-12 text-sm text-[#203126] outline-none transition placeholder:text-[#A0AAA3] focus:border-[#4E8755] focus:ring-2 focus:ring-[#4E8755]/10 disabled:cursor-not-allowed disabled:bg-[#F3F5EF]"
                  />


                  {/* Password visibility */}

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (previous) => !previous
                      )
                    }
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A9A8E] transition hover:text-[#285C38] disabled:cursor-not-allowed"
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
                  LOGIN BUTTON
              ================================================= */}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-[#285C38] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#214D2F] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  <span className="flex items-center gap-2">

                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Signing in...

                  </span>
                ) : (
                  "Sign In"
                )}

              </button>

            </form>


            {/* =================================================
                REGISTER LINK
            ================================================= */}

            <p className="mt-7 text-center text-sm text-[#748078]">

              Don't have an account?{" "}

              <Link
                to="/register"
                className="font-bold text-[#285C38] hover:text-[#214D2F]"
              >

                Create an account

              </Link>

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;