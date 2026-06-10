export default function Header({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="px-5 pt-[max(env(safe-area-inset-top),20px)] pb-2">
      {subtitle && (
        <p className="text-[13px] font-medium uppercase tracking-wide text-ink-2">
          {subtitle}
        </p>
      )}
      <h1 className="text-[32px] font-bold tracking-tight">{title}</h1>
    </header>
  );
}
