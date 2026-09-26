"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-screen place-content-center gap-4 p-6 text-center">
      <p role="alert">This page could not be loaded. Please try again.</p>
      <button className="rounded-lg border px-4 py-2" onClick={reset}>Try again</button>
    </main>
  );
}
