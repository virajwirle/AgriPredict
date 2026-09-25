import { useEffect, useState } from "react";
import {
  Cloud,
  Droplets,
  LocateFixed,
  Loader2,
  MapPin,
  RefreshCcw,
  Wind,
} from "lucide-react";

import {
  getCurrentWeather,
  getUserLocation,
  getWeatherDescription,
  getWeatherIcon,
} from "../services/weather";

export default function WeatherCard() {
  const [weather, setWeather] = useState(null);

  const [location, setLocation] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /*
   * =========================================================
   * LOAD LOCATION + WEATHER
   * =========================================================
   */

  async function loadWeather() {
    setLoading(true);
    setError("");

    try {
      /*
       * Ask browser for user's real location.
       */
      const userLocation = await getUserLocation();

      setLocation(userLocation);

      /*
       * Use the real latitude and longitude
       * to fetch current weather.
       */
      const weatherData = await getCurrentWeather(
        userLocation.latitude,
        userLocation.longitude
      );

      setWeather(weatherData);
    } catch (err) {
      console.error("Weather error:", err);

      setWeather(null);

      setError(
        err?.message ||
          "Unable to load weather for your location."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * =========================================================
   * INITIAL WEATHER LOAD
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
      <div className="flex min-h-[285px] items-center justify-center rounded-3xl border border-[#D9E1D6] bg-white p-6 shadow-sm">
        <div className="text-center">
          <Loader2
            size={28}
            className="mx-auto animate-spin text-[#4E8755]"
          />

          <p className="mt-3 text-sm font-semibold text-[#203126]">
            Getting your local weather...
          </p>

          <p className="mt-1 text-xs text-[#748078]">
            Requesting location access
          </p>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * LOCATION ERROR
   * =========================================================
   */

  if (error || !weather) {
    return (
      <div className="flex min-h-[285px] flex-col justify-center rounded-3xl border border-[#D9E1D6] bg-white p-6 shadow-sm sm:p-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF5ED] text-[#4E8755]">
          <MapPin size={23} />
        </div>

        <h2 className="mt-5 text-xl font-bold text-[#203126]">
          Local weather
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#748078]">
          {error ||
            "Location access is required to show weather information for your area."}
        </p>

        <div className="mt-5 rounded-2xl border border-[#E4EAE1] bg-[#F7FAF6] p-4">
          <div className="flex gap-3">
            <LocateFixed
              size={19}
              className="mt-0.5 shrink-0 text-[#4E8755]"
            />

            <p className="text-sm leading-6 text-[#5F6E63]">
              Allow location access in your browser so we can
              show live weather conditions for your current
              location.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadWeather}
          className="mt-5 inline-flex w-fit items-center gap-2 rounded-xl bg-[#285C38] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214D2F]"
        >
          <RefreshCcw size={16} />

          Allow location access
        </button>
      </div>
    );
  }

  /*
   * =========================================================
   * CURRENT WEATHER
   * =========================================================
   */

  const current = weather.current || {};

  const temperature = Math.round(
    Number(current.temperature_2m ?? 0)
  );

  const humidity = Math.round(
    Number(current.relative_humidity_2m ?? 0)
  );

  const apparentTemperature = Math.round(
    Number(current.apparent_temperature ?? temperature)
  );

  const windSpeed = Math.round(
    Number(current.wind_speed_10m ?? 0)
  );

  const precipitation = Number(
    current.precipitation ?? 0
  );

  const rain = Number(current.rain ?? 0);

  const weatherCode = Number(
    current.weather_code ?? 0
  );

  const description =
    getWeatherDescription(weatherCode);

  const icon = getWeatherIcon(weatherCode);

  /*
   * =========================================================
   * RENDER LIVE WEATHER
   * =========================================================
   */

  return (
    <div className="min-h-[285px] rounded-3xl border border-[#D9E1D6] bg-white p-6 shadow-sm sm:p-7">
      {/* HEADER */}

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#77907D]">
            Live weather
          </p>

          <h2 className="mt-2 text-xl font-bold text-[#203126]">
            Current conditions
          </h2>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF5ED] text-2xl">
          {icon}
        </div>
      </div>

      {/* LOCATION */}

      <div className="mt-5 flex items-center gap-2 text-sm text-[#5F6E63]">
        <MapPin
          size={16}
          className="text-[#4E8755]"
        />

        <span>
          Your current location
        </span>
      </div>

      {/* TEMPERATURE */}

      <div className="mt-4 flex items-end gap-3">
        <span className="text-5xl font-bold tracking-tight text-[#203126]">
          {temperature}°
        </span>

        <div className="pb-1">
          <p className="text-sm font-semibold text-[#203126]">
            {description}
          </p>

          <p className="mt-1 text-xs text-[#748078]">
            Feels like {apparentTemperature}°
          </p>
        </div>
      </div>

      {/* WEATHER DETAILS */}

      <div className="mt-6 grid grid-cols-3 gap-3">
        {/* HUMIDITY */}

        <div className="rounded-2xl bg-[#F5F8F3] p-3">
          <Droplets
            size={18}
            className="text-[#4E8755]"
          />

          <p className="mt-2 text-xs text-[#748078]">
            Humidity
          </p>

          <p className="mt-1 text-sm font-bold text-[#203126]">
            {humidity}%
          </p>
        </div>

        {/* WIND */}

        <div className="rounded-2xl bg-[#F5F8F3] p-3">
          <Wind
            size={18}
            className="text-[#4E8755]"
          />

          <p className="mt-2 text-xs text-[#748078]">
            Wind
          </p>

          <p className="mt-1 text-sm font-bold text-[#203126]">
            {windSpeed} km/h
          </p>
        </div>

        {/* RAIN */}

        <div className="rounded-2xl bg-[#F5F8F3] p-3">
          <Cloud
            size={18}
            className="text-[#4E8755]"
          />

          <p className="mt-2 text-xs text-[#748078]">
            Rain
          </p>

          <p className="mt-1 text-sm font-bold text-[#203126]">
            {rain > 0 || precipitation > 0
              ? `${precipitation.toFixed(1)} mm`
              : "Low"}
          </p>
        </div>
      </div>

      {/* REFRESH */}

      <button
        type="button"
        onClick={loadWeather}
        className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#4E8755] transition hover:text-[#315E38]"
      >
        <RefreshCcw size={14} />

        Refresh weather
      </button>
    </div>
  );
}