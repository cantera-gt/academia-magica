import { NextResponse } from "next/server";
import { createPayPalOrder } from "@/lib/paypal";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type OrderSummary = {
  id: string;
  total_price_usd: number;
  currency: string;
  payment_status: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { orderId?: string };
    const orderId = body.orderId?.trim() ?? "";
    if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
      return NextResponse.json({ error: "Orden no válida" }, { status: 400 });
    }

    const serverSecret = process.env.PAYMENT_SERVER_SECRET;
    if (!serverSecret) throw new Error("Servidor de pagos no configurado");

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });

    const { data, error } = await supabase.rpc("get_subject_order_summary", {
      p_order_id: orderId,
    });
    const summary = (data?.[0] ?? null) as OrderSummary | null;
    if (error || !summary) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    if (summary.payment_status === "paid") {
      return NextResponse.json({ error: "Esta orden ya está pagada" }, { status: 409 });
    }

    const origin = new URL(request.url).origin;
    const query = `order=${encodeURIComponent(orderId)}`;
    const order = await createPayPalOrder({
      reference: orderId,
      amount: Number(summary.total_price_usd).toFixed(2),
      currency: summary.currency,
      returnUrl: `${origin}/alumno/panel-padres/pago/resultado?${query}`,
      cancelUrl: `${origin}/alumno/panel-padres/pago?${query}&cancelled=1`,
    });
    const approvalUrl = order.links?.find(
      (link) => link.rel === "payer-action" || link.rel === "approve"
    )?.href;
    if (!order.id || !approvalUrl) throw new Error("PayPal no devolvió el enlace de aprobación");

    const { error: registerError } = await supabase.rpc("register_subject_order_paypal_order", {
      p_order_id: orderId,
      p_paypal_order_id: order.id,
      p_server_secret: serverSecret,
    });
    if (registerError) throw registerError;

    return NextResponse.json({ approvalUrl });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "unknown";
    console.error("paypal_subject_create_order_failed", message);
    return NextResponse.json(
      { error: "No hemos podido iniciar PayPal. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
