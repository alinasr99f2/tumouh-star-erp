
import {
  startRegistration,
} from "@simplewebauthn/browser";

import { supabase } from "../utils/supabase";

export type WebAuthnDeviceContext = {
  tenantId: string;
  deviceId: string;
};

export type PasskeyRegistrationResult = {
  verified: boolean;
  credentialRecordId?: string;
};

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

async function invokeWebAuthn<T>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<T> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error(
      "جلسة تسجيل الدخول غير متاحة. سجل الدخول مرة أخرى.",
    );
  }

  const { data, error } =
    await supabase.functions.invoke<T>(
      functionName,
      {
        body,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    );

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        "فشل الاتصال بخدمة WebAuthn.",
      ),
    );
  }

  if (!data) {
    throw new Error(
      "لم يتم استلام استجابة من خدمة WebAuthn.",
    );
  }

  return data;
}

export async function registerPasskey(
  context: WebAuthnDeviceContext,
): Promise<PasskeyRegistrationResult> {
  if (!window.isSecureContext) {
    throw new Error(
      "تسجيل Passkey يتطلب اتصال HTTPS آمنًا.",
    );
  }

  if (!window.PublicKeyCredential) {
    throw new Error(
      "المتصفح الحالي لا يدعم WebAuthn.",
    );
  }

  const options = await invokeWebAuthn<
    Parameters<typeof startRegistration>[0]["optionsJSON"]
  >(
    "webauthn-register-options",
    {
      tenantId: context.tenantId,
      deviceId: context.deviceId,
    },
  );

  const registrationResponse =
    await startRegistration({
      optionsJSON: options,
    });

  const result =
    await invokeWebAuthn<PasskeyRegistrationResult>(
      "webauthn-register-verify",
      {
        tenantId: context.tenantId,
        deviceId: context.deviceId,
        response: registrationResponse,
      },
    );

  if (!result.verified) {
    throw new Error(
      "لم يتم تأكيد تسجيل Passkey.",
    );
  }

  return result;
}


export async function requestTenantDevice(
  tenantId: string,
  deviceName: string,
): Promise<string> {
  const storageKey = "aqary_staging_device_key";

  let deviceKey = localStorage.getItem(storageKey);

  if (!deviceKey) {
    deviceKey = crypto.randomUUID();
    localStorage.setItem(storageKey, deviceKey);
  }

  const encoded = new TextEncoder().encode(deviceKey);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoded,
  );

  const deviceKeyHash = Array.from(
    new Uint8Array(digest),
  )
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  const { data, error } = await supabase.rpc(
    "request_tenant_device",
    {
      p_tenant_id: tenantId,
      p_device_key_hash: deviceKeyHash,
      p_device_name: deviceName,
      p_device_type: "browser",
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  if (typeof data !== "string") {
    throw new Error(
      "لم يتم استلام معرف الجهاز من Supabase.",
    );
  }

  return data;
}


export type TenantDevice = {
  device_id: string;
  device_name: string | null;
  device_type: string | null;
  device_status:
    | "pending"
    | "approved"
    | "blocked"
    | "revoked";
  approved_at: string | null;
  created_at: string;
};

export async function getMyTenantDevices(
  tenantId: string,
): Promise<TenantDevice[]> {
  const { data, error } = await supabase.rpc(
    "get_my_tenant_devices",
    {
      p_tenant_id: tenantId,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TenantDevice[];
}
