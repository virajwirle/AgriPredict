import { useEffect, useState } from "react";
import {
  User,
  Mail,
  MapPin,
  Thermometer,
  Sprout,
  Lock,
  LogOut,
  LocateFixed,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();

  // =========================================================
  // USER DATA
  // =========================================================

  const [user, setUser] = useState({
    name: "",
    email: "",
  });

  // =========================================================
  // LOCATION
  // =========================================================

  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem("weather_location");

      return saved
        ? JSON.parse(saved)
        : null;
    } catch {
      return null;
    }
  });

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [locationError, setLocationError] = useState("");

  // =========================================================
  // WEATHER PREFERENCE
  // =========================================================

  const [temperatureUnit, setTemperatureUnit] = useState(() => {
    return localStorage.getItem("temperature_unit") || "C";
  });

  // =========================================================
  // CROP PREFERENCE
  // =========================================================

  const [defaultCrop, setDefaultCrop] = useState(() => {
    return localStorage.getItem("default_crop") || "apple";
  });

  const [savedMessage, setSavedMessage] = useState("");

  // =========================================================
  // LOAD USER
  // =========================================================

  useEffect(() => {
    try {
      /*
       * Adjust these keys if your login system stores
       * the user under a different localStorage key.
       */

      const storedUser =
        localStorage.getItem("user") ||
        localStorage.getItem("currentUser");

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);

        setUser({
          name:
            parsedUser?.name ||
            parsedUser?.full_name ||
            parsedUser?.username ||
            "",
          email:
            parsedUser?.email ||
            "",
        });

        return;
      }

      // Fallback if individual values are stored
      setUser({
        name:
          localStorage.getItem("user_name") ||
          localStorage.getItem("name") ||
          "",
        email:
          localStorage.getItem("user_email") ||
          localStorage.getItem("email") ||
          "",
      });
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  }, []);

  // =========================================================
  // GET USER LOCATION
  // =========================================================

  function handleGetLocation() {
    setLocationLoading(true);
    setLocationMessage("");
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationLoading(false);

      setLocationError(
        "Location services are not supported by this browser."
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        /*
         * Store coordinates.
         *
         * Your Weather page / WeatherCard can use the same
         * weather_location object.
         */

        const newLocation = {
          latitude,
          longitude,
        };

        localStorage.setItem(
          "weather_location",
          JSON.stringify(newLocation)
        );

        setLocation(newLocation);

        setLocationLoading(false);

        setLocationMessage(
          "Your location has been updated successfully."
        );
      },

      (error) => {
        setLocationLoading(false);

        if (error.code === error.PERMISSION_DENIED) {
          setLocationError(
            "Location access was denied. Please allow location access from your browser settings and try again."
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError(
            "Your location could not be determined right now. Please try again."
          );
        } else if (error.code === error.TIMEOUT) {
          setLocationError(
            "Location request timed out. Please try again."
          );
        } else {
          setLocationError(
            "Unable to get your location. Please try again."
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  // =========================================================
  // SAVE PREFERENCES
  // =========================================================

  function handleSavePreferences() {
    localStorage.setItem(
      "temperature_unit",
      temperatureUnit
    );

    localStorage.setItem(
      "default_crop",
      defaultCrop
    );

    setSavedMessage(
      "Your preferences have been saved successfully."
    );

    setTimeout(() => {
      setSavedMessage("");
    }, 3000);
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  function handleLogout() {
    /*
     * Remove authentication information.
     *
     * IMPORTANT:
     * Keep weather_location if you want the location to
     * remain available after the next login.
     */

    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  }

  // =========================================================
  // PROFILE INITIAL
  // =========================================================

  const profileName =
    user.name?.trim() || "User";

  const profileEmail =
    user.email?.trim() || "No email available";

  const initial =
    profileName.charAt(0).toUpperCase();

  // =========================================================
  // LOCATION DISPLAY
  // =========================================================

  const hasLocation =
    location?.latitude !== undefined &&
    location?.longitude !== undefined;

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-full bg-[#F3F5EF] p-4 sm:p-6 lg:p-8">

      <div className="mx-auto max-w-5xl">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="mb-7">

          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#77907D]">
            Account
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#203126]">
            Profile
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-[#748078]">
            Manage your account, location, weather preferences,
            and crop preferences.
          </p>

        </div>

        {/* =====================================================
            SUCCESS MESSAGE
        ===================================================== */}

        {savedMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">

            <CheckCircle2
              size={20}
              className="shrink-0 text-emerald-600"
            />

            <p className="text-sm font-medium text-emerald-800">
              {savedMessage}
            </p>

          </div>
        )}

        {/* =====================================================
            LOCATION ERROR
        ===================================================== */}

        {locationError && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">

            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-amber-600"
            />

            <div>

              <p className="text-sm font-semibold text-amber-900">
                Location access
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                {locationError}
              </p>

            </div>

          </div>
        )}

        {/* =====================================================
            PROFILE CARD
        ===================================================== */}

        <section className="mb-6 overflow-hidden rounded-3xl border border-[#D9E1D6] bg-white shadow-sm">

          <div className="bg-[#17442A] p-6 sm:p-8">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

              {/* Avatar */}

              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-bold text-[#285C38] shadow-sm">

                {initial}

              </div>

              <div className="text-white">

                <h2 className="text-2xl font-bold">
                  {profileName}
                </h2>

                <div className="mt-2 flex items-center gap-2 text-sm text-[#C8D8CB]">

                  <Mail size={15} />

                  {profileEmail}

                </div>

              </div>

            </div>

          </div>

          {/* Account information */}

          <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">

            <ProfileField
              icon={<User size={18} />}
              label="Name"
              value={profileName}
            />

            <ProfileField
              icon={<Mail size={18} />}
              label="Email"
              value={profileEmail}
            />

          </div>

        </section>

        {/* =====================================================
            LOCATION
        ===================================================== */}

        <section className="mb-6 rounded-3xl border border-[#D9E1D6] bg-white p-6 shadow-sm sm:p-8">

          <SectionHeader
            icon={<MapPin size={20} />}
            title="Weather location"
            description="Your location is used to provide local weather forecasts and spraying conditions."
          />

          <div className="mt-6 rounded-2xl border border-[#D9E1D6] bg-[#F7FAF5] p-5">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">

                  <LocateFixed size={20} />

                </div>

                <div>

                  <p className="text-sm font-semibold text-[#203126]">
                    {hasLocation
                      ? "Location connected"
                      : "No location connected"}
                  </p>

                  {hasLocation ? (
                    <p className="mt-1 text-xs leading-5 text-[#748078]">
                      Latitude:{" "}
                      {location.latitude.toFixed(5)}
                      <br />
                      Longitude:{" "}
                      {location.longitude.toFixed(5)}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs leading-5 text-[#748078]">
                      Connect your location to receive
                      local weather information.
                    </p>
                  )}

                </div>

              </div>

              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locationLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#285C38] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#214D2F] disabled:cursor-not-allowed disabled:opacity-60"
              >

                <LocateFixed size={17} />

                {locationLoading
                  ? "Getting location..."
                  : hasLocation
                  ? "Update location"
                  : "Use my location"}

              </button>

            </div>

          </div>

          {locationMessage && (
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-700">

              <CheckCircle2 size={17} />

              {locationMessage}

            </div>
          )}

        </section>

        {/* =====================================================
            WEATHER PREFERENCES
        ===================================================== */}

        <section className="mb-6 rounded-3xl border border-[#D9E1D6] bg-white p-6 shadow-sm sm:p-8">

          <SectionHeader
            icon={<Thermometer size={20} />}
            title="Weather preferences"
            description="Choose how temperature information should appear throughout the application."
          />

          <div className="mt-6">

            <p className="mb-3 text-sm font-semibold text-[#203126]">
              Temperature unit
            </p>

            <div className="grid gap-3 sm:grid-cols-2">

              {/* Celsius */}

              <button
                type="button"
                onClick={() => setTemperatureUnit("C")}
                className={`rounded-2xl border p-4 text-left transition ${
                  temperatureUnit === "C"
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >

                <div className="flex items-center justify-between">

                  <div>

                    <p className="font-semibold text-[#203126]">
                      Celsius
                    </p>

                    <p className="mt-1 text-xs text-[#748078]">
                      °C
                    </p>

                  </div>

                  {temperatureUnit === "C" && (
                    <CheckCircle2
                      size={20}
                      className="text-emerald-600"
                    />
                  )}

                </div>

              </button>

              {/* Fahrenheit */}

              <button
                type="button"
                onClick={() => setTemperatureUnit("F")}
                className={`rounded-2xl border p-4 text-left transition ${
                  temperatureUnit === "F"
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >

                <div className="flex items-center justify-between">

                  <div>

                    <p className="font-semibold text-[#203126]">
                      Fahrenheit
                    </p>

                    <p className="mt-1 text-xs text-[#748078]">
                      °F
                    </p>

                  </div>

                  {temperatureUnit === "F" && (
                    <CheckCircle2
                      size={20}
                      className="text-emerald-600"
                    />
                  )}

                </div>

              </button>

            </div>

          </div>

        </section>

        {/* =====================================================
            CROP PREFERENCE
        ===================================================== */}

        <section className="mb-6 rounded-3xl border border-[#D9E1D6] bg-white p-6 shadow-sm sm:p-8">

          <SectionHeader
            icon={<Sprout size={20} />}
            title="Crop preference"
            description="Choose the crop you analyze most often."
          />

          <div className="mt-6">

            <label
              htmlFor="defaultCrop"
              className="mb-2 block text-sm font-semibold text-[#203126]"
            >
              Default crop
            </label>

            <select
              id="defaultCrop"
              value={defaultCrop}
              onChange={(event) =>
                setDefaultCrop(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:max-w-md"
            >

              <option value="apple">
                🍎 Apple
              </option>

              <option value="maize">
                🌽 Maize
              </option>

            </select>

          </div>

        </section>

        {/* =====================================================
            SAVE BUTTON
        ===================================================== */}

        <div className="mb-6 flex justify-end">

          <button
            type="button"
            onClick={handleSavePreferences}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#285C38] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#214D2F]"
          >

            <Save size={17} />

            Save preferences

          </button>

        </div>

        {/* =====================================================
            SECURITY
        ===================================================== */}

        <section className="mb-6 rounded-3xl border border-[#D9E1D6] bg-white p-6 shadow-sm sm:p-8">

          <SectionHeader
            icon={<Lock size={20} />}
            title="Account security"
            description="Manage your account security settings."
          />

          <div className="mt-6">

            <button
              type="button"
              onClick={() => {
                alert(
                  "Password change functionality will be connected to the backend."
                );
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >

              <Lock size={17} />

              Change password

            </button>

          </div>

        </section>

        {/* =====================================================
            LOGOUT
        ===================================================== */}

        <section className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm sm:p-8">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="font-bold text-slate-900">
                Sign out
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Sign out of your Plant Intelligence account
                on this device.
              </p>

            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >

              <LogOut size={17} />

              Logout

            </button>

          </div>

        </section>

      </div>

    </div>
  );
}

// =============================================================
// SECTION HEADER
// =============================================================

function SectionHeader({
  icon,
  title,
  description,
}) {
  return (
    <div className="flex items-start gap-3">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        {icon}
      </div>

      <div>

        <h2 className="text-lg font-bold text-[#203126]">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-6 text-[#748078]">
          {description}
        </p>

      </div>

    </div>
  );
}

// =============================================================
// PROFILE FIELD
// =============================================================

function ProfileField({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">

      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">

        {icon}

        {label}

      </div>

      <p className="mt-2 text-sm font-semibold text-slate-800">
        {value}
      </p>

    </div>
  );
}