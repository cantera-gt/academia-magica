import { NextResponse } from "next/server";
import { capturePayPalOrder, completedCapture, getPayPalOrder } from "@/lib/paypal";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { orderId?: string; paypalOrderId?: string };
    const orderId = body.orderId?.trim() ?? "";
    const paypalOrderId = body.paypalOrderId?.trim() ?? "";
    if (!/^[0-9a-f-]{36}$/i.test(orderId) || !/^[A-Z0-9]{8,80}$/i.test(paypalOrderId)) {
      return NextResponse.json({ error: "Datos de pago no válidos" }, { status: 400 });
    }

    let order;
    try {
      order = await capturePayPalOrder(paypalOrderId);
    } catch {
      order = await getPayPalOrder(paypalOrderId);
    }
    const capture = completedCapture(order);
    if (!capture) {
      return NextResponse.json({ error: "PayPal todavía no ha confirmado el pago" }, { status: 409 });
    }

    const serverSecret = process.env.PAYMENT_SERVER_SECRET;
    if (!serverSecret) throw new Error("Servidor de pagos no configurado");

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });

    const { error } = await supabase.rpc("complete_subject_order_paypal_order", {
      p_order_id: orderId,
      p_paypal_order_id: paypalOrderId,
      p_paypal_capture_id: capture.id,
      p_captured_amount: capture.amount,
      p_currency: capture.currency,
      p_server_secret: serverSecret,
    });
    if (error) throw error;

    return NextResponse.json({ ok: true, orderId });
  } catch (error) {
    console.error(
      "paypal_subject_capture_order_failed",
      error instanceof Error ? error.message : "unknown"
    );
    return NextResponse.json(
      {
        error:
          "No hemos podido confirmar el pago. No vuelvas a pagarlo; contacta con nosotros.",
      },
      { status: 500 }
    );
  }
}
