import type { Metadata } from "next";
import Link from "next/link";
import SubjectOrderReturn from "@/components/subject-order-return";

export const metadata: Metadata = { title: "Confirmando pago", robots: { index: false, follow: false } };

export default async function SubjectOrderPaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; token?: string }>;
}) {
  const { order = "", token = "" } = await searchParams;
  const valid = /^[0-9a-f-]{36}$/i.test(order) && /^[A-Z0-9]{8,80}$/i.test(token);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffaf3] px-4 py-12 text-[#3b2a55]">
      {valid ? (
        <SubjectOrderReturn orderId={order} paypalOrderId={token} />
      ) : (
        <section className="w-full max-w-xl rounded-[2.5rem] bg-white p-8 text-center shadow-2xl">
          <p className="text-5xl">🪄</p>
          <h1 className="font-display mt-5 text-3xl font-extrabold">No podemos identificar este pago</h1>
          <p className="mt-4">
            Volvé al Panel para padres o contactá con nosotros si ya aprobaste una operación en PayPal.
          </p>
          <Link
            href="/alumno/panel-padres"
            className="mt-7 inline-flex rounded-2xl bg-[#ffd93d] px-6 py-3 font-extrabold"
          >
            Volver al Panel para padres
          </Link>
        </section>
      )}
    </main>
  );
}
