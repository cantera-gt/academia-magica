import { NextResponse } from "next/server";
import { capturePayPalOrder, completedCapture, getPayPalOrder } from "@/lib/paypal";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      reference?: string;
      paymentToken?: string;
      orderId?: string;
    };
    const reference = body.reference?.trim() ?? "";
    const paymentToken = body.paymentToken?.trim() ?? "";
    const orderId = body.orderId?.trim() ?? "";
    if (!/^AM-[A-Z0-9]{8}$/.test(reference) ||
        !/^[0-9a-f-]{36}$/i.test(paymentToken) ||
        !/^[A-Z0-9]{8,80}$/i.test(orderId)) {
      return NextResponse.json({ error: "Datos de pago no válidos" }, { status: 400 });
    }

    let order;
    try {
      order = await capturePayPalOrder(orderId);
    } catch {
      order = await getPayPalOrder(orderId);
    }
    const capture = completedCapture(order);
    if (!capture) {
      return NextResponse.json({ error: "PayPal todavía no ha confirmado el pago" }, { status: 409 });
    }

    const serverSecret = process.env.PAYMENT_SERVER_SECRET;\n    if (!serverSecret) throw new Error("Servidor de pagos no configurado");\n\n    const supabase = await createClient();
    const { error } = await supabase.rpc("complete_enrollment_paypal_order", {
      p_public_reference: reference,
      p_payment_token: paymentToken,
      p_paypal_order_id: orderId,
      p_paypal_capture_id: capture.id,
      p_captured_amount: capture.amount,
      p_currency: capture.currency,
    });
    if (error) throw error;

    return NextResponse.json({ ok: true, reference });
  } catch (error) {
    console.error("paypal_capture_order_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "No hemos podido confirmar el pago. No vuelvas a pagarlo; contacta con nosotros." }, { status: 500 });
  }
}
