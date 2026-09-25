import { useEffect, useState } from "react";
import {
  ScanLine,
  Sprout,
  AlertTriangle,
  X,
  Leaf,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AuthModal from "../components/AuthModal";
import CropCard from "../components/CropCard";
import WeatherCard from "../components/WeatherCard";
import SprayingConditions from "../components/SprayingConditions";

import { getPredictionHistory } from "../services/api";

function Dashboard() {
  const navigate = useNavigate();

  // =====================================================
  // DASHBOARD STATE
  // =====================================================

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Currently selected crop
  const [selectedCrop, setSelectedCrop] = useState(null);

  // =====================================================
  // AUTH MODAL STATE
  // =====================================================

  const [authModalOpen, setAuthModalOpen] = useState(false);

  // =====================================================
  // SCAN WARNING STATE
  // =====================================================

  const [scanWarning, setScanWarning] = useState(false);

  // =====================================================
  // RECENT SCANS STATE
  // =====================================================

  const [recentScans, setRecentScans] = useState([]);

  const [recentScansLoading, setRecentScansLoading] =
    useState(true);

  const [recentScansError, setRecentScansError] =
    useState("");

  // =====================================================
  // LOAD RECENT SCANS
  // =====================================================

  useEffect(() => {
    async function loadRecentScans() {
      try {
        setRecentScansLoading(true);
        setRecentScansError("");

        const response =
          await getPredictionHistory({
            limit: 3,
            include_images: true,
          });

        setRecentScans(
          Array.isArray(response?.items)
            ? response.items
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load recent scans:",
          error
        );

        setRecentScansError(
          error?.message ||
            "Unable to load recent scans."
        );
      } finally {
        setRecentScansLoading(false);
      }
    }

    loadRecentScans();
  }, []);

  // =====================================================
  // FORMAT CROP
  // =====================================================

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

  // =====================================================
  // FORMAT DATE
  // =====================================================

  function formatDate(dateValue) {
    if (!dateValue) {
      return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
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

  // =====================================================
  // FORMAT TIME
  // =====================================================

  function formatTime(dateValue) {
    if (!dateValue) {
      return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
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

  // =====================================================
  // OPEN RECENT RESULT
  // =====================================================

  function handleOpenRecentScan(scan) {
    const reconstructedResponse = {
      selected_crop:
        scan.selected_crop,

      prediction: {
        decision:
          scan.decision,

        class_name:
          scan.predicted_class_name,

        class_code:
          scan.predicted_class_code,

        message:
          scan.message,
      },

      llm_content:
        scan.llm_content || null,
    };

    navigate("/result", {
      state: {
        prediction:
          reconstructedResponse,

        selectedCrop:
          scan.selected_crop,

        imagePreview:
          scan.image_url || "",

        fromHistory: true,
      },
    });
  }

  // =====================================================
  // OPEN AUTH MODAL
  // =====================================================

  const handleAuthClick = () => {
    setAuthModalOpen(true);
  };

  // =====================================================
  // CLOSE AUTH MODAL
  // =====================================================

  const handleCloseAuthModal = () => {
    setAuthModalOpen(false);
  };

  // =====================================================
  // CROP SELECTION
  // =====================================================

  const handleCropSelect = (crop) => {
    setSelectedCrop(crop);

    // If warning is visible, remove it
    // because the user has now selected a crop.
    setScanWarning(false);
  };

  // =====================================================
  // START SCAN
  // =====================================================

  const handleStartScan = () => {
    // -----------------------------------------------------
    // NO CROP SELECTED
    // -----------------------------------------------------

    if (!selectedCrop) {
      setScanWarning(true);
      return;
    }

    // -----------------------------------------------------
    // CROP SELECTED
    // -----------------------------------------------------

    setScanWarning(false);

    navigate("/scan", {
      state: {
        selectedCrop,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#F3F5EF] text-[#17251D]">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <Sidebar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />


      {/* =====================================================
          MAIN APPLICATION AREA
      ===================================================== */}

      <div className="lg:pl-[240px]">

        {/* ===================================================
            TOPBAR
        =================================================== */}

        <Topbar
          onMenuClick={() => setMobileMenuOpen(true)}
          onAuthClick={handleAuthClick}
        />


        {/* ===================================================
            DASHBOARD CONTENT
        =================================================== */}

        <main className="mx-auto max-w-[1440px] p-5 sm:p-8">

          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <section className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#77907D]">
                Agricultural Intelligence
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-[#203126] sm:text-4xl">
                Dashboard
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#748078]">
                Monitor your crops, analyze plant health, and get
                intelligent disease recommendations.
              </p>

            </div>


            {/* =================================================
                TOP SCAN BUTTON
            ================================================= */}

            <button
              type="button"
              onClick={handleStartScan}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#285C38] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#214D2F]"
            >

              <ScanLine size={17} />

              Scan Plant

            </button>

          </section>


          {/* =================================================
              SCAN WARNING
          ================================================= */}

          {scanWarning && (
            <div
              className="mb-6 flex items-start gap-4 rounded-2xl border border-[#E7C98B] bg-[#FFF8E8] p-4 shadow-sm"
              role="alert"
            >

              {/* Warning icon */}

              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FCECC7] text-[#B87922]">

                <AlertTriangle size={20} />

              </div>


              {/* Warning content */}

              <div className="min-w-0 flex-1">

                <p className="text-sm font-bold text-[#76521F]">
                  Select a crop first
                </p>

                <p className="mt-1 text-sm leading-5 text-[#967344]">
                  Please select the crop you want to analyze before
                  starting a plant scan.
                </p>

              </div>


              {/* Close warning */}

              <button
                type="button"
                onClick={() => setScanWarning(false)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#A27A3E] transition hover:bg-[#FCECC7] hover:text-[#76521F]"
                aria-label="Close warning"
              >

                <X size={17} />

              </button>

            </div>
          )}


          {/* =================================================
              AI SCAN + WEATHER
          ================================================= */}

          <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">

            {/* =================================================
                AI SCAN HERO
            ================================================= */}

            <div className="relative min-h-[285px] overflow-hidden rounded-3xl bg-[#17442A] p-7 text-white shadow-sm sm:p-9">

              {/* Decorative background */}

              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#3E7650]/30" />

              <div className="absolute -bottom-24 -right-8 h-64 w-64 rounded-full bg-[#8DB58D]/10" />


              {/* Content */}

              <div className="relative z-10 max-w-xl">

                {/* Badge */}

                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-[#DCEBDD]">

                  <Sprout size={14} />

                  AI Plant Intelligence

                </div>


                {/* Heading */}

                <h2 className="max-w-lg text-3xl font-bold leading-tight tracking-[-0.03em] sm:text-4xl">
                  Detect plant diseases before they spread.
                </h2>


                {/* Description */}

                <p className="mt-4 max-w-lg text-sm leading-6 text-[#C8D8CB]">
                  Upload a clear image of your plant leaf and our
                  AI system will analyze its health and provide
                  actionable recommendations.
                </p>


                {/* Start Scan */}

                <button
                  type="button"
                  onClick={handleStartScan}
                  className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#245634] transition hover:bg-[#F2F6EF]"
                >

                  <ScanLine size={17} />

                  Start a Scan

                </button>

              </div>

            </div>


            {/* =================================================
                WEATHER
            ================================================= */}

            <WeatherCard />

          </section>


          {/* =================================================
              CROP SELECTION
          ================================================= */}

          <section className="mt-7">

            {/* Section heading */}

            <div className="mb-4">

              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#77907D]">
                Crop Monitoring
              </p>

              <h2 className="mt-2 text-xl font-bold text-[#203126]">
                Select a crop
              </h2>

              <p className="mt-1 text-sm text-[#748078]">
                Choose the crop you want to analyze before starting
                a scan.
              </p>

            </div>


            {/* Crop cards */}

            <div className="grid gap-4 sm:grid-cols-2">

              {/* =================================================
                  APPLE
              ================================================= */}

              <CropCard
                emoji="🍎"
                crop="Apple"
                description="Apple leaf disease detection"
                selected={selectedCrop === "apple"}
                onClick={() => handleCropSelect("apple")}
              />


              {/* =================================================
                  MAIZE
              ================================================= */}

              <CropCard
                emoji="🌽"
                crop="Maize"
                description="Maize leaf disease detection"
                selected={selectedCrop === "maize"}
                onClick={() => handleCropSelect("maize")}
              />

            </div>

          </section>


          {/* =================================================
              RECENT SCANS + FIELD CONDITIONS
          ================================================= */}

          <section className="mt-7 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">

            {/* =================================================
                RECENT SCANS
            ================================================= */}

            <div className="rounded-3xl border border-[#D9E1D6] bg-white p-6 shadow-sm sm:p-7">

              {/* Header */}

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#77907D]">
                    Activity
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-[#203126]">
                    Recent Scans
                  </h2>

                </div>


                {/* View all */}

                <button
                  type="button"
                  onClick={() => navigate("/history")}
                  className="text-xs font-semibold text-[#4E8755] transition hover:text-[#315E38]"
                >
                  View all
                </button>

              </div>


              {/* =================================================
                  LOADING
              ================================================= */}

              {recentScansLoading && (
                <div className="mt-6 space-y-3">

                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="flex animate-pulse items-center gap-4 rounded-2xl border border-slate-100 p-3"
                    >

                      <div className="h-16 w-16 shrink-0 rounded-xl bg-slate-200" />

                      <div className="flex-1 space-y-2">

                        <div className="h-3 w-24 rounded bg-slate-200" />

                        <div className="h-4 w-36 rounded bg-slate-200" />

                        <div className="h-3 w-20 rounded bg-slate-200" />

                      </div>

                    </div>
                  ))}

                </div>
              )}


              {/* =================================================
                  ERROR
              ================================================= */}

              {!recentScansLoading &&
                recentScansError && (
                  <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">

                    <p className="text-sm font-semibold text-red-800">
                      Unable to load recent scans
                    </p>

                    <p className="mt-1 text-xs leading-5 text-red-700">
                      {recentScansError}
                    </p>

                  </div>
                )}


              {/* =================================================
                  EMPTY
              ================================================= */}

              {!recentScansLoading &&
                !recentScansError &&
                recentScans.length === 0 && (
                  <div className="mt-6 rounded-2xl border border-dashed border-[#D9E1D6] p-8 text-center">

                    <Leaf
                      size={30}
                      className="mx-auto text-[#B6C2B5]"
                    />

                    <p className="mt-3 text-sm font-semibold text-[#526056]">
                      No recent scans
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#8A968D]">
                      Your completed scans will appear here.
                    </p>

                  </div>
                )}


              {/* =================================================
                  REAL RECENT SCANS
              ================================================= */}

              {!recentScansLoading &&
                !recentScansError &&
                recentScans.length > 0 && (
                  <div className="mt-6 space-y-3">

                    {recentScans.map((scan) => {

                      const healthy =
                        scan?.predicted_class_name
                          ?.toLowerCase()
                          .includes("healthy");

                      const cropName =
                        formatCrop(
                          scan.selected_crop
                        );

                      const diseaseName =
                        scan.predicted_class_name ||
                        "Prediction result";

                      return (
                        <button
                          key={
                            scan.request_id
                          }
                          type="button"
                          onClick={() =>
                            handleOpenRecentScan(
                              scan
                            )
                          }
                          className="group flex w-full items-center gap-4 rounded-2xl border border-[#E6ECE4] p-3 text-left transition hover:border-[#BFD5C1] hover:bg-[#F7FAF6]"
                        >

                          {/* IMAGE */}

                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#F0F3EE]">

                            {scan.image_url ? (
                              <img
                                src={
                                  scan.image_url
                                }
                                alt={
                                  diseaseName
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">

                                <Leaf
                                  size={25}
                                  className="text-[#B6C2B5]"
                                />

                              </div>
                            )}

                          </div>


                          {/* INFORMATION */}

                          <div className="min-w-0 flex-1">

                            <div className="flex flex-wrap items-center gap-2">

                              <span className="rounded-full bg-[#EDF6EE] px-2.5 py-1 text-[11px] font-semibold text-[#3F7648]">
                                {cropName}
                              </span>

                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                  healthy
                                    ? "bg-[#EDF6EE] text-[#3F7648]"
                                    : "bg-[#FFF4DE] text-[#9A6824]"
                                }`}
                              >
                                {healthy
                                  ? "Healthy"
                                  : "Disease detected"}
                              </span>

                            </div>


                            <p className="mt-2 truncate text-sm font-semibold text-[#203126]">
                              {diseaseName}
                            </p>


                            <p className="mt-1 text-xs text-[#8A968D]">

                              {formatDate(
                                scan.created_at
                              )}

                              {formatTime(
                                scan.created_at
                              ) && (
                                <>
                                  {" • "}
                                  {formatTime(
                                    scan.created_at
                                  )}
                                </>
                              )}

                            </p>

                          </div>


                          {/* ARROW */}

                          <span className="shrink-0 text-lg text-[#B6C2B5] transition group-hover:text-[#4E8755]">
                            →
                          </span>

                        </button>
                      );
                    })}

                  </div>
                )}

            </div>


            {/* =================================================
                SPRAYING CONDITIONS
            ================================================= */}

            <SprayingConditions />

          </section>

        </main>

      </div>


      {/* =====================================================
          AUTHENTICATION MODAL
      ===================================================== */}

      <AuthModal
        isOpen={authModalOpen}
        onClose={handleCloseAuthModal}
      />

    </div>
  );
}

export default Dashboard;