import { useRef, useState } from "react";
import {
  Upload,
  Image as ImageIcon,
  X,
  Sparkles,
  Leaf,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { predictDisease } from "../services/api";

export default function Scan() {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedCrop =
    location.state?.selectedCrop || "";

  const fileInputRef = useRef(null);

  const [selectedImage, setSelectedImage] =
    useState(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [error, setError] = useState("");

  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  const cropDisplayName =
    selectedCrop === "apple"
      ? "Apple"
      : selectedCrop === "maize"
      ? "Maize"
      : "";

  const cropEmoji =
    selectedCrop === "apple"
      ? "🍎"
      : selectedCrop === "maize"
      ? "🌽"
      : "🌿";

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    setError("");

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setSelectedImage(null);
      setPreviewUrl("");

      setError(
        "Please select a valid image file."
      );

      return;
    }

    if (file.size === 0) {
      setSelectedImage(null);
      setPreviewUrl("");

      setError(
        "This image file is empty or invalid. Please choose another image."
      );

      return;
    }

    setSelectedImage(file);

    const reader = new FileReader();

    reader.onload = () => {
      setPreviewUrl(reader.result);
    };

    reader.onerror = () => {
      setSelectedImage(null);
      setPreviewUrl("");

      setError(
        "The selected image could not be read. Please choose another image."
      );
    };

    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setSelectedImage(null);
    setPreviewUrl("");
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleAnalyze() {
    setError("");

    if (!selectedCrop) {
      setError(
        "Please select a crop before continuing."
      );

      return;
    }

    if (!selectedImage) {
      setError(
        "Please upload a plant image first."
      );

      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await predictDisease({
        image: selectedImage,
        crop: selectedCrop,
        language: "en",
        save_to_history: true,
      });

      console.log(
        "Prediction API response:",
        response
      );

      navigate("/result", {
        state: {
          prediction: response,
          selectedCrop,
          imagePreview: previewUrl,
        },
      });
    } catch (err) {
      console.error(
        "Prediction failed:",
        err
      );

      setError(
        err?.message ||
          "Unable to analyze the image. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleSelectAnotherCrop() {
    navigate("/dashboard");
  }

  return (
    <div className="min-h-full bg-[#f5f8f3] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
            <Sparkles size={16} />
            AI Plant Disease Analysis
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Scan your plant
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Upload a clear image of the selected crop leaf
            and let AgriPredict analyze it.
          </p>
        </div>

        {/* Selected Crop */}
        <div className="mb-6 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
                {cropEmoji}
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Selected crop
                </p>

                <p className="text-base font-semibold text-slate-900">
                  {cropDisplayName || "No crop selected"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSelectAnotherCrop}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              Change crop
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <AlertCircle
              className="mt-0.5 shrink-0 text-red-600"
              size={20}
            />

            <div>
              <p className="font-semibold text-red-800">
                Analysis issue
              </p>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Main upload card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">

          {!previewUrl ? (
            <div
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="group flex min-h-[380px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-6 text-center transition hover:border-emerald-300 hover:bg-emerald-50/40"
            >
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 transition group-hover:scale-105">
                <Upload size={28} />
              </div>

              <h2 className="text-lg font-semibold text-slate-900">
                Upload a leaf image
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Choose a clear photo of the {cropDisplayName || "plant"} leaf.
                Avoid blurry, extremely dark, or overexposed images.
              </p>

              <span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition group-hover:bg-emerald-800">
                <ImageIcon size={17} />
                Choose image
              </span>

              <p className="mt-4 text-xs text-slate-400">
                JPG, JPEG, PNG and other supported image formats
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    Selected image
                  </p>

                  <p className="text-xs text-slate-500">
                    {selectedImage?.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <X size={16} />
                  Remove
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <img
                  src={previewUrl}
                  alt={`${cropDisplayName} leaf preview`}
                  className="mx-auto max-h-[520px] w-full object-contain"
                />
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Analyze */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {previewUrl
                ? "Choose another image"
                : "Select image"}
            </button>

            <button
              type="button"
              disabled={
                isAnalyzing ||
                !selectedImage ||
                !selectedCrop
              }
              onClick={handleAnalyze}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isAnalyzing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  Analyze plant
                </>
              )}
            </button>
          </div>
        </div>

        {/* Guidance */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <CheckCircle2
              className="mb-3 text-emerald-600"
              size={21}
            />

            <h3 className="font-semibold text-slate-900">
              Clear image
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Keep the affected leaf in focus.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Leaf
              className="mb-3 text-emerald-600"
              size={21}
            />

            <h3 className="font-semibold text-slate-900">
              Correct crop
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Upload an image matching the selected crop.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <ImageIcon
              className="mb-3 text-emerald-600"
              size={21}
            />

            <h3 className="font-semibold text-slate-900">
              Good lighting
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Avoid extreme darkness, glare and shadows.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}