import { supabase } from "./supabase";

export const IDLE_MS = 10 * 60 * 1000;
export const MAX_SESSION_MS = 8 * 60 * 60 * 1000;
const START = "aqary_session_start_v1";
const LAST = "aqary_last_activity_v1";
const OWNER = "aqary_session_user_v1";

export function startManagedSession(userId: string) {
  const now = Date.now();
  sessionStorage.setItem(START, String(now));
  sessionStorage.setItem(LAST, String(now));
  sessionStorage.setItem(OWNER, userId);
}

export function clearManagedSession() {
  sessionStorage.removeItem(START);
  sessionStorage.removeItem(LAST);
  sessionStorage.removeItem(OWNER);
}

export function sessionExpiryReason(userId: string): "idle_timeout" | "max_duration" | "missing" | null {
  const start = Number(sessionStorage.getItem(START));
  const last = Number(sessionStorage.getItem(LAST));
  if (!start || !last || sessionStorage.getItem(OWNER) !== userId) return "missing";
  const now = Date.now();
  if (now < start || now - start >= MAX_SESSION_MS) return "max_duration";
  if (now < last || now - last >= IDLE_MS) return "idle_timeout";
  return null;
}

export function recordActivity() {
  const last = Number(sessionStorage.getItem(LAST));
  const now = Date.now();
  if (last && now - last >= 5000) sessionStorage.setItem(LAST, String(now));
}

export async function endManagedSession(reason: "idle_timeout" | "max_duration" | "manual" | "missing") {
  try {
    if (reason !== "missing") {
      try {
        const { error } = await supabase.rpc("record_session_end", { p_reason: reason });
        if (error) {
          console.error("Session end audit failed:", {
            reason,
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
        } else {
          console.info("Session end audit saved:", reason);
        }
      } catch (error) {
        console.error("Session end audit request failed:", reason, error);
      }
    } else {
      console.warn("Managed session metadata missing; session end audit skipped.");
    }
  } finally {
    clearManagedSession();
    // Local scope avoids logging out another device.
    await supabase.auth.signOut({ scope: "local" });
  }
}
