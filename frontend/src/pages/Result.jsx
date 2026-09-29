import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Leaf,
  RefreshCcw,
  ShieldCheck,
  Stethoscope,
  Sprout,
} from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();

  /*
   * =========================================================
   * READ DATA FROM SCAN PAGE / HISTORY
   * =========================================================
   */

  const state = location.state || {};

  const response = state.prediction || null;
  const selectedCrop = state.selectedCrop || "";
  const imagePreview = state.imagePreview || "";

  /*
   * Result was opened from History
   *
   * true  -> Back to history
   * false -> Back to dashboard
   */
  const fromHistory = state.fromHistory === true;

  /*
   * =========================================================
   * NO RESPONSE
   * =========================================================
   */

  if (!response) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#f5f8f3] p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle
            size={44}
            className="mx-auto mb-4 text-slate-400"
          />

          <h1 className="text-xl font-bold text-slate-900">
            No prediction available
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Please scan a plant image first.
          </p>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-6 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * NORMALIZE API RESPONSE
   *
   * This is important because the backend response may contain
   * prediction information at slightly different levels.
   * =========================================================
   */

  const prediction =
    response?.prediction &&
    typeof response.prediction === "object"
      ? response.prediction
      : {};

  const modelPrediction =
    response?.result &&
    typeof response.result === "object"
      ? response.result
      : {};

  /*
   * =========================================================
   * CROP
   * =========================================================
   */

  const crop =
    response?.selected_crop ||
    response?.crop ||
    prediction?.selected_crop ||
    prediction?.crop ||
    modelPrediction?.selected_crop ||
    modelPrediction?.crop ||
    selectedCrop ||
    "";

  /*
   * =========================================================
   * DECISION
   * =========================================================
   */

  const rawDecision =
    prediction?.decision ||
    response?.decision ||
    modelPrediction?.decision ||
    "";

  const decision = String(rawDecision)
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  const reliabilityStatus =
    prediction?.reliability_status ||
    (decision === "ACCEPT" ? "SUPPORTED" : "UNCERTAIN");

  /*
   * =========================================================
   * CLASS / DISEASE NAME
   *
   * Support several possible backend field names.
   * =========================================================
   */

  const className =
    prediction?.class_name ||
    prediction?.predicted_class ||
    prediction?.predicted_label ||
    prediction?.disease_name ||
    prediction?.disease ||
    response?.class_name ||
    response?.predicted_class ||
    response?.predicted_label ||
    response?.disease_name ||
    response?.disease ||
    modelPrediction?.class_name ||
    modelPrediction?.predicted_class ||
    modelPrediction?.predicted_label ||
    modelPrediction?.disease_name ||
    modelPrediction?.disease ||
    null;

  /*
   * =========================================================
   * MESSAGE
   * =========================================================
   */

  const predictionMessage =
    prediction?.message ||
    prediction?.prediction_message ||
    prediction?.reason ||
    response?.message ||
    response?.prediction_message ||
    response?.reason ||
    "";

  const isUnsupportedImage =
    /does not reliably match|not reliably match|unsupported condition|not supported/i.test(
      predictionMessage
    );

  /*
   * =========================================================
   * LLM CONTENT
   * =========================================================
   */

  const llmContent =
    response?.llm_content ||
    response?.llmContent ||
    prediction?.llm_content ||
    prediction?.llmContent ||
    null;

  const diagnosis =
    llmContent?.diagnosis ||
    response?.diagnosis ||
    null;

  const diseaseInfo =
    llmContent?.disease_info ||
    llmContent?.diseaseInfo ||
    response?.disease_info ||
    response?.diseaseInfo ||
    null;

  const treatment =
    llmContent?.treatment ||
    response?.treatment ||
    null;

  /*
   * =========================================================
   * CROP DISPLAY NAME
   * =========================================================
   */

  const normalizedCrop = String(crop)
    .trim()
    .toLowerCase();

  const cropName =
    normalizedCrop === "apple"
      ? "Apple"
      : normalizedCrop === "maize"
      ? "Maize"
      : normalizedCrop
      ? capitalize(normalizedCrop)
      : "Plant";

  /*
   * =========================================================
   * HEALTHY / DECISION STATES
   * =========================================================
   */

  const normalizedClass = String(
    className || ""
  ).toLowerCase();

  const isHealthy =
    normalizedClass.includes("healthy") ||
    normalizedClass.includes("normal");

  const isRetake =
    decision === "RETAKE_IMAGE" ||
    decision === "RETAKE" ||
    decision === "RETAKE_PHOTO" ||
    decision === "IMAGE_RETAKE";

  const isUncertain =
    decision === "UNCERTAIN" ||
    decision === "UNKNOWN" ||
    decision === "UNSUPPORTED" ||
    decision === "REVIEW" ||
    isUnsupportedImage;

  /*
   * Some backends may return:
   * ACCEPTED instead of ACCEPT.
   */

  const isAcceptedDecision =
    decision === "ACCEPT" ||
    decision === "ACCEPTED" ||
    decision === "PROCEED" ||
    decision === "SUCCESS" ||
    decision === "VALID";

  /*
   * =========================================================
   * IMPORTANT FALLBACK
   *
   * If backend returns prediction/class_name but does not send
   * a decision field, don't show a blank Result page.
   * =========================================================
   */

  const hasPrediction =
    Boolean(className) ||
    Boolean(diagnosis) ||
    Boolean(diseaseInfo) ||
    Boolean(treatment);

  const isAccepted =
    !isRetake &&
    !isUncertain &&
    (isAcceptedDecision ||
      (!decision && hasPrediction));

  /*
   * =========================================================
   * RETAKE
   * =========================================================
   */

  function handleRetake() {
    navigate("/scan", {
      state: {
        selectedCrop: crop || selectedCrop,
      },
    });
  }

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="min-h-full bg-[#f5f8f3] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            {/* =================================================
                BACK BUTTON
            ================================================= */}

            <button
              type="button"
              onClick={() =>
                navigate(
                  fromHistory
                    ? "/history"
                    : "/dashboard"
                )
              }
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
            >
              <ArrowLeft size={16} />

              {fromHistory
                ? "Back to history"
                : "Back to dashboard"}
            </button>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Analysis result
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {cropName} leaf analysis
            </p>

          </div>

          <button
            type="button"
            onClick={handleRetake}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCcw size={16} />

            Scan another image
          </button>

        </div>

        {/* =====================================================
            RETAKE IMAGE
        ====================================================== */}

        {isRetake && (
          <div className="space-y-6">

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 md:p-8">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <AlertTriangle size={25} />
                </div>

                <div>

                  <h2 className="text-xl font-bold text-amber-900">
                    Please retake the image
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-800">
                    The image isn't clear enough. Please retake the photo.
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={handleRetake}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-800"
              >
                <RefreshCcw size={17} />

                Retake image
              </button>

            </div>

            {imagePreview && (
              <ImageCard
                imagePreview={imagePreview}
                cropName={cropName}
              />
            )}

          </div>
        )}

        {/* =====================================================
            UNCERTAIN RESULT
        ====================================================== */}

        {isUncertain && (
          <div className="space-y-6">

            <div className="rounded-3xl border border-orange-200 bg-orange-50 p-6 md:p-8">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                  <AlertTriangle size={25} />
                </div>

                <div>

                  <h2 className="text-xl font-bold text-orange-900">
                    Condition not confirmed
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-orange-800">
                    {predictionMessage || "The image did not meet the model's reliability checks, so we have not issued a diagnosis."} Please try a clear, close-up photo of a supported crop leaf.
                  </p>

                  <div className="mt-5 rounded-2xl border border-orange-200 bg-white/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                      Reliability check
                    </p>
                    <p className="mt-1 font-semibold text-orange-950">
                      Diagnosis withheld
                    </p>
                    <p className="mt-1 text-sm leading-6 text-orange-800">
                      AgriPredict can return an uncertain result instead of forcing a disease label when the image is outside its reliable prediction range.
                    </p>
                  </div>

                </div>

              </div>

              <button
                type="button"
                onClick={handleRetake}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-800"
              >
                <RefreshCcw size={17} />

                Try another image
              </button>

            </div>

            {imagePreview && (
              <ImageCard
                imagePreview={imagePreview}
                cropName={cropName}
              />
            )}

          </div>
        )}

        {/* =================================================
            MAIN RESULT CARD
        ================================================= */}

        {isAccepted && (
          <div className="space-y-6">

            <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">

              <div className="grid lg:grid-cols-[0.9fr_1.1fr]">

                {/* IMAGE */}

                <div className="min-h-[300px] bg-slate-100">

                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt={`${cropName} leaf`}
                      className="h-full min-h-[300px] w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-[300px] items-center justify-center">
                      <Leaf
                        size={50}
                        className="text-slate-300"
                      />
                    </div>
                  )}

                </div>

                {/* RESULT INFO */}

                <div className="p-6 md:p-8">

                  <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 size={15} />

                    Analysis complete
                  </div>

                  <p className="text-sm font-medium text-slate-500">
                    Detected condition
                  </p>

                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    {className || "Condition detected"}
                  </h2>

                  {predictionMessage && (
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {predictionMessage}
                    </p>
                  )}

                  <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Reliability check
                    </p>
                    <p className="mt-1 font-semibold text-emerald-950">
                      {reliabilityStatus === "SUPPORTED" ? "Prediction passed reliability checks" : "Prediction reliability is uncertain"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-emerald-800">
                      This result is limited to the supported crop and conditions represented by the current model.
                    </p>
                  </div>

                  {isHealthy ? (
                    <div className="mt-6 flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">

                      <ShieldCheck
                        className="mt-0.5 shrink-0 text-emerald-600"
                        size={21}
                      />

                      <div>

                        <p className="font-semibold text-emerald-900">
                          Healthy leaf
                        </p>

                        <p className="mt-1 text-sm leading-6 text-emerald-800">
                          The selected crop leaf was classified as healthy.
                        </p>

                      </div>

                    </div>
                  ) : (
                    <div className="mt-6 flex gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">

                      <Stethoscope
                        className="mt-0.5 shrink-0 text-amber-600"
                        size={21}
                      />

                      <div>

                        <p className="font-semibold text-amber-900">
                          Disease detected
                        </p>

                        <p className="mt-1 text-sm leading-6 text-amber-800">
                          Review the information and management guidance below.
                        </p>

                      </div>

                    </div>
                  )}

                </div>

              </div>

            </div>

            {/* =================================================
                DIAGNOSIS
            ================================================= */}

            {diagnosis && (
              <InfoSection
                icon={<Stethoscope size={21} />}
                title="Diagnosis"
              >

                {typeof diagnosis === "string" ? (
                  <p className="text-sm leading-7 text-slate-600">
                    {diagnosis}
                  </p>
                ) : (
                  <>
                    {diagnosis.title && (
                      <h3 className="text-lg font-semibold text-slate-900">
                        {diagnosis.title}
                      </h3>
                    )}

                    {diagnosis.summary && (
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {diagnosis.summary}
                      </p>
                    )}

                    {diagnosis.confidence && (
                      <p className="mt-3 text-sm text-slate-500">
                        Confidence:{" "}
                        <span className="font-semibold text-slate-700">
                          {diagnosis.confidence}
                        </span>
                      </p>
                    )}
                  </>
                )}

              </InfoSection>
            )}

            {/* =================================================
                DISEASE INFORMATION
            ================================================= */}

            {diseaseInfo && (
              <InfoSection
                icon={<Leaf size={21} />}
                title="Disease information"
              >

                {typeof diseaseInfo === "string" ? (
                  <p className="text-sm leading-7 text-slate-600">
                    {diseaseInfo}
                  </p>
                ) : (
                  <>
                    {diseaseInfo.overview && (
                      <p className="text-sm leading-7 text-slate-600">
                        {diseaseInfo.overview}
                      </p>
                    )}

                    <div className="mt-6 grid gap-6 md:grid-cols-3">

                      <ListBlock
                        title="Symptoms"
                        items={diseaseInfo.symptoms}
                      />

                      <ListBlock
                        title="Possible causes"
                        items={
                          diseaseInfo.possible_causes ||
                          diseaseInfo.causes
                        }
                      />

                      <ListBlock
                        title="Spread"
                        items={
                          diseaseInfo.spread ||
                          diseaseInfo.transmission
                        }
                      />

                    </div>
                  </>
                )}

              </InfoSection>
            )}

            {/* =================================================
                TREATMENT
            ================================================= */}

            {treatment && (
              <InfoSection
                icon={<Sprout size={21} />}
                title="Treatment & management"
              >

                {typeof treatment === "string" ? (
                  <p className="text-sm leading-7 text-slate-600">
                    {treatment}
                  </p>
                ) : (
                  <>
                    <div className="grid gap-6 md:grid-cols-2">

                      <ListBlock
                        title="Prevention"
                        items={treatment.prevention}
                      />

                      <ListBlock
                        title="Management"
                        items={
                          treatment.management ||
                          treatment.steps
                        }
                      />

                    </div>

                    {treatment.professional_help_message && (
                      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">

                        <p className="text-sm font-semibold text-slate-900">
                          When to seek professional help
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {treatment.professional_help_message}
                        </p>

                      </div>
                    )}

                    {treatment.professional_help && (
                      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">

                        <p className="text-sm font-semibold text-slate-900">
                          When to seek professional help
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {treatment.professional_help}
                        </p>

                      </div>
                    )}
                  </>
                )}

              </InfoSection>
            )}

            {/* =================================================
                FALLBACK INFORMATION
            ================================================= */}

            {!diagnosis &&
              !diseaseInfo &&
              !treatment &&
              !predictionMessage && (
                <InfoSection
                  icon={<Leaf size={21} />}
                  title="Prediction details"
                >
                  <p className="text-sm leading-7 text-slate-600">
                    The model identified{" "}
                    <span className="font-semibold text-slate-900">
                      {className || "a condition"}
                    </span>{" "}
                    for the selected {cropName} image.
                  </p>
                </InfoSection>
              )}

            {/* =================================================
                BOTTOM ACTIONS
            ================================================= */}

            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:justify-between">

              <button
                type="button"
                onClick={() =>
                  navigate(
                    fromHistory
                      ? "/history"
                      : "/dashboard"
                  )
                }
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {fromHistory
                  ? "Back to history"
                  : "Back to dashboard"}
              </button>

              <button
                type="button"
                onClick={handleRetake}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                <RefreshCcw size={17} />

                Scan another leaf
              </button>

            </div>

          </div>
        )}

        {/* =================================================
            UNKNOWN RESPONSE FALLBACK
        ================================================= */}

        {!isRetake &&
          !isUncertain &&
          !isAccepted && (
            <div className="space-y-6">

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">

                <div className="flex gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <AlertCircle size={25} />
                  </div>

                  <div>

                    <h2 className="text-xl font-bold text-slate-900">
                      Prediction received
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {predictionMessage ||
                        "The prediction was received, but the response did not contain a recognized decision."}
                    </p>

                    {className && (
                      <div className="mt-5 rounded-2xl bg-slate-50 p-4">

                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Detected condition
                        </p>

                        <p className="mt-1 text-lg font-semibold text-slate-900">
                          {className}
                        </p>

                      </div>
                    )}

                  </div>

                </div>

                <button
                  type="button"
                  onClick={handleRetake}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  <RefreshCcw size={17} />

                  Scan another image
                </button>

              </div>

              {imagePreview && (
                <ImageCard
                  imagePreview={imagePreview}
                  cropName={cropName}
                />
              )}

            </div>
          )}

      </div>
    </div>
  );
}

/* =========================================================
   IMAGE CARD
========================================================= */

function ImageCard({
  imagePreview,
  cropName,
}) {
  if (!imagePreview) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

      <div className="border-b border-slate-100 px-5 py-4">

        <p className="font-semibold text-slate-900">
          Uploaded image
        </p>

        <p className="text-xs text-slate-500">
          {cropName} leaf
        </p>

      </div>

      <div className="bg-slate-100 p-4">

        <img
          src={imagePreview}
          alt={`${cropName} leaf`}
          className="mx-auto max-h-[500px] w-full rounded-2xl object-contain"
        />

      </div>

    </div>
  );
}

/* =========================================================
   INFO SECTION
========================================================= */

function InfoSection({
  icon,
  title,
  children,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">

      <div className="mb-5 flex items-center gap-3">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>

        <h2 className="text-lg font-bold text-slate-900">
          {title}
        </h2>

      </div>

      {children}

    </section>
  );
}

/* =========================================================
   LIST BLOCK
========================================================= */

function ListBlock({
  title,
  items,
}) {
  if (!items) {
    return null;
  }

  /*
   * Handle:
   * ["item 1", "item 2"]
   *
   * and also:
   * "item 1"
   */

  const normalizedItems = Array.isArray(items)
    ? items
    : [items];

  const validItems = normalizedItems.filter(
    (item) =>
      item !== null &&
      item !== undefined &&
      String(item).trim() !== ""
  );

  if (validItems.length === 0) {
    return null;
  }

  return (
    <div>

      <h3 className="mb-3 text-sm font-semibold text-slate-900">
        {title}
      </h3>

      <ul className="space-y-2">

        {validItems.map((item, index) => {

          const text =
            typeof item === "object"
              ? item.text ||
                item.description ||
                item.name ||
                JSON.stringify(item)
              : String(item);

          return (
            <li
              key={`${title}-${index}`}
              className="flex gap-2 text-sm leading-6 text-slate-600"
            >

              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />

              <span>
                {text}
              </span>

            </li>
          );
        })}

      </ul>

    </div>
  );
}

/* =========================================================
   CAPITALIZE
========================================================= */

function capitalize(value) {
  if (!value) {
    return "";
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}
