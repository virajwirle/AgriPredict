import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Leaf,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();

  const { register } = useAuth();

  // =====================================================
  // FORM STATE
  // =====================================================

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    preferred_language: "en",
  });

  // =====================================================
  // UI STATE
  // =====================================================

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Clear old error when user starts typing
    if (error) {
      setError("");
    }
  };

  // =====================================================
  // REGISTER
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    // -----------------------------------------------------
    // VALIDATE FULL NAME
    // -----------------------------------------------------

    if (!formData.full_name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    // -----------------------------------------------------
    // VALIDATE EMAIL
    // -----------------------------------------------------

    if (!formData.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    // -----------------------------------------------------
    // VALIDATE PASSWORD
    // -----------------------------------------------------

    if (!formData.password) {
      setError("Please enter a password.");
      return;
    }

    // -----------------------------------------------------
    // VALIDATE PASSWORD LENGTH
    // -----------------------------------------------------

    if (formData.password.length < 8) {
      setError(
        "Password must be at least 8 characters long."
      );
      return;
    }

    // -----------------------------------------------------
    // CONFIRM PASSWORD
    // -----------------------------------------------------

    if (!formData.confirm_password) {
      setError("Please confirm your password.");
      return;
    }

    if (
      formData.password !==
      formData.confirm_password
    ) {
      setError("Passwords do not match.");
      return;
    }

    // =====================================================
    // SEND REGISTER REQUEST
    // =====================================================

    try {
      setLoading(true);

      await register({
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim(),
        preferred_language:
          formData.preferred_language,
      });

      // ---------------------------------------------------
      // REGISTRATION SUCCESS
      // ---------------------------------------------------

      navigate("/login", {
        replace: true,
        state: {
          registered: true,
        },
      });

    } catch (err) {
      console.error(
        "Registration error:",
        err
      );

      setError(
        err?.message ||
          "Unable to create your account. Please try again."
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

                Start making
                smarter crop decisions.

              </h1>

              <p className="mt-5 max-w-md text-sm leading-7 text-[#C8D8CB]">

                Create your AgriPredict account to
                analyze plant diseases, monitor your
                crops, and receive intelligent
                recommendations.

              </p>

            </div>


            {/* Footer */}

            <p className="relative z-10 text-xs text-[#AFC4B3]">

              AI-powered agricultural intelligence

            </p>

          </div>

        </div>


        {/* =================================================
            REGISTER SECTION
        ================================================= */}

        <div className="flex items-center justify-center p-6 sm:p-10">

          <div className="w-full max-w-md">

            {/* =================================================
                MOBILE LOGO
            ================================================= */}

            <div className="mb-8 flex items-center gap-3 lg:hidden">

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

            <div className="mb-7">

              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#77907D]">

                Get started

              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-[#203126]">

                Create your account

              </h2>

              <p className="mt-2 text-sm leading-6 text-[#748078]">

                Create an account to access crop analysis,
                predictions, and scan history.

              </p>

            </div>


            {/* =================================================
                ERROR MESSAGE
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

                    Registration failed

                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#98764A]">

                    {error}

                  </p>

                </div>

              </div>

            )}


            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              {/* =================================================
                  FULL NAME
              ================================================= */}

              <div>

                <label
                  htmlFor="full_name"
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
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    disabled={loading}
                    className="w-full rounded-xl border border-[#D9E1D6] bg-white py-3.5 pl-11 pr-4 text-sm text-[#203126] outline-none transition placeholder:text-[#A0AAA3] focus:border-[#4E8755] focus:ring-2 focus:ring-[#4E8755]/10 disabled:cursor-not-allowed disabled:bg-[#F3F5EF]"
                  />

                </div>

              </div>


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
                    placeholder="Create a password"
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full rounded-xl border border-[#D9E1D6] bg-white py-3.5 pl-11 pr-12 text-sm text-[#203126] outline-none transition placeholder:text-[#A0AAA3] focus:border-[#4E8755] focus:ring-2 focus:ring-[#4E8755]/10 disabled:cursor-not-allowed disabled:bg-[#F3F5EF]"
                  />


                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (previous) => !previous
                      )
                    }
                    disabled={loading}
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
                  CONFIRM PASSWORD
              ================================================= */}

              <div>

                <label
                  htmlFor="confirm_password"
                  className="mb-2 block text-sm font-semibold text-[#33463A]"
                >

                  Confirm password

                </label>

                <div className="relative">

                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9A8E]"
                  />

                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      formData.confirm_password
                    }
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full rounded-xl border border-[#D9E1D6] bg-white py-3.5 pl-11 pr-12 text-sm text-[#203126] outline-none transition placeholder:text-[#A0AAA3] focus:border-[#4E8755] focus:ring-2 focus:ring-[#4E8755]/10 disabled:cursor-not-allowed disabled:bg-[#F3F5EF]"
                  />


                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (previous) => !previous
                      )
                    }
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A9A8E] transition hover:text-[#285C38]"
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >

                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}

                  </button>

                </div>

              </div>


              {/* =================================================
                  REGISTER BUTTON
              ================================================= */}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center rounded-xl bg-[#285C38] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#214D2F] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (

                  <span className="flex items-center gap-2">

                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Creating account...

                  </span>

                ) : (

                  "Create Account"

                )}

              </button>

            </form>


            {/* =================================================
                LOGIN LINK
            ================================================= */}

            <p className="mt-6 text-center text-sm text-[#748078]">

              Already have an account?{" "}

              <Link
                to="/login"
                className="font-bold text-[#285C38] hover:text-[#214D2F]"
              >

                Sign in

              </Link>

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Register;