import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Image as ImageIcon,
  Leaf,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  XCircle,
  ArrowLeft
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  getPredictionHistory,
  deletePrediction,
} from "../services/api";

export default function History() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [deletingId, setDeletingId] = useState(null);

  const [selectedItem, setSelectedItem] = useState(null);

  // =========================================================
  // DELETE CONFIRMATION
  // =========================================================
  const [deleteTarget, setDeleteTarget] = useState(null);

  // =========================================================
  // LOAD HISTORY
  // =========================================================
  async function loadHistory({ refresh = false } = {}) {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      /*
       * We request images because the history UI can display
       * the stored prediction image.
       *
       * The backend generates temporary signed URLs.
       */
      const response = await getPredictionHistory({
        limit: 50,
        include_images: true,
      });

      setItems(
        Array.isArray(response?.items)
          ? response.items
          : []
      );

      setCount(
        Number(response?.count || 0)
      );
    } catch (err) {
      console.error(
        "Failed to load prediction history:",
        err
      );

      setError(
        err?.message ||
          "Unable to load prediction history."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  // =========================================================
  // OPEN DELETE CONFIRMATION
  // =========================================================
  function handleDelete(requestId) {
    if (!requestId) {
      return;
    }

    const target = items.find(
      (item) =>
        item.request_id === requestId
    );

    if (!target) {
      return;
    }

    /*
     * Instead of window.confirm(), we open
     * our own application UI.
     */
    setDeleteTarget(target);
  }

  // =========================================================
  // ACTUAL DELETE
  // =========================================================
  async function confirmDelete() {
    if (!deleteTarget?.request_id) {
      return;
    }

    const requestId =
      deleteTarget.request_id;

    setDeletingId(requestId);
    setError("");

    try {
      await deletePrediction(requestId);

      /*
       * Remove the deleted scan immediately
       * from the current UI.
       */
      setItems((currentItems) =>
        currentItems.filter(
          (item) =>
            item.request_id !== requestId
        )
      );

      setCount((currentCount) =>
        Math.max(
          0,
          currentCount - 1
        )
      );

      /*
       * If the deleted item was open
       * in the details modal, close it.
       */
      setSelectedItem((currentItem) =>
        currentItem?.request_id ===
        requestId
          ? null
          : currentItem
      );

      // Close confirmation modal
      setDeleteTarget(null);
    } catch (err) {
      console.error(
        "Failed to delete prediction:",
        err
      );

      setError(
        err?.message ||
          "Unable to delete this scan."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // =========================================================
  // OPEN RESULT
  // =========================================================
  function handleOpenResult(item) {
    /*
     * History already contains the complete prediction
     * information, but Result.jsx expects the prediction
     * object from Scan.jsx.
     *
     * Therefore we reconstruct the same shape that
     * Result.jsx understands.
     */
    const reconstructedResponse = {
      selected_crop:
        item.selected_crop,

      prediction: {
        decision:
          item.decision,

        class_name:
          item.predicted_class_name,

        class_code:
          item.predicted_class_code,

        message:
          item.message,
      },

      llm_content:
        item.llm_content || null,
    };

    navigate("/result", {
      state: {
        prediction:
          reconstructedResponse,

        selectedCrop:
          item.selected_crop,

        imagePreview:
          item.image_url || "",

        /*
         * Important:
         * Result.jsx uses this to know that the
         * result was opened from History.
         */
        fromHistory: true,
      },
    });
  }

  // =========================================================
  // FORMAT CROP
  // =========================================================
  function formatCrop(crop) {
    if (!crop) {
      return "Unknown crop";
    }

    return crop
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  // =========================================================
  // FORMAT DECISION
  // =========================================================
  function formatDecision(decision) {
    if (!decision) {
      return "Unknown";
    }

    return decision
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  // =========================================================
  // FORMAT DATE
  // =========================================================
  function formatDate(dateValue) {
    if (!dateValue) {
      return "Unknown date";
    }

    const date = new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Unknown date";
    }

    return date.toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  // =========================================================
  // FORMAT TIME
  // =========================================================
  function formatTime(dateValue) {
    if (!dateValue) {
      return "";
    }

    const date = new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    return date.toLocaleTimeString(
      undefined,
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  }

  // =========================================================
  // HEALTHY CHECK
  // =========================================================
  function isHealthy(item) {
    return Boolean(
      item?.predicted_class_name
        ?.toLowerCase()
        .includes("healthy")
    );
  }

  // =========================================================
  // DECISION STYLES
  // =========================================================
  function getDecisionStyles(decision) {
    const normalized =
      String(decision || "")
        .toUpperCase();

    if (normalized === "ACCEPT") {
      return {
        container:
          "border-emerald-200 bg-emerald-50",
        icon:
          "text-emerald-600",
        text:
          "text-emerald-800",
        label:
          "Accepted",
      };
    }

    if (
      normalized ===
      "RETAKE_IMAGE"
    ) {
      return {
        container:
          "border-amber-200 bg-amber-50",
        icon:
          "text-amber-600",
        text:
          "text-amber-800",
        label:
          "Retake image",
      };
    }

    if (
      normalized ===
      "UNCERTAIN"
    ) {
      return {
        container:
          "border-orange-200 bg-orange-50",
        icon:
          "text-orange-600",
        text:
          "text-orange-800",
        label:
          "Uncertain",
      };
    }

    return {
      container:
        "border-slate-200 bg-slate-50",
      icon:
        "text-slate-500",
      text:
        "text-slate-700",
      label:
        formatDecision(decision),
    };
  }

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className="min-h-full bg-[#f5f8f3] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">

        <button
  type="button"
  onClick={() => navigate("/dashboard")}
  className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
>
  <ArrowLeft size={16} />
  Back to dashboard
</button>

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
              <Clock3 size={16} />

              Scan history
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Prediction history
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              View your previous plant disease
              analyses, results and stored images.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadHistory({
                refresh: true,
              })
            }
            disabled={
              loading || refreshing
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <RefreshCcw size={16} />
            )}

            Refresh
          </button>
        </div>

        {/* =====================================================
            RECENT SCANS
        ====================================================== */}

        {!loading &&
          items.length > 0 && (
            <section className="mb-8">

              <div className="mb-4 flex items-end justify-between">

                <div>
                  <p className="text-sm font-medium text-emerald-700">
                    Recent activity
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Recent scans
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Your latest plant disease analyses.
                  </p>
                </div>

                <p className="text-xs text-slate-400">
                  {Math.min(
                    items.length,
                    3
                  )}{" "}
                  recent
                </p>

              </div>

              <div className="grid gap-4 md:grid-cols-3">

                {items
                  .slice(0, 3)
                  .map((item) => {
                    const healthy =
                      isHealthy(item);

                    const decisionStyles =
                      getDecisionStyles(
                        item.decision
                      );

                    return (
                      <article
                        key={`recent-${item.request_id}`}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >

                        {/* IMAGE */}

                        <div className="h-40 bg-slate-100">

                          {item.image_url ? (
                            <img
                              src={
                                item.image_url
                              }
                              alt={
                                item.predicted_class_name ||
                                `${formatCrop(
                                  item.selected_crop
                                )} leaf`
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <ImageIcon
                                size={32}
                                className="text-slate-300"
                              />
                            </div>
                          )}

                        </div>

                        <div className="p-4">

                          {/* CROP + DECISION */}

                          <div className="flex flex-wrap gap-2">

                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              {formatCrop(
                                item.selected_crop
                              )}
                            </span>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${decisionStyles.container} ${decisionStyles.text}`}
                            >
                              {decisionStyles.label}
                            </span>

                          </div>

                          {/* CONDITION */}

                          <h3 className="mt-3 line-clamp-2 text-base font-bold text-slate-900">
                            {item.predicted_class_name ||
                              "No condition detected"}
                          </h3>

                          {/* DATE */}

                          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">

                            <CalendarDays
                              size={13}
                            />

                            {formatDate(
                              item.created_at
                            )}

                            {formatTime(
                              item.created_at
                            ) &&
                              ` • ${formatTime(
                                item.created_at
                              )}`}

                          </div>

                          {/* HEALTH */}

                          <div
                            className={`mt-4 rounded-xl border p-3 ${
                              healthy
                                ? "border-emerald-100 bg-emerald-50"
                                : "border-amber-100 bg-amber-50"
                            }`}
                          >

                            <div className="flex gap-2">

                              {healthy ? (
                                <ShieldCheck
                                  size={17}
                                  className="mt-0.5 shrink-0 text-emerald-600"
                                />
                              ) : (
                                <AlertCircle
                                  size={17}
                                  className="mt-0.5 shrink-0 text-amber-600"
                                />
                              )}

                              <p
                                className={`text-xs leading-5 ${
                                  healthy
                                    ? "text-emerald-800"
                                    : "text-amber-800"
                                }`}
                              >
                                {item.message ||
                                  (healthy
                                    ? "Healthy leaf detected."
                                    : "Disease detected.")}
                              </p>

                            </div>

                          </div>

                          {/* OPEN RESULT */}

                          <button
                            type="button"
                            onClick={() =>
                              handleOpenResult(
                                item
                              )
                            }
                            className="mt-4 w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
                          >
                            View result
                          </button>

                        </div>

                      </article>
                    );
                  })}

              </div>
            </section>
          )}

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="mb-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">

            <AlertCircle
              className="mt-0.5 shrink-0 text-red-600"
              size={20}
            />

            <div className="min-w-0">

              <p className="font-semibold text-red-800">
                History issue
              </p>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {error}
              </p>

            </div>

          </div>
        )}

        {/* =====================================================
            LOADING
        ====================================================== */}

        {loading && (
          <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">

            <div className="text-center">

              <Loader2
                size={34}
                className="mx-auto animate-spin text-emerald-600"
              />

              <p className="mt-4 text-sm font-semibold text-slate-700">
                Loading your scan history...
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Please wait
              </p>

            </div>

          </div>
        )}

        {/* =====================================================
            EMPTY
        ====================================================== */}

        {!loading &&
          items.length === 0 && (
            <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

              <div className="max-w-md text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Leaf size={30} />
                </div>

                <h2 className="mt-5 text-xl font-bold text-slate-900">
                  No scans yet
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Your completed plant disease
                  analyses will appear here.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/dashboard")
                  }
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  <Leaf size={17} />
                  Start a scan
                </button>

              </div>

            </div>
          )}

        {/* =====================================================
            HISTORY CONTENT
        ====================================================== */}

        {!loading &&
          items.length > 0 && (
            <>

              {/* COUNT */}

              <div className="mb-4 flex items-center justify-between">

                <p className="text-sm text-slate-500">
                  {count}{" "}
                  {count === 1
                    ? "scan"
                    : "scans"}{" "}
                  found
                </p>

                <p className="text-xs text-slate-400">
                  Most recent first
                </p>

              </div>

              {/* CARDS */}

              <div className="grid gap-5">

                {items.map((item) => {

                  const decisionStyles =
                    getDecisionStyles(
                      item.decision
                    );

                  const healthy =
                    isHealthy(item);

                  return (
                    <article
                      key={
                        item.request_id
                      }
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                    >

                      <div className="grid md:grid-cols-[230px_1fr]">

                        {/* =================================================
                            IMAGE
                        ================================================== */}

                        <div className="min-h-[220px] bg-slate-100">

                          {item.image_url ? (
                            <img
                              src={
                                item.image_url
                              }
                              alt={
                                item.predicted_class_name ||
                                `${formatCrop(
                                  item.selected_crop
                                )} leaf`
                              }
                              className="h-full min-h-[220px] w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full min-h-[220px] flex-col items-center justify-center p-6 text-center">

                              <ImageIcon
                                size={36}
                                className="text-slate-300"
                              />

                              <p className="mt-3 text-xs font-medium text-slate-400">
                                Image unavailable
                              </p>

                            </div>
                          )}

                        </div>

                        {/* =================================================
                            CONTENT
                        ================================================== */}

                        <div className="p-5 md:p-6">

                          {/* TOP ROW */}

                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                            <div>

                              <div className="flex flex-wrap items-center gap-2">

                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">

                                  <Leaf
                                    size={13}
                                  />

                                  {formatCrop(
                                    item.selected_crop
                                  )}

                                </span>

                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${decisionStyles.container} ${decisionStyles.text}`}
                                >

                                  {item.decision ===
                                  "ACCEPT" ? (
                                    <CheckCircle2
                                      size={13}
                                    />
                                  ) : (
                                    <AlertCircle
                                      size={13}
                                    />
                                  )}

                                  {
                                    decisionStyles.label
                                  }

                                </span>

                              </div>

                              <h2 className="mt-4 text-xl font-bold text-slate-900">

                                {item.predicted_class_name ||
                                  "No condition detected"}

                              </h2>

                            </div>

                            {/* DATE */}

                            <div className="shrink-0 text-left sm:text-right">

                              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 sm:justify-end">

                                <CalendarDays
                                  size={14}
                                />

                                {formatDate(
                                  item.created_at
                                )}

                              </div>

                              <p className="mt-1 text-xs text-slate-400">
                                {formatTime(
                                  item.created_at
                                )}
                              </p>

                            </div>

                          </div>

                          {/* =================================================
                              HEALTH / DISEASE
                          ================================================== */}

                          <div
                            className={`mt-5 flex gap-3 rounded-2xl border p-4 ${
                              healthy
                                ? "border-emerald-100 bg-emerald-50"
                                : "border-amber-100 bg-amber-50"
                            }`}
                          >

                            {healthy ? (
                              <ShieldCheck
                                size={21}
                                className="mt-0.5 shrink-0 text-emerald-600"
                              />
                            ) : (
                              <AlertCircle
                                size={21}
                                className="mt-0.5 shrink-0 text-amber-600"
                              />
                            )}

                            <div>

                              <p
                                className={`font-semibold ${
                                  healthy
                                    ? "text-emerald-900"
                                    : "text-amber-900"
                                }`}
                              >
                                {healthy
                                  ? "Healthy leaf"
                                  : "Disease detected"}
                              </p>

                              <p
                                className={`mt-1 text-sm leading-6 ${
                                  healthy
                                    ? "text-emerald-800"
                                    : "text-amber-800"
                                }`}
                              >
                                {item.message ||
                                  (healthy
                                    ? "The selected crop leaf was classified as healthy."
                                    : "Review the analysis for more information.")}
                              </p>

                            </div>

                          </div>

                          {/* =================================================
                              ACTIONS
                          ================================================== */}

                          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedItem(
                                  item
                                )
                              }
                              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              View details
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleOpenResult(
                                  item
                                )
                              }
                              className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
                            >
                              Open result
                            </button>

                            <button
                              type="button"
                              disabled={
                                deletingId ===
                                item.request_id
                              }
                              onClick={() =>
                                handleDelete(
                                  item.request_id
                                )
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >

                              <Trash2
                                size={16}
                              />

                              Delete

                            </button>

                          </div>

                        </div>

                      </div>

                    </article>
                  );
                })}

              </div>

            </>
          )}

        {/* =====================================================
            DETAILS MODAL
        ====================================================== */}

        {selectedItem && (
          <HistoryDetailsModal
            item={selectedItem}
            onClose={() =>
              setSelectedItem(null)
            }
            onOpenResult={() => {
              const item =
                selectedItem;

              setSelectedItem(null);

              handleOpenResult(item);
            }}
            formatCrop={formatCrop}
            formatDate={formatDate}
            formatTime={formatTime}
          />
        )}

        {/* =====================================================
            DELETE CONFIRMATION MODAL
        ====================================================== */}

        {deleteTarget && (
          <DeleteConfirmationModal
            item={deleteTarget}
            deleting={
              deletingId ===
              deleteTarget.request_id
            }
            onCancel={() =>
              setDeleteTarget(null)
            }
            onConfirm={confirmDelete}
            formatCrop={formatCrop}
          />
        )}

      </div>
    </div>
  );
}

/* =========================================================
   DETAILS MODAL
========================================================= */

function HistoryDetailsModal({
  item,
  onClose,
  onOpenResult,
  formatCrop,
  formatDate,
  formatTime,
}) {
  const healthy =
    item?.predicted_class_name
      ?.toLowerCase()
      .includes("healthy");

  const llm =
    item?.llm_content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">

      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">

          <div>

            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Scan details
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              {item.predicted_class_name ||
                "Prediction result"}
            </h2>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <XCircle size={22} />
          </button>

        </div>

        <div className="p-5 md:p-7">

          {/* IMAGE */}

          {item.image_url && (
            <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">

              <img
                src={item.image_url}
                alt={
                  item.predicted_class_name ||
                  "Plant scan"
                }
                className="max-h-[420px] w-full object-contain"
              />

            </div>
          )}

          {/* BASIC INFORMATION */}

          <div className="grid gap-4 sm:grid-cols-2">

            <DetailBox
              label="Crop"
              value={formatCrop(
                item.selected_crop
              )}
            />

            <DetailBox
              label="Decision"
              value={
                item.decision
                  ? item.decision.replaceAll(
                      "_",
                      " "
                    )
                  : "Unknown"
              }
            />

            <DetailBox
              label="Date"
              value={formatDate(
                item.created_at
              )}
            />

            <DetailBox
              label="Time"
              value={formatTime(
                item.created_at
              )}
            />

          </div>

          {/* MESSAGE */}

          {item.message && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">

              <p className="text-sm font-semibold text-slate-900">
                Analysis message
              </p>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                {item.message}
              </p>

            </div>
          )}

          {/* HEALTH */}

          <div
            className={`mt-6 flex gap-3 rounded-2xl border p-4 ${
              healthy
                ? "border-emerald-100 bg-emerald-50"
                : "border-amber-100 bg-amber-50"
            }`}
          >

            {healthy ? (
              <ShieldCheck
                className="mt-0.5 shrink-0 text-emerald-600"
                size={22}
              />
            ) : (
              <AlertCircle
                className="mt-0.5 shrink-0 text-amber-600"
                size={22}
              />
            )}

            <div>

              <p
                className={`font-semibold ${
                  healthy
                    ? "text-emerald-900"
                    : "text-amber-900"
                }`}
              >
                {healthy
                  ? "Healthy leaf"
                  : "Disease detected"}
              </p>

              <p
                className={`mt-1 text-sm leading-6 ${
                  healthy
                    ? "text-emerald-800"
                    : "text-amber-800"
                }`}
              >
                {healthy
                  ? "The selected crop leaf was classified as healthy."
                  : "A plant condition was identified from this scan."}
              </p>

            </div>

          </div>

          {/* LLM DIAGNOSIS */}

          {llm?.diagnosis && (
            <ModalSection
              title="Diagnosis"
            >

              {llm.diagnosis.title && (
                <h3 className="font-semibold text-slate-900">
                  {llm.diagnosis.title}
                </h3>
              )}

              {llm.diagnosis.summary && (
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {llm.diagnosis.summary}
                </p>
              )}

            </ModalSection>
          )}

          {/* DISEASE INFO */}

          {llm?.disease_info && (
            <ModalSection
              title="Disease information"
            >

              {llm.disease_info.overview && (
                <p className="text-sm leading-7 text-slate-600">
                  {llm.disease_info.overview}
                </p>
              )}

              <div className="mt-5 grid gap-5 md:grid-cols-3">

                <SimpleList
                  title="Symptoms"
                  items={
                    llm.disease_info
                      .symptoms
                  }
                />

                <SimpleList
                  title="Possible causes"
                  items={
                    llm.disease_info
                      .possible_causes
                  }
                />

                <SimpleList
                  title="Spread"
                  items={
                    llm.disease_info
                      .spread
                  }
                />

              </div>

            </ModalSection>
          )}

          {/* TREATMENT */}

          {llm?.treatment && (
            <ModalSection
              title="Treatment & management"
            >

              <div className="grid gap-5 md:grid-cols-2">

                <SimpleList
                  title="Prevention"
                  items={
                    llm.treatment
                      .prevention
                  }
                />

                <SimpleList
                  title="Management"
                  items={
                    llm.treatment
                      .management
                  }
                />

              </div>

              {llm.treatment
                .professional_help_message && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-sm font-semibold text-slate-900">
                    When to seek professional help
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {
                      llm.treatment
                        .professional_help_message
                    }
                  </p>

                </div>
              )}

            </ModalSection>
          )}

          {/* FOOTER */}

          <div className="mt-7 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Close
            </button>

            <button
              type="button"
              onClick={onOpenResult}
              className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Open full result
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DELETE CONFIRMATION MODAL
========================================================= */

function DeleteConfirmationModal({
  item,
  deleting,
  onCancel,
  onConfirm,
  formatCrop,
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">

      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="border-b border-red-100 bg-red-50 px-6 py-5">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <Trash2 size={21} />
            </div>

            <div>

              <h2 className="text-lg font-bold text-red-900">
                Delete this scan?
              </h2>

              <p className="mt-1 text-sm leading-6 text-red-700">
                This action cannot be undone.
              </p>

            </div>

          </div>

        </div>

        {/* CONTENT */}

        <div className="p-6">

          {/* SCAN INFORMATION */}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Scan
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {item?.predicted_class_name ||
                "Prediction result"}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {formatCrop(
                item?.selected_crop
              )}
            </p>

          </div>

          {/* WARNING */}

          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">

            <div className="flex gap-3">

              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-amber-600"
              />

              <div>

                <p className="text-sm font-semibold text-amber-900">
                  You will lose this data
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Deleting this scan will remove
                  it from your history along with
                  its stored image and generated
                  analysis content.
                </p>

              </div>

            </div>

          </div>

          {/* ACTIONS */}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={onCancel}
              disabled={deleting}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {deleting ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />

                  Delete permanently
                </>
              )}

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function DetailBox({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value || "Not available"}
      </p>

    </div>
  );
}

function ModalSection({
  title,
  children,
}) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white">

      <div className="border-b border-slate-100 px-4 py-3">

        <h3 className="font-semibold text-slate-900">
          {title}
        </h3>

      </div>

      <div className="p-4">
        {children}
      </div>

    </section>
  );
}

function SimpleList({
  title,
  items,
}) {
  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return null;
  }

  return (
    <div>

      <h4 className="mb-3 text-sm font-semibold text-slate-900">
        {title}
      </h4>

      <ul className="space-y-2">

        {items.map(
          (item, index) => (
            <li
              key={`${title}-${index}`}
              className="flex gap-2 text-sm leading-6 text-slate-600"
            >

              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />

              <span>
                {typeof item === "object"
                  ? item.text ||
                    item.description ||
                    item.name ||
                    JSON.stringify(item)
                  : item}
              </span>

            </li>
          )
        )}

      </ul>

    </div>
  );
}