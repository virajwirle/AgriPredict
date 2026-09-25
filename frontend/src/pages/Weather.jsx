import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Cloud,
  CloudFog,
  CloudRain,
  CloudSun,
  Droplets,
  Eye,
  Gauge,
  LocateFixed,
  MapPin,
  Navigation,
  RefreshCcw,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Umbrella,
  Wind,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

/* =========================================================
   WEATHER CODE HELPERS
========================================================= */

function getWeatherInfo(code) {
  const weatherMap = {
    0: {
      label: "Clear sky",
      icon: Sun,
    },

    1: {
      label: "Mainly clear",
      icon: Sun,
    },

    2: {
      label: "Partly cloudy",
      icon: CloudSun,
    },

    3: {
      label: "Overcast",
      icon: Cloud,
    },

    45: {
      label: "Fog",
      icon: CloudFog,
    },

    48: {
      label: "Depositing rime fog",
      icon: CloudFog,
    },

    51: {
      label: "Light drizzle",
      icon: CloudRain,
    },

    53: {
      label: "Moderate drizzle",
      icon: CloudRain,
    },

    55: {
      label: "Dense drizzle",
      icon: CloudRain,
    },

    56: {
      label: "Light freezing drizzle",
      icon: CloudRain,
    },

    57: {
      label: "Dense freezing drizzle",
      icon: CloudRain,
    },

    61: {
      label: "Slight rain",
      icon: CloudRain,
    },

    63: {
      label: "Moderate rain",
      icon: CloudRain,
    },

    65: {
      label: "Heavy rain",
      icon: CloudRain,
    },

    66: {
      label: "Light freezing rain",
      icon: CloudRain,
    },

    67: {
      label: "Heavy freezing rain",
      icon: CloudRain,
    },

    71: {
      label: "Slight snow",
      icon: Cloud,
    },

    73: {
      label: "Moderate snow",
      icon: Cloud,
    },

    75: {
      label: "Heavy snow",
      icon: Cloud,
    },

    77: {
      label: "Snow grains",
      icon: Cloud,
    },

    80: {
      label: "Slight rain showers",
      icon: CloudRain,
    },

    81: {
      label: "Moderate rain showers",
      icon: CloudRain,
    },

    82: {
      label: "Violent rain showers",
      icon: CloudRain,
    },

    85: {
      label: "Slight snow showers",
      icon: Cloud,
    },

    86: {
      label: "Heavy snow showers",
      icon: Cloud,
    },

    95: {
      label: "Thunderstorm",
      icon: CloudRain,
    },

    96: {
      label: "Thunderstorm with slight hail",
      icon: CloudRain,
    },

    99: {
      label: "Thunderstorm with heavy hail",
      icon: CloudRain,
    },
  };

  return (
    weatherMap[code] || {
      label: "Unknown weather",
      icon: Cloud,
    }
  );
}

/* =========================================================
   DATE HELPERS
========================================================= */

function formatDay(dateString, index) {
  if (index === 0) {
    return "Today";
  }

  const date = new Date(`${dateString}T12:00:00`);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
  });
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

function formatTime(timeString) {
  if (!timeString) {
    return "--";
  }

  const date = new Date(timeString);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/* =========================================================
   LOCATION NAME
========================================================= */

async function getLocationName(latitude, longitude) {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&count=1&language=en&format=json`
    );

    if (!response.ok) {
      return "Your current location";
    }

    const data = await response.json();

    const result = data?.results?.[0];

    if (!result) {
      return "Your current location";
    }

    return (
      result.city ||
      result.town ||
      result.village ||
      result.municipality ||
      result.county ||
      result.name ||
      "Your current location"
    );
  } catch (error) {
    console.error("Unable to determine location name:", error);

    return "Your current location";
  }
}

/* =========================================================
   WEATHER API
========================================================= */

async function getWeather(latitude, longitude) {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${latitude}` +
    `&longitude=${longitude}` +
    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,uv_index" +
    "&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,rain,weather_code,cloud_cover,wind_speed_10m,visibility,uv_index" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,precipitation_sum,rain_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max" +
    "&timezone=auto" +
    "&forecast_days=5";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Unable to load weather information.");
  }

  return response.json();
}

/* =========================================================
   WEATHER PAGE
========================================================= */

export default function Weather() {
  const navigate = useNavigate();

  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [locationDenied, setLocationDenied] = useState(false);

  /* =======================================================
     LOAD WEATHER
  ======================================================= */

  async function loadWeather({ refresh = false } = {}) {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");
    setLocationDenied(false);

    if (!navigator.geolocation) {
      setError(
        "Location services are not supported by this browser."
      );

      setLoading(false);
      setRefreshing(false);

      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          const [weatherData, name] = await Promise.all([
            getWeather(latitude, longitude),
            getLocationName(latitude, longitude),
          ]);

          setWeather(weatherData);
          setLocationName(name);
        } catch (err) {
          console.error("Weather loading error:", err);

          setError(
            err?.message ||
              "Unable to load weather information."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },

      (geoError) => {
        console.error(
          "Location permission error:",
          geoError
        );

        setLoading(false);
        setRefreshing(false);

        if (geoError.code === 1) {
          setLocationDenied(true);

          setError(
            "Location access is required to show weather for your current location."
          );
        } else if (geoError.code === 2) {
          setError(
            "Your location could not be determined. Please check your device location settings."
          );
        } else if (geoError.code === 3) {
          setError(
            "Location request timed out. Please try again."
          );
        } else {
          setError(
            "Unable to access your current location."
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  }

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadWeather();
  }, []);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-full bg-[#F3F5EF] p-5 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </button>

          <div className="flex min-h-[500px] items-center justify-center rounded-3xl border border-[#D9E1D6] bg-white shadow-sm">
            <div className="text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <LocateFixed
                  size={28}
                  className="animate-pulse"
                />
              </div>

              <h1 className="text-xl font-bold text-slate-900">
                Getting your weather
              </h1>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                We're using your current location to fetch
                live weather information.
              </p>

              <div className="mt-5 flex items-center justify-center gap-2 text-sm text-emerald-700">
                <RefreshCcw
                  size={15}
                  className="animate-spin"
                />
                Loading weather...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     LOCATION DENIED / ERROR
  ======================================================= */

  if (!weather) {
    return (
      <div className="min-h-full bg-[#F3F5EF] p-5 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </button>

          <div className="flex min-h-[500px] items-center justify-center rounded-3xl border border-[#D9E1D6] bg-white p-6 shadow-sm">
            <div className="max-w-lg text-center">
              <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <MapPin size={30} />
              </div>

              <h1 className="text-2xl font-bold text-slate-900">
                {locationDenied
                  ? "Location access needed"
                  : "Weather unavailable"}
              </h1>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                {error ||
                  "We couldn't load weather information right now."}
              </p>

              {locationDenied && (
                <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-left">
                  <p className="text-sm font-semibold text-emerald-900">
                    Why we need your location
                  </p>

                  <p className="mt-1 text-sm leading-6 text-emerald-800">
                    Your location is used only to find the
                    weather conditions around you. Please
                    allow location access in your browser and
                    then try again.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  loadWeather({ refresh: true })
                }
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                <RefreshCcw size={17} />
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     CURRENT WEATHER DATA
  ======================================================= */

  const current = weather.current || {};
  const daily = weather.daily || {};

  const currentWeatherInfo = getWeatherInfo(
    current.weather_code
  );

  const CurrentWeatherIcon = currentWeatherInfo.icon;

  const todayRainProbability =
    daily?.precipitation_probability_max?.[0] ?? 0;

  /* =======================================================
     UV LABEL
  ======================================================= */

  const uvIndex = current.uv_index ?? 0;

  let uvLabel = "Low";

  if (uvIndex >= 3 && uvIndex < 6) {
    uvLabel = "Moderate";
  } else if (uvIndex >= 6 && uvIndex < 8) {
    uvLabel = "High";
  } else if (uvIndex >= 8 && uvIndex < 11) {
    uvLabel = "Very high";
  } else if (uvIndex >= 11) {
    uvLabel = "Extreme";
  }

  /* =======================================================
     WIND DIRECTION
  ======================================================= */

  function getWindDirection(degrees) {
    if (degrees === undefined || degrees === null) {
      return "--";
    }

    const directions = [
      "N",
      "NE",
      "E",
      "SE",
      "S",
      "SW",
      "W",
      "NW",
    ];

    const index = Math.round(degrees / 45) % 8;

    return directions[index];
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-full bg-[#F3F5EF] p-5 sm:p-8">
      <div className="mx-auto max-w-6xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
            >
              <ArrowLeft size={16} />
              Back to dashboard
            </button>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MapPin size={16} />

              <span>
                {locationName || "Your current location"}
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#203126] sm:text-4xl">
              Weather
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#748078]">
              Live weather conditions and the next 5 days
              for your current location.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadWeather({ refresh: true })
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D9E1D6] bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw
              size={16}
              className={
                refreshing ? "animate-spin" : ""
              }
            />

            {refreshing
              ? "Updating..."
              : "Refresh weather"}
          </button>
        </div>

        {/* =================================================
            CURRENT WEATHER
        ================================================= */}

        <section className="overflow-hidden rounded-3xl bg-[#17442A] text-white shadow-sm">

          <div className="relative overflow-hidden p-6 sm:p-8">

            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/5" />

            <div className="absolute -bottom-28 -left-10 h-72 w-72 rounded-full bg-white/5" />

            <div className="relative z-10">

              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

                {/* CURRENT TEMPERATURE */}

                <div className="flex items-center gap-5">

                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-white/10">

                    <CurrentWeatherIcon
                      size={42}
                      strokeWidth={1.7}
                    />

                  </div>

                  <div>

                    <p className="text-sm font-medium text-[#C8D8CB]">
                      Current weather
                    </p>

                    <div className="mt-1 flex items-end gap-2">

                      <span className="text-5xl font-bold tracking-tight">
                        {Math.round(
                          current.temperature_2m
                        )}
                        °
                      </span>

                      <span className="mb-2 text-lg text-[#C8D8CB]">
                        {weather.current_units
                          ?.temperature_2m || "°C"}
                      </span>

                    </div>

                    <p className="mt-1 text-lg font-semibold">
                      {currentWeatherInfo.label}
                    </p>

                    <p className="mt-1 text-sm text-[#C8D8CB]">
                      Feels like{" "}
                      {Math.round(
                        current.apparent_temperature
                      )}
                      °
                    </p>

                  </div>

                </div>

                {/* RAIN */}

                <div className="rounded-2xl bg-white/10 p-5 lg:min-w-[230px]">

                  <div className="flex items-center gap-2 text-[#DCEBDD]">

                    <Umbrella size={18} />

                    <span className="text-sm font-medium">
                      Rain probability
                    </span>

                  </div>

                  <p className="mt-2 text-3xl font-bold">
                    {todayRainProbability}%
                  </p>

                  <p className="mt-1 text-xs text-[#C8D8CB]">
                    Maximum probability today
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              WEATHER METRICS
          ================================================= */}

          <div className="grid grid-cols-2 border-t border-white/10 sm:grid-cols-4">

            <WeatherMetric
              icon={<Droplets size={18} />}
              label="Humidity"
              value={`${current.relative_humidity_2m ?? "--"}%`}
            />

            <WeatherMetric
              icon={<Wind size={18} />}
              label="Wind"
              value={`${Math.round(
                current.wind_speed_10m ?? 0
              )} km/h`}
            />

            <WeatherMetric
              icon={<Eye size={18} />}
              label="Visibility"
              value={
                current.visibility
                  ? `${(
                      current.visibility / 1000
                    ).toFixed(1)} km`
                  : "--"
              }
            />

            <WeatherMetric
              icon={<Gauge size={18} />}
              label="Pressure"
              value={`${Math.round(
                current.pressure_msl ?? 0
              )} hPa`}
            />

          </div>
        </section>

        {/* =================================================
            TODAY DETAILS
        ================================================= */}

        <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <DetailCard
            icon={<Thermometer size={20} />}
            title="Temperature"
            value={`${Math.round(
              current.temperature_2m
            )}°`}
            subtitle={`Feels like ${Math.round(
              current.apparent_temperature
            )}°`}
          />

          <DetailCard
            icon={<Umbrella size={20} />}
            title="Rain"
            value={`${todayRainProbability}%`}
            subtitle={`${current.precipitation ?? 0} mm currently`}
          />

          <DetailCard
            icon={<Sun size={20} />}
            title="UV index"
            value={`${uvIndex}`}
            subtitle={uvLabel}
          />

          <DetailCard
            icon={<Navigation size={20} />}
            title="Wind direction"
            value={getWindDirection(
              current.wind_direction_10m
            )}
            subtitle={`${Math.round(
              current.wind_speed_10m ?? 0
            )} km/h`}
          />

        </section>

        {/* =================================================
            5 DAY FORECAST
        ================================================= */}

        <section className="mt-7">

          <div className="mb-4">

            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#77907D]">
              Forecast
            </p>

            <h2 className="mt-2 text-xl font-bold text-[#203126]">
              Next 5 days
            </h2>

            <p className="mt-1 text-sm text-[#748078]">
              Temperature, rain probability and expected
              weather conditions.
            </p>

          </div>

          <div className="space-y-3">

            {daily.time?.map((date, index) => {

              const code =
                daily.weather_code?.[index];

              const info = getWeatherInfo(code);

              const ForecastIcon = info.icon;

              const maxTemp =
                daily.temperature_2m_max?.[index];

              const minTemp =
                daily.temperature_2m_min?.[index];

              const rainProbability =
                daily.precipitation_probability_max?.[
                  index
                ] ?? 0;

              const precipitation =
                daily.precipitation_sum?.[index] ?? 0;

              const wind =
                daily.wind_speed_10m_max?.[index] ?? 0;

              return (
                <div
                  key={date}
                  className="rounded-2xl border border-[#D9E1D6] bg-white p-5 shadow-sm transition hover:shadow-md"
                >

                  <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr_1fr_1fr] md:items-center">

                    {/* DATE */}

                    <div>

                      <p className="font-bold text-slate-900">
                        {formatDay(date, index)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(date)}
                      </p>

                    </div>

                    {/* CONDITION */}

                    <div className="flex items-center gap-3">

                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700">

                        <ForecastIcon
                          size={23}
                        />

                      </div>

                      <div>

                        <p className="text-sm font-semibold text-slate-800">
                          {info.label}
                        </p>

                        <p className="text-xs text-slate-500">
                          {rainProbability}% rain
                        </p>

                      </div>

                    </div>

                    {/* TEMPERATURE */}

                    <div>

                      <p className="text-xs text-slate-400">
                        Temperature
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">

                        {Math.round(maxTemp)}
                        °{" "}

                        <span className="font-normal text-slate-400">
                          /{" "}
                          {Math.round(minTemp)}
                          °
                        </span>

                      </p>

                    </div>

                    {/* OTHER */}

                    <div className="flex gap-5 text-xs text-slate-500">

                      <div>
                        <p className="text-slate-400">
                          Rain
                        </p>

                        <p className="mt-1 font-semibold text-slate-700">
                          {precipitation.toFixed(
                            1
                          )} mm
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-400">
                          Wind
                        </p>

                        <p className="mt-1 font-semibold text-slate-700">
                          {Math.round(wind)} km/h
                        </p>
                      </div>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        </section>

        {/* =================================================
            SUNRISE / SUNSET
        ================================================= */}

        <section className="mt-7 rounded-3xl border border-[#D9E1D6] bg-white p-6 shadow-sm">

          <div className="mb-5">

            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#77907D]">
              Today
            </p>

            <h2 className="mt-2 text-xl font-bold text-[#203126]">
              Sun & daylight
            </h2>

          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            <div className="flex items-center gap-4 rounded-2xl bg-orange-50 p-5">

              <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-100 text-orange-600">
                <Sunrise size={24} />
              </div>

              <div>

                <p className="text-xs font-medium text-orange-700">
                  Sunrise
                </p>

                <p className="mt-1 text-xl font-bold text-orange-900">
                  {formatTime(
                    daily.sunrise?.[0]
                  )}
                </p>

              </div>

            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-indigo-50 p-5">

              <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-100 text-indigo-600">
                <Sunset size={24} />
              </div>

              <div>

                <p className="text-xs font-medium text-indigo-700">
                  Sunset
                </p>

                <p className="mt-1 text-xl font-bold text-indigo-900">
                  {formatTime(
                    daily.sunset?.[0]
                  )}
                </p>

              </div>

            </div>

          </div>
        </section>

        {/* =================================================
            AGRICULTURAL WEATHER
        ================================================= */}

        <section className="mt-7 rounded-3xl border border-emerald-100 bg-emerald-50 p-6 md:p-7">

          <div className="flex items-start gap-4">

            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              <CloudSun size={23} />
            </div>

            <div>

              <h2 className="text-lg font-bold text-emerald-950">
                Agricultural conditions
              </h2>

              <p className="mt-1 text-sm leading-6 text-emerald-800">
                Current weather conditions that may affect
                field activities and plant health.
              </p>

            </div>

          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <AgricultureMetric
              label="Humidity"
              value={`${current.relative_humidity_2m ?? "--"}%`}
            />

            <AgricultureMetric
              label="Rain risk"
              value={`${todayRainProbability}%`}
            />

            <AgricultureMetric
              label="Wind"
              value={`${Math.round(
                current.wind_speed_10m ?? 0
              )} km/h`}
            />

            <AgricultureMetric
              label="UV level"
              value={uvLabel}
            />

          </div>

        </section>

        {/* =================================================
            FOOTER NOTE
        ================================================= */}

        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          Weather information is based on your current
          location and live forecast data. Forecast
          conditions can change over time.
        </p>

      </div>
    </div>
  );
}

/* =========================================================
   WEATHER METRIC
========================================================= */

function WeatherMetric({
  icon,
  label,
  value,
}) {
  return (
    <div className="p-5">

      <div className="flex items-center gap-2 text-[#C8D8CB]">
        {icon}

        <span className="text-xs font-medium">
          {label}
        </span>
      </div>

      <p className="mt-2 text-lg font-bold">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   DETAIL CARD
========================================================= */

function DetailCard({
  icon,
  title,
  value,
  subtitle,
}) {
  return (
    <div className="rounded-2xl border border-[#D9E1D6] bg-white p-5 shadow-sm">

      <div className="flex items-center gap-3">

        <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>

        <p className="text-sm font-semibold text-slate-700">
          {title}
        </p>

      </div>

      <p className="mt-4 text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {subtitle}
      </p>

    </div>
  );
}

/* =========================================================
   AGRICULTURAL METRIC
========================================================= */

function AgricultureMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white/70 p-4">

      <p className="text-xs font-medium text-emerald-700">
        {label}
      </p>

      <p className="mt-2 text-lg font-bold text-emerald-950">
        {value}
      </p>

    </div>
  );
}