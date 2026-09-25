const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";

export async function getCurrentWeather(latitude, longitude) {
  const url = new URL(WEATHER_API_URL);

  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);

  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation",
      "rain",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
    ].join(",")
  );

  url.searchParams.set(
    "hourly",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation_probability",
      "precipitation",
      "rain",
      "wind_speed_10m",
    ].join(",")
  );

  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error("Unable to fetch current weather.");
  }

  const data = await response.json();

  return data;
}

/*
 * Convert Open-Meteo weather codes into readable text.
 */
export function getWeatherDescription(code) {
  const weatherCode = Number(code);

  const descriptions = {
    0: "Clear sky",

    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",

    45: "Foggy",
    48: "Depositing rime fog",

    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",

    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",

    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",

    66: "Light freezing rain",
    67: "Heavy freezing rain",

    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",

    77: "Snow grains",

    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",

    85: "Slight snow showers",
    86: "Heavy snow showers",

    95: "Thunderstorm",

    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };

  return descriptions[weatherCode] || "Unknown conditions";
}

/*
 * Get a simple weather icon/emoji.
 */
export function getWeatherIcon(code) {
  const weatherCode = Number(code);

  if (weatherCode === 0) {
    return "☀️";
  }

  if ([1, 2].includes(weatherCode)) {
    return "🌤️";
  }

  if (weatherCode === 3) {
    return "☁️";
  }

  if ([45, 48].includes(weatherCode)) {
    return "🌫️";
  }

  if (
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(
      weatherCode
    )
  ) {
    return "🌧️";
  }

  if (
    [71, 73, 75, 77, 85, 86].includes(weatherCode)
  ) {
    return "❄️";
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return "⛈️";
  }

  return "🌤️";
}

/*
 * Browser location.
 */
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new Error(
          "Location services are not supported by this browser."
        )
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let message =
          "Unable to access your location.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message =
              "Location access was denied. Please allow location access to view local weather.";
            break;

          case error.POSITION_UNAVAILABLE:
            message =
              "Your current location could not be determined.";
            break;

          case error.TIMEOUT:
            message =
              "Location request timed out. Please try again.";
            break;

          default:
            message =
              "Unable to access your location.";
        }

        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  });
}