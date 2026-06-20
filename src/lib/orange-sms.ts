const ORANGE_TOKEN_URL = "https://api.orange.com/oauth/v3/token";
const ORANGE_SMS_BASE = "https://api.orange.com/smsmessaging/v1/outbound";

export type SmsSendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

async function getAccessToken(): Promise<string> {
  const clientId = process.env.ORANGE_CLIENT_ID;
  const clientSecret = process.env.ORANGE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("ORANGE_CLIENT_ID or ORANGE_CLIENT_SECRET env var is missing");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(ORANGE_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Orange token request failed (${res.status}): ${text}`);
  }

  const json = await res.json() as { access_token: string };
  return json.access_token;
}

/** Normalise a phone number to international format (strips leading 0, prepends 231 for Liberia) */
function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("231")) return `+${digits}`;
  if (digits.startsWith("0")) return `+231${digits.slice(1)}`;
  return `+${digits}`;
}

export async function sendSms(
  phone: string,
  message: string
): Promise<SmsSendResult> {
  const senderNumber = process.env.ORANGE_SENDER_NUMBER;
  if (!senderNumber) {
    return { ok: false, error: "ORANGE_SENDER_NUMBER env var is missing" };
  }

  try {
    const token = await getAccessToken();
    const recipient = toE164(phone);
    // Sender address must also be in E.164 tel: URI form
    const senderE164 = toE164(senderNumber);
    const encodedSender = encodeURIComponent(`tel:${senderE164}`);

    const body = {
      outboundSMSMessageRequest: {
        address: [`tel:${recipient}`],
        senderAddress: `tel:${senderE164}`,
        outboundSMSTextMessage: { message },
      },
    };

    console.log(`[orange-sms] sending to ${recipient} from ${senderE164}`);

    const res = await fetch(`${ORANGE_SMS_BASE}/${encodedSender}/requests`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const json = await res.json() as {
      outboundSMSMessageRequest?: { resourceURL?: string };
      requestError?: { serviceException?: { text?: string } };
    };

    console.log("[orange-sms] response:", res.status, JSON.stringify(json));

    if (!res.ok) {
      const errText =
        json.requestError?.serviceException?.text ??
        `HTTP ${res.status}`;
      return { ok: false, error: errText };
    }

    const messageId =
      json.outboundSMSMessageRequest?.resourceURL ?? `orange-${Date.now()}`;

    return { ok: true, messageId };
  } catch (err) {
    console.error("[orange-sms] error:", err);
    return { ok: false, error: String(err) };
  }
}
