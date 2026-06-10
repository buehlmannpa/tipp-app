// Initialen-Avatar mit stabiler Farbe pro Benutzername (iOS-Systemfarben)
const COLORS = [
  "#007aff", // Blau
  "#34c759", // Grün
  "#5856d6", // Indigo
  "#ff9500", // Orange
  "#ff2d55", // Pink
  "#af52de", // Violett
  "#ff3b30", // Rot
  "#30b0c7", // Türkis
];

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Avatar({
  name,
  size = 36,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        backgroundColor: avatarColor(name),
      }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
