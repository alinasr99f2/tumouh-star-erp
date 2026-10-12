import { supabase } from "./supabase";

export type FinancialKind = "charge" | "collection";
export type FinancialAction = "add" | "edit" | "delete";
export type FinancialRecord = Record<string, unknown>;

/**
 * Atomically changes one financial record on Supabase.
 * Do not update localStorage until this RPC returns successfully.
 * For edits/deletes, pass the exact original record from the last server fetch.
 */
export async function applyFinancialOperation(
  buildingId: number,
  kind: FinancialKind,
  action: FinancialAction,
  record?: FinancialRecord,
  expectedRecord?: FinancialRecord
): Promise<FinancialRecord[]> {
  if (!Number.isSafeInteger(buildingId) || buildingId < 1) {
    throw new Error("رقم العمارة غير صالح");
  }
  const { data, error } = await supabase.rpc("apply_building_financial_operation", {
    p_building_id: buildingId,
    p_kind: kind,
    p_action: action,
    p_record: record ?? null,
    p_expected_record: expectedRecord ?? null,
  });
  if (error) throw error;
  if (!Array.isArray(data)) throw new Error("استجابة حفظ العمليات المالية غير صالحة");
  return data as FinancialRecord[];
}
