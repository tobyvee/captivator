import Link from "next/link";

// Placeholder until T-019 replaces it with the template picker.
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold">Captivator</h1>
      <Link href="/editor" className="rounded-md bg-zinc-900 px-4 py-3 text-white">
        Open the editor
      </Link>
    </main>
  );
}
