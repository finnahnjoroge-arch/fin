"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A simple test page for the M-Pesa STK Push (Daraja API) integration.
 *
 * It lets you enter a phone number and amount, then fires POST /api/mpesa/stkpush.
 * Once Daraja acknowledges the push, we begin polling GET /api/mpesa/status/[id]
 * every 3 seconds so the UI can show live payment progress.
 */

// How often (ms) to poll the status endpoint.
const POLL_INTERVAL_MS = 3000;
// Maximum total time we will keep polling before giving up (60 seconds).
const POLL_TIMEOUT_MS = 60 * 1000;

// The statuses we consider "finished" — stop polling once we reach one.
const FINAL_STATUSES = ["success", "failed", "timeout"];

type PaymentStatus = "pending" | "success" | "failed" | "timeout" | null;

export default function MpesaTestPage() {
  // Form state for the phone number and amount.
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("1"); // sandbox often requires small amounts
  const [accountReference, setAccountReference] = useState("TEST001");

  // State for showing results / loading / errors.
  const [loading, setLoading] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);

  // Live transaction status + any message/receipt returned by the status route.
  const [status, setStatus] = useState<PaymentStatus>(null);
  const [resultDesc, setResultDesc] = useState<string | null>(null);
  const [mpesaReceiptNumber, setMpesaReceiptNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs let us read the latest values inside the polling timer's closures
  // without churning the effect's dependencies.
  const statusRef = useRef<PaymentStatus>(null);
  const checkoutRequestIdRef = useRef<string | null>(null);

  // Keep the refs in sync whenever state changes.
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    checkoutRequestIdRef.current = checkoutRequestId;
  }, [checkoutRequestId]);

  /**
   * Poll the status endpoint once and update the UI based on the response.
   * Memoised with useCallback so the effect below can depend on it cleanly.
   */
  const pollStatus = useCallback(async () => {
    const id = checkoutRequestIdRef.current;
    if (!id) return;

    try {
      const res = await fetch(`/api/mpesa/status/${id}`);
      const data = await res.json();

      if (!res.ok) {
        // 404 etc. — surface the error but don't hard-fail the loop.
        console.error("Status poll error:", data);
        setError(data.error ?? "Could not fetch payment status.");
        return;
      }

      // Update status-related state from the server response.
      setStatus(data.status);
      setResultDesc(data.resultDesc ?? null);
      setMpesaReceiptNumber(data.mpesaReceiptNumber ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Status poll error:", err);
      setError(message);
    }
  }, []);

  /**
   * Live polling effect.
   * Runs whenever the checkoutRequestId changes. Sets up an interval that
   * calls pollStatus every POLL_INTERVAL_MS, and clears it when:
   *   - the component unmounts,
   *   - a new payment is started, or
   *   - a final status is reached (checked via the ref).
   * Also enforces a hard 60-second cap regardless of status.
   */
  useEffect(() => {
    if (!checkoutRequestId) return;

    // Immediately do one poll so the UI updates right after the push succeeds.
    pollStatus();

    // Track the total time spent polling so we can stop after POLL_TIMEOUT_MS.
    const startedAt = Date.now();

    // The interval returns some number; we'll keep a handle to clear it.
    const interval = setInterval(async () => {
      // Stop once we hit a final status (success / failed / timeout).
      if (statusRef.current && FINAL_STATUSES.includes(statusRef.current)) {
        clearInterval(interval);
        return;
      }

      // Stop once we've been polling for the full 60-second budget.
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        clearInterval(interval);
        // If still pending at the deadline, let the user know we gave up polling.
        setStatus((prev) => prev ?? "timeout");
        setResultDesc("Polling stopped after 60 seconds. Check the status manually.");
        return;
      }

      await pollStatus();
    }, POLL_INTERVAL_MS);

    // Cleanup: clear the interval if the effect re-runs (new id) or unmounts.
    return () => clearInterval(interval);
  }, [checkoutRequestId, pollStatus]);

  /**
   * Handle the "Pay" button click.
   * Calls POST /api/mpesa/stkpush with the form data. On an acknowledged push
   * (ResponseCode "0") the route returns a checkoutRequestId which we save and
   * use to kick off live polling.
   */
  async function handlePay() {
    setLoading(true);
    setError(null);

    // Reset all payment-status state for a fresh attempt.
    setCheckoutRequestId(null);
    setStatus(null);
    setResultDesc(null);
    setMpesaReceiptNumber(null);

    try {
      const res = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          amount,
          accountReference,
          description: "Test M-Pesa payment",
        }),
      });

      // Parse the raw JSON response and log it so we can inspect it.
      const data = await res.json();
      console.log("STK push client response:", data);

      // Basic error handling: surface the server/Daraja error if any.
      if (!res.ok) {
        setError(data.error ?? "Request failed. Check the console for details.");
        return;
      }

      // Save the checkoutRequestID (returned at the top level by our route).
      // Setting it triggers the polling effect above.
      const id = data.checkoutRequestId ?? data.CheckoutRequestID;
      if (id) {
        setCheckoutRequestId(id);
      } else {
        setError("Daraja did not return a CheckoutRequestID — nothing to poll.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("STK push client error:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-8">
      <h1 className="mb-4 text-2xl font-bold">M-Pesa STK Push Test</h1>

      {/* Phone number input */}
      <label className="mb-2 block text-sm font-medium" htmlFor="phone">
        Phone number (e.g. 0712345678 or 254712345678)
      </label>
      <input
        id="phone"
        type="tel"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        placeholder="0712345678"
        className="mb-4 w-full rounded border border-neutral-300 px-3 py-2"
      />

      {/* Amount input */}
      <label className="mb-2 block text-sm font-medium" htmlFor="amount">
        Amount (KES)
      </label>
      <input
        id="amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="mb-4 w-full rounded border border-neutral-300 px-3 py-2"
      />

      {/* Account reference */}
      <label className="mb-2 block text-sm font-medium" htmlFor="ref">
        Account Reference
      </label>
      <input
        id="ref"
        value={accountReference}
        onChange={(e) => setAccountReference(e.target.value)}
        className="mb-4 w-full rounded border border-neutral-300 px-3 py-2"
      />

      {/* Pay button */}
      <button
        onClick={handlePay}
        disabled={loading || !phoneNumber || !amount}
        className="rounded bg-emerald-600 px-6 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "Sending..." : "Pay"}
      </button>

      {/* Show the CheckoutRequestID once we have one */}
      {checkoutRequestId && (
        <div className="mt-4 rounded border border-neutral-300 bg-neutral-50 p-4">
          <p className="text-xs text-neutral-500">CheckoutRequestID</p>
          <p className="break-all font-mono text-sm text-neutral-700">{checkoutRequestId}</p>
        </div>
      )}

      {/* PENDING: waiting spinner/message */}
      {status === "pending" && (
        <div className="mt-4 rounded border border-amber-300 bg-amber-50 p-4 text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-amber-300 border-t-amber-600" />
          <p className="text-sm font-medium text-amber-800">
            Waiting for payment... Check your phone for the M-Pesa PIN prompt.
          </p>
        </div>
      )}

      {/* SUCCESS: green confirmation with receipt number */}
      {status === "success" && (
        <div className="mt-4 rounded border border-green-400 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-800">✅ Payment successful!</p>
          {mpesaReceiptNumber && (
            <p className="mt-1 text-sm text-green-700">
              M-Pesa Receipt: <span className="font-mono font-semibold">{mpesaReceiptNumber}</span>
            </p>
          )}
          {resultDesc && <p className="mt-1 text-xs text-green-600">{resultDesc}</p>}
        </div>
      )}

      {/* FAILED: show the result description */}
      {status === "failed" && (
        <div className="mt-4 rounded border border-red-400 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">Payment failed.</p>
          {resultDesc && <p className="mt-1 text-sm text-red-700">{resultDesc}</p>}
        </div>
      )}

      {/* TIMEOUT: no callback ever arrived */}
      {status === "timeout" && (
        <div className="mt-4 rounded border border-gray-300 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-800">Payment timed out.</p>
          {resultDesc && <p className="mt-1 text-sm text-gray-600">{resultDesc}</p>}
        </div>
      )}

      {/* Upload errors (push failed, etc.) */}
      {error && !status && (
        <div className="mt-4 rounded border border-red-300 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
