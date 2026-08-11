type PayPalLink = { href: string; rel: string };
type PayPalCapture = { id: string; status: string; amount: { currency_code: string; value: string } };
export type PayPalOrder = {
  id: string;
  status: string;
  links?: PayPalLink[];
  purchase_units?: Array<{
    payments?: { captures?: PayPalCapture[] };
  }>;
};

function config() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  const environment = process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
  if (!clientId || !secret) throw new Error("PayPal no está configurado");
  return {
    clientId,
    secret,
    baseUrl: environment === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com",
  };
}

async function accessToken() {
  const { clientId, secret, baseUrl } = config();
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("No se pudo autenticar con PayPal");
  const data = await response.json() as { access_token: string };
  return { token: data.access_token, baseUrl };
}

async function paypalRequest(path: string, init: RequestInit) {
  const { token, baseUrl } = await accessToken();
  const response = await fetch(baseUrl + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error("PayPal rechazó la operación");
    Object.assign(error, { status: response.status, paypalData: data });
    throw error;
  }
  return data as PayPalOrder;
}

export async function createPayPalOrder(input: {
  reference: string;
  amount: string;
  currency: string;
  returnUrl: string;
  cancelUrl: string;
}) {
  return paypalRequest("/v2/checkout/orders", {
    method: "POST",
    headers: { "PayPal-Request-Id": `academia-${input.reference}` },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: input.reference,
        description: `Academia Mágica · acceso de 3 meses · ${input.reference}`,
        amount: { currency_code: input.currency, value: input.amount },
      }],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "Academia Mágica",
            locale: "es-GT",
            landing_page: "LOGIN",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: input.returnUrl,
            cancel_url: input.cancelUrl,
          },
        },
      },
    }),
  });
}

export async function capturePayPalOrder(orderId: string) {
  return paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers: { "PayPal-Request-Id": `academia-capture-${orderId}` },
  });
}

export async function getPayPalOrder(orderId: string) {
  return paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
  });
}

export function completedCapture(order: PayPalOrder) {
  const capture = order.purchase_units?.flatMap((unit) => unit.payments?.captures ?? [])
    .find((item) => item.status === "COMPLETED");
  if (!capture) return null;
  return {
    id: capture.id,
    amount: capture.amount.value,
    currency: capture.amount.currency_code,
  };
}


export async function verifyPayPalWebhookSignature(
  headers: {
    authAlgo: string;
    certUrl: string;
    transmissionId: string;
    transmissionSig: string;
    transmissionTime: string;
  },
  webhookEvent: unknown,
) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) throw new Error("El webhook de PayPal no está configurado");

  const { token, baseUrl } = await accessToken();
  const response = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: headers.authAlgo,
      cert_url: headers.certUrl,
      transmission_id: headers.transmissionId,
      transmission_sig: headers.transmissionSig,
      transmission_time: headers.transmissionTime,
      webhook_id: webhookId,
      webhook_event: webhookEvent,
    }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({})) as { verification_status?: string };
  if (!response.ok) throw new Error("No se pudo verificar la firma del webhook de PayPal");
  return data.verification_status === "SUCCESS";
}
