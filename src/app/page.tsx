import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-gradient-to-br from-purple-500 via-pink-400 to-yellow-300 p-6 text-center">
      <div>
        <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">
          Academia Mágica
        </h1>
        <p className="mt-3 text-lg text-white/90">
          Aprender jugando, un diamante a la vez ✨
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/alumno"
          className="rounded-2xl bg-white px-10 py-6 text-xl font-bold text-purple-700 shadow-xl transition hover:scale-105"
        >
          Soy Alumno 🧒
        </Link>
        <Link
          href="/login"
          className="rounded-2xl bg-black/30 px-10 py-6 text-xl font-bold text-white shadow-xl backdrop-blur transition hover:scale-105 hover:bg-black/40"
        >
          Soy Administrador 🔐
        </Link>
      </div>
    </main>
  );
}
