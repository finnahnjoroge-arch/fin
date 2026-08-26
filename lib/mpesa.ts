/**
 * Safaricom Daraja API (M-Pesa STK Push) helpers.
 * Sandbox environment.
 */

// The base URL for all Daraja sandbox API requests.
// In production this would be https://api.safaricom.co.ke instead.
const MPESA_API_BASE = "https://sandbox.safaricom.co.ke";

// Endpoint that issues an OAuth access token for authenticating our requests.
const GENERATE_TOKEN_URL = `${MPESA_API_BASE}/oauth/v1/generate?grant_type=client_credentials`;

/**
 * Fetch a fresh OAuth access token from Safaricom's Daraja API.
 *
 * Authentication uses HTTP Basic Auth with our consumer key and secret.
 * The response contains an `access_token` which is required as a Bearer
 * token in the STK push request (and expires after ~1 hour).
 *
 * @returns {Promise<string>} A valid `access_token` string.
 */
export async function getAccessToken(): Promise<string> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error(
      "MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET is missing from environment variables."
    );
  }

  // Builder for the Authorization header: base64(consumerKey:consumerSecret)
  // This is standard HTTP Basic Auth.
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  const res = await fetch(GENERATE_TOKEN_URL, {
    method: "GET",
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  // Log the raw response so we can debug easily while learning the API.
  const json = (await res.json()) as { access_token?: string; [key: string]: unknown };
  console.log("Daraja getAccessToken response:", json);

  if (!res.ok || !json.access_token) {
    throw new Error(
      `Failed to get access token (status ${res.status}: ${res.statusText}). ` +
        `Body: ${JSON.stringify(json)}`
    );
  }

  return json.access_token;
}

/**
 * Format a Date as a Daraja timestamp in the form yyyymmddhhmmss.
 * The value is the current time in East Africa Time.
 *
 * @param {Date} date - The date to format (defaults to now).
 * @returns {string} The formatted timestamp string.
 */
export function formatDarajaTimestamp(date: Date = new Date()): string {
  // Convert to East Africa Time (UTC+3). We just add 3 hours to UTC
  // since Nairobi/Cairo do not observe daylight saving.
  const eat = new Date(date.getTime() + 3 * 60 * 60 * 1000);

  const year = eat.getUTCFullYear();
  const month = String(eat.getUTCMonth() + 1).padStart(2, "0");
  const day = String(eat.getUTCDate()).padStart(2, "0");
  const hours = String(eat.getUTCHours()).padStart(2, "0");
  const minutes = String(eat.getUTCMinutes()).padStart(2, "0");
  const seconds = String(eat.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Generate the STK push password/base64 string.
 *
 * Safaricom requires a password computed as:
 *   base64(BusinessShortCode + Passkey + Timestamp)
 *
 * @returns {string} The base64-encoded password for the STK push request.
 */
export function generateSTKPassword(): string {
  const shortCode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;

  if (!shortCode || !passkey) {
    throw new Error("MPESA_SHORTCODE or MPESA_PASSKEY is missing from environment variables.");
  }

  const timestamp = formatDarajaTimestamp();
  const passwordString = `${shortCode}${passkey}${timestamp}`;

  return Buffer.from(passwordString).toString("base64");
}

/**
 * Normalise a customer phone number into the Daraja M-Pesa international
 * format. Safaricom expects E.164 style numbers beginning with the country
 * code "254" and with no leading "+", space, or "0", e.g. "254712345678".
 *
 * Handles all of these input formats:
 *   "0712345678"      -> "254712345678"
 *   "254712345678"    -> "254712345678" (already correct, unchanged)
 *   "+254712345678"   -> "254712345678"
 *   "712345678"       -> "254712345678"
 *
 * @param {string} phoneNumber - The raw phone number from the request.
 * @returns {string} The normalized phone number beginning with "254".
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  // Keep only the digits, dropping "+", spaces, dashes, parentheses, etc.
  const digits = phoneNumber.replace(/\D/g, "");

  // If the caller already included the "254" country code, use it as is.
  if (digits.startsWith("254")) {
    return digits;
  }

  // Otherwise strip a single leading "0" (e.g. "0712..." -> "712...")
  // and prefix with the Kenyan country code "254".
  return "254" + digits.replace(/^0/, "");
}

/**
 * Options required to initiate a single STK push from Daraja.
 */
export type InitiateStkPushOptions = {
  phoneNumber: string; // customer's phone in any common format
  amount: string | number; // amount to charge in KES
  accountReference: string; // e.g. order number, shown on the STK prompt
  description?: string; // free-form description of the transaction
};

// The endpoint that initiates an M-Pesa STK push prompt on the customer's phone.
const STK_PUSH_URL = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

/**
 * Initiate a full M-Pesa STK push to the customer's phone and return Daraja's
 * acknowledgement. This centralises the token + password + timestamp + payload
 * + HTTP send so both the standalone /api/mpesa/stkpush route AND the checkout
 * order-creation flow can trigger a push WITHOUT duplicating any logic.
 *
 * The returned object is the parsed Daraja JSON. When accepted it includes:
 *   - ResponseCode: "0"          (the STK prompt was sent successfully)
 *   - CheckoutRequestID          (the unique id used later to poll status)
 *   - MerchantRequestID
 *
 * NOTE: this function only SENDS the request. The caller decides what to do
 * with a successful response (e.g. persist an MpesaTransaction, link the
 * order, return the checkoutRequestId to the frontend).
 *
 * @param {InitiateStkPushOptions} opts - phone, amount, reference, description.
 * @returns {Promise<Record<string, unknown>>} The raw Daraja response body.
 */
export async function initiateStkPush(
  opts: InitiateStkPushOptions
): Promise<Record<string, unknown>> {
  const { phoneNumber, amount, accountReference, description } = opts;

  // 1. Grab required env config.
  const shortCode = process.env.MPESA_SHORTCODE;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;
  if (!shortCode || !callbackUrl) {
    throw new Error("MPESA_SHORTCODE or MPESA_CALLBACK_URL is missing from environment variables.");
  }

  // 2. Get a fresh OAuth access token.
  const accessToken = await getAccessToken();

  // 3. Build the timestamp + password + normalized customer phone.
  const timestamp = formatDarajaTimestamp();
  const password = generateSTKPassword();
  const partyA = normalizePhoneNumber(phoneNumber);

  // 4. Assemble the payload as documented by Safaricom for CustomerPayBillOnline.
  const payload = {
    BusinessShortCode: shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: String(amount),
    PartyA: partyA, // payer (customer)
    PartyB: shortCode, // paybill/till number receiving money
    PhoneNumber: partyA, // phone to receive the STK prompt
    CallBackURL: callbackUrl,
    AccountReference: accountReference,
    TransactionDesc: description ?? "Payment",
  };

  console.log("STK Push payload:", payload);

  // 5. Send the STK push request to Daraja and parse the response.
  const res = await fetch(STK_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const json = (await res.json()) as Record<string, unknown>;
  console.log("Daraja STK push raw response:", json);

  if (!res.ok) {
    throw new Error(
      `STK push request failed (status ${res.status}: ${res.statusText}). ` +
        `Body: ${JSON.stringify(json)}`
    );
  }

  return json;
}
