import { CheckCircle2, ChevronRight } from "lucide-react";

function RecentScan({
  emoji,
  crop,
  disease,
  date,
  status,
}) {
  const isHealthy = status === "Healthy";

  return (
    <button
      type="button"
      className="flex w-full items-center gap-4 rounded-2xl border border-[#E7ECE4] bg-[#FAFCF8] p-4 text-left transition hover:border-[#D3DED0] hover:bg-[#F5F9F3]"
    >
      {/* Crop icon */}
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#E8F0E5] text-2xl">
        {emoji}
      </div>

      {/* Scan information */}
      <div className="min-w-0 flex-1">

        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-bold text-[#2C4032]">
            {crop}
          </h3>

          {isHealthy && (
            <CheckCircle2
              size={15}
              className="shrink-0 text-[#5D9561]"
            />
          )}
        </div>

        <p className="mt-1 truncate text-xs text-[#7D897F]">
          {disease}
        </p>

        <p className="mt-1 text-[11px] text-[#A0AAA3]">
          {date}
        </p>

      </div>

      {/* Status */}
      <div className="flex shrink-0 items-center gap-2">

        <span
          className={`
            rounded-full px-2.5 py-1 text-[10px] font-semibold
            ${
              isHealthy
                ? "bg-[#E7F3E4] text-[#4F8053]"
                : "bg-[#FFF1DF] text-[#A56C27]"
            }
          `}
        >
          {status}
        </span>

        <ChevronRight
          size={16}
          className="text-[#9AA59D]"
        />

      </div>
    </button>
  );
}

export default RecentScan;