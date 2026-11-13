import toast from "react-hot-toast";
import { RiCheckboxCircleFill, RiErrorWarningFill } from "react-icons/ri";

// Couleurs alignées sur ColorContext.tsx (colors.success / colors.error) —
// ce fichier n'est pas un composant React, il ne peut pas appeler
// useColors(), donc les valeurs sont reprises telles quelles.
const TONE = {
  success: { fg: "#16A34A", bg: "#EAF7EE", border: "#16A34A", Icon: RiCheckboxCircleFill },
  error: { fg: "#DC2626", bg: "#FDECEC", border: "#DC2626", Icon: RiErrorWarningFill },
};

export const notify = (
  text = "Message de notification par défaut",
  state = "success"
) => {
  const tone = TONE[state] || TONE.success;
  const Icon = tone.Icon;

  return toast(
    (t) => (
      <div
        onClick={() => toast.dismiss(t.id)}
        className="flex cursor-pointer items-center gap-3"
      >
        <Icon className="h-5 w-5 shrink-0" style={{ color: tone.fg }} />
        <p className="text-sm font-semibold" style={{ color: "#101B2D" }}>
          {text}
        </p>
      </div>
    ),
    {
      style: {
        borderRadius: "12px",
        borderLeft: `3px solid ${tone.border}`,
        backgroundColor: tone.bg,
        boxShadow: "0 8px 20px -4px rgba(16,27,45,0.12)",
        padding: "12px 16px",
      },
    }
  );
};
