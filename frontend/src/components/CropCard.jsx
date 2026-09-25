import {
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

function CropCard({
  emoji,
  crop,
  description,
  selected,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`
        group flex items-center gap-4 rounded-2xl border p-4
        text-left transition duration-200
        ${
          selected
            ? "border-[#5F9560] bg-[#F1F7EE] shadow-sm"
            : "border-[#E0E7DD] bg-[#FBFCFA] hover:-translate-y-0.5 hover:border-[#B9CBB5] hover:bg-[#F7FAF5]"
        }
      `}
    >
      {/* Crop icon */}
      <div
        className={`
          grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-[30px]
          transition
          ${
            selected
              ? "bg-[#E2F0DE]"
              : "bg-[#EEF2EB] group-hover:bg-[#E7EEE3]"
          }
        `}
      >
        {emoji}
      </div>

      {/* Crop information */}
      <div className="min-w-0 flex-1">

        <div className="flex items-center gap-2">

          <h3 className="font-bold text-[#263A2D]">
            {crop}
          </h3>

          {selected && (
            <CheckCircle2
              size={16}
              className="text-[#4E8755]"
            />
          )}

        </div>

        <p className="mt-1 text-xs leading-5 text-[#7D897F]">
          {description}
        </p>

      </div>

      {/* Arrow */}
      <ChevronRight
        size={18}
        className={`
          shrink-0 transition
          ${
            selected
              ? "text-[#4E8755]"
              : "text-[#A1AAA3] group-hover:translate-x-0.5"
          }
        `}
      />

    </button>
  );
}

export default CropCard;