import { useEffect, useState } from "react";
import {
  Bell,
  Globe2,
  MapPin,
  Moon,
  Sun,
  Thermometer,
  Trash2,
  ShieldCheck,
  Info,
  RefreshCcw,
  ChevronRight,
} from "lucide-react";

export default function Settings() {
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "en"
  );

  const [temperatureUnit, setTemperatureUnit] = useState(
    localStorage.getItem("temperatureUnit") || "C"
  );

  const [notifications, setNotifications] = useState(
    localStorage.getItem("notifications") !== "false"
  );

  const [weatherAlerts, setWeatherAlerts] = useState(
    localStorage.getItem("weatherAlerts") !== "false"
  );

  const [diseaseAlerts, setDiseaseAlerts] = useState(
    localStorage.getItem("diseaseAlerts") !== "false"
  );

  const [sprayAlerts, setSprayAlerts] = useState(
    localStorage.getItem("sprayAlerts") !== "false"
  );

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("temperatureUnit", temperatureUnit);
  }, [temperatureUnit]);

  useEffect(() => {
    localStorage.setItem("notifications", notifications);
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("weatherAlerts", weatherAlerts);
  }, [weatherAlerts]);

  useEffect(() => {
    localStorage.setItem("diseaseAlerts", diseaseAlerts);
  }, [diseaseAlerts]);

  useEffect(() => {
    localStorage.setItem("sprayAlerts", sprayAlerts);
  }, [sprayAlerts]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  function handleRefreshLocation() {
    if (!navigator.geolocation) {
      alert("Location is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        alert("Location updated successfully.");
      },
      () => {
        alert(
          "Location access was denied. Please allow location access from your browser settings."
        );
      }
    );
  }

  function handleDeleteHistory() {
    const confirmed = window.confirm(
      "Are you sure you want to delete your scan history?"
    );

    if (!confirmed) {
      return;
    }

    // Connect this later to your backend delete-history API.
    alert("Scan history deletion will be connected to the backend.");
  }

  return (
    <div className="min-h-full bg-[#f5f8f3] p-5 sm:p-8">
      <div className="mx-auto max-w-5xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#77907D]">
            Application
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#203126]">
            Settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#748078]">
            Manage your language, weather preferences, notifications,
            location and application settings.
          </p>
        </div>

        <div className="space-y-6">

          {/* =====================================================
              LANGUAGE
          ===================================================== */}

          <SettingsSection
            icon={<Globe2 size={21} />}
            title="Language"
            description="Choose the language used throughout the application."
          >
            <SettingRow
              title="App language"
              description="Change the language of menus, buttons and information."
            >
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="mr">मराठी</option>
                <option value="gu">ગુજરાતી</option>
              </select>
            </SettingRow>
          </SettingsSection>

          {/* =====================================================
              LOCATION & WEATHER
          ===================================================== */}

          <SettingsSection
            icon={<MapPin size={21} />}
            title="Location & Weather"
            description="Control how your location is used for local weather information."
          >
            <SettingRow
              title="Refresh location"
              description="Update your current location for live weather."
            >
              <button
                type="button"
                onClick={handleRefreshLocation}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCcw size={16} />
                Refresh
              </button>
            </SettingRow>

            <div className="my-1 border-t border-slate-100" />

            <SettingRow
              title="Temperature unit"
              description="Choose how temperatures are displayed."
            >
              <select
                value={temperatureUnit}
                onChange={(e) =>
                  setTemperatureUnit(e.target.value)
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="C">Celsius (°C)</option>
                <option value="F">Fahrenheit (°F)</option>
              </select>
            </SettingRow>
          </SettingsSection>

          {/* =====================================================
              NOTIFICATIONS
          ===================================================== */}

          <SettingsSection
            icon={<Bell size={21} />}
            title="Notifications"
            description="Choose which agricultural alerts you want to receive."
          >
            <ToggleRow
              title="Notifications"
              description="Enable application notifications."
              enabled={notifications}
              setEnabled={setNotifications}
            />

            <ToggleRow
              title="Disease alerts"
              description="Receive alerts related to detected plant diseases."
              enabled={diseaseAlerts}
              setEnabled={setDiseaseAlerts}
            />

            <ToggleRow
              title="Weather alerts"
              description="Receive important weather and rainfall alerts."
              enabled={weatherAlerts}
              setEnabled={setWeatherAlerts}
            />

            <ToggleRow
              title="Spraying condition alerts"
              description="Receive alerts when weather conditions may affect spraying."
              enabled={sprayAlerts}
              setEnabled={setSprayAlerts}
            />
          </SettingsSection>

          {/* =====================================================
              APPEARANCE
          ===================================================== */}

          <SettingsSection
            icon={theme === "dark" ? <Moon size={21} /> : <Sun size={21} />}
            title="Appearance"
            description="Choose how the application looks."
          >
            <SettingRow
              title="Theme"
              description="Select your preferred appearance."
            >
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System default</option>
              </select>
            </SettingRow>
          </SettingsSection>

          {/* =====================================================
              PRIVACY
          ===================================================== */}

          <SettingsSection
            icon={<ShieldCheck size={21} />}
            title="Privacy & Data"
            description="Manage your application data and privacy."
          >
            <SettingRow
              title="Location privacy"
              description="Your location is used to provide local weather information."
            >
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                Weather only
              </span>
            </SettingRow>

            <div className="my-1 border-t border-slate-100" />

            <SettingRow
              title="Delete scan history"
              description="Remove your previous plant scan records."
            >
              <button
                type="button"
                onClick={handleDeleteHistory}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </SettingRow>
          </SettingsSection>

          {/* =====================================================
              ABOUT
          ===================================================== */}

          <SettingsSection
            icon={<Info size={21} />}
            title="About"
            description="Information about the agricultural intelligence application."
          >
            <SettingRow
              title="Application version"
              description="Current application version."
            >
              <span className="text-sm font-semibold text-slate-700">
                v1.0.0
              </span>
            </SettingRow>

            <div className="my-1 border-t border-slate-100" />

            <SettingRow
              title="AI model"
              description="Plant disease detection and health analysis."
            >
              <span className="text-sm font-semibold text-slate-700">
                EfficientNet-B0
              </span>
            </SettingRow>
          </SettingsSection>

        </div>
      </div>
    </div>
  );
}


/* =========================================================
   SETTINGS SECTION
========================================================= */

function SettingsSection({
  icon,
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">

      <div className="mb-6 flex items-start gap-4">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {title}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>

      </div>

      <div className="space-y-1">
        {children}
      </div>

    </section>
  );
}


/* =========================================================
   SETTING ROW
========================================================= */

function SettingRow({
  title,
  description,
  children,
}) {
  return (
    <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">

      <div>
        <p className="text-sm font-semibold text-slate-900">
          {title}
        </p>

        <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <div className="shrink-0">
        {children}
      </div>

    </div>
  );
}


/* =========================================================
   TOGGLE ROW
========================================================= */

function ToggleRow({
  title,
  description,
  enabled,
  setEnabled,
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">

      <div>
        <p className="text-sm font-semibold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setEnabled(!enabled)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled
            ? "bg-emerald-700"
            : "bg-slate-300"
        }`}
        aria-label={`Toggle ${title}`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
            enabled
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>

    </div>
  );
}