// Wird sofort beim Tab-Wechsel angezeigt, während der Server die Daten lädt
export default function Loading() {
  return (
    <main className="animate-pulse">
      <header className="px-5 pt-[max(env(safe-area-inset-top),20px)] pb-2">
        <div className="mb-2 h-4 w-44 rounded-md bg-card" />
        <div className="h-9 w-40 rounded-lg bg-card" />
      </header>
      <div className="space-y-3 px-4 pt-2">
        <div className="card h-24" />
        <div className="card h-32" />
        <div className="card h-32" />
        <div className="card h-32" />
      </div>
    </main>
  );
}
