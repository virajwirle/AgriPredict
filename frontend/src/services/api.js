const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

function getAccessToken() {
  return localStorage.getItem("access_token");
}

async function apiRequest(endpoint, options = {}) {
  const token = getAccessToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    throw new Error(
      "Your session has expired. Please login again."
    );
  }

  if (!response.ok) {
    const backendMessage =
      data?.detail ||
      data?.message ||
      data?.error ||
      "";

    throw new Error(
      backendMessage ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

/* =========================================================
   AUTH
========================================================= */

export async function registerUser({
  email,
  password,
  full_name,
  preferred_language = "en",
}) {
  return apiRequest("/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      full_name,
      preferred_language,
    }),
  });
}

export async function loginUser({
  email,
  password,
}) {
  return apiRequest("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

/* =========================================================
   DISEASE PREDICTION
========================================================= */

export async function predictDisease({
  image,
  crop,
  language = "en",
  save_to_history = true,
}) {
  if (!image) {
    throw new Error("Please select an image.");
  }

  if (!crop) {
    throw new Error("Please select a crop.");
  }

  const formData = new FormData();

  formData.append("crop", crop);
  formData.append("language", language);
  formData.append(
    "save_to_history",
    String(save_to_history)
  );
  formData.append("image", image);

  /*
   * IMPORTANT:
   *
   * Prediction endpoint = /predict
   *
   * History endpoint = /predictions
   *
   * Do NOT change this to /predictions.
   */
  try {
    return await apiRequest("/predict", {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    const message = String(error?.message || "").toLowerCase();

    if (
      message.includes("blur") ||
      message.includes("blurry") ||
      message.includes("sharpness") ||
      message.includes("focus")
    ) {
      throw new Error(
        "This image is too blurry to analyze reliably. Please retake the photo with the affected leaf clearly in focus."
      );
    }

    if (
      message.includes("corrupt") ||
      message.includes("unreadable") ||
      message.includes("cannot read") ||
      message.includes("invalid image")
    ) {
      throw new Error(
        "This image could not be read correctly. The file may be corrupted or in an unsupported image format. Please upload a different image."
      );
    }

    if (
      message.includes("too dark") ||
      message.includes("dark image") ||
      message.includes("brightness")
    ) {
      throw new Error(
        "This image is too dark to analyze reliably. Please retake the photo in good lighting."
      );
    }

    if (
      message.includes("too bright") ||
      message.includes("overexposed")
    ) {
      throw new Error(
        "This image is too bright to analyze reliably. Please retake the photo without strong glare or overexposure."
      );
    }

    if (
      message.includes("resolution") ||
      message.includes("low quality") ||
      message.includes("quality")
    ) {
      throw new Error(
        "The image quality is not sufficient for reliable analysis. Please retake the photo with the leaf clearly visible, well lit, and in focus."
      );
    }

    if (
      message.includes("uncertain") ||
      message.includes("unsupported") ||
      message.includes("ood") ||
      message.includes("not recognized") ||
      message.includes("reliably identify")
    ) {
      throw new Error(
        "We couldn't reliably identify a supported condition from this image. Please retake the image with the selected crop and affected leaf clearly visible."
      );
    }

    throw error;
  }
}

/* =========================================================
   PREDICTION HISTORY
========================================================= */

export async function getPredictionHistory({
  limit = 20,
  include_images = false,
} = {}) {
  const params = new URLSearchParams();

  params.append("limit", String(limit));
  params.append(
    "include_images",
    String(include_images)
  );

  return apiRequest(
    `/predictions?${params.toString()}`,
    {
      method: "GET",
    }
  );
}

export async function getPrediction(requestId) {
  if (!requestId) {
    throw new Error(
      "Prediction request ID is required."
    );
  }

  return apiRequest(
    `/predictions/${requestId}`,
    {
      method: "GET",
    }
  );
}

export async function deletePrediction(requestId) {
  if (!requestId) {
    throw new Error(
      "Prediction request ID is required."
    );
  }

  return apiRequest(
    `/predictions/${requestId}`,
    {
      method: "DELETE",
    }
  );
}

/* =========================================================
   WEATHER
========================================================= */

export async function getWeatherDashboard() {
  return apiRequest("/weather/dashboard", {
    method: "GET",
  });
}

/* =========================================================
   HEALTH
========================================================= */

export async function getApiHealth() {
  return apiRequest("/health", {
    method: "GET",
  });
}