import { NextResponse } from "next/server";
import { verifyPayPalWebhookSignature } from "@/lib/paypal";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type PayPalWebhookEvent = {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    amount?: { value?: string; currency_code?: string };
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
        capture_id?: string;
      };
    };
  };
};

const MAX_WEBHOOK_BYTES = 256 * 1024;

export async function POST(request: Request) {
  let eventId = "unknown";

  try {
    const rawBody = await request.text();
    if (rawBody.length === 0 || rawBody.length > MAX_WEBHOOK_BYTES) {
      return NextResponse.json({ error: "Payload no válido" }, { status: 400 });
    }

    let event: PayPalWebhookEvent;
    try {
      event = JSON.parse(rawBody) as PayPalWebhookEvent;
    } catch {
      return NextResponse.json({ error: "JSON no válido" }, { status: 400 });
    }

    eventId = event.id?.trim() ?? "unknown";
    const signatureHeaders = {
      authAlgo: request.headers.get("paypal-auth-algo") ?? "",
      certUrl: request.headers.get("paypal-cert-url") ?? "",
      transmissionId: request.headers.get("paypal-transmission-id") ?? "",
      transmissionSig: request.headers.get("paypal-transmission-sig") ?? "",
      transmissionTime: request.headers.get("paypal-transmission-time") ?? "",
    };

    if (Object.values(signatureHeaders).some((value) => !value)) {
      return NextResponse.json({ error: "Firma de PayPal incompleta" }, { status: 401 });
    }

    const signatureIsValid = await verifyPayPalWebhookSignature(signatureHeaders, event);
    if (!signatureIsValid) {
      return NextResponse.json({ error: "Firma de PayPal no válida" }, { status: 401 });
    }

    const eventType = event.event_type?.trim() ?? "";
    const resource = event.resource;
    if (!/^[A-Z0-9.-]{1,100}$/.test(eventId) || !eventType || !resource) {
      return NextResponse.json({ error: "Evento verificado pero incompleto" }, { status: 400 });
    }

    const relatedIds = resource.supplementary_data?.related_ids;
    const isOrderEvent = eventType.startsWith("CHECKOUT.ORDER.");
    const isRefundEvent = eventType === "PAYMENT.CAPTURE.REFUNDED" || eventType === "PAYMENT.CAPTURE.REVERSED";
    const orderId = relatedIds?.order_id ?? (isOrderEvent ? resource.id : undefined) ?? null;
    const captureId = isRefundEvent ? relatedIds?.capture_id ?? null : resource.id ?? null;
    const amount = resource.amount?.value ?? null;
    const currency = resource.amount?.currency_code ?? null;
    const serverSecret = process.env.PAYMENT_SERVER_SECRET;
    if (!serverSecret) throw new Error("Servidor de pagos no configurado");

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("process_enrollment_paypal_webhook", {
      p_event_id: eventId,
      p_event_type: eventType,
      p_resource_id: resource.id ?? null,
      p_order_id: orderId,
      p_capture_id: captureId,
      p_amount: amount,
      p_currency: currency,
      p_server_secret: serverSecret,
    });
    if (error) throw error;

    return NextResponse.json({ ok: true, status: data ?? "processed" });
  } catch (error) {
    console.error("paypal_webhook_failed", {
      eventId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "No se pudo procesar el evento" }, { status: 500 });
  }
}
