
import { supabase } from "../utils/supabase";

export type PlatformTenant = {
  tenant_id: string;
  tenant_name: string;
};

export async function verifyPlatformOwner(): Promise<boolean> {
  const { data: { user }, error: userError } =
    await supabase.auth.getUser();

  if (userError || !user) return false;

  const { data, error } = await supabase.rpc(
    "is_my_platform_system_owner"
  );

  if (error) throw error;

  return data === true;
}

export async function getPlatformTenants(): Promise<PlatformTenant[]> {
  const { data, error } = await supabase.rpc(
    "get_my_tenant_directory"
  );

  if (error) throw error;

  return (data ?? []) as PlatformTenant[];
}
