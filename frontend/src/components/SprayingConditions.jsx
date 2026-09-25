import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Loader2,
  MapPin,
  RefreshCcw,
  Wind,
  CloudRain,
} from "lucide-react";

import {
  getCurrentWeather,
  getUserLocation,
} from "../services/weather";

export default function SprayingConditions() {
  const [weather, setWeather] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /*
   * =========================================================
   * LOAD WEATHER
   * =========================================================
   */

  async function loadWeather() {
    setLoading(true);
    setError("");

    try {
      const location = await getUserLocation();

      const data = await getCurrentWeather(
        location.latitude,
        location.longitude
      );

      setWeather(data);
    } catch (err) {
      console.error(
        "Failed to load spraying conditions:",
        err
      );

      setWeather(null);

      setError(
        err?.message ||
          "Unable to determine spraying conditions."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * =========================================================
   * INITIAL LOAD
   * =========================================================
   */

  useEffect(() => {
    loadWeather();
  }, []);

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <div className="rounded-3xl border border-[#D9E1D6] bg-white p-6 shadow-sm sm:p-7">
        <div className="flex items-center gap-3">
          <Loader2
            size={22}
            className="animate-spin text-[#4E8755]"
          />

          <div>
            <p className="font-semibold text-[#203126]">
              Spraying conditions
            </p>

            <p className="mt-1 text-xs text-[#748078]">
              Checking local weather...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * ERROR
   * =========================================================
   */

  if (error || !weather) {
    return (
      <div className="rounded-3xl border border-[#D9E1D6] bg-white p-6 shadow-sm sm:p-7">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF8E8] text-[#B87922]">
          <MapPin size={21} />
        </div>

        <h2 className="mt-4 text-xl font-bold text-[#203126]">
          Spraying conditions
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#748078]">
          {error ||
            "Location access is required to calculate local spraying conditions."}
        </p>

        <button
          type="button"
          onClick={loadWeather}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#D9E1D6] bg-white px-4 py-2.5 text-sm font-semibold text-[#315E38] transition hover:bg-[#F5F8F3]"
        >
          <RefreshCcw size={15} />

          Try again
        </button>
      </div>
    );
  }

  /*
   * =========================================================
   * WEATHER VALUES
   * =========================================================
   */

  const current = weather.current || {};

  const temperature = Number(
    current.temperature_2m ?? 0
  );

  const humidity = Number(
    current.relative_humidity_2m ?? 0
  );

  const windSpeed = Number(
    current.wind_speed_10m ?? 0
  );

  const precipitation = Number(
    current.precipitation ?? 0
  );

  /*
   * =========================================================
   * SPRAYING LOGIC
   *
   * These are general weather-based indicators,
   * not crop-specific pesticide recommendations.
   * =========================================================
   */

  const highWind = windSpeed > 20;

  const raining = precipitation > 0.5;

  const veryHumid = humidity > 90;

  const extremeTemperature =
    temperature < 10 || temperature > 35;

  const unsuitable =
    highWind ||
    raining ||
    veryHumid ||
    extremeTemperature;

  /*
   * =========================================================
   * STATUS
   * =========================================================
   */

  let status = "Suitable";

  let statusMessage =
    "Current weather conditions are generally suitable for spraying.";

  if (raining) {
    status = "Not recommended";

    statusMessage =
      "Rain is currently occurring, so spraying may be ineffective.";
  } else if (highWind) {
    status = "Not recommended";

    statusMessage =
      "Wind speed is high and may cause spray drift.";
  } else if (veryHumid) {
    status = "Caution";

    statusMessage =
      "Humidity is very high. Consider checking crop-specific guidance before spraying.";
  } else if (extremeTemperature) {
    status = "Caution";

    statusMessage =
      "Temperature is outside a moderate range. Check the product label and local agricultural guidance.";
  }

  const isCaution =
    status === "Caution";

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="rounded-3xl border border-[#D9E1D6] bg-white p-6 shadow-sm sm:p-7">
      {/* HEADER */}

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#77907D]">
            Field conditions
          </p>

          <h2 className="mt-2 text-xl font-bold text-[#203126]">
            Spraying Conditions
          </h2>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            unsuitable
              ? "bg-[#FFF8E8] text-[#B87922]"
              : "bg-[#EEF5ED] text-[#4E8755]"
          }`}
        >
          {unsuitable ? (
            <AlertTriangle size={22} />
          ) : (
            <CheckCircle2 size={22} />
          )}
        </div>
      </div>

      {/* STATUS */}

      <div
        className={`mt-5 rounded-2xl border p-4 ${
          !unsuitable
            ? "border-[#D8E9D6] bg-[#F2F8F1]"
            : isCaution
            ? "border-[#E7C98B] bg-[#FFF8E8]"
            : "border-[#F0D5C8] bg-[#FFF4EF]"
        }`}
      >
        <p
          className={`text-sm font-bold ${
            !unsuitable
              ? "text-[#315E38]"
              : isCaution
              ? "text-[#76521F]"
              : "text-[#8A3F2F]"
          }`}
        >
          {status}
        </p>

        <p
          className={`mt-1 text-xs leading-5 ${
            !unsuitable
              ? "text-[#5D765F]"
              : isCaution
              ? "text-[#967344]"
              : "text-[#9A5B4B]"
          }`}
        >
          {statusMessage}
        </p>
      </div>

      {/* WEATHER FACTORS */}

      <div className="mt-5 space-y-3">
        {/* WIND */}

        <div className="flex items-center justify-between rounded-2xl bg-[#F5F8F3] p-3">
          <div className="flex items-center gap-3">
            <Wind
              size={18}
              className="text-[#4E8755]"
            />

            <span className="text-sm text-[#5F6E63]">
              Wind speed
            </span>
          </div>

          <span className="text-sm font-bold text-[#203126]">
            {Math.round(windSpeed)} km/h
          </span>
        </div>

        {/* HUMIDITY */}

        <div className="flex items-center justify-between rounded-2xl bg-[#F5F8F3] p-3">
          <div className="flex items-center gap-3">
            <Droplets
              size={18}
              className="text-[#4E8755]"
            />

            <span className="text-sm text-[#5F6E63]">
              Humidity
            </span>
          </div>

          <span className="text-sm font-bold text-[#203126]">
            {Math.round(humidity)}%
          </span>
        </div>

        {/* RAIN */}

        <div className="flex items-center justify-between rounded-2xl bg-[#F5F8F3] p-3">
          <div className="flex items-center gap-3">
            <CloudRain
              size={18}
              className="text-[#4E8755]"
            />

            <span className="text-sm text-[#5F6E63]">
              Precipitation
            </span>
          </div>

          <span className="text-sm font-bold text-[#203126]">
            {precipitation.toFixed(1)} mm
          </span>
        </div>

        {/* TEMPERATURE */}

        <div className="flex items-center justify-between rounded-2xl bg-[#F5F8F3] p-3">
          <div className="flex items-center gap-3">
            <span className="text-lg">
              🌡️
            </span>

            <span className="text-sm text-[#5F6E63]">
              Temperature
            </span>
          </div>

          <span className="text-sm font-bold text-[#203126]">
            {Math.round(temperature)}°C
          </span>
        </div>
      </div>

      {/* DISCLAIMER */}

      <p className="mt-5 text-[11px] leading-5 text-[#8A968C]">
        Weather-based indication only. Always follow the
        pesticide/product label and local agricultural
        recommendations.
      </p>

      {/* REFRESH */}

      <button
        type="button"
        onClick={loadWeather}
        className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#4E8755] transition hover:text-[#315E38]"
      >
        <RefreshCcw size={14} />

        Refresh conditions
      </button>
    </div>
  );
}