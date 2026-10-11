import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePermissions } from "../../utils/permissions";
import PermissionDeniedModal from "../../components/PermissionDeniedModal";
import { supabase } from "../../utils/supabase";
import {
  X,
  Building2,
  Home,
  CalendarDays,
  Wallet,
  User,
  Phone,
  Users,
  Car,
  Zap,
  Droplets,
  Sofa,
  FileText,
  MessageSquare,
  Paperclip,
  Coins,
  MapPin,
  Edit3,
  Trash2,
  Info,
  CheckCircle2,
  Plus,
  AlertCircle,
  ArrowUpRight,
  Receipt,
  Image as ImageIcon,
  Search,
  Check,
  Banknote,
  CircleDollarSign,
  Download,
  Printer,
} from "lucide-react";

type ApartmentStatus = string;

type Apartment = {
  number: string;
  type: string;
  rent: number;
  status: ApartmentStatus;
  tenant: string;
};

type ApartmentExtraInfo = {
  floor: string;
  parking: "┘à╪¬┘ê┘ü╪▒" | "┘ä╪º ┘è┘ê╪¼╪»" | "╪║┘è╪▒ ┘à╪¡╪»╪»";
  electricityMeter: "┘à╪┤╪¬╪▒┘â" | "┘ü╪▒╪»┘è";
  waterMeter: "┘à╪┤╪¬╪▒┘â" | "┘ü╪▒╪»┘è";
  furnitureStatus: "┘à┘ü╪▒┘ê╪┤╪⌐" | "┘å╪╡ ┘ü╪▒╪┤" | "┘à┘ü╪▒┘ê╪┤╪⌐ ╪¿╪º┘ä┘â╪º┘à┘ä";
};

type ApartmentTenantInfo = {
  status: ApartmentStatus;
  tenantName: string;
  phone: string;
  identityNumber: string;
};

type ApartmentContractInfo = {
  contractNumber: string;
  startDate: string;
  endDate: string;
  durationUnit: "day" | "month" | "year";
  durationValue: number;
  insuranceAmount: number;
  insuranceNotes: string;
};

type BuildingCharge = {
  type: string;
  amount: string;
  date: string;
  notes: string;
  apartmentNumber?: string;
  rentMonths?: number;
  dueMonth?: string;
};

const getCurrentBuildingIdFromPath = () => {
  if (typeof window === "undefined") return null;
  const match = window.location.pathname.match(/\/buildings\/(\d+)/);
  return match ? Number(match[1]) : null;
};

const getBuildingStorageKey = (baseKey: string) => {
  const buildingId = getCurrentBuildingIdFromPath();
  return buildingId ? `${baseKey}_${buildingId}` : baseKey;
};

const getBuildingStorageValue = (baseKey: string) => {
  if (typeof window === "undefined") return null;

  // ┘à┘ç┘à: ┘ä╪º ┘è┘ê╪¼╪» LocalStorage ┘à╪┤╪¬╪▒┘â ╪¿┘è┘å ╪º┘ä╪╣┘à╪º╪ª╪▒.
  // ┘â┘ä ╪╣┘à╪º╪▒╪⌐ ┘ä┘ç╪º ┘à╪│╪º╪¡╪⌐ ╪¬╪«╪▓┘è┘å ┘à╪│╪¬┘é┘ä╪⌐ ╪¿╪º╪│┘à ╪º┘ä┘à┘ü╪¬╪º╪¡ + ╪▒┘é┘à ╪º┘ä╪╣┘à╪º╪▒╪⌐.
  const scopedKey = getBuildingStorageKey(baseKey);
  return window.localStorage.getItem(scopedKey);
};

const setBuildingStorageValue = (baseKey: string, value: string) => {
  if (typeof window === "undefined") return;

  // ╪º┘ä╪¡┘ü╪╕ ┘è┘â┘ê┘å ┘ä┘ä╪╣┘à╪º╪▒╪⌐ ╪º┘ä╪¡╪º┘ä┘è╪⌐ ┘ü┘é╪╖.
  const scopedKey = getBuildingStorageKey(baseKey);
  window.localStorage.setItem(scopedKey, value);
  window.dispatchEvent(new CustomEvent("building-data-updated"));
};

const createBlankApartments = (count: number): Apartment[] =>
  Array.from({ length: Math.max(0, count) }, (_, index) => ({
    number: String(index + 1),
    type: "╪║╪▒┘ü╪⌐ ┘ê╪╡╪º┘ä╪⌐",
    rent: 0,
    status: "╪┤╪º╪║╪▒╪⌐",
    tenant: "┘ä╪º ┘è┘ê╪¼╪» ┘à╪│╪¬╪ú╪¼╪▒",
  }));

const DEFAULT_APARTMENT_EXTRA_INFO: ApartmentExtraInfo = {
  floor: "",
  parking: "╪║┘è╪▒ ┘à╪¡╪»╪»",
  electricityMeter: "┘à╪┤╪¬╪▒┘â",
  waterMeter: "┘à╪┤╪¬╪▒┘â",
  furnitureStatus: "┘à┘ü╪▒┘ê╪┤╪⌐ ╪¿╪º┘ä┘â╪º┘à┘ä",
};

const DEFAULT_APARTMENT_CONTRACT_START_DATE = "2025-06-01";

const formatContractDate = (value: string) => {
  if (!value) {
    return "╪║┘è╪▒ ┘à╪¡╪»╪»";
  }

  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
};

const getTodayLocalDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getAccruedRentMonths = (startDate: string, endDate: string) => {
  if (!startDate) {
    return 0;
  }

  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);

  if (
    !startYear ||
    !startMonth ||
    !startDay
  ) {
    return 0;
  }

  const start = new Date(startYear, startMonth - 1, startDay);
  start.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (today.getTime() < start.getTime()) {
    return 0;
  }

  let effectiveDate = today;

  if (endDate) {
    const [endYear, endMonth, endDay] = endDate.split("-").map(Number);

    if (endYear && endMonth && endDay) {
      const end = new Date(endYear, endMonth - 1, endDay);
      end.setHours(0, 0, 0, 0);

      if (end.getTime() < effectiveDate.getTime()) {
        effectiveDate = end;
      }
    }
  }

  if (effectiveDate.getTime() < start.getTime()) {
    return 0;
  }

  let months =
    (effectiveDate.getFullYear() - start.getFullYear()) * 12 +
    (effectiveDate.getMonth() - start.getMonth());

  if (effectiveDate.getDate() >= start.getDate()) {
    months += 1;
  }

  return Math.max(months, 0);
};

const getContractDaysRemaining = (endDate: string) => {
  if (!endDate) {
    return null;
  }

  const [year, month, day] = endDate.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const end = new Date(year, month - 1, day);
  end.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = end.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const addContractDuration = (
  startDate: string,
  durationUnit: "day" | "month" | "year",
  durationValue: number
) => {
  const [year, month, day] = startDate.split("-").map(Number);

  if (!year || !month || !day || !Number.isFinite(durationValue) || durationValue < 1) {
    return "";
  }

  const start = new Date(year, month - 1, day);
  const end = new Date(start);

  if (durationUnit === "year") {
    end.setFullYear(end.getFullYear() + durationValue);
  } else if (durationUnit === "month") {
    end.setMonth(end.getMonth() + durationValue);
  } else {
    end.setDate(end.getDate() + durationValue);
  }

  end.setDate(end.getDate() - 1);

  const endYear = end.getFullYear();
  const endMonth = String(end.getMonth() + 1).padStart(2, "0");
  const endDay = String(end.getDate()).padStart(2, "0");

  return `${endYear}-${endMonth}-${endDay}`;
};

const formatContractDuration = (
  unit: "day" | "month" | "year",
  value: number
) => {
  const count = Math.max(1, Number(value) || 1);

  if (unit === "year") {
    if (count === 1) return "╪│┘å╪⌐ ┘ê╪º╪¡╪»╪⌐";
    if (count === 2) return "╪│┘å╪¬╪º┘å";
    if (count >= 3 && count <= 10) return `${count} ╪│┘å┘ê╪º╪¬`;
    return `${count} ╪│┘å╪⌐`;
  }

  if (unit === "day") {
    if (count === 1) return "┘è┘ê┘à ┘ê╪º╪¡╪»";
    if (count === 2) return "┘è┘ê┘à╪º┘å";
    if (count >= 3 && count <= 10) return `${count} ╪ú┘è╪º┘à`;
    return `${count} ┘è┘ê┘à`;
  }

  if (count === 1) return "╪┤┘ç╪▒ ┘ê╪º╪¡╪»";
  if (count === 2) return "╪┤┘ç╪▒╪º┘å";
  if (count >= 3 && count <= 10) return `${count} ╪ú╪┤┘ç╪▒`;
  return `${count} ╪┤┘ç╪▒`;
};

const createDefaultApartmentContractInfo = (apartmentNumber: string): ApartmentContractInfo => ({
  contractNumber: `CNT-001-${apartmentNumber}`,
  startDate: DEFAULT_APARTMENT_CONTRACT_START_DATE,
  endDate: addContractDuration(
    DEFAULT_APARTMENT_CONTRACT_START_DATE,
    "year",
    1
  ),
  durationUnit: "year",
  durationValue: 1,
  insuranceAmount: 0,
  insuranceNotes: "",
});

type ApartmentTab =
  | "╪º┘ä╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪ú╪│╪º╪│┘è╪⌐"
  | "╪¿┘è╪º┘å╪º╪¬ ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒"
  | "╪º┘ä╪╣┘é╪»"
  | "╪º┘ä┘à╪»┘ü┘ê╪╣╪º╪¬"
  | "╪º┘ä┘à╪│╪¬┘å╪»╪º╪¬"
  | "╪º┘ä┘à┘ä╪º╪¡╪╕╪º╪¬";

export default function BuildingDetails() {
  const { id: buildingIdParam } = useParams<{ id: string }>();
  const currentBuildingId = Number.isFinite(Number(buildingIdParam))
    ? Number(buildingIdParam)
    : null;
    const navigate = useNavigate();

const { loading: permissionsLoading, hasPermission } = usePermissions();

const canViewBuildings = hasPermission("building_details_view");
const canEditBuildings = hasPermission("building_details_edit");
const canAddBuildings = hasPermission("buildings_add");
const canDeleteBuildings = hasPermission("buildings_delete");

const canViewApartments = hasPermission("apartments_view");
const canEditApartments = hasPermission("building_apartment_edit");
const canAddApartments = hasPermission("building_apartment_add");
const canDeleteApartments = hasPermission("building_apartment_delete");
const canViewApartmentTypes = hasPermission("apartment_types_view");
const canAddApartmentTypes = hasPermission("apartment_types_add");
const canEditApartmentTypes = hasPermission("apartment_types_edit");
const canEditTenants = hasPermission("tenants_edit");
const canEditContracts = hasPermission("contracts_edit");
const canAddRentals = hasPermission("rentals_add");
const canAddInvoices = hasPermission("invoices_add");
const canAddCollections = hasPermission("collections_add");

const [permissionMessage, setPermissionMessage] =
  useState<string | null>(null);

const showPermissionDenied = (message: string) => {
  setPermissionMessage(message);
};

const denyAdd = () => {
  if (canAddBuildings) return false;
  showPermissionDenied("╪╣╪░╪▒┘ï╪º╪î ╪║┘è╪▒ ┘à╪│┘à┘ê╪¡ ┘ä┘ä┘à╪│╪¬╪«╪»┘à ╪º┘ä╪¡╪º┘ä┘è ╪¿┘ç╪░╪º ╪º┘ä╪Ñ╪¼╪▒╪º╪í.");
  return true;
};

const denyDelete = () => {
  if (canDeleteBuildings) return false;
  showPermissionDenied("╪╣╪░╪▒┘ï╪º╪î ╪║┘è╪▒ ┘à╪│┘à┘ê╪¡ ┘ä┘ä┘à╪│╪¬╪«╪»┘à ╪º┘ä╪¡╪º┘ä┘è ╪¿┘ç╪░╪º ╪º┘ä╪Ñ╪¼╪▒╪º╪í.");
  return true;
};

const denyApartmentEdit = () => {
  if (canEditApartments) return false;
  showPermissionDenied("╪╣╪░╪▒┘ï╪º╪î ╪║┘è╪▒ ┘à╪│┘à┘ê╪¡ ┘ä┘ä┘à╪│╪¬╪«╪»┘à ╪º┘ä╪¡╪º┘ä┘è ╪¿┘ç╪░╪º ╪º┘ä╪Ñ╪¼╪▒╪º╪í.");
  return true;
};

const denyApartmentAdd = () => {
  if (canAddApartments) return false;
  showPermissionDenied("╪╣╪░╪▒┘ï╪º╪î ╪║┘è╪▒ ┘à╪│┘à┘ê╪¡ ┘ä┘ä┘à╪│╪¬╪«╪»┘à ╪º┘ä╪¡╪º┘ä┘è ╪¿┘ç╪░╪º ╪º┘ä╪Ñ╪¼╪▒╪º╪í.");
  return true;
};

const denyApartmentDelete = () => {
  if (canDeleteApartments) return false;
  showPermissionDenied("╪╣╪░╪▒┘ï╪º╪î ╪║┘è╪▒ ┘à╪│┘à┘ê╪¡ ┘ä┘ä┘à╪│╪¬╪«╪»┘à ╪º┘ä╪¡╪º┘ä┘è ╪¿┘ç╪░╪º ╪º┘ä╪Ñ╪¼╪▒╪º╪í.");
  return true;
};

const denyApartmentTypeAdd = () => {
  if (canAddApartmentTypes) return false;
  showPermissionDenied("╪║┘è╪▒ ┘à╪│┘à┘ê╪¡ ┘ä┘ä┘à╪│╪¬╪«╪»┘à ╪º┘ä╪¡╪º┘ä┘è ╪¿╪Ñ╪╢╪º┘ü╪⌐ ┘å┘ê╪╣ ╪┤┘é╪⌐.");
  return true;
};

const denyApartmentTypeEdit = () => {
  if (canEditApartmentTypes) return false;
  showPermissionDenied("╪║┘è╪▒ ┘à╪│┘à┘ê╪¡ ┘ä┘ä┘à╪│╪¬╪«╪»┘à ╪º┘ä╪¡╪º┘ä┘è ╪¿╪¬╪╣╪»┘è┘ä ╪ú┘å┘ê╪º╪╣ ╪º┘ä╪┤┘é┘é.");
  return true;
};

const denyTenantEdit = () => {
  if (canEditTenants) return false;
  showPermissionDenied("╪║┘è╪▒ ┘à╪│┘à┘ê╪¡ ┘ä┘ä┘à╪│╪¬╪«╪»┘à ╪º┘ä╪¡╪º┘ä┘è ╪¿╪¬╪╣╪»┘è┘ä ╪¿┘è╪º┘å╪º╪¬ ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒.");
  return true;
};

const denyContractEdit = () => {
  if (canEditContracts) return false;
  showPermissionDenied("╪║┘è╪▒ ┘à╪│┘à┘ê╪¡ ┘ä┘ä┘à╪│╪¬╪«╪»┘à ╪º┘ä╪¡╪º┘ä┘è ╪¿╪¬╪╣╪»┘è┘ä ╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪╣┘é╪».");
  return true;
};

const denyChargeAdd = (mode: "charge" | "collection", type: string) => {
  const allowed =
    mode === "collection"
      ? canAddCollections
      : type === "╪Ñ┘è╪¼╪º╪▒"
      ? canAddRentals
      : canAddInvoices;

  if (allowed) return false;
  showPermissionDenied(
    mode === "collection"
      ? "╪║┘è╪▒ ┘à╪│┘à┘ê╪¡ ┘ä┘ä┘à╪│╪¬╪«╪»┘à ╪º┘ä╪¡╪º┘ä┘è ╪¿╪Ñ╪╢╪º┘ü╪⌐ ╪¬╪¡╪╡┘è┘ä."
      : type === "╪Ñ┘è╪¼╪º╪▒"
      ? "╪║┘è╪▒ ┘à╪│┘à┘ê╪¡ ┘ä┘ä┘à╪│╪¬╪«╪»┘à ╪º┘ä╪¡╪º┘ä┘è ╪¿╪Ñ╪╢╪º┘ü╪⌐ ╪Ñ┘è╪¼╪º╪▒."
      : "╪║┘è╪▒ ┘à╪│┘à┘ê╪¡ ┘ä┘ä┘à╪│╪¬╪«╪»┘à ╪º┘ä╪¡╪º┘ä┘è ╪¿╪Ñ╪╢╪º┘ü╪⌐ ┘ü╪º╪¬┘ê╪▒╪⌐ ╪ú┘ê ┘à╪│╪¬╪¡┘é."
  );
  return true;
};

  const [selectedApartment, setSelectedApartment] =
    useState<Apartment | null>(null);

  // ╪ú┘å┘ê╪º╪╣ ╪º┘ä╪┤┘é┘é ╪º┘ä┘à╪«╪╡╪╡╪⌐ ┘ä┘â┘ä ╪┤┘é╪⌐ + ╪º┘ä╪ú┘å┘ê╪º╪╣ ╪º┘ä╪¼╪»┘è╪»╪⌐ ╪º┘ä┘à╪¡┘ü┘ê╪╕╪⌐
  const [apartmentTypes, setApartmentTypes] =
    useState<Record<string, string>>(() => {
      try {
        const saved = getBuildingStorageValue("tumouh_star_apartment_types");
        const parsed = saved ? JSON.parse(saved) : {};
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? parsed
          : {};
      } catch {
        return {};
      }
    });

  const [customApartmentTypes, setCustomApartmentTypes] =
    useState<string[]>(() => {
      try {
        const saved = getBuildingStorageValue("tumouh_star_custom_apartment_types");
        const parsed = saved ? JSON.parse(saved) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    });

  // ╪¡╪º┘ä╪º╪¬ ╪º┘ä╪┤┘é┘é ╪º┘ä┘à╪«╪╡╪╡╪⌐ + ╪º┘ä╪¡╪º┘ä╪º╪¬ ╪º┘ä╪¼╪»┘è╪»╪⌐ ╪º┘ä┘à╪¡┘ü┘ê╪╕╪⌐
  const [customApartmentStatuses, setCustomApartmentStatuses] =
    useState<string[]>(() => {
      try {
        const saved = getBuildingStorageValue("tumouh_star_custom_apartment_statuses");
        const parsed = saved ? JSON.parse(saved) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    });

  const [apartmentTypeRents, setApartmentTypeRents] =
    useState<Record<string, number>>(() => {
      try {
        const saved = getBuildingStorageValue("tumouh_star_apartment_type_rents");
        const parsed = saved ? JSON.parse(saved) : {};
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? parsed
          : {};
      } catch {
        return {};
      }
    });

  const [apartmentExtraInfo, setApartmentExtraInfo] =
    useState<Record<string, ApartmentExtraInfo>>(() => {
      try {
        const saved = getBuildingStorageValue("tumouh_star_apartment_extra_info");
        const parsed = saved ? JSON.parse(saved) : {};
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? parsed
          : {};
      } catch {
        return {};
      }
    });

  const [apartmentTenantInfo, setApartmentTenantInfo] =
    useState<Record<string, ApartmentTenantInfo>>(() => {
      try {
        const saved = getBuildingStorageValue("tumouh_star_apartment_tenant_info");
        const parsed = saved ? JSON.parse(saved) : {};
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? parsed
          : {};
      } catch {
        return {};
      }
    });

  const [apartmentContractInfo, setApartmentContractInfo] =
    useState<Record<string, ApartmentContractInfo>>(() => {
      try {
        const saved = getBuildingStorageValue("tumouh_star_apartment_contract_info");
        const parsed = saved ? JSON.parse(saved) : {};
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? parsed
          : {};
      } catch {
        return {};
      }
    });

  const [activeTab, setActiveTab] =
    useState<ApartmentTab>("╪º┘ä╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪ú╪│╪º╪│┘è╪⌐");

  const [fromDate, setFromDate] = useState("2026-09-01");
  const [toDate, setToDate] = useState("2026-09-30");

  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [chargeModalMode, setChargeModalMode] = useState<"charge" | "collection">("charge");
  const [chargeForm, setChargeForm] = useState<BuildingCharge>({
    type: "╪Ñ┘è╪¼╪º╪▒",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const [selectedChargeApartments, setSelectedChargeApartments] =
    useState<string[]>([]);
  const [apartmentTypeFilter, setApartmentTypeFilter] = useState("");
  const [apartmentStatusFilter, setApartmentStatusFilter] = useState("");
  const [apartmentSearch, setApartmentSearch] = useState("");
  const [rentCollectionMonths, setRentCollectionMonths] = useState(1);
  const [rentDueMonth, setRentDueMonth] = useState(new Date().toISOString().slice(0, 7));
  const [rentDueMonths, setRentDueMonths] = useState<string[]>([]);
  const [chargeDueMonth, setChargeDueMonth] = useState(new Date().toISOString().slice(0, 7));
  const [chargeDueMonths, setChargeDueMonths] = useState<string[]>([]);
  const [collectionDueMonth, setCollectionDueMonth] = useState(new Date().toISOString().slice(0, 7));
  const [collectionDueMonths, setCollectionDueMonths] = useState<string[]>([]);

  const [apartmentReportType, setApartmentReportType] = useState<
    "total" | "rented" | "reserved" | "maintenance" | "vacant" | "occupancy" | null
  >(null);

  const [isPaymentExportMenuOpen, setIsPaymentExportMenuOpen] = useState(false);
  const [isMonthlyDueReportOpen, setIsMonthlyDueReportOpen] = useState(false);
  const [monthlyReportType, setMonthlyReportType] = useState<
    "total" | "rent" | "electricity" | "water"
  >("total");

  const [isMonthlyCollectionReportOpen, setIsMonthlyCollectionReportOpen] =
    useState(false);
  const [monthlyCollectionReportType, setMonthlyCollectionReportType] =
    useState<"total" | "rent" | "electricity" | "water">("total");

  const [selectedApartmentFinancialReport, setSelectedApartmentFinancialReport] =
    useState<"collections" | "water" | "electricity" | "late" | null>(null);

  const [isApartmentTypeModalOpen, setIsApartmentTypeModalOpen] =
    useState(false);
  const [selectedApartmentType, setSelectedApartmentType] =
    useState("");
  const [selectedTypeApartments, setSelectedTypeApartments] =
    useState<string[]>([]);
  const [selectedApartmentTypeReport, setSelectedApartmentTypeReport] =
    useState<string | null>(null);
  const [apartmentTypeSearch, setApartmentTypeSearch] = useState("");
  const [newApartmentType, setNewApartmentType] = useState("");
  const [newApartmentTypeRent, setNewApartmentTypeRent] = useState("");

  const [isDeleteApartmentModalOpen, setIsDeleteApartmentModalOpen] =
    useState(false);
  const [selectedDeleteApartments, setSelectedDeleteApartments] =
    useState<string[]>([]);
  const [deleteApartmentSearch, setDeleteApartmentSearch] = useState("");

  // ╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪┤┘é┘é ┘ä╪º ╪¬╪¿╪»╪ú ┘à┘å LocalStorage ╪╣╪º┘à ╪ú┘ê ╪¿┘è╪º┘å╪º╪¬ ╪╣┘à╪º╪▒╪⌐ ╪ú╪«╪▒┘ë.
  // ╪º┘ä┘à╪╡╪»╪▒ ╪º┘ä╪ú╪│╪º╪│┘è ┘ç┘ê building_state ╪º┘ä┘à╪▒╪¬╪¿╪╖ ╪¿┘Ç building_id.
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [buildingName, setBuildingName] = useState("╪º┘ä╪╣┘à╪º╪▒╪⌐");
  const buildingStateHydratedRef = useRef(false);
  const [buildingDataSyncVersion, setBuildingDataSyncVersion] = useState(0);

  // ╪╣┘å╪» ╪º┘ä╪º┘å╪¬┘é╪º┘ä ╪¿┘è┘å ╪╣┘à╪º╪▒╪¬┘è┘å ╪¿╪»┘ê┘å ╪Ñ╪╣╪º╪»╪⌐ ╪¬╪¡┘à┘è┘ä ╪º┘ä╪╡┘ü╪¡╪⌐╪î ┘è╪¼╪¿ ╪Ñ╪╣╪º╪»╪⌐ ╪¬╪¡┘à┘è┘ä
  // ┘â┘ä ╪¡╪º┘ä╪⌐ ╪º┘ä╪╣┘à╪º╪▒╪⌐ ┘à┘å ╪º┘ä┘Ç storage ╪º┘ä╪«╪º╪╡ ╪¿┘å┘ü╪│ ╪▒┘é┘à ╪º┘ä╪╣┘à╪º╪▒╪⌐ ┘ü┘é╪╖.
  useEffect(() => {
    const readJson = <T,>(key: string, fallback: T): T => {
      try {
        const saved = getBuildingStorageValue(key);
        if (!saved) return fallback;
        const parsed = JSON.parse(saved);
        return parsed as T;
      } catch {
        return fallback;
      }
    };

    const savedApartments = readJson<unknown>(
      "tumouh_star_building_apartments",
      null
    );

    setApartments(
      Array.isArray(savedApartments)
        ? savedApartments.map((apartment) => ({
            ...(apartment as Apartment),
            number: String((apartment as Apartment).number),
          }))
        : []
    );

    const savedTypes = readJson<unknown>("tumouh_star_apartment_types", {});
    setApartmentTypes(
      savedTypes && typeof savedTypes === "object" && !Array.isArray(savedTypes)
        ? (savedTypes as Record<string, string>)
        : {}
    );

    const savedCustomTypes = readJson<unknown>(
      "tumouh_star_custom_apartment_types",
      []
    );
    setCustomApartmentTypes(
      Array.isArray(savedCustomTypes) ? (savedCustomTypes as string[]) : []
    );

    const savedCustomStatuses = readJson<unknown>(
      "tumouh_star_custom_apartment_statuses",
      []
    );
    setCustomApartmentStatuses(
      Array.isArray(savedCustomStatuses) ? (savedCustomStatuses as string[]) : []
    );

    const savedTypeRents = readJson<unknown>(
      "tumouh_star_apartment_type_rents",
      {}
    );
    setApartmentTypeRents(
      savedTypeRents && typeof savedTypeRents === "object" && !Array.isArray(savedTypeRents)
        ? (savedTypeRents as Record<string, number>)
        : {}
    );

    const savedExtraInfo = readJson<unknown>(
      "tumouh_star_apartment_extra_info",
      {}
    );
    setApartmentExtraInfo(
      savedExtraInfo && typeof savedExtraInfo === "object" && !Array.isArray(savedExtraInfo)
        ? (savedExtraInfo as Record<string, ApartmentExtraInfo>)
        : {}
    );

    const savedTenantInfo = readJson<unknown>(
      "tumouh_star_apartment_tenant_info",
      {}
    );
    setApartmentTenantInfo(
      savedTenantInfo && typeof savedTenantInfo === "object" && !Array.isArray(savedTenantInfo)
        ? (savedTenantInfo as Record<string, ApartmentTenantInfo>)
        : {}
    );

    const savedContractInfo = readJson<unknown>(
      "tumouh_star_apartment_contract_info",
      {}
    );
    setApartmentContractInfo(
      savedContractInfo && typeof savedContractInfo === "object" && !Array.isArray(savedContractInfo)
        ? (savedContractInfo as Record<string, ApartmentContractInfo>)
        : {}
    );

    setBuildingName(currentBuildingId ? `╪º┘ä╪╣┘à╪º╪▒╪⌐ ${currentBuildingId}` : "╪º┘ä╪╣┘à╪º╪▒╪⌐");
    setSelectedApartment(null);
    setSelectedChargeApartments([]);
    setSelectedTypeApartments([]);
    setSelectedApartmentTypeReport(null);
  }, [currentBuildingId]);

  // ============================================================
  // ┘à╪╡╪»╪▒ ╪º┘ä╪¡┘é┘è┘é╪⌐ ┘ä┘ä╪╣┘à╪º╪▒╪⌐ ╪º┘ä╪¡╪º┘ä┘è╪⌐: Supabase / building_state
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const loadCurrentBuildingState = async () => {
      if (!currentBuildingId) return;

      buildingStateHydratedRef.current = false;

      const { data: building, error: buildingError } = await supabase
        .from("buildings")
        .select("id, name, units_count")
        .eq("id", currentBuildingId)
        .maybeSingle();

      if (cancelled) return;

      if (buildingError) {
        console.error("╪«╪╖╪ú ┘ü┘è ╪¬╪¡┘à┘è┘ä ╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪╣┘à╪º╪▒╪⌐ ╪º┘ä╪ú╪│╪º╪│┘è╪⌐:", buildingError);
      }

      setBuildingName(
        String(building?.name || "").trim() || `╪º┘ä╪╣┘à╪º╪▒╪⌐ ${currentBuildingId}`
      );

      const unitsCount = Math.max(0, Number(building?.units_count) || 0);

      const { data: state, error: stateError } = await supabase
        .from("building_state")
        .select(
          "apartments, apartment_types, custom_apartment_types, custom_apartment_statuses, apartment_type_rents, apartment_extra_info, apartment_tenant_info, apartment_contract_info, building_charges, building_collections"
        )
        .eq("building_id", currentBuildingId)
        .maybeSingle();

      if (cancelled) return;

      if (stateError) {
        console.error("╪«╪╖╪ú ┘ü┘è ╪¬╪¡┘à┘è┘ä ╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪╣┘à╪º╪▒╪⌐ ┘à┘å Supabase:", stateError);
      }

      if (state) {
        if (Array.isArray(state.apartments)) {
          const normalizedApartments = state.apartments
            .filter((apartment: Apartment) => apartment && apartment.number != null)
            .map((apartment: Apartment) => ({
              ...apartment,
              number: String(apartment.number),
              rent: Number(apartment.rent) || 0,
              type: apartment.type || "╪║╪▒┘ü╪⌐ ┘ê╪╡╪º┘ä╪⌐",
              status: apartment.status || "╪┤╪º╪║╪▒╪⌐",
              tenant: apartment.tenant || "┘ä╪º ┘è┘ê╪¼╪» ┘à╪│╪¬╪ú╪¼╪▒",
            }));

          setApartments(normalizedApartments);
          setBuildingStorageValue(
            "tumouh_star_building_apartments",
            JSON.stringify(normalizedApartments)
          );
        } else if (unitsCount > 0) {
          const blankApartments = createBlankApartments(unitsCount);
          setApartments(blankApartments);
          setBuildingStorageValue(
            "tumouh_star_building_apartments",
            JSON.stringify(blankApartments)
          );
        }

        if (state.apartment_types && typeof state.apartment_types === "object") {
          setApartmentTypes(state.apartment_types as Record<string, string>);
        }

        if (Array.isArray(state.custom_apartment_types)) {
          setCustomApartmentTypes(state.custom_apartment_types as string[]);
        }

        if (Array.isArray(state.custom_apartment_statuses)) {
          setCustomApartmentStatuses(state.custom_apartment_statuses as string[]);
        }

        if (state.apartment_type_rents && typeof state.apartment_type_rents === "object") {
          setApartmentTypeRents(state.apartment_type_rents as Record<string, number>);
        }

        if (state.apartment_extra_info && typeof state.apartment_extra_info === "object") {
          setApartmentExtraInfo(
            state.apartment_extra_info as Record<string, ApartmentExtraInfo>
          );
        }

        if (state.apartment_tenant_info && typeof state.apartment_tenant_info === "object") {
          setApartmentTenantInfo(
            state.apartment_tenant_info as Record<string, ApartmentTenantInfo>
          );
        }

        if (state.apartment_contract_info && typeof state.apartment_contract_info === "object") {
          setApartmentContractInfo(
            state.apartment_contract_info as Record<string, ApartmentContractInfo>
          );
        }

        if (Array.isArray(state.building_charges)) {
          setBuildingStorageValue(
            "tumouh_star_building_charges",
            JSON.stringify(state.building_charges)
          );
        }

        if (Array.isArray(state.building_collections)) {
          setBuildingStorageValue(
            "tumouh_star_building_collections",
            JSON.stringify(state.building_collections)
          );
        }
      } else {
        // ╪╣┘à╪º╪▒╪⌐ ╪¼╪»┘è╪»╪⌐: ┘ä╪º ┘å╪▒╪½ ╪ú┘è ╪¿┘è╪º┘å╪º╪¬ ┘à┘å ╪╣┘à╪º╪▒╪⌐ ╪ú╪«╪▒┘ë.
        // ┘å╪│╪¬╪«╪»┘à units_count ┘ü┘é╪╖ ┘ä╪Ñ┘å╪┤╪º╪í ╪«╪▒┘è╪╖╪⌐ ╪ú┘ê┘ä┘è╪⌐ ┘ü╪º╪▒╪║╪⌐.
        const scopedSaved = getBuildingStorageValue(
          "tumouh_star_building_apartments"
        );

        if (!scopedSaved && unitsCount > 0) {
          const blankApartments = createBlankApartments(unitsCount);
          setApartments(blankApartments);
          setBuildingStorageValue(
            "tumouh_star_building_apartments",
            JSON.stringify(blankApartments)
          );
        } else if (scopedSaved) {
          try {
            const parsed = JSON.parse(scopedSaved);
            if (Array.isArray(parsed)) {
              setApartments(
                parsed.map((apartment) => ({
                  ...apartment,
                  number: String(apartment.number),
                }))
              );
            }
          } catch {
            // ╪¬╪¼╪º┘ç┘ä ╪º┘ä╪¬╪«╪▓┘è┘å ╪º┘ä┘à╪¡┘ä┘è ╪║┘è╪▒ ╪º┘ä╪╡╪º┘ä╪¡.
          }
        } else {
          setApartments([]);
        }
      }

      buildingStateHydratedRef.current = true;
      setBuildingDataSyncVersion((value) => value + 1);
    };

    void loadCurrentBuildingState();

    return () => {
      cancelled = true;
      buildingStateHydratedRef.current = false;
    };
  }, [currentBuildingId]);

  // ╪Ñ╪╣╪º╪»╪⌐ ╪¬╪¡┘à┘è┘ä ╪¿┘è╪º┘å╪º╪¬ ┘å┘ü╪│ ╪º┘ä╪╣┘à╪º╪▒╪⌐ ╪╣┘å╪» ╪º┘ä╪▒╪¼┘ê╪╣ ┘ä┘ä╪╡┘ü╪¡╪⌐ ╪ú┘ê ╪¿╪╣╪» ╪¬╪╣╪»┘è┘ä ╪º┘ä╪«╪▒┘è╪╖╪⌐.
  useEffect(() => {
    const reloadOnReturn = () => {
      if (!currentBuildingId) return;
      window.dispatchEvent(new CustomEvent("building-data-refresh"));
    };

    window.addEventListener("pageshow", reloadOnReturn);
    window.addEventListener("building-data-updated", reloadOnReturn);

    return () => {
      window.removeEventListener("pageshow", reloadOnReturn);
      window.removeEventListener("building-data-updated", reloadOnReturn);
    };
  }, [currentBuildingId]);

  // ╪¡┘ü╪╕ ╪¬╪║┘è┘è╪▒╪º╪¬ ╪º┘ä╪╣┘à╪º╪▒╪⌐ ╪º┘ä╪¡╪º┘ä┘è╪⌐ ┘ü┘è ╪│╪¼┘ä┘ç╪º ╪º┘ä╪«╪º╪╡ ╪»╪º╪«┘ä Supabase.
  useEffect(() => {
  if (
    permissionsLoading ||
    !currentBuildingId ||
    !buildingStateHydratedRef.current ||
    !canEditBuildings ||
    !canEditApartments
  ) {
    return;
  }

    const saveCurrentBuildingState = async () => {
      const readScopedArray = (key: string): BuildingCharge[] => {
        try {
          const saved = getBuildingStorageValue(key);
          return saved ? (JSON.parse(saved) as BuildingCharge[]) : [];
        } catch {
          return [];
        }
      };

      const { error } = await supabase.from("building_state").upsert(
        {
          building_id: currentBuildingId,
          apartments,
          apartment_types: apartmentTypes,
          custom_apartment_types: customApartmentTypes,
          custom_apartment_statuses: customApartmentStatuses,
          apartment_type_rents: apartmentTypeRents,
          apartment_extra_info: apartmentExtraInfo,
          apartment_tenant_info: apartmentTenantInfo,
          apartment_contract_info: apartmentContractInfo,
          building_charges: readScopedArray("tumouh_star_building_charges"),
          building_collections: readScopedArray("tumouh_star_building_collections"),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "building_id" }
      );

      if (error) {
        console.error("╪«╪╖╪ú ┘ü┘è ╪¡┘ü╪╕ ╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪╣┘à╪º╪▒╪⌐ ╪º┘ä╪¡╪º┘ä┘è╪⌐:", error);
      }
    };

    void saveCurrentBuildingState();
  }, [
    currentBuildingId,
    apartments,
    apartmentTypes,
    customApartmentTypes,
    customApartmentStatuses,
    apartmentTypeRents,
    apartmentExtraInfo,
    apartmentTenantInfo,
    apartmentContractInfo,
    buildingDataSyncVersion,
    permissionsLoading,
    canEditBuildings,
    canEditApartments,
  ]);

  useEffect(() => {
    let cancelled = false;

    const loadBuildingInfo = async () => {
      const buildingId = currentBuildingId;
      if (!buildingId) return;

      const { data, error } = await supabase
        .from("buildings")
        .select("name, units_count")
        .eq("id", buildingId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("╪«╪╖╪ú ┘ü┘è ╪¬╪¡┘à┘è┘ä ╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪╣┘à╪º╪▒╪⌐:", error);
        return;
      }

      const unitsCount = Math.max(0, Number(data?.units_count) || 0);
      setBuildingName(data?.name?.trim() || `╪º┘ä╪╣┘à╪º╪▒╪⌐ ${buildingId}`);

      const existingApartments = getBuildingStorageValue(
        "tumouh_star_building_apartments"
      );

      if (!existingApartments && unitsCount > 0) {
        const blankApartments = createBlankApartments(unitsCount);
        setApartments(blankApartments);
        setBuildingStorageValue(
          "tumouh_star_building_apartments",
          JSON.stringify(blankApartments)
        );
      }
    };

    void loadBuildingInfo();

    return () => {
      cancelled = true;
    };
  }, [currentBuildingId]);

  // ┘à╪▓╪º┘à┘å╪⌐ ┘ü┘ê╪▒┘è╪⌐ ┘à╪╣ ╪┤╪º╪┤╪⌐ ╪«╪▒┘è╪╖╪⌐ ╪º┘ä╪┤┘é┘é. ╪º┘ä╪«╪▒┘è╪╖╪⌐ ╪¬╪¡┘ü╪╕ ╪º┘ä┘é╪º╪ª┘à╪⌐ ┘ü┘è localStorage╪î
  // ┘ä╪░┘ä┘â ┘å╪╣┘è╪» ┘é╪▒╪º╪í╪¬┘ç╪º ╪╣┘å╪» ╪º┘ä╪▒╪¼┘ê╪╣ ┘ä┘ä╪╡┘ü╪¡╪⌐ ╪ú┘ê ┘ê╪╡┘ê┘ä ╪¡╪»╪½ storage.
  useEffect(() => {
    const syncApartmentsFromStorage = () => {
      try {
        const saved = getBuildingStorageValue("tumouh_star_building_apartments");
        if (!saved) return;

        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return;

        setApartments(
          parsed
            .filter((apartment) => apartment && apartment.number != null)
            .map((apartment) => ({
              ...(apartment as Apartment),
              number: String((apartment as Apartment).number),
            }))
        );
      } catch {
        // ╪¬╪¼╪º┘ç┘ä ╪ú┘è ╪¿┘è╪º┘å╪º╪¬ ╪¬╪«╪▓┘è┘å ╪║┘è╪▒ ╪╡╪º┘ä╪¡╪⌐ ╪¿╪»┘ê┘å ╪¬╪╣╪╖┘è┘ä ╪º┘ä╪╡┘ü╪¡╪⌐.
      }
    };

    window.addEventListener("focus", syncApartmentsFromStorage);
    window.addEventListener("pageshow", syncApartmentsFromStorage);
    window.addEventListener("storage", syncApartmentsFromStorage);
    window.addEventListener("building-apartments-updated", syncApartmentsFromStorage);

    return () => {
      window.removeEventListener("focus", syncApartmentsFromStorage);
      window.removeEventListener("pageshow", syncApartmentsFromStorage);
      window.removeEventListener("storage", syncApartmentsFromStorage);
      window.removeEventListener("building-apartments-updated", syncApartmentsFromStorage);
    };
  }, [currentBuildingId]);

  const addApartment = () => {
    if (denyApartmentAdd()) return;
    if (denyAdd()) return;
    setApartments((current) => {
      const nextNumber =
        current.length > 0
          ? String(Math.max(...current.map((apartment) => Number(apartment.number) || 0)) + 1)
          : 1;

      const updated = [
        ...current,
        {
          number: String(nextNumber),
          type: "╪║╪▒┘ü╪⌐ ┘ê╪╡╪º┘ä╪⌐",
          rent: 3000,
          status: "╪┤╪º╪║╪▒╪⌐" as ApartmentStatus,
          tenant: "┘ä╪º ┘è┘ê╪¼╪» ┘à╪│╪¬╪ú╪¼╪▒",
        },
      ];

      setBuildingStorageValue("tumouh_star_building_apartments",
        JSON.stringify(updated)
      );

      return updated;
    });
  };

  // ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪┤┘é┘é = ╪╣╪»╪» ╪│╪¼┘ä╪º╪¬ ╪º┘ä╪┤┘é┘é ╪º┘ä┘ü╪╣┘ä┘è╪⌐ ╪º┘ä┘à╪¡┘ü┘ê╪╕╪⌐ ┘ä┘ç╪░┘ç ╪º┘ä╪╣┘à╪º╪▒╪⌐.
  // ┘ä╪º ┘å╪╣╪¬┘à╪» ╪╣┘ä┘ë units_count ┘ê┘ä╪º ╪╣┘ä┘ë ╪▒┘é┘à ╪½╪º╪¿╪¬.
  const totalApartments = apartments.length;

  // ╪º┘ä╪¡╪º┘ä╪⌐ ╪º┘ä┘ü╪╣┘ä┘è╪⌐ ┘ä┘ä╪┤┘é╪⌐: ┘å╪╣╪¬┘à╪» ╪╣┘ä┘ë ╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪┤┘é╪⌐ ┘å┘ü╪│┘ç╪º╪î ┘à╪╣ ╪º┘ä╪º╪│╪¬┘ü╪º╪»╪⌐ ┘à┘å
  // ╪¿┘è╪º┘å╪º╪¬ ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒ ╪º┘ä┘é╪»┘è┘à╪⌐ ╪Ñ╪░╪º ┘â╪º┘å╪¬ ┘ç┘è ╪º┘ä╪¬┘è ╪¬╪¡╪¬┘ê┘è ╪╣┘ä┘ë ╪º┘ä╪¡╪º┘ä╪⌐ ╪º┘ä┘à╪¡┘ü┘ê╪╕╪⌐.
  // ┘ç╪░╪º ┘è┘à┘å╪╣ ╪╕┘ç┘ê╪▒ 0 ┘à╪ñ╪¼╪▒╪⌐ / 44 ┘ü╪º╪▒╪║╪⌐ ╪▒╪║┘à ╪ú┘å ╪º┘ä╪┤┘é╪⌐ ┘à╪│╪¼┘ä╪⌐ ┘â┘à╪ñ╪¼╪▒╪⌐ ╪»╪º╪«┘ä ╪º┘ä╪¬┘ü╪º╪╡┘è┘ä.
  const normalizeApartmentStatus = (value: unknown): string => {
    const normalized = String(value ?? "")
      .normalize("NFKC")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // ╪¿╪╣╪╢ ╪º┘ä╪¿┘è╪º┘å╪º╪¬ ╪º┘ä┘é╪»┘è┘à╪⌐ ┘â╪º┘å╪¬ ╪¬╪¡┘ü╪╕ "┘ü╪º╪▒╪║╪⌐" ╪¿╪»┘ä "╪┤╪º╪║╪▒╪⌐".
    if (normalized === "┘ü╪º╪▒╪║╪⌐") return "╪┤╪º╪║╪▒╪⌐";
    return normalized;
  };

  const getEffectiveApartmentStatus = (apartment: Apartment): ApartmentStatus => {
    const apartmentStatus = normalizeApartmentStatus(apartment.status);
    const tenantStatus = normalizeApartmentStatus(
      apartmentTenantInfo?.[apartment.number]?.status
    );

    const knownStatuses = new Set([
      "┘à╪ñ╪¼╪▒╪⌐",
      "┘à╪ñ╪¼╪▒╪⌐ ┘ä┘ä╪┤╪▒┘â╪⌐",
      "╪┤╪º╪║╪▒╪⌐",
      "┘à╪¡╪¼┘ê╪▓╪⌐",
      "╪¬╪¡╪¬ ╪º┘ä╪╡┘è╪º┘å╪⌐",
    ]);

    // ╪¿┘è╪º┘å╪º╪¬ ╪¡╪º┘ä╪⌐ ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒ ┘ç┘è ╪º┘ä┘à╪╡╪»╪▒ ╪º┘ä╪ú╪¡╪»╪½ ╪»╪º╪«┘ä ╪¬┘ü╪º╪╡┘è┘ä ╪º┘ä╪┤┘é╪⌐╪î
    // ┘ä╪░┘ä┘â ┘å╪╣╪¬┘à╪»┘ç╪º ╪ú┘ê┘ä╪º┘ï ╪Ñ╪░╪º ┘â╪º┘å╪¬ ╪¬╪¡╪¬┘ê┘è ╪╣┘ä┘ë ╪¡╪º┘ä╪⌐ ╪╡╪º┘ä╪¡╪⌐.
    // ┘ç╪░╪º ┘è╪╣╪º┘ä╪¼ ╪º┘ä╪│╪¼┘ä╪º╪¬ ╪º┘ä┘é╪»┘è┘à╪⌐ ╪º┘ä╪¬┘è ╪╕┘ä╪¬ ┘ü┘è┘ç╪º apartment.status = "╪┤╪º╪║╪▒╪⌐"
    // ╪¿┘è┘å┘à╪º ╪¬┘à ╪¡┘ü╪╕ ╪¡╪º┘ä╪⌐ ╪º┘ä╪┤┘é╪⌐ ╪»╪º╪«┘ä apartmentTenantInfo ╪╣┘ä┘ë ╪ú┘å┘ç╪º "┘à╪ñ╪¼╪▒╪⌐".
    if (knownStatuses.has(tenantStatus)) {
      return tenantStatus as ApartmentStatus;
    }

    if (knownStatuses.has(apartmentStatus)) {
      return apartmentStatus as ApartmentStatus;
    }

    return "╪┤╪º╪║╪▒╪⌐";
  };

  // ┘â┘ä ╪º┘ä┘â╪▒┘ê╪¬ ╪º┘ä╪│╪¬╪⌐ ╪¬╪╣╪¬┘à╪» ╪╣┘ä┘ë ┘å┘ü╪│ ╪º┘ä╪¡╪º┘ä╪⌐ ╪º┘ä┘ü╪╣┘ä┘è╪⌐ ┘ä┘ä╪┤┘é┘é.
  // ╪¿┘ç╪░╪º ┘ä╪º ┘è╪¡╪»╪½ ╪¬╪╣╪º╪▒╪╢ ╪¿┘è┘å apartment.status ┘ê╪¿┘è╪º┘å╪º╪¬ ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒ ╪º┘ä┘é╪»┘è┘à╪⌐.
  const rentedApartments = apartments.filter(
    (apartment) => {
      const status = getEffectiveApartmentStatus(apartment);
      return status === "┘à╪ñ╪¼╪▒╪⌐" || status === "┘à╪ñ╪¼╪▒╪⌐ ┘ä┘ä╪┤╪▒┘â╪⌐";
    }
  ).length;

  const reservedApartments = apartments.filter(
    (apartment) => getEffectiveApartmentStatus(apartment) === "┘à╪¡╪¼┘ê╪▓╪⌐"
  ).length;

  const maintenanceApartments = apartments.filter(
    (apartment) => getEffectiveApartmentStatus(apartment) === "╪¬╪¡╪¬ ╪º┘ä╪╡┘è╪º┘å╪⌐"
  ).length;

  const vacantApartments = apartments.filter(
    (apartment) => getEffectiveApartmentStatus(apartment) === "╪┤╪º╪║╪▒╪⌐"
  ).length;

  const occupancyRate =
    totalApartments > 0
      ? ((rentedApartments / totalApartments) * 100).toFixed(2)
      : "0.00";

  const getApartmentColor = (
    status: ApartmentStatus
  ) => {
    if (status === "╪┤╪º╪║╪▒╪⌐") {
      return "bg-red-600 hover:bg-red-500";
    }

    if (status === "╪¬╪¡╪¬ ╪º┘ä╪╡┘è╪º┘å╪⌐") {
      return "bg-yellow-500 hover:bg-yellow-400";
    }

    if (status === "┘à╪¡╪¼┘ê╪▓╪⌐") {
      return "bg-blue-600 hover:bg-blue-500";
    }

    if (status === "┘à╪ñ╪¼╪▒╪⌐ ┘ä┘ä╪┤╪▒┘â╪⌐") {
      return "bg-emerald-700 hover:bg-emerald-600";
    }

    return "bg-green-600 hover:bg-green-500";
  };

  const getStatusColor = (
    status: ApartmentStatus
  ) => {
    if (status === "╪┤╪º╪║╪▒╪⌐") {
      return {
        badge:
          "border-red-400/30 bg-red-500/10 text-red-400",
        dot: "bg-red-400",
      };
    }

    if (status === "┘à╪ñ╪¼╪▒╪⌐ ┘ä┘ä╪┤╪▒┘â╪⌐") {
      return {
        badge:
          "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
        dot: "bg-emerald-400",
      };
    }

    if (status === "┘à╪¡╪¼┘ê╪▓╪⌐") {
      return {
        badge:
          "border-blue-400/30 bg-blue-500/10 text-blue-400",
        dot: "bg-blue-400",
      };
    }

    if (status === "╪¬╪¡╪¬ ╪º┘ä╪╡┘è╪º┘å╪⌐") {
      return {
        badge:
          "border-orange-400/30 bg-orange-500/10 text-orange-400",
        dot: "bg-orange-400",
      };
    }

    return {
      badge:
        "border-green-400/30 bg-green-500/10 text-green-400",
      dot: "bg-green-400",
    };
  };

  const getApartmentStatusCard = (
    status: ApartmentStatus
  ) => {
    if (status === "╪┤╪º╪║╪▒╪⌐") {
      return {
        label: "┘ü╪º╪▒╪║╪⌐",
        icon: Home,
        iconClass: "text-red-400",
        iconBorder: "border-red-400/20",
        iconBg: "bg-red-400/10",
        valueClass: "text-red-400",
      };
    }

    if (status === "┘à╪ñ╪¼╪▒╪⌐ ┘ä┘ä╪┤╪▒┘â╪⌐") {
      return {
        label: "┘à╪ñ╪¼╪▒╪⌐ ┘ä┘ä╪┤╪▒┘â╪⌐",
        icon: User,
        iconClass: "text-emerald-300",
        iconBorder: "border-emerald-400/20",
        iconBg: "bg-emerald-500/10",
        valueClass: "text-emerald-300",
      };
    }

    if (status === "┘à╪¡╪¼┘ê╪▓╪⌐") {
      return {
        label: "┘à╪¡╪¼┘ê╪▓╪⌐",
        icon: CalendarDays,
        iconClass: "text-blue-400",
        iconBorder: "border-blue-400/20",
        iconBg: "bg-blue-400/10",
        valueClass: "text-blue-400",
      };
    }

    if (status === "╪¬╪¡╪¬ ╪º┘ä╪╡┘è╪º┘å╪⌐") {
      return {
        label: "╪¬╪¡╪¬ ╪º┘ä╪╡┘è╪º┘å╪⌐",
        icon: AlertCircle,
        iconClass: "text-yellow-400",
        iconBorder: "border-yellow-400/20",
        iconBg: "bg-yellow-400/10",
        valueClass: "text-yellow-400",
      };
    }

    return {
      label: status,
      icon: User,
      iconClass: "text-green-300",
      iconBorder: "border-green-400/20",
      iconBg: "bg-green-400/10",
      valueClass: "text-green-300",
    };
  };

  const apartmentTabs: {
    title: ApartmentTab;
    icon: typeof Home;
  }[] = [
    {
      title: "╪º┘ä╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪ú╪│╪º╪│┘è╪⌐",
      icon: Home,
    },
    {
      title: "╪¿┘è╪º┘å╪º╪¬ ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒",
      icon: User,
    },
    {
      title: "╪º┘ä╪╣┘é╪»",
      icon: FileText,
    },
    {
      title: "╪º┘ä┘à╪»┘ü┘ê╪╣╪º╪¬",
      icon: Coins,
    },
    {
      title: "╪º┘ä┘à╪│╪¬┘å╪»╪º╪¬",
      icon: Paperclip,
    },
    {
      title: "╪º┘ä┘à┘ä╪º╪¡╪╕╪º╪¬",
      icon: MessageSquare,
    },
  ];

  const getApartmentExtraInfo = (
    apartmentNumber: string
  ): ApartmentExtraInfo => {
    return (
      (apartmentExtraInfo ?? {})[apartmentNumber] ??
      DEFAULT_APARTMENT_EXTRA_INFO
    );
  };

  const getApartmentTenantInfo = (
    apartment: Apartment
  ): ApartmentTenantInfo => {
    return (
      (apartmentTenantInfo ?? {})[apartment.number] ??
      {
        status: apartment.status,
        tenantName:
          apartment.status === "╪┤╪º╪║╪▒╪⌐"
            ? ""
            : apartment.tenant === "╪º╪│┘à ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒ ╪║┘è╪▒ ┘à╪╢╪º┘ü"
            ? ""
            : apartment.tenant,
        phone: "",
        identityNumber: "",
      }
    );
  };

  const updateApartmentTenantInfo = <K extends keyof ApartmentTenantInfo>(
    apartment: Apartment,
    key: K,
    value: ApartmentTenantInfo[K]
  ) => {
    if (denyTenantEdit()) return;
    setApartmentTenantInfo((current) => ({
      ...current,
      [apartment.number]: {
        ...getApartmentTenantInfo(apartment),
        [key]: value,
      },
    }));
  };

  const updateApartmentExtraInfo = <K extends keyof ApartmentExtraInfo>(
    apartmentNumber: string,
    key: K,
    value: ApartmentExtraInfo[K]
  ) => {
    if (denyApartmentEdit()) return;
    setApartmentExtraInfo((current) => ({
      ...current,
      [apartmentNumber]: {
        ...getApartmentExtraInfo(apartmentNumber),
        [key]: value,
      },
    }));
  };

  const getApartmentType = (apartment: Apartment) => {
    return (apartmentTypes ?? {})[apartment.number] ?? apartment.type;
  };

  const getApartmentRent = (apartment: Apartment) => {
    const type = getApartmentType(apartment);
    const typeRent = (apartmentTypeRents ?? {})[type];

    if (typeof typeRent === "number" && typeRent > 0) {
      return typeRent;
    }

    const firstApartmentOfType = apartments.find(
      (item) => getApartmentType(item) === type
    );

    return firstApartmentOfType?.rent ?? apartment.rent;
  };

  const openDeleteApartmentModal = () => {
    if (denyApartmentDelete()) return;
    if (denyDelete()) return;
    setSelectedDeleteApartments([]);
    setDeleteApartmentSearch("");
    setIsDeleteApartmentModalOpen(true);
  };

  const closeDeleteApartmentModal = () => {
    setIsDeleteApartmentModalOpen(false);
    setSelectedDeleteApartments([]);
    setDeleteApartmentSearch("");
  };

  const toggleDeleteApartment = (apartmentNumber: string) => {
    setSelectedDeleteApartments((current) =>
      current.includes(apartmentNumber)
        ? current.filter((number) => number !== apartmentNumber)
        : [...current, apartmentNumber]
    );
  };

  const filteredDeleteApartments = apartments.filter((apartment) => {
    const search = deleteApartmentSearch.trim().toLowerCase();

    if (!search) {
      return true;
    }

    return (
      apartment.number.toString().includes(search) ||
      getApartmentType(apartment).toLowerCase().includes(search)
    );
  });

  const toggleAllDeleteApartments = () => {
    const visibleNumbers = filteredDeleteApartments.map(
      (apartment) => apartment.number
    );

    const allVisibleSelected =
      visibleNumbers.length > 0 &&
      visibleNumbers.every((number) =>
        selectedDeleteApartments.includes(number)
      );

    setSelectedDeleteApartments((current) =>
      allVisibleSelected
        ? current.filter((number) => !visibleNumbers.includes(number))
        : Array.from(new Set([...current, ...visibleNumbers]))
    );
  };

  const deleteSelectedApartments = () => {
    if (denyApartmentDelete()) return;
    if (denyDelete()) return;
    if (selectedDeleteApartments.length === 0) {
      window.alert("╪º╪«╪¬╪▒ ╪┤┘é╪⌐ ┘ê╪º╪¡╪»╪⌐ ╪╣┘ä┘ë ╪º┘ä╪ú┘é┘ä ┘ä┘ä╪¡╪░┘ü.");
      return;
    }

    const selectedNumbers = new Set(selectedDeleteApartments);
    const confirmed = window.confirm(
      `┘ç┘ä ╪ú┘å╪¬ ┘à╪¬╪ú┘â╪» ┘à┘å ╪¡╪░┘ü ${selectedDeleteApartments.length} ╪┤┘é╪⌐ ┘à╪¡╪»╪»╪⌐╪ƒ`
    );

    if (!confirmed) {
      return;
    }

    setApartments((current) => {
      const updated = current.filter(
        (apartment) => !selectedNumbers.has(apartment.number)
      );

      setBuildingStorageValue("tumouh_star_building_apartments",
        JSON.stringify(updated)
      );

      return updated;
    });

    setApartmentTypes((current) => {
      const updated = { ...current };

      selectedNumbers.forEach((apartmentNumber) => {
        delete updated[apartmentNumber];
      });

      setBuildingStorageValue("tumouh_star_apartment_types",
        JSON.stringify(updated)
      );

      return updated;
    });

    setApartmentExtraInfo((current) => {
      const updated = { ...current };

      selectedNumbers.forEach((apartmentNumber) => {
        delete updated[apartmentNumber];
      });

      return updated;
    });

    setApartmentTenantInfo((current) => {
      const updated = { ...current };

      selectedNumbers.forEach((apartmentNumber) => {
        delete updated[apartmentNumber];
      });

      return updated;
    });

    if (
      selectedApartment &&
      selectedNumbers.has(selectedApartment.number)
    ) {
      closeApartment();
    }

    closeDeleteApartmentModal();
  };

  const updateApartmentTypeRent = (type: string, value: string) => {
    if (denyApartmentTypeEdit()) return;
    const numericValue = Number(value);

    setApartmentTypeRents((current) => {
      const updated = {
        ...current,
        [type]: Number.isFinite(numericValue) ? numericValue : 0,
      };

      setBuildingStorageValue("tumouh_star_apartment_type_rents",
        JSON.stringify(updated)
      );

      return updated;
    });
  };

  const availableApartmentTypes = Array.from(
    new Set([
      "╪║╪▒┘ü╪¬┘è┘å ┘ê╪╡╪º┘ä╪⌐",
      "╪║╪▒┘ü╪⌐ ┘ê╪╡╪º┘ä╪⌐",
      ...customApartmentTypes,
      ...apartments.map((apartment) => getApartmentType(apartment)),
    ])
  );

  const filteredTypeApartments = apartments.filter((apartment) => {
    const search = apartmentTypeSearch.trim().toLowerCase();

    if (!search) {
      return true;
    }

    return (
      apartment.number.toString().includes(search) ||
      getApartmentType(apartment).toLowerCase().includes(search)
    );
  });

  const openApartmentTypeModal = () => {
    const firstType = availableApartmentTypes[0] ?? "╪║╪▒┘ü╪¬┘è┘å ┘ê╪╡╪º┘ä╪⌐";
    setSelectedApartmentType(firstType);
    setSelectedTypeApartments(
      apartments
        .filter((apartment) => getApartmentType(apartment) === firstType)
        .map((apartment) => apartment.number)
    );
    setApartmentTypeSearch("");
    setNewApartmentType("");
    setNewApartmentTypeRent("");
    setIsApartmentTypeModalOpen(true);
  };

  const closeApartmentTypeModal = () => {
    setIsApartmentTypeModalOpen(false);
    setApartmentTypeSearch("");
    setNewApartmentType("");
    setNewApartmentTypeRent("");
    setSelectedTypeApartments([]);
  };

  const selectApartmentTypeForManagement = (type: string) => {
    setSelectedApartmentType(type);
    setSelectedTypeApartments(
      apartments
        .filter((apartment) => getApartmentType(apartment) === type)
        .map((apartment) => apartment.number)
    );
  };

  const toggleTypeApartment = (apartmentNumber: string) => {
    setSelectedTypeApartments((current) =>
      current.includes(apartmentNumber)
        ? current.filter((number) => number !== apartmentNumber)
        : [...current, apartmentNumber]
    );
  };

  const toggleAllTypeApartments = () => {
    const visibleNumbers = filteredTypeApartments.map(
      (apartment) => apartment.number
    );
    const allSelected = visibleNumbers.every((number) =>
      selectedTypeApartments.includes(number)
    );

    setSelectedTypeApartments((current) =>
      allSelected
        ? current.filter((number) => !visibleNumbers.includes(number))
        : Array.from(new Set([...current, ...visibleNumbers]))
    );
  };

  const addNewApartmentTypeFromCard = () => {
    if (denyApartmentTypeAdd()) return;
    const type = newApartmentType.trim();
    const rent = Number(newApartmentTypeRent);

    if (!type) {
      window.alert("╪º┘â╪¬╪¿ ╪º╪│┘à ┘å┘ê╪╣ ╪º┘ä╪┤┘é╪⌐ ╪ú┘ê┘ä╪º┘ï");
      return;
    }

    if (!Number.isFinite(rent) || rent <= 0) {
      window.alert("╪º┘â╪¬╪¿ ┘é┘è┘à╪⌐ ╪Ñ┘è╪¼╪º╪▒ ╪╡╪¡┘è╪¡╪⌐ ┘ä┘å┘ê╪╣ ╪º┘ä╪┤┘é╪⌐");
      return;
    }

    if (availableApartmentTypes.includes(type)) {
      updateApartmentTypeRent(type, String(rent));
      setSelectedApartmentType(type);
      setSelectedTypeApartments([]);
      setNewApartmentType("");
      setNewApartmentTypeRent("");
      return;
    }

    setCustomApartmentTypes((current) => {
      const updated = [...current, type];
      setBuildingStorageValue("tumouh_star_custom_apartment_types",
        JSON.stringify(updated)
      );
      return updated;
    });

    updateApartmentTypeRent(type, String(rent));
    setSelectedApartmentType(type);
    setSelectedTypeApartments([]);
    setNewApartmentType("");
    setNewApartmentTypeRent("");
  };

  const saveApartmentTypeAssignments = () => {
    if (denyApartmentTypeEdit()) return;
    if (!selectedApartmentType) {
      window.alert("╪º╪«╪¬╪▒ ┘å┘ê╪╣ ╪º┘ä╪┤┘é╪⌐ ╪ú┘ê┘ä╪º┘ï");
      return;
    }

    setApartmentTypes((current) => {
      const updated = { ...current };
      const selectedSet = new Set(selectedTypeApartments);

      apartments.forEach((apartment) => {
        if (selectedSet.has(apartment.number)) {
          updated[apartment.number] = selectedApartmentType;
        } else if (current[apartment.number] === selectedApartmentType) {
          delete updated[apartment.number];
        }
      });

      setBuildingStorageValue("tumouh_star_apartment_types",
        JSON.stringify(updated)
      );

      return updated;
    });

    closeApartmentTypeModal();
  };

  const updateApartmentType = (
    apartment: Apartment,
    value: string
  ) => {
    if (denyApartmentTypeEdit()) return;
    if (value === "__add_new__") {
      const newType = window.prompt(
        "╪º┘â╪¬╪¿ ╪º╪│┘à ┘å┘ê╪╣ ╪º┘ä╪┤┘é╪⌐ ╪º┘ä╪¼╪»┘è╪»:"
      )?.trim();

      if (!newType) {
        return;
      }

      setCustomApartmentTypes((current) => {
        const updated = current.includes(newType)
          ? current
          : [...current, newType];

        setBuildingStorageValue("tumouh_star_custom_apartment_types",
          JSON.stringify(updated)
        );

        return updated;
      });

      if (apartmentTypeRents[newType] === undefined) {
        updateApartmentTypeRent(newType, String(apartment.rent));
      }

      setApartmentTypes((current) => {
        const updated = {
          ...current,
          [apartment.number]: newType,
        };

        setBuildingStorageValue("tumouh_star_apartment_types",
          JSON.stringify(updated)
        );

        return updated;
      });

      return;
    }

    setApartmentTypes((current) => {
      const updated = {
        ...current,
        [apartment.number]: value,
      };

      setBuildingStorageValue("tumouh_star_apartment_types",
        JSON.stringify(updated)
      );

      return updated;
    });
  };

  const availableApartmentStatuses: ApartmentStatus[] = [
    "┘à╪ñ╪¼╪▒╪⌐",
    "╪┤╪º╪║╪▒╪⌐",
    "╪¬╪¡╪¬ ╪º┘ä╪╡┘è╪º┘å╪⌐",
    "┘à╪¡╪¼┘ê╪▓╪⌐",
    "┘à╪ñ╪¼╪▒╪⌐ ┘ä┘ä╪┤╪▒┘â╪⌐",
    ...customApartmentStatuses,
  ];

  const addNewApartmentStatus = (apartment?: Apartment) => {
    if (denyApartmentAdd()) return;
    if (denyAdd()) return;
    const newStatus = window.prompt("╪º┘â╪¬╪¿ ╪º╪│┘à ╪¡╪º┘ä╪⌐ ╪º┘ä╪┤┘é╪⌐ ╪º┘ä╪¼╪»┘è╪»╪⌐:")?.trim();

    if (!newStatus) {
      return;
    }

    if (availableApartmentStatuses.includes(newStatus)) {
      if (apartment) {
        updateApartmentStatus(apartment, newStatus);
      }
      return;
    }

    setCustomApartmentStatuses((current) => {
      const updated = [...current, newStatus];
      setBuildingStorageValue("tumouh_star_custom_apartment_statuses",
        JSON.stringify(updated)
      );
      return updated;
    });

    if (apartment) {
      updateApartmentStatus(apartment, newStatus);
    }
  };

  const handleApartmentStatusChange = (
    apartment: Apartment,
    value: string
  ) => {
    if (denyApartmentEdit()) return;
    if (value === "__add_new_status__") {
      addNewApartmentStatus(apartment);
      return;
    }

    updateApartmentStatus(apartment, value as ApartmentStatus);
  };

  const updateApartmentStatus = (
    apartment: Apartment,
    status: ApartmentStatus
  ) => {
    if (denyApartmentEdit()) return;
    const updatedApartment = {
      ...apartment,
      status,
    };

    setApartments((current) => {
      const updated = current.map((item) =>
        item.number === apartment.number ? updatedApartment : item
      );

      setBuildingStorageValue("tumouh_star_building_apartments",
        JSON.stringify(updated)
      );

      return updated;
    });

    setApartmentTenantInfo((current) => {
      const updated = {
        ...current,
        [apartment.number]: {
          ...getApartmentTenantInfo(apartment),
          status,
        },
      };

      setBuildingStorageValue(
        "tumouh_star_apartment_tenant_info",
        JSON.stringify(updated)
      );

      return updated;
    });

    setSelectedApartment(updatedApartment);
  };

  const openApartment = (
    apartment: Apartment
  ) => {
    if (!canViewApartments) {
      showPermissionDenied("╪╣╪░╪▒┘ï╪º╪î ╪║┘è╪▒ ┘à╪│┘à┘ê╪¡ ┘ä┘ä┘à╪│╪¬╪«╪»┘à ╪º┘ä╪¡╪º┘ä┘è ╪¿╪╣╪▒╪╢ ┘ç╪░┘ç ╪º┘ä╪╡┘ü╪¡╪⌐.");
      return;
    }
    setSelectedApartment(apartment);
    setActiveTab("╪º┘ä╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪ú╪│╪º╪│┘è╪⌐");
  };

  const closeApartment = () => {
    setSelectedApartment(null);
    setActiveTab("╪º┘ä╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪ú╪│╪º╪│┘è╪⌐");
    setIsPaymentExportMenuOpen(false);
  };

  const saveApartmentTenantField = <
    K extends keyof Pick<
      ApartmentTenantInfo,
      "tenantName" | "phone" | "identityNumber"
    >
  >(
    apartment: Apartment,
    key: K
  ) => {
    if (denyTenantEdit()) return;
    const tenantInfo = getApartmentTenantInfo(apartment);

    const updatedTenantInfo = {
      ...tenantInfo,
      [key]: tenantInfo[key],
    };

    setApartmentTenantInfo((current) => {
      const updated = {
        ...current,
        [apartment.number]: updatedTenantInfo,
      };

      setBuildingStorageValue("tumouh_star_apartment_tenant_info",
        JSON.stringify(updated)
      );

      return updated;
    });

    if (key === "tenantName") {
      setApartments((current) => {
        const updated = current.map((item) =>
          item.number === apartment.number
            ? {
                ...item,
                tenant:
                  tenantInfo.tenantName || "╪º╪│┘à ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒ ╪║┘è╪▒ ┘à╪╢╪º┘ü",
              }
            : item
        );

        setBuildingStorageValue("tumouh_star_building_apartments",
          JSON.stringify(updated)
        );

        return updated;
      });

      setSelectedApartment((current) =>
        current && current.number === apartment.number
          ? {
              ...current,
              tenant:
                tenantInfo.tenantName || "╪º╪│┘à ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒ ╪║┘è╪▒ ┘à╪╢╪º┘ü",
            }
          : current
      );
    }
  };

  const saveApartmentFloor = (apartmentNumber: string) => {
    if (denyApartmentEdit()) return;
    const extraInfo = getApartmentExtraInfo(apartmentNumber);

    setApartmentExtraInfo((current) => {
      const updated = {
        ...current,
        [apartmentNumber]: extraInfo,
      };

      setBuildingStorageValue("tumouh_star_apartment_extra_info",
        JSON.stringify(updated)
      );

      return updated;
    });
  };

  const getApartmentContractInfo = (apartmentNumber: string) => {
    return (
      (apartmentContractInfo ?? {})[apartmentNumber] ??
      createDefaultApartmentContractInfo(apartmentNumber)
    );
  };

  const updateApartmentContractField = <
    K extends keyof ApartmentContractInfo
  >(
    apartmentNumber: string,
    key: K,
    value: ApartmentContractInfo[K]
  ) => {
    if (denyContractEdit()) return;
    setApartmentContractInfo((current) => ({
      ...current,
      [apartmentNumber]: {
        ...getApartmentContractInfo(apartmentNumber),
        [key]: value,
      },
    }));
  };

  const updateApartmentContractStartDate = (
    apartmentNumber: string,
    startDate: string
  ) => {
    if (denyContractEdit()) return;
    const currentInfo = getApartmentContractInfo(apartmentNumber);
    const endDate = addContractDuration(
      startDate,
      currentInfo.durationUnit,
      currentInfo.durationValue
    );

    setApartmentContractInfo((current) => ({
      ...current,
      [apartmentNumber]: {
        ...currentInfo,
        startDate,
        endDate: endDate || currentInfo.endDate,
      },
    }));
  };

  const updateApartmentContractDuration = (
    apartmentNumber: string,
    durationUnit: "day" | "month" | "year",
    durationValue: number
  ) => {
    if (denyContractEdit()) return;
    const currentInfo = getApartmentContractInfo(apartmentNumber);
    const safeValue = Math.max(1, Number(durationValue) || 1);
    const endDate = addContractDuration(
      currentInfo.startDate,
      durationUnit,
      safeValue
    );

    setApartmentContractInfo((current) => ({
      ...current,
      [apartmentNumber]: {
        ...currentInfo,
        durationUnit,
        durationValue: safeValue,
        endDate: endDate || currentInfo.endDate,
      },
    }));
  };

  const saveApartmentContractInfo = (apartmentNumber: string) => {
    if (denyContractEdit()) return;
    const contractInfo = getApartmentContractInfo(apartmentNumber);

    setApartmentContractInfo((current) => {
      const updated = {
        ...current,
        [apartmentNumber]: contractInfo,
      };

      setBuildingStorageValue("tumouh_star_apartment_contract_info",
        JSON.stringify(updated)
      );

      return updated;
    });
  };

  const saveApartmentDetails = () => {
    if (denyApartmentEdit()) return;
    if (!selectedApartment) {
      return;
    }

    const updatedApartments = apartments.map((apartment) => {
      const tenantInfo = apartmentTenantInfo[apartment.number];

      return tenantInfo
        ? {
            ...apartment,
            tenant:
              tenantInfo.tenantName || "╪º╪│┘à ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒ ╪║┘è╪▒ ┘à╪╢╪º┘ü",
            status: tenantInfo.status,
          }
        : apartment;
    });

    setBuildingStorageValue("tumouh_star_building_apartments",
      JSON.stringify(updatedApartments)
    );

    setBuildingStorageValue("tumouh_star_apartment_types",
      JSON.stringify(apartmentTypes)
    );

    setBuildingStorageValue("tumouh_star_apartment_extra_info",
      JSON.stringify(apartmentExtraInfo)
    );

    setBuildingStorageValue("tumouh_star_apartment_tenant_info",
      JSON.stringify(apartmentTenantInfo)
    );

    setBuildingStorageValue("tumouh_star_apartment_contract_info",
      JSON.stringify(apartmentContractInfo)
    );

    setApartments(updatedApartments);
    closeApartment();
  };

  const openChargeModal = (
    mode: "charge" | "collection",
    type: string,
    apartmentNumber?: string
  ) => {
    if (denyChargeAdd(mode, type)) return;
    setChargeModalMode(mode);
    setChargeForm({
      type,
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setSelectedChargeApartments(
      apartmentNumber !== undefined ? [apartmentNumber] : []
    );
    setApartmentTypeFilter("");
    setApartmentStatusFilter("");
    setApartmentSearch("");
    setRentCollectionMonths(1);
    setRentDueMonth(new Date().toISOString().slice(0, 7));
    setRentDueMonths([]);
    setChargeDueMonth(new Date().toISOString().slice(0, 7));
    setChargeDueMonths([]);
    setCollectionDueMonth(new Date().toISOString().slice(0, 7));
    setCollectionDueMonths([]);
    setIsChargeModalOpen(true);
  };

  const toggleChargeApartment = (apartmentNumber: string) => {
    setSelectedChargeApartments((current) =>
      current.includes(apartmentNumber)
        ? current.filter((number) => number !== apartmentNumber)
        : [...current, apartmentNumber]
    );
  };

  const apartmentTypeOptions = Array.from(
    new Set([
      ...apartments.map((apartment) => getApartmentType(apartment)),
      ...customApartmentTypes,
    ])
  );

  const visibleChargeApartments = apartments.filter((apartment) => {
    const search = apartmentSearch.trim().toLowerCase();
    const apartmentType = getApartmentType(apartment);

    if (apartmentTypeFilter && apartmentType !== apartmentTypeFilter) {
      return false;
    }

    if (apartmentStatusFilter && apartment.status !== apartmentStatusFilter) {
      return false;
    }

    if (!search) {
      return true;
    }

    return (
      apartment.number.toString().includes(search) ||
      apartmentType.toLowerCase().includes(search)
    );
  });

  const toggleAllVisibleChargeApartments = () => {
    const visibleNumbers = visibleChargeApartments.map(
      (apartment) => apartment.number
    );

    const allVisibleSelected = visibleNumbers.every((number) =>
      selectedChargeApartments.includes(number)
    );

    setSelectedChargeApartments((current) =>
      allVisibleSelected
        ? current.filter((number) => !visibleNumbers.includes(number))
        : Array.from(new Set([...current, ...visibleNumbers]))
    );
  };

  const selectedRentTotal = selectedChargeApartments.reduce(
    (total, apartmentNumber) => {
      const apartment = apartments.find(
        (item) => item.number === apartmentNumber
      );

      return total + (apartment ? getApartmentRent(apartment) : 0);
    },
    0
  );

  const getContractDurationMonths = (contractInfo: ApartmentContractInfo) => {
    const value = Math.max(1, Number(contractInfo.durationValue) || 1);

    if (contractInfo.durationUnit === "year") {
      return value * 12;
    }

    if (contractInfo.durationUnit === "month") {
      return value;
    }

    return Math.max(1, Math.ceil(value / 30));
  };

  const getApartmentRentCollected = (apartmentNumber: string) => {
    return getApartmentPayments(apartmentNumber)
      .filter((payment) => payment.type?.trim() === "╪Ñ┘è╪¼╪º╪▒")
      .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  };

  const getApartmentRemainingRentMonths = (apartment: Apartment) => {
    const contractInfo = getApartmentContractInfo(apartment.number);
    const contractMonths = getContractDurationMonths(contractInfo);
    const monthlyRent = getApartmentRent(apartment);

    if (monthlyRent <= 0) {
      return 0;
    }

    const contractTotal = contractMonths * monthlyRent;
    const collectedRent = getApartmentRentCollected(apartment.number);
    const remainingValue = Math.max(contractTotal - collectedRent, 0);

    return Math.min(
      contractMonths,
      Math.max(0, Math.floor((remainingValue + 0.000001) / monthlyRent))
    );
  };

  const selectedRentChargeTotal =
    chargeModalMode === "charge" && chargeForm.type === "╪Ñ┘è╪¼╪º╪▒"
      ? selectedRentTotal * Math.max(1, rentDueMonths.length)
      : selectedRentTotal;

  const selectedRentCollectionTotal =
    chargeModalMode === "collection" && chargeForm.type === "╪Ñ┘è╪¼╪º╪▒"
      ? selectedRentTotal * Math.max(1, rentCollectionMonths)
      : selectedRentTotal;

  const selectedChargeNonRentTotal =
    chargeModalMode === "charge" && chargeForm.type !== "╪Ñ┘è╪¼╪º╪▒"
      ? selectedChargeApartments.length * (Number(chargeForm.amount) || 0) * Math.max(1, chargeDueMonths.length)
      : 0;

  const selectedCollectionNonRentTotal =
    chargeModalMode === "collection" && chargeForm.type !== "╪Ñ┘è╪¼╪º╪▒"
      ? selectedChargeApartments.length * (Number(chargeForm.amount) || 0) * Math.max(1, collectionDueMonths.length)
      : 0;

  const selectedRentCollectionMaxMonths = selectedChargeApartments.length
    ? Math.min(
        ...selectedChargeApartments.map((apartmentNumber) => {
          const apartment = apartments.find(
            (item) => item.number === apartmentNumber
          );
          return apartment ? getApartmentRemainingRentMonths(apartment) : 0;
        })
      )
    : 0;

  const getApartmentReport = () => {
    if (!apartmentReportType) {
      return {
        title: "",
        subtitle: "",
        data: [] as Apartment[],
      };
    }

    if (apartmentReportType === "total") {
      return {
        title: "╪¬┘é╪▒┘è╪▒ ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪┤┘é┘é",
        subtitle: `╪¼┘à┘è╪╣ ╪º┘ä╪┤┘é┘é ╪º┘ä┘à╪│╪¼┘ä╪⌐ ┘ü┘è ${buildingName} (${totalApartments} ╪┤┘é╪⌐)`,
        data: apartments,
      };
    }

    if (apartmentReportType === "rented") {
      return {
        title: "╪¬┘é╪▒┘è╪▒ ╪º┘ä╪┤┘é┘é ╪º┘ä┘à╪ñ╪¼╪▒╪⌐",
        subtitle: `╪º┘ä╪┤┘é┘é ╪º┘ä┘à╪ñ╪¼╪▒╪⌐ ╪│┘â┘å┘è┘ï╪º ╪ú┘ê ╪º┘ä┘à╪ñ╪¼╪▒╪⌐ ┘ä┘ä╪┤╪▒┘â╪⌐ (${rentedApartments} ╪┤┘é╪⌐)`,
        data: apartments.filter((apartment) => {
          const status = getEffectiveApartmentStatus(apartment);
          return status === "┘à╪ñ╪¼╪▒╪⌐" || status === "┘à╪ñ╪¼╪▒╪⌐ ┘ä┘ä╪┤╪▒┘â╪⌐";
        }),
      };
    }

    if (apartmentReportType === "reserved") {
      return {
        title: "╪¬┘é╪▒┘è╪▒ ╪º┘ä╪┤┘é┘é ╪º┘ä┘à╪¡╪¼┘ê╪▓╪⌐",
        subtitle: `╪º┘ä╪┤┘é┘é ╪º┘ä╪¬┘è ╪¡╪º┘ä╪¬┘ç╪º ┘à╪¡╪¼┘ê╪▓╪⌐ (${reservedApartments} ╪┤┘é╪⌐)`,
        data: apartments.filter(
          (apartment) => getEffectiveApartmentStatus(apartment) === "┘à╪¡╪¼┘ê╪▓╪⌐"
        ),
      };
    }

    if (apartmentReportType === "maintenance") {
      return {
        title: "╪¬┘é╪▒┘è╪▒ ╪º┘ä╪┤┘é┘é ╪¬╪¡╪¬ ╪º┘ä╪╡┘è╪º┘å╪⌐",
        subtitle: `╪º┘ä╪┤┘é┘é ╪º┘ä╪¬┘è ╪¡╪º┘ä╪¬┘ç╪º ╪¬╪¡╪¬ ╪º┘ä╪╡┘è╪º┘å╪⌐ (${maintenanceApartments} ╪┤┘é╪⌐)`,
        data: apartments.filter(
          (apartment) => getEffectiveApartmentStatus(apartment) === "╪¬╪¡╪¬ ╪º┘ä╪╡┘è╪º┘å╪⌐"
        ),
      };
    }

    if (apartmentReportType === "vacant") {
      return {
        title: "╪¬┘é╪▒┘è╪▒ ╪º┘ä╪┤┘é┘é ╪º┘ä┘ü╪º╪▒╪║╪⌐",
        subtitle: `╪º┘ä╪┤┘é┘é ╪º┘ä┘ü╪º╪▒╪║╪⌐ (${vacantApartments} ╪┤┘é╪⌐)`,
        data: apartments.filter(
          (apartment) => getEffectiveApartmentStatus(apartment) === "╪┤╪º╪║╪▒╪⌐"
        ),
      };
    }

    return {
      title: "╪¬┘é╪▒┘è╪▒ ┘å╪│╪¿╪⌐ ╪º┘ä╪Ñ╪┤╪║╪º┘ä",
      subtitle: `┘å╪│╪¿╪⌐ ╪º┘ä╪Ñ╪┤╪║╪º┘ä ╪º┘ä╪¡╪º┘ä┘è╪⌐ ${occupancyRate}% ΓÇö ${rentedApartments} ┘à╪ñ╪¼╪▒╪⌐ ┘à┘å ╪ú╪╡┘ä ${totalApartments} ╪┤┘é╪⌐`,
      data: apartments,
    };
  };

  const openApartmentReport = (
    type:
      | "total"
      | "rented"
      | "reserved"
      | "maintenance"
      | "vacant"
      | "occupancy"
  ) => {
    setApartmentReportType(type);
  };

  const closeApartmentReport = () => {
    setApartmentReportType(null);
  };

  const getBuildingChargesForPeriod = (): BuildingCharge[] => {
    try {
      const saved = getBuildingStorageValue("tumouh_star_building_charges");

      if (!saved) {
        return [];
      }

      const charges = JSON.parse(saved) as BuildingCharge[];

      return charges
        .filter((charge) => {
          const chargePeriod = charge.dueMonth
            ? `${charge.dueMonth}-01`
            : charge.date;

          if (!chargePeriod) {
            return false;
          }

          return chargePeriod >= fromDate && chargePeriod <= toDate;
        })
        .sort((a, b) => {
          const aPeriod = a.dueMonth ? `${a.dueMonth}-01` : a.date;
          const bPeriod = b.dueMonth ? `${b.dueMonth}-01` : b.date;

          if (aPeriod !== bPeriod) {
            return bPeriod.localeCompare(aPeriod);
          }

          return Number(a.apartmentNumber ?? 0) - Number(b.apartmentNumber ?? 0);
        });
    } catch {
      return [];
    }
  };

  const getCurrentRentDueCharges = (): BuildingCharge[] => {
    try {
      const saved = getBuildingStorageValue("tumouh_star_building_charges");
      if (!saved) return [];

      const charges = JSON.parse(saved) as BuildingCharge[];
      const currentMonth = getTodayLocalDateString().slice(0, 7);

      return charges
        .filter((charge) => {
          if (charge.type?.trim() !== "╪Ñ┘è╪¼╪º╪▒" || !charge.dueMonth) {
            return false;
          }

          // ╪º┘ä┘à╪│╪¬╪¡┘é ╪º┘ä╪ó┘å = ┘â┘ä ╪º┘ä╪┤┘ç┘ê╪▒ ╪º┘ä╪│╪º╪¿┘é╪⌐ ╪║┘è╪▒ ╪º┘ä┘à╪¡╪╡┘ä╪⌐ + ╪º┘ä╪┤┘ç╪▒ ╪º┘ä╪¡╪º┘ä┘è╪î
          // ┘ê┘ä╪º ┘å╪»╪«┘ä ╪ú┘è ╪┤┘ç╪▒ ┘à╪│╪¬┘é╪¿┘ä┘è.
          return charge.dueMonth <= currentMonth;
        })
        .sort((a, b) => {
          const aPeriod = a.dueMonth || a.date;
          const bPeriod = b.dueMonth || b.date;
          return aPeriod.localeCompare(bPeriod);
        });
    } catch {
      return [];
    }
  };

  const getCurrentRentCollectionsTotal = () => {
    try {
      const saved = getBuildingStorageValue("tumouh_star_building_collections");
      if (!saved) return 0;

      const collections = JSON.parse(saved) as BuildingCharge[];
      return collections
        .filter((collection) => collection.type?.trim() === "╪Ñ┘è╪¼╪º╪▒")
        .reduce((sum, collection) => sum + (Number(collection.amount) || 0), 0);
    } catch {
      return 0;
    }
  };

  const getMonthlyRentDueTotal = () => {
    const dueTotal = getCurrentRentDueCharges().reduce(
      (sum, charge) => sum + (Number(charge.amount) || 0),
      0
    );

    return Math.max(dueTotal - getCurrentRentCollectionsTotal(), 0);
  };

  const getMonthlyDueTotal = () => {
    // ┘ç╪░┘ç ╪º┘ä╪«╪º┘å╪⌐ ╪«╪º╪╡╪⌐ ╪¿╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ╪º┘ä╪ú╪«╪▒┘ë ┘ü┘é╪╖╪î ┘ê╪º┘ä╪Ñ┘è╪¼╪º╪▒╪º╪¬ ┘ä┘ç╪º ╪«╪º┘å╪⌐ ┘à╪│╪¬┘é┘ä╪⌐.
    const charges = getBuildingChargesForPeriod().filter(
      (charge) => charge.type?.trim() !== "╪Ñ┘è╪¼╪º╪▒"
    );

    return charges.reduce(
      (sum, charge) => sum + (Number(charge.amount) || 0),
      0
    );
  };

  const getMonthlyRentRows = () => {
    const charges = getCurrentRentDueCharges();

    return charges.map((charge) => {
      const apartment = apartments.find(
        (item) => String(item.number) === String(charge.apartmentNumber)
      );
      const tenantInfo = apartment ? getApartmentTenantInfo(apartment) : null;

      return {
        apartmentNumber: charge.apartmentNumber,
        tenant:
          tenantInfo?.tenantName ||
          apartment?.tenant ||
          "╪║┘è╪▒ ┘à╪╢╪º┘ü",
        date: charge.dueMonth ? `${charge.dueMonth}-01` : charge.date,
        type: "╪Ñ┘è╪¼╪º╪▒",
        amount: Number(charge.amount) || 0,
        notes: `╪Ñ┘è╪¼╪º╪▒ ┘à╪│╪¬╪¡┘é ╪╣┘å ╪┤┘ç╪▒ ${
          charge.dueMonth
            ? new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "long" }).format(
                new Date(`${charge.dueMonth}-01T00:00:00`)
              )
            : "╪║┘è╪▒ ┘à╪¡╪»╪»"
        }`,
      };
    });
  };

  const getMonthlyReportData = () => {
    const charges = getBuildingChargesForPeriod();

    if (monthlyReportType === "rent") {
      const rows = getMonthlyRentRows();
      return {
        title: "╪¬┘é╪▒┘è╪▒ ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪Ñ┘è╪¼╪º╪▒╪º╪¬ ╪º┘ä┘à╪│╪¬╪¡┘é╪⌐ ┘ä┘ä╪┤┘ç╪▒",
        subtitle: "╪¬┘ü╪º╪╡┘è┘ä ╪º┘ä╪Ñ┘è╪¼╪º╪▒╪º╪¬ ╪º┘ä┘à╪│╪¬╪¡┘é╪⌐ ╪¡╪¬┘ë ╪º┘ä╪┤┘ç╪▒ ╪º┘ä╪¡╪º┘ä┘è╪î ┘à╪╣ ╪º╪│╪¬╪¿╪╣╪º╪» ╪º┘ä╪┤┘ç┘ê╪▒ ╪º┘ä┘à╪│╪¬┘é╪¿┘ä┘è╪⌐ ┘ê╪º┘ä┘à╪¡╪╡┘ä ┘à┘å┘ç╪º",
        rows,
        total: rows.reduce((sum, row) => sum + row.amount, 0),
      };
    }

    if (monthlyReportType === "electricity") {
      const rows = charges
        .filter((charge) => charge.type?.trim() === "┘ü╪º╪¬┘ê╪▒╪⌐ ┘â┘ç╪▒╪¿╪º╪í")
        .map((charge) => {
          const apartment = apartments.find(
            (item) =>
              String(item.number) === String(charge.apartmentNumber)
          );
          const tenantInfo = apartment
            ? getApartmentTenantInfo(apartment)
            : null;

          return {
            apartmentNumber: charge.apartmentNumber,
            tenant:
              tenantInfo?.tenantName ||
              apartment?.tenant ||
              "╪║┘è╪▒ ┘à╪╢╪º┘ü",
            date: charge.date,
            type: charge.type || "┘ü╪º╪¬┘ê╪▒╪⌐ ┘â┘ç╪▒╪¿╪º╪í",
            amount: Number(charge.amount) || 0,
            notes: charge.notes || "┘ä╪º ╪¬┘ê╪¼╪» ╪¬┘ü╪º╪╡┘è┘ä",
          };
        });

      return {
        title: "╪¬┘é╪▒┘è╪▒ ╪Ñ╪¼┘à╪º┘ä┘è ┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä┘â┘ç╪▒╪¿╪º╪í ┘ä┘ä╪┤┘ç╪▒",
        subtitle: "╪¬┘ü╪º╪╡┘è┘ä ┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä┘â┘ç╪▒╪¿╪º╪í ╪º┘ä┘à╪│╪¬╪¡┘é╪⌐ ┘ê╪º┘ä┘à╪»╪«┘ä╪⌐ ╪«┘ä╪º┘ä ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐",
        rows,
        total: rows.reduce((sum, row) => sum + row.amount, 0),
      };
    }

    if (monthlyReportType === "water") {
      const rows = charges
        .filter((charge) => charge.type?.trim() === "┘ü╪º╪¬┘ê╪▒╪⌐ ┘à┘è╪º┘ç")
        .map((charge) => {
          const apartment = apartments.find(
            (item) =>
              String(item.number) === String(charge.apartmentNumber)
          );
          const tenantInfo = apartment
            ? getApartmentTenantInfo(apartment)
            : null;

          return {
            apartmentNumber: charge.apartmentNumber,
            tenant:
              tenantInfo?.tenantName ||
              apartment?.tenant ||
              "╪║┘è╪▒ ┘à╪╢╪º┘ü",
            date: charge.date,
            type: charge.type || "┘ü╪º╪¬┘ê╪▒╪⌐ ┘à┘è╪º┘ç",
            amount: Number(charge.amount) || 0,
            notes: charge.notes || "┘ä╪º ╪¬┘ê╪¼╪» ╪¬┘ü╪º╪╡┘è┘ä",
          };
        });

      return {
        title: "╪¬┘é╪▒┘è╪▒ ╪Ñ╪¼┘à╪º┘ä┘è ┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä┘à┘è╪º┘ç ┘ä┘ä╪┤┘ç╪▒",
        subtitle: "╪¬┘ü╪º╪╡┘è┘ä ┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä┘à┘è╪º┘ç ╪º┘ä┘à╪│╪¬╪¡┘é╪⌐ ┘ê╪º┘ä┘à╪»╪«┘ä╪⌐ ╪«┘ä╪º┘ä ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐",
        rows,
        total: rows.reduce((sum, row) => sum + row.amount, 0),
      };
    }

    const rows = charges.map((charge) => {
      const apartment = apartments.find(
        (item) =>
          String(item.number) === String(charge.apartmentNumber)
      );
      const tenantInfo = apartment
        ? getApartmentTenantInfo(apartment)
        : null;

      return {
        apartmentNumber: charge.apartmentNumber,
        tenant:
          tenantInfo?.tenantName ||
          apartment?.tenant ||
          "╪║┘è╪▒ ┘à╪╢╪º┘ü",
        date: charge.date,
        type: charge.type || "╪║┘è╪▒ ┘à╪¡╪»╪»",
        amount: Number(charge.amount) || 0,
        notes: charge.notes || "┘ä╪º ╪¬┘ê╪¼╪» ╪¬┘ü╪º╪╡┘è┘ä",
      };
    });

    return {
      title: "╪¬┘é╪▒┘è╪▒ ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ┘ä┘ä╪┤┘ç╪▒",
      subtitle: "╪¬┘ü╪º╪╡┘è┘ä ╪¼┘à┘è╪╣ ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ╪º┘ä┘à╪│╪¼┘ä╪⌐ ╪╣┘ä┘ë ╪º┘ä╪┤┘é┘é ╪«┘ä╪º┘ä ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐",
      rows,
      total: rows.reduce((sum, row) => sum + row.amount, 0),
    };
  };

  const getBuildingCollectionsForPeriod = (): BuildingCharge[] => {
    try {
      const saved = getBuildingStorageValue("tumouh_star_building_collections");

      if (!saved) {
        return [];
      }

      const parsed = JSON.parse(saved);
      const collections = Array.isArray(parsed) ? (parsed as BuildingCharge[]) : [];

      return collections
        .filter((collection) => {
          const collectionPeriod = collection.dueMonth
            ? `${collection.dueMonth}-01`
            : collection.date;

          if (!collectionPeriod) {
            return false;
          }

          return collectionPeriod >= fromDate && collectionPeriod <= toDate;
        })
        .sort((a, b) => {
          const aPeriod = a.dueMonth ? `${a.dueMonth}-01` : a.date;
          const bPeriod = b.dueMonth ? `${b.dueMonth}-01` : b.date;

          if (aPeriod !== bPeriod) {
            return bPeriod.localeCompare(aPeriod);
          }

          return (
            Number(a.apartmentNumber ?? 0) -
            Number(b.apartmentNumber ?? 0)
          );
        });
    } catch {
      return [];
    }
  };

  const getMonthlyCollectionReportData = () => {
    const charges = getBuildingChargesForPeriod();
    const collections = getBuildingCollectionsForPeriod();

    const monthlyRentRows = getMonthlyRentRows();

    const getTenantForApartment = (apartmentNumber?: string) => {
      const apartment = apartments.find(
        (item) => String(item.number) === String(apartmentNumber)
      );

      if (!apartment) {
        return "╪║┘è╪▒ ┘à╪╢╪º┘ü";
      }

      const tenantInfo = getApartmentTenantInfo(apartment);

      return tenantInfo.tenantName || apartment.tenant || "╪║┘è╪▒ ┘à╪╢╪º┘ü";
    };

    const getDueRows = (
      type: "total" | "rent" | "electricity" | "water"
    ) => {
      if (type === "rent") {
        return monthlyRentRows.map((row) => ({
          apartmentNumber: row.apartmentNumber,
          tenant: row.tenant,
          date: row.date,
          type: "╪Ñ┘è╪¼╪º╪▒",
          transactionType: "┘à╪│╪¬╪¡┘é",
          amount: row.amount,
          notes: row.notes,
        }));
      }

      const filteredCharges =
        type === "electricity"
          ? charges.filter((charge) => charge.type?.trim() === "┘ü╪º╪¬┘ê╪▒╪⌐ ┘â┘ç╪▒╪¿╪º╪í")
          : type === "water"
          ? charges.filter((charge) => charge.type?.trim() === "┘ü╪º╪¬┘ê╪▒╪⌐ ┘à┘è╪º┘ç")
          : charges.filter((charge) => charge.type?.trim() !== "╪Ñ┘è╪¼╪º╪▒");

      return filteredCharges.map((charge) => ({
        apartmentNumber: charge.apartmentNumber,
        tenant: getTenantForApartment(charge.apartmentNumber),
        date: charge.date,
        type: charge.type || "╪║┘è╪▒ ┘à╪¡╪»╪»",
        transactionType: "┘à╪│╪¬╪¡┘é",
        amount: Number(charge.amount) || 0,
        notes: charge.notes || "┘ä╪º ╪¬┘ê╪¼╪» ╪¬┘ü╪º╪╡┘è┘ä",
      }));
    };

    const getCollectionRows = (
      type: "total" | "rent" | "electricity" | "water"
    ) => {
      const filteredCollections =
        type === "rent"
          ? collections.filter((collection) => collection.type?.trim() === "╪Ñ┘è╪¼╪º╪▒")
          : type === "electricity"
          ? collections.filter(
              (collection) => collection.type?.trim() === "┘ü╪º╪¬┘ê╪▒╪⌐ ┘â┘ç╪▒╪¿╪º╪í"
            )
          : type === "water"
          ? collections.filter(
              (collection) => collection.type?.trim() === "┘ü╪º╪¬┘ê╪▒╪⌐ ┘à┘è╪º┘ç"
            )
          : collections.filter(
              // ╪¬┘é╪▒┘è╪▒ ╪¬╪¡╪╡┘è┘ä╪º╪¬ ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ = ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ╪º┘ä╪ú╪«╪▒┘ë ┘ü┘é╪╖╪î ╪¿╪»┘ê┘å ╪º┘ä╪Ñ┘è╪¼╪º╪▒╪º╪¬.
              (collection) => collection.type?.trim() !== "╪Ñ┘è╪¼╪º╪▒"
            );

      return filteredCollections.map((collection) => ({
        apartmentNumber: collection.apartmentNumber,
        tenant: getTenantForApartment(collection.apartmentNumber),
        date: collection.date,
        type: collection.type || "╪║┘è╪▒ ┘à╪¡╪»╪»",
        transactionType: "╪¬╪¡╪╡┘è┘ä",
        amount: Number(collection.amount) || 0,
        notes: collection.notes || "┘ä╪º ╪¬┘ê╪¼╪» ╪¬┘ü╪º╪╡┘è┘ä",
      }));
    };

    const dueRows = getDueRows(monthlyCollectionReportType);
    const collectionRows = getCollectionRows(monthlyCollectionReportType);

    const dueTotal = dueRows.reduce((sum, row) => sum + row.amount, 0);
    const collectedTotal = collectionRows.reduce(
      (sum, row) => sum + row.amount,
      0
    );

    return {
      title:
        monthlyCollectionReportType === "total"
          ? "╪¬┘é╪▒┘è╪▒ ╪Ñ╪¼┘à╪º┘ä┘è ╪¬╪¡╪╡┘è┘ä╪º╪¬ ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ┘ä┘ä╪┤┘ç╪▒"
          : monthlyCollectionReportType === "rent"
          ? "╪¬┘é╪▒┘è╪▒ ╪Ñ╪¼┘à╪º┘ä┘è ╪¬╪¡╪╡┘è┘ä╪º╪¬ ╪º┘ä╪Ñ┘è╪¼╪º╪▒╪º╪¬ ┘ä┘ä╪┤┘ç╪▒"
          : monthlyCollectionReportType === "electricity"
          ? "╪¬┘é╪▒┘è╪▒ ╪¬╪¡╪╡┘è┘ä╪º╪¬ ┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä┘â┘ç╪▒╪¿╪º╪í ┘ê╪º┘ä┘à╪¬╪¿┘é┘è"
          : "╪¬┘é╪▒┘è╪▒ ╪¬╪¡╪╡┘è┘ä╪º╪¬ ┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä┘à┘è╪º┘ç ┘ê╪º┘ä┘à╪¬╪¿┘é┘è",
      subtitle:
        monthlyCollectionReportType === "total"
          ? "╪¬┘ü╪º╪╡┘è┘ä ╪¼┘à┘è╪╣ ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ┘ê╪º┘ä╪¬╪¡╪╡┘è┘ä╪º╪¬ ╪º┘ä┘à╪│╪¼┘ä╪⌐ ╪«┘ä╪º┘ä ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐"
          : monthlyCollectionReportType === "rent"
          ? "╪¬┘ü╪º╪╡┘è┘ä ╪Ñ┘è╪¼╪º╪▒╪º╪¬ ╪º┘ä╪┤┘é┘é ┘ê╪º┘ä╪¬╪¡╪╡┘è┘ä╪º╪¬ ╪º┘ä┘à╪│╪¼┘ä╪⌐ ╪«┘ä╪º┘ä ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐"
          : monthlyCollectionReportType === "electricity"
          ? "╪¬┘ü╪º╪╡┘è┘ä ┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä┘â┘ç╪▒╪¿╪º╪í ┘ê╪º┘ä╪¬╪¡╪╡┘è┘ä╪º╪¬ ╪º┘ä┘à╪│╪¼┘ä╪⌐ ╪«┘ä╪º┘ä ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐"
          : "╪¬┘ü╪º╪╡┘è┘ä ┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä┘à┘è╪º┘ç ┘ê╪º┘ä╪¬╪¡╪╡┘è┘ä╪º╪¬ ╪º┘ä┘à╪│╪¼┘ä╪⌐ ╪«┘ä╪º┘ä ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐",
      rows: [...dueRows, ...collectionRows].sort((a, b) => {
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }

        return (
          Number(a.apartmentNumber ?? 0) -
          Number(b.apartmentNumber ?? 0)
        );
      }),
      dueTotal,
      collectedTotal,
      remainingTotal: Math.max(dueTotal - collectedTotal, 0),
    };
  };

  const getMonthlyCollectionReportHtml = () => {
    const report = getMonthlyCollectionReportData();

    const rows = report.rows.length
      ? report.rows
          .map(
            (row, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${row.apartmentNumber ?? "╪║┘è╪▒ ┘à╪¡╪»╪»"}</td>
                <td>${escapeReportHtml(row.tenant)}</td>
                <td>${escapeReportHtml(formatContractDate(row.date))}</td>
                <td>${escapeReportHtml(row.type)}</td>
                <td>${escapeReportHtml(row.transactionType)}</td>
                <td>${row.amount.toLocaleString("en-US")} ╪▒┘è╪º┘ä</td>
                <td>${escapeReportHtml(row.notes)}</td>
              </tr>
            `
          )
          .join("")
      : `
          <tr>
            <td colspan="8">┘ä╪º ╪¬┘ê╪¼╪» ╪¿┘è╪º┘å╪º╪¬ ┘à╪│╪¼┘ä╪⌐ ╪«┘ä╪º┘ä ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐.</td>
          </tr>
        `;

    return `
      <div class="report-header">
        <div class="report-brand">TUMOUH STAR</div>
        <h1>${escapeReportHtml(report.title)}</h1>
        <div class="report-subtitle">
          ${escapeReportHtml(report.subtitle)}
        </div>
        <div class="report-period">
          ┘à┘å ${escapeReportHtml(formatContractDate(fromDate))}
          ╪Ñ┘ä┘ë ${escapeReportHtml(formatContractDate(toDate))}
        </div>
      </div>

      <div class="tenant-info">
        <div class="info-box">
          <span>╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪│╪¬╪¡┘é</span>
          <strong>${report.dueTotal.toLocaleString("en-US")} ╪▒┘è╪º┘ä</strong>
        </div>
        <div class="info-box">
          <span>╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪¡╪╡┘ä</span>
          <strong>${report.collectedTotal.toLocaleString("en-US")} ╪▒┘è╪º┘ä</strong>
        </div>
        <div class="info-box">
          <span>╪º┘ä┘à╪¬╪¿┘é┘è</span>
          <strong>${report.remainingTotal.toLocaleString("en-US")} ╪▒┘è╪º┘ä</strong>
        </div>
        <div class="info-box">
          <span>╪╣╪»╪» ╪º┘ä╪╣┘à┘ä┘è╪º╪¬</span>
          <strong>${report.rows.length}</strong>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>╪▒┘é┘à ╪º┘ä╪┤┘é╪⌐</th>
            <th>╪º┘ä┘à╪│╪¬╪ú╪¼╪▒ / ╪º┘ä╪¼┘ç╪⌐</th>
            <th>╪º┘ä╪¬╪º╪▒┘è╪«</th>
            <th>┘å┘ê╪╣ ╪º┘ä┘à╪│╪¬╪¡┘é</th>
            <th>┘å┘ê╪╣ ╪º┘ä╪╣┘à┘ä┘è╪⌐</th>
            <th>╪º┘ä┘à╪¿┘ä╪║</th>
            <th>╪¬┘ü╪º╪╡┘è┘ä / ┘à┘ä╪º╪¡╪╕╪º╪¬</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="report-footer">
        ╪¬╪º╪▒┘è╪« ╪Ñ╪╡╪»╪º╪▒ ╪º┘ä╪¬┘é╪▒┘è╪▒: ${new Date().toLocaleDateString("ar-SA")}
      </div>
    `;
  };

  const getMonthlyCollectionExportDocument = () => {
    return `
      <!doctype html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>╪¬┘é╪▒┘è╪▒ ╪º┘ä╪¬╪¡╪╡┘è┘ä╪º╪¬</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 28px;
              font-family: Arial, Tahoma, sans-serif;
              color: #111827;
              direction: rtl;
              background: #ffffff;
            }
            .report-header {
              text-align: center;
              margin-bottom: 22px;
            }
            .report-brand {
              font-size: 22px;
              font-weight: 900;
              letter-spacing: 2px;
              margin-bottom: 8px;
            }
            h1 {
              margin: 0;
              font-size: 28px;
            }
            .report-subtitle {
              margin-top: 7px;
              color: #6b7280;
              font-size: 14px;
            }
            .report-period {
              margin-top: 10px;
              font-size: 14px;
              font-weight: 800;
              color: #374151;
            }
            .tenant-info {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin-bottom: 16px;
            }
            .info-box {
              border: 1px solid #d1d5db;
              border-radius: 10px;
              padding: 11px;
              text-align: center;
              background: #f9fafb;
            }
            .info-box span {
              display: block;
              color: #6b7280;
              font-size: 12px;
              margin-bottom: 5px;
            }
            .info-box strong {
              display: block;
              font-size: 17px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #9ca3af;
              padding: 9px 7px;
              text-align: center;
              font-size: 12px;
              vertical-align: middle;
            }
            th {
              background: #e5e7eb;
              font-weight: 900;
            }
            .report-footer {
              margin-top: 18px;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
            @media print {
              body { padding: 10mm; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${getMonthlyCollectionReportHtml()}
        </body>
      </html>
    `;
  };

  const printMonthlyCollectionReport = () => {
    const report = getMonthlyCollectionReportData();

    if (!report.rows.length) {
      window.alert("┘ä╪º ╪¬┘ê╪¼╪» ╪¿┘è╪º┘å╪º╪¬ ╪¬╪¡╪╡┘è┘ä ╪ú┘ê ┘à╪│╪¬╪¡┘é╪º╪¬ ╪«┘ä╪º┘ä ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐.");
      return;
    }

    const printWindow = window.open(
      "",
      "_blank",
      "width=1200,height=850"
    );

    if (!printWindow) {
      window.alert(
        "╪¬╪╣╪░╪▒ ┘ü╪¬╪¡ ┘å╪º┘ü╪░╪⌐ ╪º┘ä╪¬┘é╪▒┘è╪▒. ╪º╪│┘à╪¡ ╪¿╪º┘ä┘å┘ê╪º┘ü╪░ ╪º┘ä┘à┘å╪¿╪½┘é╪⌐ ╪½┘à ╪¡╪º┘ê┘ä ┘à╪▒╪⌐ ╪ú╪«╪▒┘ë."
      );
      return;
    }

    printWindow.document.write(getMonthlyCollectionExportDocument());
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const exportMonthlyCollectionPdf = () => {
    printMonthlyCollectionReport();
  };

  const exportMonthlyCollectionExcel = () => {
    const report = getMonthlyCollectionReportData();

    if (!report.rows.length) {
      window.alert("┘ä╪º ╪¬┘ê╪¼╪» ╪¿┘è╪º┘å╪º╪¬ ╪¬╪¡╪╡┘è┘ä ╪ú┘ê ┘à╪│╪¬╪¡┘é╪º╪¬ ╪«┘ä╪º┘ä ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐ ┘ä╪¬╪╡╪»┘è╪▒┘ç╪º.");
      return;
    }

    const rows = report.rows
      .map(
        (row, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${row.apartmentNumber ?? "╪║┘è╪▒ ┘à╪¡╪»╪»"}</td>
            <td>${escapeReportHtml(row.tenant)}</td>
            <td>${escapeReportHtml(formatContractDate(row.date))}</td>
            <td>${escapeReportHtml(row.type)}</td>
            <td>${escapeReportHtml(row.transactionType)}</td>
            <td>${row.amount.toLocaleString("en-US")}</td>
            <td>${escapeReportHtml(row.notes)}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <html dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, Tahoma, sans-serif; direction: rtl; }
            h1, p { text-align: center; }
            .summary {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            .summary td {
              border: 1px solid #999;
              padding: 8px;
              text-align: center;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th, td {
              border: 1px solid #999;
              padding: 8px;
              text-align: center;
            }
            th { background: #e9ecef; }
          </style>
        </head>
        <body>
          <h1>${escapeReportHtml(report.title)}</h1>
          <p>Tumouh Star</p>
          <p>
            ╪º┘ä┘ü╪¬╪▒╪⌐ ┘à┘å ${escapeReportHtml(formatContractDate(fromDate))}
            ╪Ñ┘ä┘ë ${escapeReportHtml(formatContractDate(toDate))}
          </p>

          <table class="summary">
            <tr>
              <td><strong>╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪│╪¬╪¡┘é</strong><br />${report.dueTotal.toLocaleString("en-US")} ╪▒┘è╪º┘ä</td>
              <td><strong>╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪¡╪╡┘ä</strong><br />${report.collectedTotal.toLocaleString("en-US")} ╪▒┘è╪º┘ä</td>
              <td><strong>╪º┘ä┘à╪¬╪¿┘é┘è</strong><br />${report.remainingTotal.toLocaleString("en-US")} ╪▒┘è╪º┘ä</td>
              <td><strong>╪╣╪»╪» ╪º┘ä╪╣┘à┘ä┘è╪º╪¬</strong><br />${report.rows.length}</td>
            </tr>
          </table>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>╪▒┘é┘à ╪º┘ä╪┤┘é╪⌐</th>
                <th>╪º┘ä┘à╪│╪¬╪ú╪¼╪▒ / ╪º┘ä╪¼┘ç╪⌐</th>
                <th>╪º┘ä╪¬╪º╪▒┘è╪«</th>
                <th>┘å┘ê╪╣ ╪º┘ä┘à╪│╪¬╪¡┘é</th>
                <th>┘å┘ê╪╣ ╪º┘ä╪╣┘à┘ä┘è╪⌐</th>
                <th>╪º┘ä┘à╪¿┘ä╪║</th>
                <th>╪¬┘ü╪º╪╡┘è┘ä / ┘à┘ä╪º╪¡╪╕╪º╪¬</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.title.replace(/\s+/g, "_")}_${fromDate}_${toDate}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getMonthlyDueReportHtml = () => {
    const report = getMonthlyReportData();

    const rows = report.rows.length
      ? report.rows
          .map(
            (row, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${row.apartmentNumber ?? "╪║┘è╪▒ ┘à╪¡╪»╪»"}</td>
                <td>${escapeReportHtml(row.tenant)}</td>
                <td>${escapeReportHtml(formatContractDate(row.date))}</td>
                <td>${escapeReportHtml(row.type)}</td>
                <td>${row.amount.toLocaleString("en-US")} ╪▒┘è╪º┘ä</td>
                <td>${escapeReportHtml(row.notes)}</td>
              </tr>
            `
          )
          .join("")
      : `
          <tr>
            <td colspan="7">┘ä╪º ╪¬┘ê╪¼╪» ╪¿┘è╪º┘å╪º╪¬ ┘à╪│╪¼┘ä╪⌐ ╪«┘ä╪º┘ä ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐.</td>
          </tr>
        `;

    return `
      <div class="report-header">
        <div class="report-brand">TUMOUH STAR</div>
        <h1>${escapeReportHtml(report.title)}</h1>
        <div class="report-subtitle">
          ${escapeReportHtml(report.subtitle)}
        </div>
        <div class="report-period">
          ┘à┘å ${escapeReportHtml(formatContractDate(fromDate))}
          ╪Ñ┘ä┘ë ${escapeReportHtml(formatContractDate(toDate))}
        </div>
      </div>

      <div class="summary">
        <div class="summary-box">
          <span>╪╣╪»╪» ╪º┘ä╪╣┘à┘ä┘è╪º╪¬</span>
          <strong>${report.rows.length}</strong>
        </div>
        <div class="summary-box total">
          <span>╪º┘ä╪Ñ╪¼┘à╪º┘ä┘è</span>
          <strong>${report.total.toLocaleString("en-US")} ╪▒┘è╪º┘ä</strong>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>╪▒┘é┘à ╪º┘ä╪┤┘é╪⌐</th>
            <th>╪º┘ä┘à╪│╪¬╪ú╪¼╪▒ / ╪º┘ä╪¼┘ç╪⌐</th>
            <th>╪º┘ä╪¬╪º╪▒┘è╪«</th>
            <th>┘å┘ê╪╣ ╪º┘ä┘à╪│╪¬╪¡┘é</th>
            <th>╪º┘ä┘à╪¿┘ä╪║</th>
            <th>╪¬┘ü╪º╪╡┘è┘ä / ┘à┘ä╪º╪¡╪╕╪º╪¬</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="report-footer">
        ╪¬╪º╪▒┘è╪« ╪Ñ╪╡╪»╪º╪▒ ╪º┘ä╪¬┘é╪▒┘è╪▒: ${new Date().toLocaleDateString("ar-SA")}
      </div>
    `;
  };

  const getMonthlyDueExportDocument = () => {
    const report = getMonthlyReportData();

    return `
      <!doctype html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>${escapeReportHtml(report.title)}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 28px;
              font-family: Arial, Tahoma, sans-serif;
              color: #111827;
              direction: rtl;
              background: #ffffff;
            }
            .report-header {
              text-align: center;
              margin-bottom: 22px;
            }
            .report-brand {
              font-size: 22px;
              font-weight: 900;
              letter-spacing: 2px;
              margin-bottom: 8px;
            }
            h1 {
              margin: 0;
              font-size: 28px;
            }
            .report-subtitle {
              margin-top: 7px;
              color: #6b7280;
              font-size: 14px;
            }
            .report-period {
              margin-top: 10px;
              font-size: 14px;
              font-weight: 800;
              color: #374151;
            }
            .summary {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 16px;
            }
            .summary-box {
              border: 1px solid #d1d5db;
              border-radius: 10px;
              padding: 12px;
              text-align: center;
              background: #f9fafb;
            }
            .summary-box span {
              display: block;
              color: #6b7280;
              font-size: 12px;
              margin-bottom: 5px;
            }
            .summary-box strong {
              display: block;
              font-size: 20px;
            }
            .summary-box.total strong {
              font-size: 24px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #9ca3af;
              padding: 9px 7px;
              text-align: center;
              font-size: 12px;
              vertical-align: middle;
            }
            th {
              background: #e5e7eb;
              font-weight: 900;
            }
            .report-footer {
              margin-top: 18px;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
            @media print {
              body { padding: 10mm; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${getMonthlyDueReportHtml()}
        </body>
      </html>
    `;
  };

  const printMonthlyDueReport = () => {
    const report = getMonthlyReportData();

    if (!report.rows.length) {
      window.alert("┘ä╪º ╪¬┘ê╪¼╪» ╪¿┘è╪º┘å╪º╪¬ ┘à╪│╪¼┘ä╪⌐ ╪«┘ä╪º┘ä ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐ ┘ä┘ä╪╖╪¿╪º╪╣╪⌐ ╪ú┘ê ╪º┘ä╪¬╪╡╪»┘è╪▒.");
      return;
    }

    const printWindow = window.open(
      "",
      "_blank",
      "width=1200,height=850"
    );

    if (!printWindow) {
      window.alert(
        "╪¬╪╣╪░╪▒ ┘ü╪¬╪¡ ┘å╪º┘ü╪░╪⌐ ╪º┘ä╪¬┘é╪▒┘è╪▒. ╪º╪│┘à╪¡ ╪¿╪º┘ä┘å┘ê╪º┘ü╪░ ╪º┘ä┘à┘å╪¿╪½┘é╪⌐ ╪½┘à ╪¡╪º┘ê┘ä ┘à╪▒╪⌐ ╪ú╪«╪▒┘ë."
      );
      return;
    }

    printWindow.document.write(getMonthlyDueExportDocument());
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const exportMonthlyDuePdf = () => {
    printMonthlyDueReport();
  };

  const exportMonthlyDueExcel = () => {
    const report = getMonthlyReportData();

    if (!report.rows.length) {
      window.alert("┘ä╪º ╪¬┘ê╪¼╪» ╪¿┘è╪º┘å╪º╪¬ ┘à╪│╪¼┘ä╪⌐ ╪«┘ä╪º┘ä ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐ ┘ä╪¬╪╡╪»┘è╪▒┘ç╪º.");
      return;
    }

    const rows = report.rows
      .map(
        (row, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${row.apartmentNumber ?? "╪║┘è╪▒ ┘à╪¡╪»╪»"}</td>
            <td>${escapeReportHtml(row.tenant)}</td>
            <td>${escapeReportHtml(formatContractDate(row.date))}</td>
            <td>${escapeReportHtml(row.type)}</td>
            <td>${row.amount.toLocaleString("en-US")}</td>
            <td>${escapeReportHtml(row.notes)}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <html dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, Tahoma, sans-serif; direction: rtl; }
            h1, p { text-align: center; }
            .info {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            .info td {
              border: 1px solid #999;
              padding: 8px;
              text-align: center;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th, td {
              border: 1px solid #999;
              padding: 8px;
              text-align: center;
            }
            th { background: #e9ecef; }
          </style>
        </head>
        <body>
          <h1>${escapeReportHtml(report.title)}</h1>
          <p>Tumouh Star</p>
          <p>
            ╪º┘ä┘ü╪¬╪▒╪⌐ ┘à┘å ${escapeReportHtml(
              formatContractDate(fromDate)
            )} ╪Ñ┘ä┘ë ${escapeReportHtml(formatContractDate(toDate))}
          </p>

          <table class="info">
            <tr>
              <td><strong>╪╣╪»╪» ╪º┘ä╪╣┘à┘ä┘è╪º╪¬</strong><br />${
                report.rows.length
              }</td>
              <td><strong>╪º┘ä╪Ñ╪¼┘à╪º┘ä┘è</strong><br />${report.total.toLocaleString(
                "en-US"
              )} ╪▒┘è╪º┘ä</td>
            </tr>
          </table>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>╪▒┘é┘à ╪º┘ä╪┤┘é╪⌐</th>
                <th>╪º┘ä┘à╪│╪¬╪ú╪¼╪▒ / ╪º┘ä╪¼┘ç╪⌐</th>
                <th>╪º┘ä╪¬╪º╪▒┘è╪«</th>
                <th>┘å┘ê╪╣ ╪º┘ä┘à╪│╪¬╪¡┘é</th>
                <th>╪º┘ä┘à╪¿┘ä╪║</th>
                <th>╪¬┘ü╪º╪╡┘è┘ä / ┘à┘ä╪º╪¡╪╕╪º╪¬</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.title.replace(/\s+/g, "_")}_${fromDate}_${toDate}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const escapeReportHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  function getApartmentPayments(apartmentNumber: string): BuildingCharge[] {
    try {
      const saved = getBuildingStorageValue("tumouh_star_building_collections");

      if (!saved) {
        return [];
      };

      const collections = JSON.parse(saved) as BuildingCharge[];

      return collections
        .filter(
          (payment) =>
            payment &&
            String(payment.apartmentNumber) === String(apartmentNumber)
        )
        .sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")));
    } catch {
      return [];
    }
  };

  const formatPaymentDate = (value: string) => {
    return formatContractDate(value);
  };

  const getSelectedApartmentPeriodPayments = (): BuildingCharge[] => {
    if (!selectedApartment) {
      return [];
    }

    return getApartmentPayments(selectedApartment.number).filter(
      (payment) =>
        Boolean(payment.date) &&
        payment.date >= fromDate &&
        payment.date <= toDate
    );
  };

  const getSelectedApartmentPeriodCharges = (): BuildingCharge[] => {
    if (!selectedApartment) {
      return [];
    }

    try {
      const saved = getBuildingStorageValue("tumouh_star_building_charges");

      if (!saved) {
        return [];
      }

      const charges = JSON.parse(saved) as BuildingCharge[];

      return charges.filter(
        (charge) =>
          String(charge.apartmentNumber) === String(selectedApartment.number) &&
          Boolean(charge.date) &&
          charge.date >= fromDate &&
          charge.date <= toDate
      );
    } catch {
      return [];
    }
  };

  const getApartmentRentDueCharges = (apartmentNumber: string): BuildingCharge[] => {
    try {
      const saved = getBuildingStorageValue("tumouh_star_building_charges");
      if (!saved) return [];
      const charges = JSON.parse(saved) as BuildingCharge[];
      return charges
        .filter(
          (charge) =>
            String(charge.apartmentNumber) === String(apartmentNumber) &&
            charge.type?.trim() === "╪Ñ┘è╪¼╪º╪▒"
        )
        .sort((a, b) => {
          const aPeriod = a.dueMonth ? `${a.dueMonth}-01` : a.date;
          const bPeriod = b.dueMonth ? `${b.dueMonth}-01` : b.date;
          return bPeriod.localeCompare(aPeriod);
        });
    } catch {
      return [];
    }
  };

  const getSelectedApartmentLateRemaining = () => {
    if (!selectedApartment) {
      return 0;
    }

    const contractInfo = getApartmentContractInfo(selectedApartment.number);
    const apartmentRent = getApartmentRent(selectedApartment);
    const today = getTodayLocalDateString();

    // ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪Ñ┘è╪¼╪º╪▒╪º╪¬ ╪º┘ä┘à╪│╪¬╪¡┘é╪⌐ ┘à┘å ╪¿╪»╪º┘è╪⌐ ╪º┘ä╪╣┘é╪» ╪¡╪¬┘ë ╪º┘ä┘è┘ê┘à.
    const accruedRentMonths =
      selectedApartment.status === "┘à╪ñ╪¼╪▒╪⌐" ||
      selectedApartment.status === "┘à╪ñ╪¼╪▒╪⌐ ┘ä┘ä╪┤╪▒┘â╪⌐"
        ? getAccruedRentMonths(contractInfo.startDate, contractInfo.endDate)
        : 0;
    const rentDue = accruedRentMonths * apartmentRent;

    // ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ╪º┘ä╪ú╪«╪▒┘ë ╪º┘ä┘à╪│╪¼┘ä╪⌐ ╪╣┘ä┘ë ╪º┘ä╪┤┘é╪⌐ ┘à┘å ╪¿╪»╪º┘è╪⌐ ╪º┘ä╪╣┘é╪» ╪¡╪¬┘ë ╪º┘ä┘è┘ê┘à
    // (┘à╪╣ ╪º╪│╪¬╪¿╪╣╪º╪» ╪º┘ä╪Ñ┘è╪¼╪º╪▒ ╪¡╪¬┘ë ┘ä╪º ┘è╪¬┘à ╪º╪¡╪¬╪│╪º╪¿┘ç ┘à╪▒╪¬┘è┘å).
    const otherDue = getApartmentCharges(
      selectedApartment.number,
      contractInfo.startDate
    ).reduce((sum, charge) => sum + (Number(charge.amount) || 0), 0);

    // ┘â┘ä ╪º┘ä╪¬╪¡╪╡┘è┘ä╪º╪¬ ╪º┘ä┘ü╪╣┘ä┘è╪⌐ ╪º┘ä┘à╪│╪¼┘ä╪⌐ ╪╣┘ä┘ë ╪º┘ä╪┤┘é╪⌐ ╪¡╪¬┘ë ╪º┘ä┘è┘ê┘à╪î ╪¿┘à╪º ┘ü┘è┘ç╪º ╪º┘ä╪Ñ┘è╪¼╪º╪▒╪º╪¬
    // ┘ê╪º┘ä┘à╪»┘ü┘ê╪╣╪º╪¬ ╪º┘ä╪«╪º╪╡╪⌐ ╪¿╪º┘ä┘ü┘ê╪º╪¬┘è╪▒ ┘ê╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ╪º┘ä╪ú╪«╪▒┘ë.
    const contractPayments = getApartmentPayments(selectedApartment.number).filter(
      (payment) => Boolean(payment.date) && payment.date <= today
    );
    const collected = contractPayments.reduce(
      (sum, payment) => sum + (Number(payment.amount) || 0),
      0
    );

    // ╪º┘ä┘à╪¬╪¿┘é┘è ╪º┘ä┘ü╪╣┘ä┘è ╪╣┘ä┘ë ╪º┘ä╪┤┘é╪⌐ = ┘â┘ä ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ╪¡╪¬┘ë ╪º┘ä┘è┘ê┘à - ┘â┘ä ┘à╪º ╪¬┘à ╪¬╪¡╪╡┘è┘ä┘ç.
    const totalDue = rentDue + otherDue;
    return Math.max(totalDue - collected, 0);
  };

  const getSelectedApartmentFinancialReport = () => {
    if (!selectedApartment || !selectedApartmentFinancialReport) {
      return { title: "", rows: [], total: 0 };
    }

    const payments = getSelectedApartmentPeriodPayments();
    const charges = getSelectedApartmentPeriodCharges();

    if (selectedApartmentFinancialReport === "collections") {
      return {
        title: "╪¬┘é╪▒┘è╪▒ ╪¬╪¡╪╡┘è┘ä╪º╪¬ ╪º┘ä╪┤┘é╪⌐",
        rows: payments,
        total: payments.reduce(
          (sum, payment) => sum + (Number(payment.amount) || 0),
          0
        ),
      };
    }

    if (selectedApartmentFinancialReport === "water") {
      const rows = charges.filter(
        (charge) => charge.type?.trim() === "┘ü╪º╪¬┘ê╪▒╪⌐ ┘à┘è╪º┘ç"
      );
      return {
        title: "╪¬┘é╪▒┘è╪▒ ┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä┘à┘è╪º┘ç ┘ä┘ä╪┤┘é╪⌐",
        rows,
        total: rows.reduce(
          (sum, charge) => sum + (Number(charge.amount) || 0),
          0
        ),
      };
    }

    if (selectedApartmentFinancialReport === "electricity") {
      const rows = charges.filter(
        (charge) => charge.type?.trim() === "┘ü╪º╪¬┘ê╪▒╪⌐ ┘â┘ç╪▒╪¿╪º╪í"
      );
      return {
        title: "╪¬┘é╪▒┘è╪▒ ┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä┘â┘ç╪▒╪¿╪º╪í ┘ä┘ä╪┤┘é╪⌐",
        rows,
        total: rows.reduce(
          (sum, charge) => sum + (Number(charge.amount) || 0),
          0
        ),
      };
    }

    const contractInfo = getApartmentContractInfo(selectedApartment.number);
    const apartmentRent = getApartmentRent(selectedApartment);
    const today = getTodayLocalDateString();

    // ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪Ñ┘è╪¼╪º╪▒╪º╪¬ ╪º┘ä┘à╪│╪¬╪¡┘é╪⌐ ┘à┘å ╪¿╪»╪º┘è╪⌐ ╪º┘ä╪╣┘é╪» ╪¡╪¬┘ë ╪º┘ä┘è┘ê┘à.
    const accruedRentMonths =
      selectedApartment.status === "┘à╪ñ╪¼╪▒╪⌐" ||
      selectedApartment.status === "┘à╪ñ╪¼╪▒╪⌐ ┘ä┘ä╪┤╪▒┘â╪⌐"
        ? getAccruedRentMonths(contractInfo.startDate, contractInfo.endDate)
        : 0;
    const rentDue = accruedRentMonths * apartmentRent;

    // ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ╪º┘ä╪ú╪«╪▒┘ë ╪º┘ä┘à╪│╪¼┘ä╪⌐ ╪╣┘ä┘ë ╪º┘ä╪┤┘é╪⌐ ┘à┘å ╪¿╪»╪º┘è╪⌐ ╪º┘ä╪╣┘é╪» ╪¡╪¬┘ë ╪º┘ä┘è┘ê┘à
    // (┘à╪╣ ╪º╪│╪¬╪¿╪╣╪º╪» ╪º┘ä╪Ñ┘è╪¼╪º╪▒ ╪¡╪¬┘ë ┘ä╪º ┘è╪¬┘à ╪º╪¡╪¬╪│╪º╪¿┘ç ┘à╪▒╪¬┘è┘å).
    const otherDue = getApartmentCharges(
      selectedApartment.number,
      contractInfo.startDate
    ).reduce((sum, charge) => sum + (Number(charge.amount) || 0), 0);

    // ┘â┘ä ╪º┘ä╪¬╪¡╪╡┘è┘ä╪º╪¬ ╪º┘ä┘ü╪╣┘ä┘è╪⌐ ╪º┘ä┘à╪│╪¼┘ä╪⌐ ╪╣┘ä┘ë ╪º┘ä╪┤┘é╪⌐ ╪¡╪¬┘ë ╪º┘ä┘è┘ê┘à╪î ╪¿┘à╪º ┘ü┘è┘ç╪º ╪º┘ä╪Ñ┘è╪¼╪º╪▒╪º╪¬
    // ┘ê╪º┘ä┘à╪»┘ü┘ê╪╣╪º╪¬ ╪º┘ä╪«╪º╪╡╪⌐ ╪¿╪º┘ä┘ü┘ê╪º╪¬┘è╪▒ ┘ê╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ╪º┘ä╪ú╪«╪▒┘ë.
    const contractPayments = getApartmentPayments(selectedApartment.number).filter(
      (payment) => Boolean(payment.date) && payment.date <= today
    );
    const collected = contractPayments.reduce(
      (sum, payment) => sum + (Number(payment.amount) || 0),
      0
    );

    // ╪º┘ä┘à╪¬╪¿┘é┘è ╪º┘ä┘ü╪╣┘ä┘è ╪╣┘ä┘ë ╪º┘ä╪┤┘é╪⌐ = ┘â┘ä ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ╪¡╪¬┘ë ╪º┘ä┘è┘ê┘à - ┘â┘ä ┘à╪º ╪¬┘à ╪¬╪¡╪╡┘è┘ä┘ç.
    const totalDue = rentDue + otherDue;
    const remaining = Math.max(totalDue - collected, 0);

    return {
      title: "╪¬┘é╪▒┘è╪▒ ╪º┘ä╪¬╪¡╪╡┘è┘ä╪º╪¬ ╪º┘ä┘à╪¬╪ú╪«╪▒╪⌐ ┘ä┘ä╪┤┘é╪⌐",
      rows: [
        {
          type: "╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪Ñ┘è╪¼╪º╪▒╪º╪¬ ╪º┘ä┘à╪│╪¬╪¡┘é╪⌐",
          amount: String(rentDue),
          date: today,
          notes: `┘à┘å ╪¿╪»╪º┘è╪⌐ ╪º┘ä╪╣┘é╪» ╪¡╪¬┘ë ╪º┘ä┘è┘ê┘à ΓÇö ╪╣╪»╪» ╪ú╪┤┘ç╪▒ ╪º┘ä╪Ñ┘è╪¼╪º╪▒ ╪º┘ä┘à╪│╪¬╪¡┘é╪⌐: ${accruedRentMonths} ├ù ${apartmentRent.toLocaleString("ar-SA")} ╪▒┘è╪º┘ä`,
          apartmentNumber: selectedApartment.number,
        },
        {
          type: "╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ╪º┘ä╪ú╪«╪▒┘ë",
          amount: String(otherDue),
          date: today,
          notes: "╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ┘ê╪º┘ä┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä┘à╪│╪¼┘ä╪⌐ ╪╣┘ä┘ë ╪º┘ä╪┤┘é╪⌐ ╪¡╪¬┘ë ╪º┘ä┘è┘ê┘à",
          apartmentNumber: selectedApartment.number,
        },
        {
          type: "╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ╪¡╪¬┘ë ╪º┘ä┘è┘ê┘à",
          amount: String(totalDue),
          date: today,
          notes: "╪º┘ä╪Ñ┘è╪¼╪º╪▒╪º╪¬ ╪º┘ä┘à╪│╪¬╪¡┘é╪⌐ + ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ┘ê╪º┘ä┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä╪ú╪«╪▒┘ë",
          apartmentNumber: selectedApartment.number,
        },
        {
          type: "╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪¡╪╡┘ä",
          amount: String(collected),
          date: today,
          notes: "╪Ñ╪¼┘à╪º┘ä┘è ╪¼┘à┘è╪╣ ╪º┘ä╪¬╪¡╪╡┘è┘ä╪º╪¬ ╪º┘ä┘ü╪╣┘ä┘è╪⌐ ╪º┘ä┘à╪│╪¼┘ä╪⌐ ╪╣┘ä┘ë ╪º┘ä╪┤┘é╪⌐ ╪¡╪¬┘ë ╪º┘ä┘è┘ê┘à",
          apartmentNumber: selectedApartment.number,
        },
        {
          type: "╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪¬╪¿┘é┘è",
          amount: String(remaining),
          date: today,
          notes: "╪º┘ä┘à╪¿┘ä╪║ ╪º┘ä┘à╪¬╪¿┘é┘è ┘ü╪╣┘ä┘è┘ï╪º ╪¿╪╣╪» ╪«╪╡┘à ╪¼┘à┘è╪╣ ╪º┘ä╪¬╪¡╪╡┘è┘ä╪º╪¬ ┘à┘å ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬",
          apartmentNumber: selectedApartment.number,
        },
      ],
      total: remaining,
    };
  };

  const getSelectedApartmentFinancialReportExportDocument = () => {
    if (!selectedApartment || !selectedApartmentFinancialReport) {
      return "";
    }

    const report = getSelectedApartmentFinancialReport();
    const rows = report.rows
      .map(
        (row, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeReportHtml(formatContractDate(row.date))}</td>
            <td>${escapeReportHtml(row.type || "╪║┘è╪▒ ┘à╪¡╪»╪»")}</td>
            <td>${(Number(row.amount) || 0).toLocaleString("en-US")} ╪▒┘è╪º┘ä</td>
            <td>${escapeReportHtml(row.notes || "┘ä╪º ╪¬┘ê╪¼╪» ╪¬┘ü╪º╪╡┘è┘ä")}</td>
          </tr>
        `
      )
      .join("");

    return `
      <!doctype html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <title>${escapeReportHtml(report.title)}</title>
          <style>
            body { font-family: Arial, Tahoma, sans-serif; direction: rtl; padding: 28px; color: #111827; }
            .header { text-align: center; margin-bottom: 24px; }
            .brand { font-size: 18px; font-weight: 900; letter-spacing: 2px; color: #b77900; }
            h1 { margin: 8px 0; font-size: 25px; }
            .subtitle { color: #6b7280; font-size: 13px; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0; }
            .box { border: 1px solid #d1d5db; border-radius: 10px; padding: 12px; text-align: center; }
            .label { color: #6b7280; font-size: 11px; margin-bottom: 5px; }
            .value { font-size: 18px; font-weight: 900; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th, td { border: 1px solid #d1d5db; padding: 9px; text-align: center; font-size: 12px; }
            th { background: #eef2f7; font-weight: 900; }
            .total { margin-top: 18px; padding: 14px; border: 1px solid #d1d5db; text-align: center; font-weight: 900; }
            @media print { body { padding: 10mm; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">TUMOUH STAR</div>
            <h1>${escapeReportHtml(report.title)}</h1>
            <div class="subtitle">╪┤┘é╪⌐ ╪▒┘é┘à ${selectedApartment.number} ΓÇö ${formatContractDate(fromDate)} ╪Ñ┘ä┘ë ${formatContractDate(toDate)}</div>
          </div>

          <div class="summary">
            <div class="box"><div class="label">╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪¬┘é╪▒┘è╪▒</div><div class="value">${report.total.toLocaleString("en-US")} ╪▒┘è╪º┘ä</div></div>
            <div class="box"><div class="label">╪╣╪»╪» ╪º┘ä╪╣┘à┘ä┘è╪º╪¬</div><div class="value">${report.rows.length}</div></div>
            <div class="box"><div class="label">╪º┘ä┘ü╪¬╪▒╪⌐</div><div class="value">${formatContractDate(fromDate)} ΓÇö ${formatContractDate(toDate)}</div></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>╪º┘ä╪¬╪º╪▒┘è╪«</th>
                <th>┘å┘ê╪╣ ╪º┘ä╪╣┘à┘ä┘è╪⌐</th>
                <th>╪º┘ä┘à╪¿┘ä╪║</th>
                <th>╪º┘ä╪¬┘ü╪º╪╡┘è┘ä</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="5">┘ä╪º ╪¬┘ê╪¼╪» ╪¿┘è╪º┘å╪º╪¬ ╪«┘ä╪º┘ä ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐.</td></tr>'}
            </tbody>
          </table>

          <div class="total">╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪¬┘é╪▒┘è╪▒: ${report.total.toLocaleString("en-US")} ╪▒┘è╪º┘ä</div>
        </body>
      </html>
    `;
  };

  const exportSelectedApartmentFinancialReportExcel = () => {
    if (!selectedApartment || !selectedApartmentFinancialReport) {
      return;
    }

    const report = getSelectedApartmentFinancialReport();
    if (!report.rows.length) {
      window.alert("┘ä╪º ╪¬┘ê╪¼╪» ╪¿┘è╪º┘å╪º╪¬ ╪«┘ä╪º┘ä ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐ ┘ä╪¬╪╡╪»┘è╪▒┘ç╪º.");
      return;
    }

    const html = getSelectedApartmentFinancialReportExportDocument();
    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `╪¬┘é╪▒┘è╪▒_${report.title.replace(/\s+/g, "_")}_╪┤┘é╪⌐_${selectedApartment.number}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printSelectedApartmentFinancialReport = () => {
    if (!selectedApartment || !selectedApartmentFinancialReport) {
      return;
    }

    const report = getSelectedApartmentFinancialReport();
    if (!report.rows.length) {
      window.alert("┘ä╪º ╪¬┘ê╪¼╪» ╪¿┘è╪º┘å╪º╪¬ ╪«┘ä╪º┘ä ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐ ┘ä┘ä╪╖╪¿╪º╪╣╪⌐ ╪ú┘ê ╪º┘ä╪¬╪╡╪»┘è╪▒.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=1100,height=800");

    if (!printWindow) {
      window.alert("╪¬╪╣╪░╪▒ ┘ü╪¬╪¡ ┘å╪º┘ü╪░╪⌐ ╪º┘ä╪¬┘é╪▒┘è╪▒. ╪º╪│┘à╪¡ ╪¿╪º┘ä┘å┘ê╪º┘ü╪░ ╪º┘ä┘à┘å╪¿╪½┘é╪⌐ ╪½┘à ╪¡╪º┘ê┘ä ┘à╪▒╪⌐ ╪ú╪«╪▒┘ë.");
      return;
    }

    printWindow.document.write(getSelectedApartmentFinancialReportExportDocument());
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const exportSelectedApartmentFinancialReportPdf = () => {
    printSelectedApartmentFinancialReport();
  };

  const getApartmentCharges = (
    apartmentNumber: string,
    fromDate?: string
  ): BuildingCharge[] => {
    try {
      const saved = getBuildingStorageValue("tumouh_star_building_charges");

      if (!saved) {
        return [];
      }

      const charges = JSON.parse(saved) as BuildingCharge[];
      const today = getTodayLocalDateString();

      return charges.filter(
        (charge) =>
          String(charge.apartmentNumber) === String(apartmentNumber) &&
          Boolean(charge.date) &&
          charge.date <= today &&
          (!fromDate || charge.date >= fromDate) &&
          charge.type?.trim() !== "╪Ñ┘è╪¼╪º╪▒"
      );
    } catch {
      return [];
    }
  };


  const getApartmentPaymentReportHtml = () => {
    if (!selectedApartment) {
      return "";
    }

    const tenantInfo = getApartmentTenantInfo(selectedApartment);
    const payments = getApartmentPayments(selectedApartment.number);
    const totalPaid = payments.reduce(
      (sum, payment) => sum + (Number(payment.amount) || 0),
      0
    );

    const paymentRows = payments.length
      ? payments
          .map(
            (payment, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${escapeReportHtml(formatPaymentDate(payment.date))}</td>
                <td>${escapeReportHtml(payment.type || "╪║┘è╪▒ ┘à╪¡╪»╪»")}</td>
                <td>${(Number(payment.amount) || 0).toLocaleString("en-US")} ╪▒┘è╪º┘ä</td>
                <td>${escapeReportHtml(payment.notes || "┘ä╪º ╪¬┘ê╪¼╪» ╪¬┘ü╪º╪╡┘è┘ä")}</td>
              </tr>
            `
          )
          .join("")
      : `
          <tr>
            <td colspan="5">┘ä╪º ╪¬┘ê╪¼╪» ╪»┘ü╪╣╪º╪¬ ┘à╪│╪¼┘ä╪⌐ ┘ä┘ç╪░┘ç ╪º┘ä╪┤┘é╪⌐.</td>
          </tr>
        `;

    return `
      <div class="report-header">
        <div class="report-brand">TUMOUH STAR</div>
        <h1>╪¬┘é╪▒┘è╪▒ ╪│╪¼┘ä ╪»┘ü╪╣╪º╪¬ ╪º┘ä╪┤┘é╪⌐</h1>
        <div class="report-subtitle">╪¬┘ü╪º╪╡┘è┘ä ╪¼┘à┘è╪╣ ╪╣┘à┘ä┘è╪º╪¬ ╪º┘ä╪»┘ü╪╣ ┘ê╪º┘ä╪¬╪¡╪╡┘è┘ä ╪º┘ä┘à╪│╪¼┘ä╪⌐ ┘ä┘ä╪┤┘é╪⌐</div>
      </div>

      <div class="tenant-info">
        <div class="info-box">
          <span>╪▒┘é┘à ╪º┘ä╪┤┘é╪⌐</span>
          <strong>${selectedApartment.number}</strong>
        </div>
        <div class="info-box">
          <span>╪º╪│┘à ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒</span>
          <strong>${escapeReportHtml(tenantInfo.tenantName || "╪║┘è╪▒ ┘à╪╢╪º┘ü")}</strong>
        </div>
        <div class="info-box">
          <span>╪▒┘é┘à ╪º┘ä╪¼┘ê╪º┘ä</span>
          <strong>${escapeReportHtml(tenantInfo.phone || "╪║┘è╪▒ ┘à╪╢╪º┘ü")}</strong>
        </div>
        <div class="info-box">
          <span>╪▒┘é┘à ╪º┘ä┘ç┘ê┘è╪⌐ / ╪º┘ä╪Ñ┘é╪º┘à╪⌐</span>
          <strong>${escapeReportHtml(
            tenantInfo.identityNumber || "╪║┘è╪▒ ┘à╪╢╪º┘ü"
          )}</strong>
        </div>
      </div>

      <div class="report-total">
        <span>╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪»┘ü┘ê╪╣╪º╪¬</span>
        <strong>${totalPaid.toLocaleString("en-US")} ╪▒┘è╪º┘ä</strong>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>╪¬╪º╪▒┘è╪« ╪º┘ä╪»┘ü╪╣</th>
            <th>┘å┘ê╪╣ ╪º┘ä┘à╪│╪¬╪¡┘é</th>
            <th>╪º┘ä┘à╪¿┘ä╪║</th>
            <th>╪¬┘ü╪º╪╡┘è┘ä / ┘à┘ä╪º╪¡╪╕╪º╪¬</th>
          </tr>
        </thead>
        <tbody>${paymentRows}</tbody>
      </table>

      <div class="report-footer">
        ╪¬╪º╪▒┘è╪« ╪Ñ╪╡╪»╪º╪▒ ╪º┘ä╪¬┘é╪▒┘è╪▒: ${new Date().toLocaleDateString("ar-SA")}
      </div>
    `;
  };

  const getApartmentPaymentExportDocument = () => {
    return `
      <!doctype html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>╪¬┘é╪▒┘è╪▒ ╪»┘ü╪╣╪º╪¬ ╪º┘ä╪┤┘é╪⌐ ${selectedApartment?.number ?? ""}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 28px;
              font-family: Arial, Tahoma, sans-serif;
              color: #111827;
              direction: rtl;
              background: #ffffff;
            }
            .report-header {
              text-align: center;
              margin-bottom: 22px;
            }
            .report-brand {
              font-size: 22px;
              font-weight: 900;
              letter-spacing: 2px;
              margin-bottom: 8px;
            }
            h1 {
              margin: 0;
              font-size: 28px;
            }
            .report-subtitle {
              margin-top: 7px;
              color: #6b7280;
              font-size: 14px;
            }
            .tenant-info {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin-bottom: 16px;
            }
            .info-box {
              border: 1px solid #d1d5db;
              border-radius: 10px;
              padding: 11px;
              text-align: center;
              background: #f9fafb;
            }
            .info-box span {
              display: block;
              color: #6b7280;
              font-size: 12px;
              margin-bottom: 5px;
            }
            .info-box strong {
              display: block;
              font-size: 15px;
              word-break: break-word;
            }
            .report-total {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border: 1px solid #d1d5db;
              border-radius: 10px;
              padding: 12px 15px;
              margin-bottom: 16px;
              background: #f9fafb;
              font-weight: 800;
            }
            .report-total strong {
              font-size: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #9ca3af;
              padding: 10px 8px;
              text-align: center;
              font-size: 13px;
              vertical-align: middle;
            }
            th {
              background: #e5e7eb;
              font-weight: 900;
            }
            .report-footer {
              margin-top: 18px;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
            @media print {
              body { padding: 10mm; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${getApartmentPaymentReportHtml()}
        </body>
      </html>
    `;
  };

  const exportApartmentPaymentsExcel = () => {
    if (!selectedApartment) {
      return;
    }

    const payments = getApartmentPayments(selectedApartment.number);

    if (!payments.length) {
      window.alert("┘ä╪º ╪¬┘ê╪¼╪» ╪»┘ü╪╣╪º╪¬ ┘à╪│╪¼┘ä╪⌐ ┘ä┘ç╪░┘ç ╪º┘ä╪┤┘é╪⌐ ┘ä╪¬╪╡╪»┘è╪▒┘ç╪º.");
      return;
    }

    const tenantInfo = getApartmentTenantInfo(selectedApartment);
    const totalPaid = payments.reduce(
      (sum, payment) => sum + (Number(payment.amount) || 0),
      0
    );

    const rows = payments
      .map(
        (payment, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeReportHtml(formatPaymentDate(payment.date))}</td>
            <td>${escapeReportHtml(payment.type || "╪║┘è╪▒ ┘à╪¡╪»╪»")}</td>
            <td>${(Number(payment.amount) || 0).toLocaleString("en-US")}</td>
            <td>${escapeReportHtml(payment.notes || "┘ä╪º ╪¬┘ê╪¼╪» ╪¬┘ü╪º╪╡┘è┘ä")}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <html dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, Tahoma, sans-serif; direction: rtl; }
            h1, h2, p { text-align: center; }
            .info {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            .info td {
              border: 1px solid #999;
              padding: 8px;
              text-align: center;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th, td {
              border: 1px solid #999;
              padding: 8px;
              text-align: center;
            }
            th { background: #e9ecef; }
          </style>
        </head>
        <body>
          <h1>╪¬┘é╪▒┘è╪▒ ╪│╪¼┘ä ╪»┘ü╪╣╪º╪¬ ╪º┘ä╪┤┘é╪⌐</h1>
          <p>Tumouh Star</p>
          <table class="info">
            <tr>
              <td><strong>╪▒┘é┘à ╪º┘ä╪┤┘é╪⌐</strong><br />${selectedApartment.number}</td>
              <td><strong>╪º╪│┘à ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒</strong><br />${escapeReportHtml(
                tenantInfo.tenantName || "╪║┘è╪▒ ┘à╪╢╪º┘ü"
              )}</td>
              <td><strong>╪▒┘é┘à ╪º┘ä╪¼┘ê╪º┘ä</strong><br />${escapeReportHtml(
                tenantInfo.phone || "╪║┘è╪▒ ┘à╪╢╪º┘ü"
              )}</td>
              <td><strong>╪▒┘é┘à ╪º┘ä┘ç┘ê┘è╪⌐ / ╪º┘ä╪Ñ┘é╪º┘à╪⌐</strong><br />${escapeReportHtml(
                tenantInfo.identityNumber || "╪║┘è╪▒ ┘à╪╢╪º┘ü"
              )}</td>
            </tr>
            <tr>
              <td colspan="4"><strong>╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪»┘ü┘ê╪╣╪º╪¬: ${totalPaid.toLocaleString(
                "en-US"
              )} ╪▒┘è╪º┘ä</strong></td>
            </tr>
          </table>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>╪¬╪º╪▒┘è╪« ╪º┘ä╪»┘ü╪╣</th>
                <th>┘å┘ê╪╣ ╪º┘ä┘à╪│╪¬╪¡┘é</th>
                <th>╪º┘ä┘à╪¿┘ä╪║</th>
                <th>╪¬┘ü╪º╪╡┘è┘ä / ┘à┘ä╪º╪¡╪╕╪º╪¬</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `╪│╪¼┘ä_╪»┘ü╪╣╪º╪¬_╪º┘ä╪┤┘é╪⌐_${selectedApartment.number}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsPaymentExportMenuOpen(false);
  };

  const printApartmentPayments = () => {
    if (!selectedApartment) {
      return;
    }

    const payments = getApartmentPayments(selectedApartment.number);

    if (!payments.length) {
      window.alert("┘ä╪º ╪¬┘ê╪¼╪» ╪»┘ü╪╣╪º╪¬ ┘à╪│╪¼┘ä╪⌐ ┘ä┘ç╪░┘ç ╪º┘ä╪┤┘é╪⌐ ┘ä┘ä╪╖╪¿╪º╪╣╪⌐ ╪ú┘ê ╪º┘ä╪¬╪╡╪»┘è╪▒.");
      return;
    }

    const printWindow = window.open(
      "",
      "_blank",
      "width=1100,height=800"
    );

    if (!printWindow) {
      window.alert(
        "╪¬╪╣╪░╪▒ ┘ü╪¬╪¡ ┘å╪º┘ü╪░╪⌐ ╪º┘ä╪¬┘é╪▒┘è╪▒. ╪º╪│┘à╪¡ ╪¿╪º┘ä┘å┘ê╪º┘ü╪░ ╪º┘ä┘à┘å╪¿╪½┘é╪⌐ ╪½┘à ╪¡╪º┘ê┘ä ┘à╪▒╪⌐ ╪ú╪«╪▒┘ë."
      );
      return;
    }

    printWindow.document.write(getApartmentPaymentExportDocument());
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);

    setIsPaymentExportMenuOpen(false);
  };

  const exportApartmentPaymentsPdf = () => {
    printApartmentPayments();
  };

  const getApartmentTypeReportData = () => {
    if (!selectedApartmentTypeReport) {
      return [];
    }

    return apartments
      .filter(
        (apartment) =>
          getApartmentType(apartment) === selectedApartmentTypeReport
      )
      .map((apartment) => {
        const extraInfo = getApartmentExtraInfo(apartment.number);
        const tenantInfo = getApartmentTenantInfo(apartment);
        const contractInfo = getApartmentContractInfo(apartment.number);
        const payments = getApartmentPayments(apartment.number);

        return {
          apartment,
          extraInfo,
          tenantInfo,
          contractInfo,
          paymentCount: payments.length,
          totalPaid: payments.reduce(
            (sum, payment) => sum + (Number(payment.amount) || 0),
            0
          ),
        };
      });
  };

  const getApartmentTypeReportTitle = () =>
    selectedApartmentTypeReport
      ? `╪¬┘é╪▒┘è╪▒ ╪┤┘é┘é ${selectedApartmentTypeReport}`
      : "";

  const exportApartmentTypeReportExcel = () => {
    const rows = getApartmentTypeReportData();

    if (!rows.length) {
      window.alert("┘ä╪º ╪¬┘ê╪¼╪» ╪┤┘é┘é ┘à╪│╪¼┘ä╪⌐ ┘ä┘ç╪░╪º ╪º┘ä┘å┘ê╪╣ ┘ä╪¬╪╡╪»┘è╪▒┘ç╪º.");
      return;
    }

    const bodyRows = rows
      .map(
        ({
          apartment,
          extraInfo,
          tenantInfo,
          contractInfo,
          paymentCount,
          totalPaid,
        }) => `
          <tr>
            <td>${apartment.number}</td>
            <td>${escapeReportHtml(getApartmentType(apartment))}</td>
            <td>${escapeReportHtml(
              apartment.status === "╪┤╪º╪║╪▒╪⌐" ? "┘ü╪º╪▒╪║╪⌐" : apartment.status
            )}</td>
            <td>${getApartmentRent(apartment).toLocaleString("en-US")}</td>
            <td>${escapeReportHtml(tenantInfo.tenantName || apartment.tenant || "╪║┘è╪▒ ┘à╪╢╪º┘ü")}</td>
            <td>${escapeReportHtml(tenantInfo.phone || "╪║┘è╪▒ ┘à╪╢╪º┘ü")}</td>
            <td>${escapeReportHtml(tenantInfo.identityNumber || "╪║┘è╪▒ ┘à╪╢╪º┘ü")}</td>
            <td>${escapeReportHtml(extraInfo.floor || "╪║┘è╪▒ ┘à╪¡╪»╪»")}</td>
            <td>${escapeReportHtml(extraInfo.parking)}</td>
            <td>${escapeReportHtml(extraInfo.electricityMeter)}</td>
            <td>${escapeReportHtml(extraInfo.waterMeter)}</td>
            <td>${escapeReportHtml(extraInfo.furnitureStatus)}</td>
            <td>${escapeReportHtml(contractInfo.contractNumber || "╪║┘è╪▒ ┘à╪¡╪»╪»")}</td>
            <td>${escapeReportHtml(formatContractDate(contractInfo.startDate))}</td>
            <td>${escapeReportHtml(formatContractDate(contractInfo.endDate))}</td>
            <td>${escapeReportHtml(
              formatContractDuration(
                contractInfo.durationUnit,
                contractInfo.durationValue
              )
            )}</td>
            <td>${Number(contractInfo.insuranceAmount || 0).toLocaleString("en-US")}</td>
            <td>${escapeReportHtml(contractInfo.insuranceNotes || "┘ä╪º ╪¬┘ê╪¼╪» ┘à┘ä╪º╪¡╪╕╪º╪¬")}</td>
            <td>${paymentCount}</td>
            <td>${totalPaid.toLocaleString("en-US")}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <!doctype html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>${escapeReportHtml(getApartmentTypeReportTitle())}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 24px;
              font-family: Arial, "Tahoma", sans-serif;
              direction: rtl;
              color: #111827;
            }
            h1 { margin: 0 0 8px; text-align: center; font-size: 26px; }
            p { margin: 0 0 18px; text-align: center; color: #4b5563; }
            .summary {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin-bottom: 18px;
            }
            .summary div {
              border: 1px solid #d1d5db;
              border-radius: 10px;
              padding: 10px;
              text-align: center;
              background: #f9fafb;
              font-weight: 700;
            }
            .table-wrap { overflow-x: auto; }
            table { width: 100%; min-width: 2400px; border-collapse: collapse; }
            th, td {
              border: 1px solid #9ca3af;
              padding: 7px 6px;
              text-align: center;
              font-size: 10px;
              white-space: nowrap;
            }
            th { background: #e5e7eb; }
            @media print {
              @page { size: A3 landscape; margin: 8mm; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>${escapeReportHtml(getApartmentTypeReportTitle())}</h1>
          <p>╪¬┘ü╪º╪╡┘è┘ä ╪¼┘à┘è╪╣ ╪º┘ä╪┤┘é┘é ╪º┘ä┘à╪│╪¼┘ä╪⌐ ╪¬╪¡╪¬ ┘ç╪░╪º ╪º┘ä┘å┘ê╪╣</p>
          <div class="summary">
            <div>╪╣╪»╪» ╪º┘ä╪┤┘é┘é: ${rows.length}</div>
            <div>╪Ñ┘è╪¼╪º╪▒ ╪º┘ä╪┤┘é╪⌐: ${getApartmentRent(rows[0].apartment).toLocaleString("en-US")} ╪▒┘è╪º┘ä</div>
            <div>╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪Ñ┘è╪¼╪º╪▒ ╪º┘ä╪┤┘ç╪▒┘è: ${rows
              .reduce(
                (sum, row) => sum + getApartmentRent(row.apartment),
                0
              )
              .toLocaleString("en-US")} ╪▒┘è╪º┘ä</div>
            <div>╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪»┘ü┘ê╪╣╪º╪¬: ${rows
              .reduce((sum, row) => sum + row.totalPaid, 0)
              .toLocaleString("en-US")} ╪▒┘è╪º┘ä</div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>╪▒┘é┘à ╪º┘ä╪┤┘é╪⌐</th>
                  <th>╪º┘ä┘å┘ê╪╣</th>
                  <th>╪º┘ä╪¡╪º┘ä╪⌐</th>
                  <th>╪º┘ä╪Ñ┘è╪¼╪º╪▒ ╪º┘ä╪┤┘ç╪▒┘è</th>
                  <th>╪º╪│┘à ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒ / ╪º┘ä╪¼┘ç╪⌐</th>
                  <th>╪º┘ä╪¼┘ê╪º┘ä</th>
                  <th>╪▒┘é┘à ╪º┘ä┘ç┘ê┘è╪⌐</th>
                  <th>╪º┘ä╪»┘ê╪▒</th>
                  <th>╪º┘ä┘à┘ê╪º┘é┘ü</th>
                  <th>╪╣╪»╪º╪» ╪º┘ä┘â┘ç╪▒╪¿╪º╪í</th>
                  <th>╪╣╪»╪º╪» ╪º┘ä┘à┘è╪º┘ç</th>
                  <th>╪¡╪º┘ä╪⌐ ╪º┘ä┘ü╪▒╪┤</th>
                  <th>╪▒┘é┘à ╪º┘ä╪╣┘é╪»</th>
                  <th>╪¿╪»╪º┘è╪⌐ ╪º┘ä╪╣┘é╪»</th>
                  <th>┘å┘ç╪º┘è╪⌐ ╪º┘ä╪╣┘é╪»</th>
                  <th>┘à╪»╪⌐ ╪º┘ä╪╣┘é╪»</th>
                  <th>╪º┘ä╪¬╪ú┘à┘è┘å</th>
                  <th>┘à┘ä╪º╪¡╪╕╪º╪¬ ╪º┘ä╪¬╪ú┘à┘è┘å</th>
                  <th>╪╣╪»╪» ╪º┘ä╪»┘ü╪╣╪º╪¬</th>
                  <th>╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪»┘ü┘ê╪╣</th>
                </tr>
              </thead>
              <tbody>${bodyRows}</tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${getApartmentTypeReportTitle().replace(/\s+/g, "_")}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printApartmentTypeReport = () => {
    const rows = getApartmentTypeReportData();

    if (!rows.length) {
      window.alert("┘ä╪º ╪¬┘ê╪¼╪» ╪┤┘é┘é ┘à╪│╪¼┘ä╪⌐ ┘ä┘ç╪░╪º ╪º┘ä┘å┘ê╪╣ ┘ä┘ä╪╖╪¿╪º╪╣╪⌐.");
      return;
    }

    const bodyRows = rows
      .map(
        ({
          apartment,
          extraInfo,
          tenantInfo,
          contractInfo,
          paymentCount,
          totalPaid,
        }) => `
          <tr>
            <td>${apartment.number}</td>
            <td>${escapeReportHtml(getApartmentType(apartment))}</td>
            <td>${escapeReportHtml(
              apartment.status === "╪┤╪º╪║╪▒╪⌐" ? "┘ü╪º╪▒╪║╪⌐" : apartment.status
            )}</td>
            <td>${getApartmentRent(apartment).toLocaleString("en-US")} ╪▒┘è╪º┘ä</td>
            <td>${escapeReportHtml(tenantInfo.tenantName || apartment.tenant || "╪║┘è╪▒ ┘à╪╢╪º┘ü")}</td>
            <td>${escapeReportHtml(tenantInfo.phone || "╪║┘è╪▒ ┘à╪╢╪º┘ü")}</td>
            <td>${escapeReportHtml(tenantInfo.identityNumber || "╪║┘è╪▒ ┘à╪╢╪º┘ü")}</td>
            <td>${escapeReportHtml(extraInfo.floor || "╪║┘è╪▒ ┘à╪¡╪»╪»")}</td>
            <td>${escapeReportHtml(extraInfo.parking)}</td>
            <td>${escapeReportHtml(extraInfo.electricityMeter)}</td>
            <td>${escapeReportHtml(extraInfo.waterMeter)}</td>
            <td>${escapeReportHtml(extraInfo.furnitureStatus)}</td>
            <td>${escapeReportHtml(contractInfo.contractNumber || "╪║┘è╪▒ ┘à╪¡╪»╪»")}</td>
            <td>${escapeReportHtml(formatContractDate(contractInfo.startDate))}</td>
            <td>${escapeReportHtml(formatContractDate(contractInfo.endDate))}</td>
            <td>${escapeReportHtml(
              formatContractDuration(
                contractInfo.durationUnit,
                contractInfo.durationValue
              )
            )}</td>
            <td>${Number(contractInfo.insuranceAmount || 0).toLocaleString("en-US")} ╪▒┘è╪º┘ä</td>
            <td>${escapeReportHtml(contractInfo.insuranceNotes || "┘ä╪º ╪¬┘ê╪¼╪» ┘à┘ä╪º╪¡╪╕╪º╪¬")}</td>
            <td>${paymentCount}</td>
            <td>${totalPaid.toLocaleString("en-US")} ╪▒┘è╪º┘ä</td>
          </tr>
        `
      )
      .join("");

    const totalRent = rows.reduce(
      (sum, row) => sum + getApartmentRent(row.apartment),
      0
    );
    const totalPaid = rows.reduce((sum, row) => sum + row.totalPaid, 0);

    const printWindow = window.open("", "_blank", "width=1500,height=900");

    if (!printWindow) {
      window.alert(
        "╪¬╪╣╪░╪▒ ┘ü╪¬╪¡ ┘å╪º┘ü╪░╪⌐ ╪º┘ä╪¬┘é╪▒┘è╪▒. ╪º╪│┘à╪¡ ╪¿╪º┘ä┘å┘ê╪º┘ü╪░ ╪º┘ä┘à┘å╪¿╪½┘é╪⌐ ╪½┘à ╪¡╪º┘ê┘ä ┘à╪▒╪⌐ ╪ú╪«╪▒┘ë."
      );
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>${escapeReportHtml(getApartmentTypeReportTitle())}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, "Tahoma", sans-serif;
              color: #111827;
              direction: rtl;
            }
            h1 { margin: 0 0 8px; text-align: center; font-size: 26px; }
            p { margin: 0 0 16px; text-align: center; color: #4b5563; }
            .summary {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              margin-bottom: 16px;
            }
            .summary div {
              border: 1px solid #d1d5db;
              border-radius: 8px;
              padding: 8px;
              text-align: center;
              background: #f9fafb;
              font-weight: 700;
              font-size: 12px;
            }
            table { width: 100%; border-collapse: collapse; }
            th, td {
              border: 1px solid #9ca3af;
              padding: 6px 5px;
              text-align: center;
              font-size: 9px;
              white-space: nowrap;
            }
            th { background: #e5e7eb; }
            @media print {
              @page { size: A3 landscape; margin: 8mm; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>${escapeReportHtml(getApartmentTypeReportTitle())}</h1>
          <p>╪¬┘ü╪º╪╡┘è┘ä ╪¼┘à┘è╪╣ ╪º┘ä╪┤┘é┘é ╪º┘ä┘à╪│╪¼┘ä╪⌐ ╪¬╪¡╪¬ ┘ç╪░╪º ╪º┘ä┘å┘ê╪╣</p>
          <div class="summary">
            <div>╪╣╪»╪» ╪º┘ä╪┤┘é┘é: ${rows.length}</div>
            <div>╪Ñ┘è╪¼╪º╪▒ ╪º┘ä╪┤┘é╪⌐: ${getApartmentRent(rows[0].apartment).toLocaleString("ar-SA")} ╪▒┘è╪º┘ä</div>
            <div>╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪Ñ┘è╪¼╪º╪▒ ╪º┘ä╪┤┘ç╪▒┘è: ${totalRent.toLocaleString("ar-SA")} ╪▒┘è╪º┘ä</div>
            <div>╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪»┘ü┘ê╪╣╪º╪¬: ${totalPaid.toLocaleString("ar-SA")} ╪▒┘è╪º┘ä</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>╪▒┘é┘à ╪º┘ä╪┤┘é╪⌐</th>
                <th>╪º┘ä┘å┘ê╪╣</th>
                <th>╪º┘ä╪¡╪º┘ä╪⌐</th>
                <th>╪º┘ä╪Ñ┘è╪¼╪º╪▒ ╪º┘ä╪┤┘ç╪▒┘è</th>
                <th>╪º╪│┘à ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒ / ╪º┘ä╪¼┘ç╪⌐</th>
                <th>╪º┘ä╪¼┘ê╪º┘ä</th>
                <th>╪▒┘é┘à ╪º┘ä┘ç┘ê┘è╪⌐</th>
                <th>╪º┘ä╪»┘ê╪▒</th>
                <th>╪º┘ä┘à┘ê╪º┘é┘ü</th>
                <th>╪╣╪»╪º╪» ╪º┘ä┘â┘ç╪▒╪¿╪º╪í</th>
                <th>╪╣╪»╪º╪» ╪º┘ä┘à┘è╪º┘ç</th>
                <th>╪¡╪º┘ä╪⌐ ╪º┘ä┘ü╪▒╪┤</th>
                <th>╪▒┘é┘à ╪º┘ä╪╣┘é╪»</th>
                <th>╪¿╪»╪º┘è╪⌐ ╪º┘ä╪╣┘é╪»</th>
                <th>┘å┘ç╪º┘è╪⌐ ╪º┘ä╪╣┘é╪»</th>
                <th>┘à╪»╪⌐ ╪º┘ä╪╣┘é╪»</th>
                <th>╪º┘ä╪¬╪ú┘à┘è┘å</th>
                <th>┘à┘ä╪º╪¡╪╕╪º╪¬ ╪º┘ä╪¬╪ú┘à┘è┘å</th>
                <th>╪╣╪»╪» ╪º┘ä╪»┘ü╪╣╪º╪¬</th>
                <th>╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪»┘ü┘ê╪╣</th>
              </tr>
            </thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const exportApartmentTypeReportPdf = () => {
    printApartmentTypeReport();
  };

  const exportApartmentReportExcel = () => {
    const report = getApartmentReport();
    if (!report.data.length) {
      window.alert("┘ä╪º ╪¬┘ê╪¼╪» ╪¿┘è╪º┘å╪º╪¬ ┘ä╪¬╪╡╪»┘è╪▒┘ç╪º.");
      return;
    }

    const rows = report.data
      .map(
        (apartment) => `
          <tr>
            <td>${apartment.number}</td>
            <td>${escapeReportHtml(getApartmentType(apartment))}</td>
            <td>${escapeReportHtml(
              apartment.status === "╪┤╪º╪║╪▒╪⌐" ? "┘ü╪º╪▒╪║╪⌐" : apartment.status
            )}</td>
            <td>${getApartmentRent(apartment).toLocaleString("en-US")}</td>
            <td>${escapeReportHtml(apartment.tenant || "╪║┘è╪▒ ┘à╪╢╪º┘ü")}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <html dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, sans-serif; direction: rtl; }
            h1, p { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #999; padding: 8px; text-align: center; }
            th { background: #e9ecef; }
          </style>
        </head>
        <body>
          <h1>${escapeReportHtml(report.title)}</h1>
          <p>${escapeReportHtml(report.subtitle)}</p>
          <table>
            <thead>
              <tr>
                <th>╪▒┘é┘à ╪º┘ä╪┤┘é╪⌐</th>
                <th>┘å┘ê╪╣ ╪º┘ä╪┤┘é╪⌐</th>
                <th>╪º┘ä╪¡╪º┘ä╪⌐</th>
                <th>╪º┘ä╪Ñ┘è╪¼╪º╪▒ ╪º┘ä╪┤┘ç╪▒┘è</th>
                <th>╪º┘ä┘à╪│╪¬╪ú╪¼╪▒ / ╪º┘ä╪¼┘ç╪⌐</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.title.replace(/\s+/g, "_")}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printApartmentReport = () => {
    const report = getApartmentReport();
    if (!report.data.length) {
      window.alert("┘ä╪º ╪¬┘ê╪¼╪» ╪¿┘è╪º┘å╪º╪¬ ┘ä┘ä╪╖╪¿╪º╪╣╪⌐.");
      return;
    }

    const rows = report.data
      .map(
        (apartment) => `
          <tr>
            <td>${apartment.number}</td>
            <td>${escapeReportHtml(getApartmentType(apartment))}</td>
            <td>${escapeReportHtml(
              apartment.status === "╪┤╪º╪║╪▒╪⌐" ? "┘ü╪º╪▒╪║╪⌐" : apartment.status
            )}</td>
            <td>${getApartmentRent(apartment).toLocaleString("en-US")} ╪▒┘è╪º┘ä</td>
            <td>${escapeReportHtml(apartment.tenant || "╪║┘è╪▒ ┘à╪╢╪º┘ü")}</td>
          </tr>
        `
      )
      .join("");

    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) {
      window.alert("╪¬╪╣╪░╪▒ ┘ü╪¬╪¡ ┘å╪º┘ü╪░╪⌐ ╪º┘ä╪╖╪¿╪º╪╣╪⌐. ╪º╪│┘à╪¡ ╪¿╪º┘ä┘å┘ê╪º┘ü╪░ ╪º┘ä┘à┘å╪¿╪½┘é╪⌐ ╪½┘à ╪¡╪º┘ê┘ä ┘à╪▒╪⌐ ╪ú╪«╪▒┘ë.");
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>${escapeReportHtml(report.title)}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 30px;
              font-family: Arial, "Tahoma", sans-serif;
              color: #111827;
              direction: rtl;
            }
            h1 { margin: 0 0 8px; text-align: center; font-size: 28px; }
            p { margin: 0 0 22px; text-align: center; color: #4b5563; }
            .summary {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
              margin-bottom: 20px;
            }
            .summary div {
              border: 1px solid #d1d5db;
              border-radius: 10px;
              padding: 10px;
              text-align: center;
              background: #f9fafb;
              font-weight: 700;
            }
            table { width: 100%; border-collapse: collapse; }
            th, td {
              border: 1px solid #9ca3af;
              padding: 9px 7px;
              text-align: center;
              font-size: 13px;
            }
            th { background: #e5e7eb; }
            @media print {
              body { padding: 10mm; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${escapeReportHtml(report.title)}</h1>
          <p>${escapeReportHtml(report.subtitle)}</p>
          <div class="summary">
            <div>╪╣╪»╪» ╪º┘ä╪┤┘é┘é: ${report.data.length}</div>
            <div>╪º┘ä╪Ñ┘è╪¼╪º╪▒ ╪º┘ä╪┤┘ç╪▒┘è: ${report.data
              .reduce((sum, apartment) => sum + getApartmentRent(apartment), 0)
              .toLocaleString("en-US")} ╪▒┘è╪º┘ä</div>
            <div>╪¬╪º╪▒┘è╪« ╪º┘ä╪¬┘é╪▒┘è╪▒: ${new Date().toLocaleDateString("ar-SA")}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>╪▒┘é┘à ╪º┘ä╪┤┘é╪⌐</th>
                <th>┘å┘ê╪╣ ╪º┘ä╪┤┘é╪⌐</th>
                <th>╪º┘ä╪¡╪º┘ä╪⌐</th>
                <th>╪º┘ä╪Ñ┘è╪¼╪º╪▒ ╪º┘ä╪┤┘ç╪▒┘è</th>
                <th>╪º┘ä┘à╪│╪¬╪ú╪¼╪▒ / ╪º┘ä╪¼┘ç╪⌐</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const exportApartmentReportPdf = () => {
    printApartmentReport();
  };

  const openFinancialMovementsDetails = () => {
    window.location.href = "/buildings/financial-details";
  };

  const openTenantDetails = () => {
    window.location.href = "/buildings/tenant-details";
  };

  if (permissionsLoading) {
    return null;
  }

  if (!canViewBuildings) {
    return (
      <PermissionDeniedModal
        open={true}
        message="╪╣╪░╪▒┘ï╪º╪î ╪║┘è╪▒ ┘à╪│┘à┘ê╪¡ ┘ä┘ä┘à╪│╪¬╪«╪»┘à ╪º┘ä╪¡╪º┘ä┘è ╪¿╪╣╪▒╪╢ ┘ç╪░┘ç ╪º┘ä╪╡┘ü╪¡╪⌐."
        redirectTo="/home"
        onClose={() => navigate("/home", { replace: true })}
      />
    );
  }

  const isFinancialMovementsPage =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("view") ===
      "financial-movements";

  if (isFinancialMovementsPage) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-[#061426] p-6 text-white"
      >
        <div className="mx-auto min-h-[calc(100vh-3rem)] max-w-7xl rounded-3xl border border-[#d89b18]/40 bg-[#07182b] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <button
              type="button"
              onClick={() => window.close()}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-gray-300 transition hover:border-[#f0ad18]/50 hover:bg-[#f0ad18]/10 hover:text-[#f6c84a]"
            >
              <X size={18} />
              ╪Ñ╪║┘ä╪º┘é ╪º┘ä╪╡┘ü╪¡╪⌐
            </button>

            <div className="text-center">
              <h1 className="text-2xl font-black text-[#f6c84a] sm:text-3xl">
                ╪¬┘ü╪º╪╡┘è┘ä ╪º┘ä╪¡╪▒┘â╪º╪¬ ╪º┘ä┘à╪º┘ä┘è╪⌐
              </h1>
              <p className="mt-1 text-sm font-semibold text-gray-400">
                ╪¬┘é╪º╪▒┘è╪▒ ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ┘ê╪º┘ä╪¬╪¡╪╡┘è┘ä╪º╪¬ ┘ê╪╣┘à┘ä┘è╪º╪¬ ╪º┘ä╪Ñ╪╢╪º┘ü╪⌐ ┘ê╪º┘ä╪¬╪╣╪»┘è┘ä ┘ê╪º┘ä╪¡╪░┘ü
              </p>
            </div>

            <div className="w-[110px]" />
          </div>

          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] px-8 py-10 text-center">
              <FileText
                size={46}
                className="mx-auto text-[#f0ad18]"
              />
              <h2 className="mt-5 text-xl font-black text-gray-200">
                ╪╡┘ü╪¡╪⌐ ╪¬┘é╪º╪▒┘è╪▒ ╪º┘ä╪¡╪▒┘â╪º╪¬
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-7 text-gray-500">
                ╪│┘è╪¬┘à ╪¬╪¼┘ç┘è╪▓ ╪¼╪»╪º┘ê┘ä ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ┘ê╪º┘ä╪¬╪¡╪╡┘è┘ä╪º╪¬ ┘ç┘å╪º ┘à╪╣ ╪Ñ┘à┘â╪º┘å┘è╪⌐ ╪╣╪▒╪╢
                ╪¬┘ü╪º╪╡┘è┘ä ╪º┘ä╪╣┘à┘ä┘è╪⌐ ┘ê╪¬╪╣╪»┘è┘ä┘ç╪º ╪ú┘ê ╪¡╪░┘ü┘ç╪º.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#031F18] p-6 text-white"
      style={{
        backgroundImage:
          "linear-gradient(rgba(3,31,24,0.93), rgba(3,31,24,0.93)), url('/aqar-smart-logo.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center, center",
        backgroundSize: "cover, 420px",
        backgroundAttachment: "fixed, fixed",
      }}
    >

      {/* ===================================================== */}
      {/* HEADER                                                 */}
      {/* ===================================================== */}

      <div className="mb-6 rounded-2xl border border-[#d89b18] bg-[#050505] p-6 shadow-lg">

        <div className="flex flex-col items-center justify-center gap-2 text-center">

          <div className="flex items-center justify-center gap-5 text-center">

            <h1 className="text-4xl font-bold text-[#f0ad18]">
              {buildingName}
            </h1>

            <div className="text-3xl font-bold text-white">
              Tumouh Star
            </div>

          </div>

          <div className="flex items-center justify-center gap-4 text-center">

            <p className="text-lg text-gray-300">
              ╪¬┘ü╪º╪╡┘è┘ä ╪º┘ä╪º╪│╪¬╪½┘à╪º╪▒ ┘ê╪º┘ä╪╣┘é┘ê╪» ┘ê╪º┘ä╪Ñ┘è╪▒╪º╪»╪º╪¬
            </p>

            <div className="text-base text-[#d89b18]">
              ERP System
            </div>

          </div>

        </div>

      </div>

      {/* ===================================================== */}
      {/* QUICK FINANCIAL ACTIONS - 4 LARGE GLASS CARDS            */}
      {/* ===================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5" dir="rtl">

        {/* 1 - ADD INVOICE / CHARGE */}
        <button
          type="button"
          onClick={() => openChargeModal("charge", "┘ü╪º╪¬┘ê╪▒╪⌐ ┘à┘è╪º┘ç")}
          className="group relative min-h-[155px] overflow-hidden rounded-3xl border border-cyan-400/30 bg-white/[0.055] p-4 text-center shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/70 hover:bg-cyan-400/[0.08] hover:shadow-[0_18px_50px_rgba(34,211,238,0.16)]"
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 shadow-[0_0_25px_rgba(34,211,238,0.10)]">
            <Receipt size={30} className="text-cyan-300" />
          </div>
          <div className="mt-4 text-2xl font-black text-white">
            ╪Ñ╪╢╪º┘ü╪⌐ ┘ü╪º╪¬┘ê╪▒╪⌐ ╪ú┘ê ┘à╪│╪¬╪¡┘é╪º╪¬
          </div>
          <div className="mt-2 text-base font-semibold text-cyan-200/75">
            ┘à┘è╪º┘ç╪î ┘â┘ç╪▒╪¿╪º╪í╪î ┘å╪╕╪º┘ü╪⌐ ╪ú┘ê ┘à╪│╪¬╪¡┘é╪º╪¬ ╪ú╪«╪▒┘ë
          </div>
          <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-sm font-black text-cyan-200">
            <Users size={15} />
            ╪º╪«╪¬┘è╪º╪▒ ╪º┘ä╪┤┘é┘é
          </div>
        </button>

        {/* 2 - COLLECT INVOICE / CHARGE */}
        <button
          type="button"
          onClick={() => openChargeModal("collection", "┘ü╪º╪¬┘ê╪▒╪⌐ ┘à┘è╪º┘ç")}
          className="group relative min-h-[155px] overflow-hidden rounded-3xl border border-green-400/30 bg-white/[0.055] p-4 text-center shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-green-300/70 hover:bg-green-400/[0.08] hover:shadow-[0_18px_50px_rgba(34,197,94,0.14)]"
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-green-300 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-green-300/30 bg-green-400/10 shadow-[0_0_25px_rgba(34,197,94,0.10)]">
            <Coins size={30} className="text-green-300" />
          </div>
          <div className="mt-4 text-2xl font-black text-white">
            ╪¬╪¡╪╡┘è┘ä ┘ü╪º╪¬┘ê╪▒╪⌐ ╪ú┘ê ┘à╪│╪¬╪¡┘é╪º╪¬
          </div>
          <div className="mt-2 text-base font-semibold text-green-200/75">
            ╪¬╪│╪¼┘è┘ä ╪¬╪¡╪╡┘è┘ä ╪º┘ä┘à┘è╪º┘ç╪î ╪º┘ä┘â┘ç╪▒╪¿╪º╪í ╪ú┘ê ┘à╪│╪¬╪¡┘é╪º╪¬ ╪ú╪«╪▒┘ë
          </div>
          <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-green-300/20 bg-green-400/10 px-3 py-1.5 text-sm font-black text-green-200">
            <Users size={15} />
            ╪º╪«╪¬┘è╪º╪▒ ╪º┘ä╪┤┘é┘é
          </div>
        </button>

        {/* 3 - ADD RENT */}
        <button
          type="button"
          onClick={() => openChargeModal("charge", "╪Ñ┘è╪¼╪º╪▒")}
          className="group relative min-h-[155px] overflow-hidden rounded-3xl border border-[#f0ad18]/35 bg-white/[0.055] p-4 text-center shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#f6c84a]/80 hover:bg-[#f0ad18]/[0.08] hover:shadow-[0_18px_50px_rgba(240,173,24,0.16)]"
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#f6c84a] to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#f6c84a]/30 bg-[#f0ad18]/10 shadow-[0_0_25px_rgba(240,173,24,0.10)]">
            <Wallet size={30} className="text-[#f6c84a]" />
          </div>
          <div className="mt-4 text-2xl font-black text-white">
            ╪Ñ╪╢╪º┘ü╪⌐ ╪Ñ┘è╪¼╪º╪▒
          </div>
          <div className="mt-2 text-base font-semibold text-[#f6c84a]/75">
            ╪¬╪│╪¼┘è┘ä ╪º╪│╪¬╪¡┘é╪º┘é ╪Ñ┘è╪¼╪º╪▒ ╪¼╪»┘è╪»
          </div>
          <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-[#f6c84a]/20 bg-[#f0ad18]/10 px-3 py-1.5 text-sm font-black text-[#f6c84a]">
            <Users size={15} />
            ╪º╪«╪¬┘è╪º╪▒ ╪º┘ä╪┤┘é┘é
          </div>
        </button>

        {/* 4 - COLLECT RENT */}
        <button
          type="button"
          onClick={() => openChargeModal("collection", "╪Ñ┘è╪¼╪º╪▒")}
          className="group relative min-h-[155px] overflow-hidden rounded-3xl border border-purple-400/30 bg-white/[0.055] p-4 text-center shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-300/70 hover:bg-purple-400/[0.08] hover:shadow-[0_18px_50px_rgba(168,85,247,0.15)]"
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-300 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-300/30 bg-purple-400/10 shadow-[0_0_25px_rgba(168,85,247,0.10)]">
            <ArrowUpRight size={30} className="text-purple-300" />
          </div>
          <div className="mt-4 text-2xl font-black text-white">
            ╪¬╪¡╪╡┘è┘ä ╪Ñ┘è╪¼╪º╪▒
          </div>
          <div className="mt-2 text-base font-semibold text-purple-200/75">
            ╪¬╪│╪¼┘è┘ä ╪»┘ü╪╣╪⌐ ╪Ñ┘è╪¼╪º╪▒ ┘à╪¡╪╡┘ä╪⌐
          </div>
          <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-400/10 px-3 py-1.5 text-sm font-black text-purple-200">
            <Users size={15} />
            ╪º╪«╪¬┘è╪º╪▒ ╪º┘ä╪┤┘é┘é
          </div>
        </button>

        {/* 5 - APARTMENT TYPES */}
        {canViewApartmentTypes && (
        <button
          type="button"
          onClick={openApartmentTypeModal}
          className="group relative min-h-[155px] overflow-hidden rounded-3xl border border-blue-400/30 bg-white/[0.055] p-4 text-center shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-300/70 hover:bg-blue-400/[0.08] hover:shadow-[0_18px_50px_rgba(59,130,246,0.16)]"
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-300 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-300/30 bg-blue-400/10 shadow-[0_0_25px_rgba(59,130,246,0.10)]">
            <Building2 size={30} className="text-blue-300" />
          </div>
          <div className="mt-4 text-2xl font-black text-white">
            ╪ú┘å┘ê╪º╪╣ ╪º┘ä╪┤┘é┘é
          </div>
          <div className="mt-2 text-base font-semibold text-blue-200/75">
            ╪Ñ╪╢╪º┘ü╪⌐ ╪ú┘å┘ê╪º╪╣ ╪º┘ä╪┤┘é┘é ┘ê╪¬╪¡╪»┘è╪» ╪ú╪▒┘é╪º┘à┘ç╪º ╪»╪º╪«┘ä ╪º┘ä╪╣┘à╪º╪▒╪⌐
          </div>
          <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-sm font-black text-blue-200">
            <Plus size={15} />
            ╪Ñ╪»╪º╪▒╪⌐ ╪º┘ä╪ú┘å┘ê╪º╪╣
          </div>
        </button>
        )}

      </div>

      {/* ===================================================== */}
      {/* BASIC INFO - 6 GLASS CARDS                            */}
      {/* ===================================================== */}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">

        {/* 1 - TOTAL APARTMENTS */}

        <div
          onClick={() => openApartmentReport("total")}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-center shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:border-[#f0ad18]/70 hover:bg-white/[0.07] hover:shadow-[0_16px_45px_rgba(240,173,24,0.12)]">

          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f0ad18]/70 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="mb-3 flex items-center justify-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#f0ad18]/25 bg-[#f0ad18]/10">
              <Building2 size={19} className="text-[#f0ad18]" />
            </div>
            <span className="text-[11px] font-medium text-gray-500">
              01
            </span>
          </div>

          <div className="text-sm font-medium text-gray-300">
            ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪┤┘é┘é
          </div>

          <div className="mt-1 text-3xl font-black leading-none text-[#f0ad18]">
            {totalApartments}
          </div>

          <div className="mt-2 text-xs text-gray-400">
            ╪┤┘é╪⌐
          </div>

        </div>

        {/* 2 - RENTED */}

        <div
          onClick={() => openApartmentReport("rented")}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-center shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:border-green-400/70 hover:bg-white/[0.07] hover:shadow-[0_16px_45px_rgba(34,197,94,0.10)]">

          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-400/70 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="mb-3 flex items-center justify-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-green-400/25 bg-green-400/10">
              <User size={19} className="text-green-400" />
            </div>
            <span className="text-[11px] font-medium text-gray-500">
              02
            </span>
          </div>

          <div className="text-sm font-medium text-gray-300">
            ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪┤┘é┘é ╪º┘ä┘à╪ñ╪¼╪▒╪⌐
          </div>

          <div className="mt-1 text-3xl font-black leading-none text-green-400">
            {rentedApartments}
          </div>

          <div className="mt-2 text-xs text-gray-400">
            ╪┤┘é╪⌐
          </div>

        </div>

        {/* 3 - RESERVED */}

        <div
          onClick={() => openApartmentReport("reserved")}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-center shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:border-blue-400/70 hover:bg-white/[0.07] hover:shadow-[0_16px_45px_rgba(59,130,246,0.10)]">

          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/70 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="mb-3 flex items-center justify-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-400/10">
              <CalendarDays size={19} className="text-blue-400" />
            </div>
            <span className="text-[11px] font-medium text-gray-500">
              03
            </span>
          </div>

          <div className="text-sm font-medium text-gray-300">
            ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪┤┘é┘é ╪º┘ä┘à╪¡╪¼┘ê╪▓╪⌐
          </div>

          <div className="mt-1 text-3xl font-black leading-none text-blue-400">
            {reservedApartments}
          </div>

          <div className="mt-2 text-xs text-gray-400">
            ╪┤┘é╪⌐
          </div>

        </div>

        {/* 4 - MAINTENANCE */}

        <div
          onClick={() => openApartmentReport("maintenance")}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-center shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:border-orange-400/70 hover:bg-white/[0.07] hover:shadow-[0_16px_45px_rgba(251,146,60,0.10)]">

          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/70 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="mb-3 flex items-center justify-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-400/25 bg-orange-400/10">
              <AlertCircle size={19} className="text-orange-400" />
            </div>
            <span className="text-[11px] font-medium text-gray-500">
              04
            </span>
          </div>

          <div className="text-sm font-medium text-gray-300">
            ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪┤┘é┘é ╪¬╪¡╪¬ ╪º┘ä╪╡┘è╪º┘å╪⌐
          </div>

          <div className="mt-1 text-3xl font-black leading-none text-orange-400">
            {maintenanceApartments}
          </div>

          <div className="mt-2 text-xs text-gray-400">
            ╪┤┘é╪⌐
          </div>

        </div>

        {/* 5 - VACANT */}

        <div
          onClick={() => openApartmentReport("vacant")}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-center shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:border-red-400/70 hover:bg-white/[0.07] hover:shadow-[0_16px_45px_rgba(248,113,113,0.10)]">

          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/70 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="mb-3 flex items-center justify-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/25 bg-red-400/10">
              <Home size={19} className="text-red-400" />
            </div>
            <span className="text-[11px] font-medium text-gray-500">
              05
            </span>
          </div>

          <div className="text-sm font-medium text-gray-300">
            ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪┤┘é┘é ╪º┘ä┘ü╪º╪▒╪║╪⌐
          </div>

          <div className="mt-1 text-3xl font-black leading-none text-red-400">
            {vacantApartments}
          </div>

          <div className="mt-2 text-xs text-gray-400">
            ╪┤┘é╪⌐
          </div>

        </div>

        {/* 6 - OCCUPANCY */}

        <div
          onClick={() => openApartmentReport("occupancy")}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-center shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:border-[#f6c84a]/70 hover:bg-white/[0.07] hover:shadow-[0_16px_45px_rgba(246,200,74,0.12)]">

          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f6c84a]/70 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="mb-3 flex items-center justify-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#f6c84a]/25 bg-[#f6c84a]/10">
              <CheckCircle2 size={19} className="text-[#f6c84a]" />
            </div>
            <span className="text-[11px] font-medium text-gray-500">
              06
            </span>
          </div>

          <div className="text-sm font-medium text-gray-300">
            ┘å╪│╪¿╪⌐ ╪º┘ä╪Ñ╪┤╪║╪º┘ä
          </div>

          <div className="mt-1 text-3xl font-black leading-none text-[#f6c84a]">
            {occupancyRate}%
          </div>

          <div className="mt-2 text-xs text-gray-400">
            ┘à┘å ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪┤┘é┘é
          </div>

        </div>

      </div>


      {/* ===================================================== */}
      {/* MONTHLY FINANCIAL SUMMARY - 8 LARGE GLASS CARDS        */}
      {/* ===================================================== */}

      <div className="mb-6 rounded-3xl border border-emerald-400/20 bg-[#06382b]/70 p-4 shadow-[0_14px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-5">
        <div className="relative mb-5 min-h-[76px]">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-32 text-center">
            <div>
              <h2 className="text-xl font-black text-[#f6c84a]">
                ╪Ñ╪¼┘à╪º┘ä┘è╪º╪¬ ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ┘ê╪º┘ä╪¬╪¡╪╡┘è┘ä╪º╪¬ ╪¡╪│╪¿ ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐
              </h2>
              <p className="mt-1 text-sm font-semibold text-gray-400">
                ╪º┘ä┘à┘ä╪«╪╡ ╪º┘ä┘à╪º┘ä┘è ┘ä┘ä┘ü╪¬╪▒╪⌐
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={openFinancialMovementsDetails}
                className="flex min-h-[46px] items-center gap-2 rounded-2xl border border-[#f0ad18]/45 bg-[#f0ad18]/10 px-5 py-3 text-sm font-black text-[#f6c84a] shadow-[0_8px_24px_rgba(240,173,24,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f6c84a]/80 hover:bg-[#f0ad18]/20 hover:shadow-[0_10px_28px_rgba(240,173,24,0.14)]"
              >
                <ArrowUpRight size={19} />
                ╪╣╪▒╪╢ ╪º┘ä╪¬┘ü╪º╪╡┘è┘ä ╪º┘ä┘à╪º┘ä┘è╪⌐
              </button>

              <button
                type="button"
                onClick={openTenantDetails}
                className="flex min-h-[46px] items-center gap-2 rounded-2xl border border-cyan-400/40 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-300 shadow-[0_8px_24px_rgba(34,211,238,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/80 hover:bg-cyan-400/20 hover:shadow-[0_10px_28px_rgba(34,211,238,0.14)]"
              >
                <Users size={19} />
                ╪¬┘ü╪º╪╡┘è┘ä ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒┘è┘å
              </button>
            </div>

            <div className="w-full max-w-[560px] ml-auto grid grid-cols-2 gap-3">
            <label className="text-center text-xs font-bold text-gray-400">
              ┘à┘å ╪¬╪º╪▒┘è╪«
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07182b] px-3 py-2.5 text-center text-sm font-bold text-white outline-none transition focus:border-[#f0ad18]/60"
              />
            </label>

            <label className="text-center text-xs font-bold text-gray-400">
              ╪Ñ┘ä┘ë ╪¬╪º╪▒┘è╪«
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07182b] px-3 py-2.5 text-center text-sm font-bold text-white outline-none transition focus:border-[#f0ad18]/60"
              />
            </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* 1 - TOTAL CHARGES */}
          <div
            onClick={() => {
              setMonthlyReportType("total");
              setIsMonthlyDueReportOpen(true);
            }}
            className="group relative min-h-[150px] cursor-pointer overflow-hidden rounded-3xl border border-orange-400/25 bg-white/[0.045] p-5 text-center shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-orange-300/60 hover:bg-orange-400/[0.06]"
          >
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-70" />
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-400/25 bg-orange-400/10">
              <FileText size={23} className="text-orange-300" />
            </div>
            <div className="mt-3 text-base font-black text-gray-100">
              ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ┘ä┘ä╪┤┘ç╪▒
            </div>
            <div className="mt-3 text-3xl font-black text-orange-300">
              {getMonthlyDueTotal().toLocaleString("ar-SA")}{" "}
              <span className="text-xs font-bold text-gray-500">╪▒┘è╪º┘ä</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-gray-400">
              ╪¡╪│╪¿ ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐
            </div>
          </div>

          {/* 2 - TOTAL RENT DUE */}
          <div
            onClick={() => {
              setMonthlyReportType("rent");
              setIsMonthlyDueReportOpen(true);
            }}
            className="group relative min-h-[150px] cursor-pointer overflow-hidden rounded-3xl border border-[#f0ad18]/30 bg-white/[0.045] p-5 text-center shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#f6c84a]/70 hover:bg-[#f0ad18]/[0.06]"
          >
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#f6c84a] to-transparent opacity-70" />
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-[#f6c84a]/25 bg-[#f0ad18]/10">
              <Wallet size={23} className="text-[#f6c84a]" />
            </div>
            <div className="mt-3 text-base font-black text-gray-100">
              ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪Ñ┘è╪¼╪º╪▒╪º╪¬ ╪º┘ä┘à╪│╪¬╪¡┘é╪⌐ ┘ä┘ä╪┤┘ç╪▒
            </div>
            <div className="mt-3 text-3xl font-black text-[#f6c84a]">
              {getMonthlyRentDueTotal().toLocaleString("ar-SA")}{" "}
              <span className="text-xs font-bold text-gray-500">╪▒┘è╪º┘ä</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-gray-400">
              ╪º┘ä┘à╪│╪¬╪¡┘é ╪¡╪¬┘ë ╪º┘ä╪┤┘ç╪▒ ╪º┘ä╪¡╪º┘ä┘è ┘ü┘é╪╖ ΓÇö ╪º┘ä╪┤┘ç┘ê╪▒ ╪º┘ä╪│╪º╪¿┘é╪⌐ + ╪º┘ä╪┤┘ç╪▒ ╪º┘ä╪¡╪º┘ä┘è
            </div>
          </div>

          {/* 3 - ELECTRICITY BILLS */}
          <div
            onClick={() => {
              setMonthlyReportType("electricity");
              setIsMonthlyDueReportOpen(true);
            }}
            className="group relative min-h-[150px] cursor-pointer overflow-hidden rounded-3xl border border-yellow-400/25 bg-white/[0.045] p-5 text-center shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-yellow-300/60 hover:bg-yellow-400/[0.06]"
          >
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-70" />
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-yellow-400/25 bg-yellow-400/10">
              <Zap size={23} className="text-yellow-300" />
            </div>
            <div className="mt-3 text-base font-black text-gray-100">
              ╪Ñ╪¼┘à╪º┘ä┘è ┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä┘â┘ç╪▒╪¿╪º╪í ┘ä┘ä╪┤┘ç╪▒
            </div>
            <div className="mt-3 text-3xl font-black text-yellow-300">
              {getBuildingChargesForPeriod()
                .filter((charge) => charge.type?.trim() === "┘ü╪º╪¬┘ê╪▒╪⌐ ┘â┘ç╪▒╪¿╪º╪í")
                .reduce(
                  (sum, charge) => sum + (Number(charge.amount) || 0),
                  0
                )
                .toLocaleString("ar-SA")}{" "}
              <span className="text-xs font-bold text-gray-500">╪▒┘è╪º┘ä</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-gray-400">
              ╪º┘ä┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä┘à╪»╪«┘ä╪⌐ ┘ê╪º┘ä┘à╪│╪¬╪¡┘é╪⌐ ╪«┘ä╪º┘ä ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐
            </div>
          </div>

          {/* 4 - WATER BILLS */}
          <div
            onClick={() => {
              setMonthlyReportType("water");
              setIsMonthlyDueReportOpen(true);
            }}
            className="group relative min-h-[150px] cursor-pointer overflow-hidden rounded-3xl border border-cyan-400/25 bg-white/[0.045] p-5 text-center shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/60 hover:bg-cyan-400/[0.06]"
          >
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-70" />
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10">
              <Droplets size={23} className="text-cyan-300" />
            </div>
            <div className="mt-3 text-base font-black text-gray-100">
              ╪Ñ╪¼┘à╪º┘ä┘è ┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä┘à┘è╪º┘ç ┘ä┘ä╪┤┘ç╪▒
            </div>
            <div className="mt-3 text-3xl font-black text-cyan-300">
              {getBuildingChargesForPeriod()
                .filter((charge) => charge.type?.trim() === "┘ü╪º╪¬┘ê╪▒╪⌐ ┘à┘è╪º┘ç")
                .reduce(
                  (sum, charge) => sum + (Number(charge.amount) || 0),
                  0
                )
                .toLocaleString("ar-SA")}{" "}
              <span className="text-xs font-bold text-gray-500">╪▒┘è╪º┘ä</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-gray-400">
              ╪º┘ä┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä┘à╪»╪«┘ä╪⌐ ┘ê╪º┘ä┘à╪│╪¬╪¡┘é╪⌐ ╪«┘ä╪º┘ä ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐
            </div>
          </div>

          {/* 5 - CHARGE COLLECTIONS */}
          <div
            onClick={() => {
              setMonthlyCollectionReportType("total");
              setIsMonthlyCollectionReportOpen(true);
            }}
            className="group relative min-h-[150px] cursor-pointer overflow-hidden rounded-3xl border border-green-400/25 bg-white/[0.045] p-5 text-center shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-green-300/60 hover:bg-green-400/[0.06]"
          >
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-green-300 to-transparent opacity-70" />
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-green-400/25 bg-green-400/10">
              <Coins size={23} className="text-green-300" />
            </div>
            <div className="mt-3 text-base font-black text-gray-100">
              ╪Ñ╪¼┘à╪º┘ä┘è ╪¬╪¡╪╡┘è┘ä╪º╪¬ ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ┘ä┘ä╪┤┘ç╪▒
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-green-400/15 bg-green-400/[0.06] p-2">
                <div className="text-xs font-bold text-gray-400">╪º┘ä┘à╪¡╪╡┘ä</div>
                <div className="mt-1 text-xl font-black text-green-300">
                  {getMonthlyCollectionReportData().collectedTotal.toLocaleString("ar-SA")}
                </div>
              </div>
              <div className="rounded-xl border border-red-400/15 bg-red-400/[0.06] p-2">
                <div className="text-xs font-bold text-gray-400">╪º┘ä┘à╪¬╪¿┘é┘è</div>
                <div className="mt-1 text-xl font-black text-red-300">
                  {getMonthlyCollectionReportData().remainingTotal.toLocaleString("ar-SA")}
                </div>
              </div>
            </div>
          </div>

          {/* 6 - RENT COLLECTIONS */}
          <div
            onClick={() => {
              setMonthlyCollectionReportType("rent");
              setIsMonthlyCollectionReportOpen(true);
            }}
            className="group relative min-h-[150px] cursor-pointer overflow-hidden rounded-3xl border border-purple-400/25 bg-white/[0.045] p-5 text-center shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-300/60 hover:bg-purple-400/[0.06]"
          >
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-300 to-transparent opacity-70" />
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-purple-400/25 bg-purple-400/10">
              <Banknote size={23} className="text-purple-300" />
            </div>
            <div className="mt-3 text-base font-black text-gray-100">
              ╪Ñ╪¼┘à╪º┘ä┘è ╪¬╪¡╪╡┘è┘ä╪º╪¬ ╪º┘ä╪Ñ┘è╪¼╪º╪▒╪º╪¬ ┘ä┘ä╪┤┘ç╪▒
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-green-400/15 bg-green-400/[0.06] p-2">
                <div className="text-xs font-bold text-gray-400">╪º┘ä┘à╪¡╪╡┘ä</div>
                <div className="mt-1 text-xl font-black text-green-300">
                  {(() => {
                    const collections = getBuildingCollectionsForPeriod()
                      .filter((collection) => collection.type?.trim() === "╪Ñ┘è╪¼╪º╪▒");
                    return collections
                      .reduce((sum, collection) => sum + (Number(collection.amount) || 0), 0)
                      .toLocaleString("ar-SA");
                  })()}
                </div>
              </div>
              <div className="rounded-xl border border-red-400/15 bg-red-400/[0.06] p-2">
                <div className="text-xs font-bold text-gray-400">╪º┘ä┘à╪¬╪¿┘é┘è</div>
                <div className="mt-1 text-xl font-black text-red-300">
                  {Math.max(
                    getMonthlyRentRows().reduce((sum, row) => sum + row.amount, 0) -
                      getBuildingCollectionsForPeriod()
                        .filter((collection) => collection.type?.trim() === "╪Ñ┘è╪¼╪º╪▒")
                        .reduce((sum, collection) => sum + (Number(collection.amount) || 0), 0),
                    0
                  ).toLocaleString("ar-SA")}
                </div>
              </div>
            </div>
          </div>

          {/* 7 - ELECTRICITY COLLECTIONS / REMAINING */}
          <div
            onClick={() => {
              setMonthlyCollectionReportType("electricity");
              setIsMonthlyCollectionReportOpen(true);
            }}
            className="group relative min-h-[150px] cursor-pointer overflow-hidden rounded-3xl border border-amber-400/25 bg-white/[0.045] p-5 text-center shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/60 hover:bg-amber-400/[0.06]"
          >
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-70" />
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/25 bg-amber-400/10">
              <Zap size={23} className="text-amber-300" />
            </div>
            <div className="mt-3 text-base font-black text-gray-100">
              ╪¬╪¡╪╡┘è┘ä╪º╪¬ ┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä┘â┘ç╪▒╪¿╪º╪í ┘ê╪º┘ä┘à╪¬╪¿┘é┘è
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-green-400/15 bg-green-400/[0.06] p-2">
                <div className="text-xs font-bold text-gray-400">╪º┘ä┘à╪¡╪╡┘ä</div>
                <div className="mt-1 text-xl font-black text-green-300">
                  {getBuildingCollectionsForPeriod()
                    .filter((collection) => collection.type?.trim() === "┘ü╪º╪¬┘ê╪▒╪⌐ ┘â┘ç╪▒╪¿╪º╪í")
                    .reduce((sum, collection) => sum + (Number(collection.amount) || 0), 0)
                    .toLocaleString("ar-SA")}
                </div>
              </div>
              <div className="rounded-xl border border-red-400/15 bg-red-400/[0.06] p-2">
                <div className="text-xs font-bold text-gray-400">╪º┘ä┘à╪¬╪¿┘é┘è</div>
                <div className="mt-1 text-xl font-black text-red-300">
                  {Math.max(
                    getBuildingChargesForPeriod()
                      .filter((charge) => charge.type?.trim() === "┘ü╪º╪¬┘ê╪▒╪⌐ ┘â┘ç╪▒╪¿╪º╪í")
                      .reduce((sum, charge) => sum + (Number(charge.amount) || 0), 0) -
                      getBuildingCollectionsForPeriod()
                        .filter((collection) => collection.type?.trim() === "┘ü╪º╪¬┘ê╪▒╪⌐ ┘â┘ç╪▒╪¿╪º╪í")
                        .reduce((sum, collection) => sum + (Number(collection.amount) || 0), 0),
                    0
                  ).toLocaleString("ar-SA")}
                </div>
              </div>
            </div>
          </div>

          {/* 8 - WATER COLLECTIONS / REMAINING */}
          <div
            onClick={() => {
              setMonthlyCollectionReportType("water");
              setIsMonthlyCollectionReportOpen(true);
            }}
            className="group relative min-h-[150px] cursor-pointer overflow-hidden rounded-3xl border border-blue-400/25 bg-white/[0.045] p-5 text-center shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-300/60 hover:bg-blue-400/[0.06]"
          >
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-300 to-transparent opacity-70" />
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-400/25 bg-blue-400/10">
              <Droplets size={23} className="text-blue-300" />
            </div>
            <div className="mt-3 text-base font-black text-gray-100">
              ╪¬╪¡╪╡┘è┘ä╪º╪¬ ┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä┘à┘è╪º┘ç ┘ê╪º┘ä┘à╪¬╪¿┘é┘è
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-green-400/15 bg-green-400/[0.06] p-2">
                <div className="text-xs font-bold text-gray-400">╪º┘ä┘à╪¡╪╡┘ä</div>
                <div className="mt-1 text-xl font-black text-green-300">
                  {getBuildingCollectionsForPeriod()
                    .filter((collection) => collection.type?.trim() === "┘ü╪º╪¬┘ê╪▒╪⌐ ┘à┘è╪º┘ç")
                    .reduce((sum, collection) => sum + (Number(collection.amount) || 0), 0)
                    .toLocaleString("ar-SA")}
                </div>
              </div>
              <div className="rounded-xl border border-red-400/15 bg-red-400/[0.06] p-2">
                <div className="text-xs font-bold text-gray-400">╪º┘ä┘à╪¬╪¿┘é┘è</div>
                <div className="mt-1 text-xl font-black text-red-300">
                  {Math.max(
                    getBuildingChargesForPeriod()
                      .filter((charge) => charge.type?.trim() === "┘ü╪º╪¬┘ê╪▒╪⌐ ┘à┘è╪º┘ç")
                      .reduce((sum, charge) => sum + (Number(charge.amount) || 0), 0) -
                      getBuildingCollectionsForPeriod()
                        .filter((collection) => collection.type?.trim() === "┘ü╪º╪¬┘ê╪▒╪⌐ ┘à┘è╪º┘ç")
                        .reduce((sum, collection) => sum + (Number(collection.amount) || 0), 0),
                    0
                  ).toLocaleString("ar-SA")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================== */}
      {/* APARTMENT TYPES                                       */}
      {/* ===================================================== */}

      <div className="mb-6 rounded-2xl border border-emerald-400/25 bg-[#06382b]/80 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.16)] backdrop-blur-xl">

        <h2 className="mb-6 text-center text-2xl font-bold text-[#f0ad18]">
          ╪ú┘å┘ê╪º╪╣ ╪º┘ä╪┤┘é┘é ┘ê╪ú╪│╪╣╪º╪▒ ╪º┘ä╪Ñ┘è╪¼╪º╪▒
        </h2>

        {(() => {
          const apartmentTypeGroups = availableApartmentTypes
            .map((type) => {
              const typeApartments = apartments.filter(
                (apartment) => getApartmentType(apartment) === type
              );

              if (typeApartments.length === 0) {
                return null;
              }

              const rent = getApartmentRent(typeApartments[0]);
              const totalRent = typeApartments.reduce(
                (sum, apartment) => sum + getApartmentRent(apartment),
                0
              );

              const statuses = Array.from(
                new Set([
                  ...availableApartmentStatuses,
                  ...typeApartments.map((apartment) => apartment.status),
                ])
              )
                .map((status) => ({
                  status,
                  count: typeApartments.filter(
                    (apartment) => apartment.status === status
                  ).length,
                }))
                .filter((item) => item.count > 0);

              return {
                type,
                apartments: typeApartments,
                rent,
                totalRent,
                statuses,
              };
            })
            .filter(
              (
                group
              ): group is {
                type: string;
                apartments: Apartment[];
                rent: number;
                totalRent: number;
                statuses: { status: string; count: number }[];
              } => group !== null
            );

          return (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {apartmentTypeGroups.map((group) => {
                const percentage =
                  totalApartments > 0
                    ? Math.min(
                        (group.apartments.length / totalApartments) * 100,
                        100
                      )
                    : 0;

                return (
                  <div
                    key={group.type}
                    onClick={() => setSelectedApartmentTypeReport(group.type)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedApartmentTypeReport(group.type);
                      }
                    }}
                    className="cursor-pointer rounded-2xl border border-[#173858] bg-[#07182b] p-5 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-[#f0ad18]/60 hover:shadow-[0_15px_45px_rgba(0,0,0,0.25)] focus:outline-none focus:ring-2 focus:ring-[#f0ad18]/60"
                  >
                    <div className="mb-5 rounded-2xl border border-[#173858] bg-[#0b2039] p-5 text-center">
                      <h3 className="text-2xl font-black text-white">
                        {group.type}
                      </h3>

                      <p className="mt-2 text-sm font-semibold text-gray-400">
                        ╪¬┘ü╪º╪╡┘è┘ä ╪º┘ä┘å┘ê╪╣
                      </p>
                    </div>

                    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/5 bg-[#0b2039] p-4 text-center">
                        <p className="text-sm font-semibold text-gray-400">
                          ╪╣╪»╪» ╪º┘ä╪┤┘é┘é
                        </p>

                        <p className="mt-2 text-2xl font-black text-white">
                          {group.apartments.length.toLocaleString("en-US")}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          ╪┤┘é╪⌐
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#f0ad18]/20 bg-[#0b2039] p-4 text-center">
                        <p className="text-sm font-semibold text-gray-400">
                          ╪Ñ┘è╪¼╪º╪▒ ╪º┘ä╪┤┘é╪⌐
                        </p>

                        <p className="mt-2 text-2xl font-black text-[#f0ad18]">
                          {group.rent.toLocaleString("en-US")}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          ╪▒┘è╪º┘ä / ╪┤┘ç╪▒┘è┘ï╪º
                        </p>
                      </div>

                      <div className="rounded-xl border border-green-400/20 bg-[#0b2039] p-4 text-center">
                        <p className="text-sm font-semibold text-gray-400">
                          ╪Ñ╪¼┘à╪º┘ä┘è ╪Ñ┘è╪¼╪º╪▒ ╪º┘ä┘å┘ê╪╣
                        </p>

                        <p className="mt-2 text-2xl font-black text-green-400">
                          {group.totalRent.toLocaleString("en-US")}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          ╪▒┘è╪º┘ä / ╪┤┘ç╪▒┘è┘ï╪º
                        </p>
                      </div>
                    </div>

                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="text-base font-black text-white">
                        ╪¬┘ê╪▓┘è╪╣ ╪º┘ä╪┤┘é┘é ╪¡╪│╪¿ ╪º┘ä╪¡╪º┘ä╪⌐
                      </h4>

                      <span className="rounded-full border border-[#f0ad18]/20 bg-[#f0ad18]/10 px-3 py-1 text-xs font-bold text-[#f0ad18]">
                        {percentage.toFixed(1)}% ┘à┘å ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪┤┘é┘é
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                      {group.statuses.map((item) => {
                        const isVacant = item.status === "╪┤╪º╪║╪▒╪⌐";
                        const isCompany = item.status === "┘à╪ñ╪¼╪▒╪⌐ ┘ä┘ä╪┤╪▒┘â╪⌐";
                        const isReserved = item.status === "┘à╪¡╪¼┘ê╪▓╪⌐";
                        const isMaintenance = item.status === "╪¬╪¡╪¬ ╪º┘ä╪╡┘è╪º┘å╪⌐";

                        const statusLabel = isVacant
                          ? "┘ü╪º╪▒╪║╪⌐"
                          : item.status;

                        const statusClass = isVacant
                          ? "border-red-400/20 bg-red-500/10 text-red-300"
                          : isCompany
                          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                          : isReserved
                          ? "border-blue-400/20 bg-blue-500/10 text-blue-300"
                          : isMaintenance
                          ? "border-yellow-400/20 bg-yellow-500/10 text-yellow-300"
                          : "border-green-400/20 bg-green-500/10 text-green-300";

                        return (
                          <div
                            key={`${group.type}-${item.status}`}
                            className={`flex min-h-[48px] items-center justify-between gap-3 rounded-xl border px-4 py-3 ${statusClass}`}
                          >
                            <span className="font-bold">
                              {statusLabel}
                            </span>

                            <span className="font-black">
                              {item.count.toLocaleString("en-US")} ╪┤┘é╪⌐
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#173858]">
                      <div
                        className="h-full rounded-full bg-[#f0ad18] transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

      </div>

      {/* ===================================================== */}

      {/* APARTMENT MAP */}
      <div className="rounded-2xl border border-emerald-400/25 bg-[#06382b]/80 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:p-6">
        <button
          type="button"
          onClick={() => {
            const buildingId = getCurrentBuildingIdFromPath();
            if (!buildingId) {
              window.alert("┘ä┘à ┘è╪¬┘à ╪º┘ä╪¬╪╣╪▒┘ü ╪╣┘ä┘ë ╪▒┘é┘à ╪º┘ä╪╣┘à╪º╪▒╪⌐ ┘à┘å ╪º┘ä╪▒╪º╪¿╪╖.");
              return;
            }
            window.location.href = `/buildings/${buildingId}/apartments`;
          }}
          className="group flex w-full flex-col items-center justify-center rounded-2xl border border-[#d89b18]/70 bg-gradient-to-br from-[#0a4a38] via-[#073b2d] to-[#05291f] px-6 py-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#f6c84a] hover:shadow-[0_0_40px_rgba(216,155,24,0.14)]"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d89b18]/60 bg-[#d89b18]/10 text-[#f6c84a] transition-transform duration-300 group-hover:scale-105">
            <Building2 size={34} />
          </div>
          <h2 className="text-3xl font-black text-[#f6c84a]">╪«╪▒┘è╪╖╪⌐ ╪º┘ä╪┤┘é┘é</h2>
          <p className="mt-2 text-base font-semibold text-gray-300">
            ╪º╪╢╪║╪╖ ┘ç┘å╪º ┘ä┘ü╪¬╪¡ ╪╡┘ü╪¡╪⌐ ╪«╪▒┘è╪╖╪⌐ ╪º┘ä╪┤┘é┘é ┘ê╪Ñ╪»╪º╪▒╪⌐ ╪¼┘à┘è╪╣ ╪º┘ä╪┤┘é┘é ┘ê╪¬┘ü╪º╪╡┘è┘ä┘ç╪º
          </p>
          <div className="mt-5 rounded-xl border border-[#d89b18]/40 bg-[#d89b18]/10 px-6 py-3 text-sm font-black text-[#f6c84a]">
            ┘ü╪¬╪¡ ╪«╪▒┘è╪╖╪⌐ ╪º┘ä╪┤┘é┘é ΓåÉ
          </div>
        </button>
      </div>

      {/* DELETE APARTMENTS MODAL                                */}
      {/* ===================================================== */}

      {isDeleteApartmentModalOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-3 backdrop-blur-xl sm:p-5"
          onClick={closeDeleteApartmentModal}
        >
          <div
            dir="rtl"
            className="relative flex max-h-[calc(100vh-24px)] w-full max-w-[760px] flex-col overflow-hidden rounded-[30px] border border-red-400/55 bg-[#061426]/[0.97] shadow-[0_0_100px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-red-400 to-transparent" />

            <div className="shrink-0 border-b border-white/10 bg-gradient-to-r from-[#050d18] via-[#25131b] to-[#061426] px-5 py-4 sm:px-7">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-red-400/40 bg-red-400/10 text-red-300">
                    <Trash2 size={29} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-black text-red-300 sm:text-2xl">
                      ╪¡╪░┘ü ╪º┘ä╪┤┘é┘é
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-gray-400">
                      ╪º╪«╪¬╪▒ ╪┤┘é╪⌐ ╪ú┘ê ╪ú┘â╪½╪▒ ╪½┘à ╪º╪╢╪║╪╖ ╪¬╪ú┘â┘è╪» ╪º┘ä╪¡╪░┘ü
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeDeleteApartmentModal}
                  aria-label="╪Ñ╪║┘ä╪º┘é"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-400"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={toggleAllDeleteApartments}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 text-sm font-black text-red-300 transition hover:bg-red-400/20"
                >
                  <Check size={18} />
                  {filteredDeleteApartments.length > 0 &&
                  filteredDeleteApartments.every((apartment) =>
                    selectedDeleteApartments.includes(apartment.number)
                  )
                    ? "╪Ñ┘ä╪║╪º╪í ╪¬╪¡╪»┘è╪» ╪º┘ä┘â┘ä"
                    : "╪¬╪¡╪»┘è╪» ╪º┘ä┘â┘ä"}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDeleteApartments([])}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-bold text-gray-400 transition hover:bg-white/10 hover:text-white"
                >
                  ╪Ñ┘ä╪║╪º╪í ╪º┘ä╪¬╪¡╪»┘è╪»
                </button>

                <div className="flex h-12 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/[0.05] px-5 text-sm font-black text-red-300">
                  {selectedDeleteApartments.length} ┘à╪¡╪»╪»╪⌐
                </div>
              </div>

              <div className="relative mb-4">
                <Search
                  size={19}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  value={deleteApartmentSearch}
                  onChange={(event) =>
                    setDeleteApartmentSearch(event.target.value)
                  }
                  placeholder="╪º╪¿╪¡╪½ ╪¿╪▒┘é┘à ╪º┘ä╪┤┘é╪⌐ ╪ú┘ê ┘å┘ê╪╣┘ç╪º..."
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#07182b] pl-4 pr-11 text-sm font-semibold text-white outline-none transition placeholder:text-gray-600 focus:border-red-400/50"
                />
              </div>

              <div className="max-h-[480px] overflow-y-auto rounded-2xl border border-white/5 bg-[#061426]/60 p-2 scrollbar-thin">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {filteredDeleteApartments.map((apartment) => {
                    const isSelected = selectedDeleteApartments.includes(
                      apartment.number
                    );

                    return (
                      <button
                        key={apartment.number}
                        type="button"
                        onClick={() => toggleDeleteApartment(apartment.number)}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-right transition ${
                          isSelected
                            ? "border-red-400/40 bg-red-400/10"
                            : "border-transparent bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.045]"
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition ${
                            isSelected
                              ? "border-red-300 bg-red-300 text-[#07182b]"
                              : "border-gray-600 bg-transparent text-transparent"
                          }`}
                        >
                          <Check size={16} strokeWidth={3} />
                        </span>

                        <span className="flex-1">
                          <span className="flex items-center justify-between gap-3">
                            <span className="text-base font-black text-white">
                              ╪┤┘é╪⌐ {apartment.number}
                            </span>
                            <span className="text-sm font-bold text-gray-300">
                              {getApartmentType(apartment)}
                            </span>
                          </span>
                          <span className="mt-1 block text-xs font-semibold text-gray-500">
                            ╪Ñ┘è╪¼╪º╪▒ {getApartmentRent(apartment).toLocaleString("ar-SA")} ╪▒┘è╪º┘ä
                          </span>
                        </span>
                      </button>
                    );
                  })}

                  {filteredDeleteApartments.length === 0 && (
                    <div className="col-span-full py-10 text-center text-sm font-semibold text-gray-500">
                      ┘ä╪º ╪¬┘ê╪¼╪» ╪┤┘é┘é ┘à╪╖╪º╪¿┘é╪⌐ ┘ä┘ä╪¿╪¡╪½
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-white/10 bg-[#061426] p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={deleteSelectedApartments}
                  className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-red-400/40 bg-gradient-to-r from-red-700 to-red-500 px-5 text-base font-black text-white shadow-[0_8px_30px_rgba(239,68,68,0.16)] transition hover:brightness-110 sm:text-lg"
                >
                  <Trash2 size={21} />
                  ╪¬╪ú┘â┘è╪» ╪¡╪░┘ü ╪º┘ä╪┤┘é┘é ╪º┘ä┘à╪¡╪»╪»╪⌐
                </button>

                <button
                  type="button"
                  onClick={closeDeleteApartmentModal}
                  className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 text-base font-black text-gray-300 transition hover:bg-white/10 hover:text-white sm:text-lg"
                >
                  <X size={21} />
                  ╪Ñ╪║┘ä╪º┘é
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* APARTMENT DETAILS MODAL                               */}
      {/* ===================================================== */}

      {selectedApartment && (

        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-2 backdrop-blur-md sm:p-4"
          onClick={closeApartment}
        >

          <div
            className="relative flex max-h-[calc(100vh-16px)] w-full max-w-[1420px] flex-col overflow-hidden rounded-[28px] border border-[#d89b18]/70 bg-[#061426]/98 shadow-[0_0_80px_rgba(216,155,24,0.18)] sm:max-h-[calc(100vh-32px)]"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* GOLD LINE */}

            <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#f6c84a] to-transparent" />

            {/* ================================================= */}
            {/* MODAL HEADER                                      */}
            {/* ================================================= */}

            <div className="relative border-b border-white/10 bg-gradient-to-r from-[#050d18] via-[#0a2038] to-[#071a2d] px-5 py-3 lg:px-7">
              <div className="relative flex min-h-[58px] items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={closeApartment}
                  aria-label="╪Ñ╪║┘ä╪º┘é"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-400"
                >
                  <X size={25} />
                </button>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <h2 className="text-2xl font-bold text-[#f6c84a] lg:text-3xl">
                    ╪¬┘ü╪º╪╡┘è┘ä ╪º┘ä╪┤┘é╪⌐
                  </h2>
                  <p className="mt-1 text-base font-semibold text-gray-300 lg:text-lg">
                    {buildingName}
                  </p>
                </div>

                <div className="mr-auto flex items-center gap-3 text-right">
                  <div className="hidden sm:block">
                    <div className="text-xl font-black tracking-[0.08em] text-white lg:text-2xl">
                      TUMOUH STAR
                    </div>
                    <div className="text-sm font-semibold text-[#d89b18]">
                      ╪╖┘à┘ê╪¡ ╪│╪¬╪º╪▒
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#f0ad18]/40 bg-[#f0ad18]/10 shadow-[0_0_25px_rgba(240,173,24,0.12)]">
                    <Building2 size={25} className="text-[#f0ad18]" />
                  </div>
                </div>
              </div>
            </div>

            {/* ================================================= */}
            {/* MODAL HERO                                         */}
            {/* ================================================= */}

            <div className="grid shrink-0 grid-cols-1 gap-4 border-b border-white/10 bg-[#06182c] p-4 lg:grid-cols-[330px_1fr] lg:p-5" dir="ltr">
              <div className="relative min-h-[220px] overflow-hidden rounded-3xl border border-[#d89b18]/30 bg-[#0a1e33]">
                <img
                  src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85"
                  alt="╪╡┘ê╪▒╪⌐ ╪º┘ä╪┤┘é╪⌐"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020813]/95 via-[#061426]/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-right" dir="rtl">
                  <div className="text-sm font-medium text-gray-300">╪┤┘é╪⌐ ╪▒┘é┘à</div>
                  <div className="mt-1 text-[76px] font-black leading-none text-[#f6c84a] drop-shadow-[0_0_25px_rgba(246,200,74,0.25)]">
                    {selectedApartment.number}
                  </div>
                  <div className={`mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold backdrop-blur-md ${getStatusColor(selectedApartment.status).badge}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${getStatusColor(selectedApartment.status).dot}`} />
                    {selectedApartment.status}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="flex h-full min-h-0 flex-col gap-3">
                  <div className="flex flex-1 flex-col justify-between rounded-2xl border border-[#2a5275] bg-white/[0.035] p-3 text-center backdrop-blur-xl transition hover:border-[#f0ad18]/50">
                    <div className="mb-2 flex flex-col items-center justify-center gap-1.5">
                      <span className="text-sm font-semibold text-gray-300">
                        ┘å┘ê╪╣ ╪º┘ä╪┤┘é╪⌐
                      </span>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/10">
                        <Home size={19} className="text-blue-400" />
                      </div>
                    </div>

                    <select
                      value={getApartmentType(selectedApartment)}
                      onChange={(event) =>
                        updateApartmentType(
                          selectedApartment,
                          event.target.value
                        )
                      }
                      disabled={!canEditApartmentTypes}
                      className="mx-auto block w-full max-w-[230px] rounded-xl border border-white/10 bg-[#0b2039] px-3 py-2 text-center text-sm font-bold text-white outline-none transition focus:border-blue-400/60"
                    >
                      <option value="╪║╪▒┘ü╪¬┘è┘å ┘ê╪╡╪º┘ä╪⌐">
                        ╪║╪▒┘ü╪¬┘è┘å ┘ê╪╡╪º┘ä╪⌐
                      </option>
                      <option value="╪║╪▒┘ü╪⌐ ┘ê╪╡╪º┘ä╪⌐">
                        ╪║╪▒┘ü╪⌐ ┘ê╪╡╪º┘ä╪⌐
                      </option>

                      {customApartmentTypes
                        .filter(
                          (type) =>
                            type !== "╪║╪▒┘ü╪¬┘è┘å ┘ê╪╡╪º┘ä╪⌐" &&
                            type !== "╪║╪▒┘ü╪⌐ ┘ê╪╡╪º┘ä╪⌐"
                        )
                        .map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}

                      <option value="__add_new__">
                        + ╪Ñ╪╢╪º┘ü╪⌐ ┘å┘ê╪╣ ╪¼╪»┘è╪»
                      </option>
                    </select>

                    <div className="mt-1 text-xs text-gray-500">

                    </div>
                  </div>

                  {(() => {
                    const statusCard = getApartmentStatusCard(
                      selectedApartment.status
                    );
                    const StatusIcon = statusCard.icon;

                    return (
                      <div className="flex flex-1 flex-col justify-between rounded-2xl border border-[#2a5275] bg-white/[0.035] p-3 text-center backdrop-blur-xl transition hover:border-[#f0ad18]/50">
                        <div className="flex items-center justify-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${statusCard.iconBorder} ${statusCard.iconBg}`}
                          >
                            <StatusIcon
                              size={19}
                              className={statusCard.iconClass}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-300">
                            ╪¡╪º┘ä╪⌐ ╪º┘ä╪┤┘é╪⌐
                          </span>
                        </div>

                        <select
                          value={selectedApartment.status}
                          onChange={(event) =>
                            handleApartmentStatusChange(
                              selectedApartment,
                              event.target.value
                            )
                          }
                          className={`mx-auto mt-2 block w-full max-w-[230px] rounded-xl border bg-[#071a2d] px-3 py-2 text-center text-sm font-black outline-none transition ${statusCard.iconBorder} ${statusCard.valueClass}`}
                        >
                          <option className="bg-[#071a2d] text-white" value="┘à╪ñ╪¼╪▒╪⌐">┘à╪ñ╪¼╪▒╪⌐</option>
                          <option className="bg-[#071a2d] text-white" value="╪┤╪º╪║╪▒╪⌐">┘ü╪º╪▒╪║╪⌐</option>
                          <option className="bg-[#071a2d] text-white" value="╪¬╪¡╪¬ ╪º┘ä╪╡┘è╪º┘å╪⌐">╪¬╪¡╪¬ ╪º┘ä╪╡┘è╪º┘å╪⌐</option>
                          <option className="bg-[#071a2d] text-white" value="┘à╪¡╪¼┘ê╪▓╪⌐">┘à╪¡╪¼┘ê╪▓╪⌐</option>
                          <option className="bg-[#071a2d] text-white" value="┘à╪ñ╪¼╪▒╪⌐ ┘ä┘ä╪┤╪▒┘â╪⌐">┘à╪ñ╪¼╪▒╪⌐ ┘ä┘ä╪┤╪▒┘â╪⌐</option>
                          {customApartmentStatuses.map((status) => (
                            <option
                              key={status}
                              className="bg-[#071a2d] text-white"
                              value={status}
                            >
                              {status}
                            </option>
                          ))}
                          <option
                            className="bg-[#071a2d] text-[#f0ad18] font-black"
                            value="__add_new_status__"
                          >
                            + ╪Ñ╪╢╪º┘ü╪⌐ ╪¡╪º┘ä╪⌐ ╪¼╪»┘è╪»╪⌐
                          </option>
                        </select>
                      </div>
                    );
                  })()}
                </div>

                <div className="rounded-2xl border border-[#2a5275] bg-white/[0.035] p-5 text-center backdrop-blur-xl transition hover:border-[#f0ad18]/50">
                  <div className="mb-4 flex flex-col items-center justify-center gap-2">
                    <span className="text-base font-semibold text-gray-300">┘é┘è┘à╪⌐ ╪º┘ä╪Ñ┘è╪¼╪º╪▒</span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#f0ad18]/20 bg-[#f0ad18]/10">
                      <Wallet size={23} className="text-[#f0ad18]" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-[#f6c84a]">{getApartmentRent(selectedApartment).toLocaleString("ar-SA")}</div>
                  <div className="mt-2 text-sm text-gray-500">╪▒┘è╪º┘ä / ╪┤┘ç╪▒┘è╪º┘ï</div>
                </div>

                <div className="rounded-2xl border border-[#2a5275] bg-white/[0.035] p-5 text-center backdrop-blur-xl transition hover:border-[#f0ad18]/50">
                  <div className="mb-4 flex flex-col items-center justify-center gap-2">
                    <span className="text-base font-semibold text-gray-300">╪¬╪º╪▒┘è╪« ╪¿╪»╪º┘è╪⌐ ╪º┘ä╪╣┘é╪»</span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-400/10">
                      <CalendarDays size={23} className="text-purple-400" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-white">{formatContractDate(getApartmentContractInfo(selectedApartment.number).startDate)}</div>
                  <div className="mt-2 text-base font-semibold text-gray-400">┘à┘å╪░ ╪¿╪»╪º┘è╪⌐ ╪º┘ä╪╣┘é╪»</div>
                </div>

                <div className="rounded-2xl border border-[#2a5275] bg-white/[0.035] p-5 text-center backdrop-blur-xl transition hover:border-[#f0ad18]/50">
                  <div className="mb-4 flex flex-col items-center justify-center gap-2">
                    <span className="text-base font-semibold text-gray-300">╪¬╪º╪▒┘è╪« ┘å┘ç╪º┘è╪⌐ ╪º┘ä╪╣┘é╪»</span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                      <CalendarDays size={23} className="text-cyan-400" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-white">{formatContractDate(getApartmentContractInfo(selectedApartment.number).endDate)}</div>
                  {(() => {
                    const daysRemaining = getContractDaysRemaining(
                      getApartmentContractInfo(selectedApartment.number).endDate
                    );

                    if (daysRemaining !== null && daysRemaining >= 46 && daysRemaining <= 90) {
                      return (
                        <div className="mt-2 text-base font-black text-yellow-400">
                          ┘à╪¬╪¿┘é┘è {daysRemaining} ┘è┘ê┘à ╪╣┘ä┘ë ╪º┘å╪¬┘ç╪º╪í ╪º┘ä╪╣┘é╪»
                        </div>
                      );
                    }

                    if (daysRemaining !== null && daysRemaining <= 45) {
                      return (
                        <div className="mt-2 text-base font-black text-red-400">
                          ┘à╪¬╪¿┘é┘è {Math.max(0, daysRemaining)} ┘è┘ê┘à ΓÇö ┘è╪¡╪¬╪º╪¼ ╪Ñ┘ä┘ë ╪¬╪¡╪»┘è╪½
                        </div>
                      );
                    }

                    return null;
                  })()}
                </div>
              </div>
            </div>

            {/* ================================================= */}
            {/* SECONDARY FINANCIAL / UTILITY CARDS               */}
            {/* ================================================= */}

            <div className="shrink-0 border-b border-white/10 bg-[#071a2d] p-3 lg:p-4" dir="rtl">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">

                {/* ╪Ñ╪╢╪º┘ü╪⌐ ┘ü╪º╪¬┘ê╪▒╪⌐ ╪ú┘ê ┘à╪│╪¬╪¡┘é╪º╪¬ */}
                {canAddInvoices && (
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedApartment) return;
                    openChargeModal("charge", "┘ü╪º╪¬┘ê╪▒╪⌐ ┘à┘è╪º┘ç", selectedApartment.number);
                  }}
                  className="rounded-2xl border border-cyan-400/40 bg-cyan-400/[0.06] p-5 text-right transition hover:border-cyan-400/60 hover:bg-cyan-400/[0.10]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-gray-100">╪Ñ╪╢╪º┘ü╪⌐ ┘ü╪º╪¬┘ê╪▒╪⌐ ╪ú┘ê ┘à╪│╪¬╪¡┘é╪º╪¬</p>
                      <p className="mt-1 text-sm text-gray-400">┘à┘è╪º┘ç╪î ┘â┘ç╪▒╪¿╪º╪í ╪ú┘ê ┘à╪│╪¬╪¡┘é╪º╪¬ ╪ú╪«╪▒┘ë</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-[#07182b]">
                      <Receipt size={21} />
                    </div>
                  </div>
                  <div className="mt-4 text-base font-bold text-cyan-300">╪Ñ╪╢╪º┘ü╪⌐ ┘ü╪º╪¬┘ê╪▒╪⌐ +</div>
                </button>
                )}

                {/* ╪Ñ╪╢╪º┘ü╪⌐ ╪¬╪¡╪╡┘è┘ä */}
                {canAddCollections && (
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedApartment) return;
                    openChargeModal("collection", "╪Ñ┘è╪¼╪º╪▒", selectedApartment.number);
                  }}
                  className="rounded-2xl border border-[#f0ad18]/60 bg-[#f0ad18]/10 p-5 text-right transition hover:bg-[#f0ad18]/20"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-gray-100">╪Ñ╪╢╪º┘ü╪⌐ ╪¬╪¡╪╡┘è┘ä ╪Ñ┘è╪¼╪º╪▒</p>
                      <p className="mt-1 text-sm text-gray-400">╪¬╪│╪¼┘è┘ä ╪»┘ü╪╣╪⌐ ╪¼╪»┘è╪»╪⌐</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0ad18] text-[#07182b]">
                      <Plus size={22} />
                    </div>
                  </div>
                  <div className="mt-4 text-base font-bold text-[#f6c84a]">╪Ñ╪╢╪º┘ü╪⌐ ╪¬╪¡╪╡┘è┘ä +</div>
                </button>
                )}

                {/* ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪¬╪¡╪╡┘è┘ä╪º╪¬ */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedApartmentFinancialReport("collections")}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedApartmentFinancialReport("collections");
                    }
                  }}
                  className="rounded-2xl border border-[#f0ad18]/25 bg-[#0b2039] p-4 text-right transition hover:border-[#f6c84a]/60 hover:bg-[#0f2945]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-200">╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪¬╪¡╪╡┘è┘ä╪º╪¬</p>
                      <p className="mt-1 text-[11px] text-gray-500">┘à┘å ╪¬╪º╪▒┘è╪« ╪Ñ┘ä┘ë ╪¬╪º╪▒┘è╪«</p>
                    </div>
                    <Coins size={21} className="text-[#f0ad18]" />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <label className="text-[10px] text-gray-500">
                      ┘à┘å
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(event) => setFromDate(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#07182b] px-2 py-1.5 text-[11px] text-white outline-none focus:border-[#f0ad18]/60"
                      />
                    </label>
                    <label className="text-[10px] text-gray-500">
                      ╪Ñ┘ä┘ë
                      <input
                        type="date"
                        value={toDate}
                        onChange={(event) => setToDate(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#07182b] px-2 py-1.5 text-[11px] text-white outline-none focus:border-[#f0ad18]/60"
                      />
                    </label>
                  </div>

                  <div className="mt-3 text-2xl font-black text-green-400">
                    {getSelectedApartmentPeriodPayments()
                      .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
                      .toLocaleString("ar-SA")} <span className="text-xs text-gray-500">╪▒┘è╪º┘ä</span>
                  </div>
                  <div className="mt-1 text-[10px] font-semibold text-gray-500">╪º╪╢╪║╪╖ ┘ä╪╣╪▒╪╢ ╪º┘ä╪¬┘ü╪º╪╡┘è┘ä</div>
                </div>

                {/* ┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä┘à┘è╪º┘ç */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedApartmentFinancialReport("water")}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedApartmentFinancialReport("water");
                    }
                  }}
                  className="rounded-2xl border border-cyan-400/20 bg-[#0b2039] p-4 text-right transition hover:border-cyan-300/60 hover:bg-[#0f2945]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-200">╪Ñ╪¼┘à╪º┘ä┘è ┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä┘à┘è╪º┘ç</p>
                      <p className="mt-1 text-xs text-cyan-300/80">╪¬╪¡╪»┘è╪» ╪º┘ä┘ü╪¬╪▒╪⌐</p>
                    </div>
                    <Droplets size={21} className="text-cyan-400" />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <label className="text-[10px] font-semibold text-gray-400">
                      ┘à┘å
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(event) => setFromDate(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#07182b] px-2 py-1.5 text-[11px] font-semibold text-white outline-none focus:border-cyan-400/60"
                      />
                    </label>
                    <label className="text-[10px] font-semibold text-gray-400">
                      ╪Ñ┘ä┘ë
                      <input
                        type="date"
                        value={toDate}
                        onChange={(event) => setToDate(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#07182b] px-2 py-1.5 text-[11px] font-semibold text-white outline-none focus:border-cyan-400/60"
                      />
                    </label>
                  </div>

                  <div className="mt-3 text-2xl font-black text-cyan-400">
                    {getSelectedApartmentPeriodCharges()
                      .filter((charge) => charge.type?.trim() === "┘ü╪º╪¬┘ê╪▒╪⌐ ┘à┘è╪º┘ç")
                      .reduce((sum, charge) => sum + (Number(charge.amount) || 0), 0)
                      .toLocaleString("ar-SA")} <span className="text-xs font-semibold text-gray-500">╪▒┘è╪º┘ä</span>
                  </div>
                  <div className="mt-1 text-[10px] font-semibold text-gray-500">╪º╪╢╪║╪╖ ┘ä╪╣╪▒╪╢ ╪º┘ä╪¬┘ü╪º╪╡┘è┘ä</div>
                </div>

                {/* ┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä┘â┘ç╪▒╪¿╪º╪í */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedApartmentFinancialReport("electricity")}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedApartmentFinancialReport("electricity");
                    }
                  }}
                  className="rounded-2xl border border-yellow-400/20 bg-[#0b2039] p-4 text-right transition hover:border-yellow-300/60 hover:bg-[#0f2945]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-200">╪Ñ╪¼┘à╪º┘ä┘è ┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä┘â┘ç╪▒╪¿╪º╪í</p>
                      <p className="mt-1 text-xs text-yellow-300/80">╪¬╪¡╪»┘è╪» ╪º┘ä┘ü╪¬╪▒╪⌐</p>
                    </div>
                    <Zap size={21} className="text-yellow-400" />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <label className="text-[10px] font-semibold text-gray-400">
                      ┘à┘å
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(event) => setFromDate(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#07182b] px-2 py-1.5 text-[11px] font-semibold text-white outline-none focus:border-yellow-400/60"
                      />
                    </label>
                    <label className="text-[10px] font-semibold text-gray-400">
                      ╪Ñ┘ä┘ë
                      <input
                        type="date"
                        value={toDate}
                        onChange={(event) => setToDate(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#07182b] px-2 py-1.5 text-[11px] font-semibold text-white outline-none focus:border-yellow-400/60"
                      />
                    </label>
                  </div>

                  <div className="mt-3 text-2xl font-black text-yellow-400">
                    {getSelectedApartmentPeriodCharges()
                      .filter((charge) => charge.type?.trim() === "┘ü╪º╪¬┘ê╪▒╪⌐ ┘â┘ç╪▒╪¿╪º╪í")
                      .reduce((sum, charge) => sum + (Number(charge.amount) || 0), 0)
                      .toLocaleString("ar-SA")} <span className="text-xs font-semibold text-gray-500">╪▒┘è╪º┘ä</span>
                  </div>
                  <div className="mt-1 text-[10px] font-semibold text-gray-500">╪º╪╢╪║╪╖ ┘ä╪╣╪▒╪╢ ╪º┘ä╪¬┘ü╪º╪╡┘è┘ä</div>
                </div>

                {/* ╪º┘ä╪¬╪¡╪╡┘è┘ä╪º╪¬ ╪º┘ä┘à╪¬╪ú╪«╪▒╪⌐ */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedApartmentFinancialReport("late")}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedApartmentFinancialReport("late");
                    }
                  }}
                  className="rounded-2xl border border-red-400/25 bg-[#301b29]/70 p-4 text-right transition hover:border-red-300/60 hover:bg-[#3a202f]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-200">╪º┘ä╪¬╪¡╪╡┘è┘ä╪º╪¬ ╪º┘ä┘à╪¬╪ú╪«╪▒╪⌐</p>
                      <p className="mt-1 text-xs text-gray-500">╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪¬╪¿┘é┘è ╪╣┘ä┘ë ╪º┘ä╪┤┘é╪⌐ ╪¡╪¬┘ë ╪º┘ä┘è┘ê┘à</p>
                    </div>
                    <AlertCircle size={21} className="text-red-400" />
                  </div>
                  <div className="mt-3 text-2xl font-black text-red-400">
                    {getSelectedApartmentLateRemaining().toLocaleString("ar-SA")} <span className="text-xs text-gray-500">╪▒┘è╪º┘ä</span>
                  </div>
                  <div className="mt-1 text-[10px] font-semibold text-gray-500">╪º╪╢╪║╪╖ ┘ä╪╣╪▒╪╢ ╪º┘ä╪¬┘ü╪º╪╡┘è┘ä</div>
                </div>

              </div>
            </div>

            {/* ================================================= */}
            {/* TABS                                               */}
            {/* ================================================= */}

            <div className="shrink-0 border-b border-white/10 bg-[#071a2d] px-3 py-2.5 lg:px-5">

              <div className="flex gap-2.5 overflow-x-auto">

                {apartmentTabs.map((tab) => {

                  const Icon = tab.icon;

                  const active =
                    activeTab === tab.title;

                  return (

                    <button
                      key={tab.title}
                      type="button"
                      onClick={() =>
                        setActiveTab(tab.title)
                      }
                      className={`flex min-h-[50px] min-w-fit items-center justify-center gap-2.5 rounded-xl border px-5 py-3 text-base font-bold transition ${
                        active
                          ? "border-[#f0ad18]/60 bg-gradient-to-r from-[#f0ad18] to-[#d99a12] text-[#07182b] shadow-[0_0_20px_rgba(240,173,24,0.18)]"
                          : "border-white/10 bg-white/[0.025] text-gray-300 hover:border-[#f0ad18]/30 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >

                      <Icon size={21} strokeWidth={2.2} />

                      {tab.title}

                    </button>

                  );
                })}

              </div>

            </div>

            {/* ================================================= */}
            {/* TAB CONTENT                                        */}
            {/* ================================================= */}

            <div className="min-h-0 flex-1 overflow-y-auto bg-[#061426] p-4 lg:p-5">

              {/* BASIC */}

              {activeTab ===
                "╪º┘ä╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪ú╪│╪º╪│┘è╪⌐" && (

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

                  <div className="order-2 rounded-3xl border border-[#285273] bg-white/[0.025] p-6 backdrop-blur-xl lg:order-2">

                    <div className="relative mb-7 flex items-center justify-center">
                      <h3 className="text-2xl font-black text-white">
                        ╪¡╪º┘ä╪⌐ ╪º┘ä╪┤┘é╪⌐ ┘ê╪º┘ä┘à╪│╪¬╪ú╪¼╪▒
                      </h3>

                      <User
                        size={24}
                        className="absolute left-0 text-blue-400"
                      />
                    </div>

                    <div className="space-y-4">

                      {/* ╪º┘ä╪¡╪º┘ä╪⌐ ╪º┘ä╪¡╪º┘ä┘è╪⌐ */}
                      <div className="flex min-h-[68px] items-center justify-between gap-5 rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="text-lg font-bold text-gray-200">
                          ╪º┘ä╪¡╪º┘ä╪⌐ ╪º┘ä╪¡╪º┘ä┘è╪⌐
                        </span>

                        <select
                          value={
                            getApartmentTenantInfo(
                              selectedApartment
                            ).status
                          }
                          onChange={(event) =>
                            handleApartmentStatusChange(
                              selectedApartment,
                              event.target.value
                            )
                          }
                          className="min-w-[180px] rounded-xl border border-white/10 bg-[#0b2039] px-4 py-2.5 text-base font-bold text-white outline-none transition focus:border-[#f0ad18]/60"
                        >
                          {availableApartmentStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status === "╪┤╪º╪║╪▒╪⌐" ? "┘ü╪º╪▒╪║╪⌐" : status}
                            </option>
                          ))}
                          <option value="__add_new_status__">
                            + ╪Ñ╪╢╪º┘ü╪⌐ ╪¡╪º┘ä╪⌐ ╪¼╪»┘è╪»╪⌐
                          </option>
                        </select>
                      </div>

                      {/* ╪º╪│┘à ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒ */}
                      <div className="flex min-h-[68px] items-center justify-between gap-5 rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="shrink-0 text-lg font-bold text-gray-200">
                          ╪º╪│┘à ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒
                        </span>

                        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
                          <input
                            type="text"
                            value={
                              getApartmentTenantInfo(
                                selectedApartment
                              ).tenantName
                            }
                            onChange={(event) =>
                              updateApartmentTenantInfo(
                                selectedApartment,
                                "tenantName",
                                event.target.value
                              )
                            }
                            placeholder="╪º┘â╪¬╪¿ ╪º╪│┘à ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒"
                            className="w-full max-w-[280px] rounded-xl border border-white/10 bg-[#0b2039] px-4 py-2.5 text-right text-base font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-[#f0ad18]/60"
                          />
                          <Edit3
                            size={19}
                            className="shrink-0 text-[#f0ad18]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              saveApartmentTenantField(
                                selectedApartment,
                                "tenantName"
                              )
                            }
                            className="shrink-0 rounded-lg border border-green-400/40 bg-green-500/10 px-3 py-1.5 text-sm font-black text-green-400 transition hover:bg-green-500/20"
                          >
                            ╪¡┘ü╪╕
                          </button>
                        </div>
                      </div>

                      {/* ╪▒┘é┘à ╪º┘ä╪¼┘ê╪º┘ä */}
                      <div className="flex min-h-[68px] items-center justify-between gap-5 rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="shrink-0 text-lg font-bold text-gray-200">
                          ╪▒┘é┘à ╪º┘ä╪¼┘ê╪º┘ä
                        </span>

                        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
                          <input
                            type="tel"
                            value={
                              getApartmentTenantInfo(
                                selectedApartment
                              ).phone
                            }
                            onChange={(event) =>
                              updateApartmentTenantInfo(
                                selectedApartment,
                                "phone",
                                event.target.value
                              )
                            }
                            placeholder="05XXXXXXXX"
                            className="w-full max-w-[280px] rounded-xl border border-white/10 bg-[#0b2039] px-4 py-2.5 text-left text-base font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-[#f0ad18]/60"
                          />
                          <Edit3
                            size={19}
                            className="shrink-0 text-[#f0ad18]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              saveApartmentTenantField(
                                selectedApartment,
                                "phone"
                              )
                            }
                            className="shrink-0 rounded-lg border border-green-400/40 bg-green-500/10 px-3 py-1.5 text-sm font-black text-green-400 transition hover:bg-green-500/20"
                          >
                            ╪¡┘ü╪╕
                          </button>
                        </div>
                      </div>

                      {/* ╪▒┘é┘à ╪º┘ä┘ç┘ê┘è╪⌐ */}
                      <div className="flex min-h-[68px] items-center justify-between gap-5 rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="shrink-0 text-lg font-bold text-gray-200">
                          ╪▒┘é┘à ╪º┘ä┘ç┘ê┘è╪⌐
                        </span>

                        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={
                              getApartmentTenantInfo(
                                selectedApartment
                              ).identityNumber
                            }
                            onChange={(event) =>
                              updateApartmentTenantInfo(
                                selectedApartment,
                                "identityNumber",
                                event.target.value
                              )
                            }
                            placeholder="╪º┘â╪¬╪¿ ╪▒┘é┘à ╪º┘ä┘ç┘ê┘è╪⌐"
                            className="w-full max-w-[280px] rounded-xl border border-white/10 bg-[#0b2039] px-4 py-2.5 text-left text-base font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-[#f0ad18]/60"
                          />
                          <Edit3
                            size={19}
                            className="shrink-0 text-[#f0ad18]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              saveApartmentTenantField(
                                selectedApartment,
                                "identityNumber"
                              )
                            }
                            className="shrink-0 rounded-lg border border-green-400/40 bg-green-500/10 px-3 py-1.5 text-sm font-black text-green-400 transition hover:bg-green-500/20"
                          >
                            ╪¡┘ü╪╕
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>

                  <div className="order-3 rounded-3xl border border-[#285273] bg-white/[0.025] p-5 backdrop-blur-xl lg:order-1">

                    <div className="relative mb-6 flex items-center justify-center">

                      <h3 className="text-xl font-bold text-white">
                        ┘à╪╣┘ä┘ê┘à╪º╪¬ ╪Ñ╪╢╪º┘ü┘è╪⌐
                      </h3>

                      <Info
                        size={22}
                        className="absolute left-0 text-[#f0ad18]"
                      />

                    </div>

                    <div className="space-y-3">
                      {/* ╪º┘ä╪»┘ê╪▒ */}
                      <div className="flex min-h-[68px] items-center justify-between gap-5 rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="flex shrink-0 items-center gap-2 text-lg font-bold text-gray-200">
                          <Building2 size={16} />
                          ╪º┘ä╪»┘ê╪▒
                        </span>

                        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                          <input
                            type="text"
                            value={
                              getApartmentExtraInfo(
                                selectedApartment.number
                              ).floor
                            }
                            onChange={(event) =>
                              updateApartmentExtraInfo(
                                selectedApartment.number,
                                "floor",
                                event.target.value
                              )
                            }
                            placeholder="╪º┘â╪¬╪¿ ╪º┘ä╪»┘ê╪▒"
                            className="w-full max-w-[280px] rounded-xl border border-white/10 bg-[#0b2039] px-4 py-2.5 text-right text-base font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-[#f0ad18]/60"
                          />
                          <Edit3
                            size={19}
                            className="shrink-0 text-[#f0ad18]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              saveApartmentFloor(selectedApartment.number)
                            }
                            className="shrink-0 rounded-lg border border-green-400/40 bg-green-500/10 px-3 py-1.5 text-sm font-black text-green-400 transition hover:bg-green-500/20"
                          >
                            ╪¡┘ü╪╕
                          </button>
                        </div>
                      </div>

                      {/* ┘à┘ê┘é┘ü ╪│┘è╪º╪▒╪⌐ */}
                      <div className="flex min-h-[68px] items-center justify-between gap-5 rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="flex items-center gap-2 text-lg font-bold text-gray-200">
                          <Car size={16} />
                          ┘à┘ê┘é┘ü ╪│┘è╪º╪▒╪⌐
                        </span>

                        <select
                          value={
                            getApartmentExtraInfo(
                              selectedApartment.number
                            ).parking
                          }
                          onChange={(event) =>
                            updateApartmentExtraInfo(
                              selectedApartment.number,
                              "parking",
                              event.target.value as ApartmentExtraInfo["parking"]
                            )
                          }
                          className="min-w-[180px] rounded-xl border border-white/10 bg-[#0b2039] px-4 py-2.5 text-base font-bold text-white outline-none transition focus:border-[#f0ad18]/60"
                        >
                          <option value="╪║┘è╪▒ ┘à╪¡╪»╪»">╪║┘è╪▒ ┘à╪¡╪»╪»</option>
                          <option value="┘à╪¬┘ê┘ü╪▒">┘à╪¬┘ê┘ü╪▒</option>
                          <option value="┘ä╪º ┘è┘ê╪¼╪»">┘ä╪º ┘è┘ê╪¼╪»</option>
                        </select>
                      </div>

                      {/* ╪╣╪»╪º╪» ╪º┘ä┘â┘ç╪▒╪¿╪º╪í */}
                      <div className="flex min-h-[68px] items-center justify-between gap-5 rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="flex items-center gap-2 text-lg font-bold text-gray-200">
                          <Zap size={16} />
                          ╪╣╪»╪º╪» ╪º┘ä┘â┘ç╪▒╪¿╪º╪í
                        </span>

                        <select
                          value={
                            getApartmentExtraInfo(
                              selectedApartment.number
                            ).electricityMeter
                          }
                          onChange={(event) =>
                            updateApartmentExtraInfo(
                              selectedApartment.number,
                              "electricityMeter",
                              event.target.value as ApartmentExtraInfo["electricityMeter"]
                            )
                          }
                          className="min-w-[180px] rounded-xl border border-white/10 bg-[#0b2039] px-4 py-2.5 text-base font-bold text-white outline-none transition focus:border-[#f0ad18]/60"
                        >
                          <option value="┘à╪┤╪¬╪▒┘â">┘à╪┤╪¬╪▒┘â</option>
                          <option value="┘ü╪▒╪»┘è">┘ü╪▒╪»┘è</option>
                        </select>
                      </div>

                      {/* ╪╣╪»╪º╪» ╪º┘ä┘à┘è╪º┘ç */}
                      <div className="flex min-h-[68px] items-center justify-between gap-5 rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="flex items-center gap-2 text-lg font-bold text-gray-200">
                          <Droplets size={16} />
                          ╪╣╪»╪º╪» ╪º┘ä┘à┘è╪º┘ç
                        </span>

                        <select
                          value={
                            getApartmentExtraInfo(
                              selectedApartment.number
                            ).waterMeter
                          }
                          onChange={(event) =>
                            updateApartmentExtraInfo(
                              selectedApartment.number,
                              "waterMeter",
                              event.target.value as ApartmentExtraInfo["waterMeter"]
                            )
                          }
                          className="min-w-[180px] rounded-xl border border-white/10 bg-[#0b2039] px-4 py-2.5 text-base font-bold text-white outline-none transition focus:border-[#f0ad18]/60"
                        >
                          <option value="┘à╪┤╪¬╪▒┘â">┘à╪┤╪¬╪▒┘â</option>
                          <option value="┘ü╪▒╪»┘è">┘ü╪▒╪»┘è</option>
                        </select>
                      </div>

                      {/* ╪¡╪º┘ä╪⌐ ╪º┘ä╪ú╪½╪º╪½ */}
                      <div className="flex min-h-[68px] items-center justify-between gap-5 rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="flex items-center gap-2 text-lg font-bold text-gray-200">
                          <Sofa size={16} />
                          ╪¡╪º┘ä╪⌐ ╪º┘ä╪ú╪½╪º╪½
                        </span>

                        <select
                          value={
                            getApartmentExtraInfo(
                              selectedApartment.number
                            ).furnitureStatus
                          }
                          onChange={(event) =>
                            updateApartmentExtraInfo(
                              selectedApartment.number,
                              "furnitureStatus",
                              event.target.value as ApartmentExtraInfo["furnitureStatus"]
                            )
                          }
                          className="min-w-[180px] rounded-xl border border-white/10 bg-[#0b2039] px-4 py-2.5 text-base font-bold text-white outline-none transition focus:border-[#f0ad18]/60"
                        >
                          <option value="┘à┘ü╪▒┘ê╪┤╪⌐">┘ü╪º╪▒╪║╪⌐</option>
                          <option value="┘å╪╡ ┘ü╪▒╪┤">┘å╪╡ ┘à┘ü╪▒┘ê╪┤</option>
                          <option value="┘à┘ü╪▒┘ê╪┤╪⌐ ╪¿╪º┘ä┘â╪º┘à┘ä">
                            ┘à┘ü╪▒┘ê╪┤╪⌐ ╪¿╪º┘ä┘â╪º┘à┘ä
                          </option>
                        </select>
                      </div>
                    </div>

                  </div>

                  <div className="order-4 rounded-3xl border border-[#285273] bg-white/[0.025] p-5 backdrop-blur-xl lg:order-3">
                    <div className="mb-5 flex items-center justify-between">
                      <h3 className="text-lg font-bold leading-relaxed">╪╡┘ê╪▒╪⌐ ╪º┘ä╪┤┘é╪⌐</h3>
                      <ImageIcon size={21} className="text-cyan-400" />
                    </div>

                    <div className="space-y-3">
                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#061a2d]">
                        <img
                          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80"
                          alt="╪║╪▒┘ü╪⌐ ╪º┘ä╪┤┘é╪⌐"
                          className="h-40 w-full object-cover"
                        />
                      </div>
                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#061a2d]">
                        <img
                          src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=80"
                          alt="┘à╪╖╪¿╪« ╪º┘ä╪┤┘é╪⌐"
                          className="h-40 w-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                </div>

              )}

              {/* TENANT */}

              {activeTab ===
                "╪¿┘è╪º┘å╪º╪¬ ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒" && (

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                  <div className="rounded-3xl border border-[#285273] bg-white/[0.025] p-7 backdrop-blur-xl">

                    <div className="mb-8 flex flex-col items-center justify-center text-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/10 text-blue-400">
                        <User size={28} />
                      </div>

                      <h3 className="text-2xl font-black text-white">
                        ╪¿┘è╪º┘å╪º╪¬ ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒
                      </h3>

                      <p className="mt-2 text-base font-medium text-gray-400">
                        ╪º┘ä┘à╪╣┘ä┘ê┘à╪º╪¬ ╪º┘ä╪┤╪«╪╡┘è╪⌐ ┘ê╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪¬┘ê╪º╪╡┘ä
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">

                      {/* ╪º┘ä╪º╪│┘à */}
                      <div className="rounded-2xl border border-white/5 bg-[#061a2d] p-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="text-lg font-bold text-gray-200">
                            ╪º╪│┘à ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒
                          </span>
                          <Edit3 size={19} className="text-[#f0ad18]" />
                        </div>

                        <input
                          type="text"
                          value={
                            getApartmentTenantInfo(
                              selectedApartment
                            ).tenantName
                          }
                          onChange={(event) =>
                            updateApartmentTenantInfo(
                              selectedApartment,
                              "tenantName",
                              event.target.value
                            )
                          }
                          placeholder="╪º┘â╪¬╪¿ ╪º╪│┘à ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒"
                          className="w-full rounded-xl border border-white/10 bg-[#0b2039] px-4 py-3 text-right text-lg font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-[#f0ad18]/60"
                        />
                      </div>

                      {/* ╪▒┘é┘à ╪º┘ä╪¼┘ê╪º┘ä */}
                      <div className="rounded-2xl border border-white/5 bg-[#061a2d] p-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="text-lg font-bold text-gray-200">
                            ╪▒┘é┘à ╪º┘ä╪¼┘ê╪º┘ä
                          </span>
                          <Edit3 size={19} className="text-[#f0ad18]" />
                        </div>

                        <input
                          type="tel"
                          value={
                            getApartmentTenantInfo(
                              selectedApartment
                            ).phone
                          }
                          onChange={(event) =>
                            updateApartmentTenantInfo(
                              selectedApartment,
                              "phone",
                              event.target.value
                            )
                          }
                          placeholder="05XXXXXXXX"
                          className="w-full rounded-xl border border-white/10 bg-[#0b2039] px-4 py-3 text-left text-lg font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-[#f0ad18]/60"
                        />
                      </div>

                      {/* ╪▒┘é┘à ╪º┘ä┘ç┘ê┘è╪⌐ */}
                      <div className="rounded-2xl border border-white/5 bg-[#061a2d] p-5 md:col-span-2">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="text-lg font-bold text-gray-200">
                            ╪▒┘é┘à ╪º┘ä┘ç┘ê┘è╪⌐
                          </span>
                          <Edit3 size={19} className="text-[#f0ad18]" />
                        </div>

                        <input
                          type="text"
                          inputMode="numeric"
                          value={
                            getApartmentTenantInfo(
                              selectedApartment
                            ).identityNumber
                          }
                          onChange={(event) =>
                            updateApartmentTenantInfo(
                              selectedApartment,
                              "identityNumber",
                              event.target.value
                            )
                          }
                          placeholder="╪º┘â╪¬╪¿ ╪▒┘é┘à ╪º┘ä┘ç┘ê┘è╪⌐"
                          className="w-full rounded-xl border border-white/10 bg-[#0b2039] px-4 py-3 text-left text-lg font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-[#f0ad18]/60"
                        />
                      </div>

                    </div>

                  </div>

                  <div className="rounded-3xl border border-[#285273] bg-white/[0.025] p-7 backdrop-blur-xl">

                    <div className="mb-8 flex flex-col items-center justify-center text-center">

                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-green-400/20 bg-green-400/10 text-green-400">
                        <CheckCircle2 size={28} />
                      </div>

                      <h3 className="text-2xl font-black text-white">
                        ╪¡╪º┘ä╪⌐ ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒
                      </h3>

                      <p className="mt-2 text-base font-medium text-gray-400">
                        ┘à┘ä╪«╪╡ ╪º┘ä╪¬╪╣╪º┘à┘ä ┘à╪╣ ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒
                      </p>

                    </div>

                    <div className="space-y-4">

                      <div className="flex min-h-[70px] items-center justify-between rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="text-lg font-bold text-gray-300">
                          ╪¡╪º┘ä╪⌐ ╪º┘ä╪¡╪│╪º╪¿
                        </span>
                        <span className="text-lg font-black text-green-400">
                          ┘å╪┤╪╖
                        </span>
                      </div>

                      <div className="flex min-h-[70px] items-center justify-between rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="text-lg font-bold text-gray-300">
                          ╪º┘ä╪º┘ä╪¬╪▓╪º┘à ╪¿╪º┘ä╪│╪»╪º╪»
                        </span>
                        <span className="text-lg font-black text-green-400">
                          ┘à┘å╪¬╪╕┘à
                        </span>
                      </div>

                      <div className="flex min-h-[70px] items-center justify-between rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="text-lg font-bold text-gray-300">
                          ╪ó╪«╪▒ ╪»┘ü╪╣╪⌐
                        </span>
                        <span className="text-lg font-black text-white">
                          01 / 05 / 2026
                        </span>
                      </div>

                    </div>

                  </div>

                </div>

              )}

              {/* CONTRACT */}

              {activeTab === "╪º┘ä╪╣┘é╪»" && (

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

                  {(() => {
                    const contractInfo = getApartmentContractInfo(
                      selectedApartment.number
                    );

                    return (
                      <>
                        <div className="rounded-3xl border border-[#285273] bg-white/[0.025] p-6 text-center">

                          <div className="mb-4 flex justify-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#f0ad18]/20 bg-[#f0ad18]/10">
                              <FileText size={26} className="text-[#f0ad18]" />
                            </div>
                          </div>

                          <div className="text-lg font-black text-gray-200">
                            ╪▒┘é┘à ╪º┘ä╪╣┘é╪»
                          </div>

                          <div className="mt-4 flex items-center justify-center gap-3">
                            <Edit3 size={20} className="shrink-0 text-[#f0ad18]" />
                            <input
                              type="text"
                              value={contractInfo.contractNumber}
                              onChange={(event) =>
                                updateApartmentContractField(
                                  selectedApartment.number,
                                  "contractNumber",
                                  event.target.value
                                )
                              }
                              className="w-full max-w-[260px] rounded-xl border border-white/10 bg-[#061a2d] px-4 py-3 text-center text-xl font-black text-white outline-none transition focus:border-[#f0ad18]/60"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                saveApartmentContractInfo(
                                  selectedApartment.number
                                )
                              }
                              className="shrink-0 rounded-lg border border-green-400/40 bg-green-500/10 px-3 py-2 text-sm font-black text-green-400 transition hover:bg-green-500/20"
                            >
                              ╪¡┘ü╪╕
                            </button>
                          </div>

                        </div>

                        <div className="rounded-3xl border border-[#285273] bg-white/[0.025] p-6 text-center">

                          <div className="mb-4 flex justify-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/10">
                              <CalendarDays size={26} className="text-blue-400" />
                            </div>
                          </div>

                          <div className="text-lg font-black text-gray-200">
                            ╪¿╪»╪º┘è╪⌐ ╪º┘ä╪╣┘é╪»
                          </div>

                          <input
                            key={`contract-start-date-${selectedApartment.number}-${contractInfo.startDate}`}
                            type="text"
                            inputMode="numeric"
                            dir="ltr"
                            defaultValue={formatContractDate(contractInfo.startDate)}
                            onChange={(event) => {
                              const value = event.target.value.replace(/[^0-9/]/g, "");
                              const match = value.match(/^(\d{0,2})(?:\/(\d{0,2}))?(?:\/(\d{0,4}))?$/);

                              if (!match) return;

                              const [, day, month, year] = match;
                              const formatted = [day, month, year].filter(Boolean).join("/");

                              if (day?.length === 2 && month?.length === 2 && year?.length === 4) {
                                const parsedDate = `${year}-${month}-${day}`;
                                const parsed = new Date(`${parsedDate}T00:00:00`);
                                if (
                                  !Number.isNaN(parsed.getTime()) &&
                                  parsed.getFullYear() === Number(year) &&
                                  parsed.getMonth() + 1 === Number(month) &&
                                  parsed.getDate() === Number(day)
                                ) {
                                  updateApartmentContractStartDate(
                                    selectedApartment.number,
                                    parsedDate
                                  );
                                }
                              } else if (!formatted) {
                                updateApartmentContractStartDate(
                                  selectedApartment.number,
                                  ""
                                );
                              }
                            }}
                            onBlur={(event) => {
                              const currentValue = event.currentTarget.value;
                              const match = currentValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

                              if (!match) {
                                event.currentTarget.value = formatContractDate(contractInfo.startDate);
                              }
                            }}
                            placeholder="┘è┘ê┘à/╪┤┘ç╪▒/╪│┘å╪⌐"
                            className="mt-4 w-full rounded-xl border border-white/10 bg-[#061a2d] px-4 py-3 text-center text-xl font-black text-white outline-none transition focus:border-blue-400/60"
                          />

                          <div className="mt-2 text-sm text-gray-500">
                            ┘è╪¬┘à ╪¡╪│╪º╪¿ ┘å┘ç╪º┘è╪⌐ ╪º┘ä╪╣┘é╪» ╪¬┘ä┘é╪º╪ª┘è┘ï╪º ╪¡╪│╪¿ ╪º┘ä┘à╪»╪⌐
                          </div>

                        </div>

                        <div className="rounded-3xl border border-[#285273] bg-white/[0.025] p-6 text-center">

                          <div className="mb-4 flex justify-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10">
                              <CalendarDays size={26} className="text-red-400" />
                            </div>
                          </div>

                          <div className="text-lg font-black text-gray-200">
                            ┘å┘ç╪º┘è╪⌐ ╪º┘ä╪╣┘é╪»
                          </div>

                          <input
                            key={`contract-end-date-${selectedApartment.number}-${contractInfo.endDate}`}
                            type="text"
                            inputMode="numeric"
                            dir="ltr"
                            defaultValue={formatContractDate(contractInfo.endDate)}
                            onChange={(event) => {
                              const value = event.target.value.replace(/[^0-9/]/g, "");
                              const match = value.match(/^(\d{0,2})(?:\/(\d{0,2}))?(?:\/(\d{0,4}))?$/);

                              if (!match) return;

                              const [, day, month, year] = match;
                              const formatted = [day, month, year].filter(Boolean).join("/");

                              if (day?.length === 2 && month?.length === 2 && year?.length === 4) {
                                const parsedDate = `${year}-${month}-${day}`;
                                const parsed = new Date(`${parsedDate}T00:00:00`);
                                if (
                                  !Number.isNaN(parsed.getTime()) &&
                                  parsed.getFullYear() === Number(year) &&
                                  parsed.getMonth() + 1 === Number(month) &&
                                  parsed.getDate() === Number(day)
                                ) {
                                  updateApartmentContractField(
                                    selectedApartment.number,
                                    "endDate",
                                    parsedDate
                                  );
                                }
                              } else if (!formatted) {
                                updateApartmentContractField(
                                  selectedApartment.number,
                                  "endDate",
                                  ""
                                );
                              }
                            }}
                            placeholder="┘è┘ê┘à/╪┤┘ç╪▒/╪│┘å╪⌐"
                            className="mt-4 w-full rounded-xl border border-white/10 bg-[#061a2d] px-4 py-3 text-center text-xl font-black text-white outline-none transition focus:border-red-400/60"
                          />

                          <div className="mt-2 text-sm text-gray-500">
                            ┘è┘à┘â┘å┘â ╪¬╪╣╪»┘è┘ä ╪º┘ä╪¬╪º╪▒┘è╪« ┘è╪»┘ê┘è┘ï╪º ╪╣┘å╪» ╪º┘ä╪¡╪º╪¼╪⌐
                          </div>

                        </div>

                        <div className="rounded-3xl border border-[#285273] bg-white/[0.025] p-6 lg:col-span-3">

                          <h3 className="mb-5 text-center text-2xl font-black text-[#f0ad18]">
                            ╪¬┘ü╪º╪╡┘è┘ä ╪º┘ä╪╣┘é╪»
                          </h3>

                          <div className="grid gap-4 md:grid-cols-3">

                            <div className="rounded-xl bg-[#061a2d] p-5 text-center">
                              <div className="text-lg font-black text-gray-200">
                                ┘é┘è┘à╪⌐ ╪º┘ä╪Ñ┘è╪¼╪º╪▒
                              </div>
                              <div className="mt-3 text-2xl font-black text-[#f0ad18]">
                                {selectedApartment.rent.toLocaleString(
                                  "ar-SA"
                                )} {" "}
                                ╪▒┘è╪º┘ä
                              </div>
                            </div>

                            <div className="rounded-xl bg-[#061a2d] p-5 text-center">
                              <div className="text-xl font-black text-gray-100 text-center">
                                ┘à╪»╪⌐ ╪º┘ä╪╣┘é╪»
                              </div>

                              <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
                                <select
                                  value={contractInfo.durationUnit}
                                  onChange={(event) =>
                                    updateApartmentContractDuration(
                                      selectedApartment.number,
                                      event.target.value as "day" | "month" | "year",
                                      contractInfo.durationValue
                                    )
                                  }
                                  className="rounded-xl border border-white/10 bg-[#071a2d] px-4 py-2.5 text-center text-base font-black text-white outline-none transition focus:border-[#f0ad18]/60"
                                >
                                  <option value="day" className="bg-[#071a2d] text-white">
                                    ┘è┘ê┘à
                                  </option>
                                  <option value="month" className="bg-[#071a2d] text-white">
                                    ╪┤┘ç╪▒
                                  </option>
                                  <option value="year" className="bg-[#071a2d] text-white">
                                    ╪│┘å╪⌐
                                  </option>
                                </select>

                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={contractInfo.durationValue}
                                  onChange={(event) =>
                                    updateApartmentContractDuration(
                                      selectedApartment.number,
                                      contractInfo.durationUnit,
                                      Number(event.target.value)
                                    )
                                  }
                                  className="w-24 rounded-xl border border-white/10 bg-[#071a2d] px-4 py-2.5 text-center text-base font-black text-white outline-none transition focus:border-[#f0ad18]/60"
                                />
                              </div>

                              <div className="mt-3 text-xl font-black text-white">
                                {formatContractDuration(
                                  contractInfo.durationUnit,
                                  contractInfo.durationValue
                                )}
                              </div>
                            </div>

                            <div className="rounded-xl bg-[#061a2d] p-5 text-center">
                              <div className="text-xl font-black text-gray-100 text-center">
                                ╪º┘ä╪¬╪ú┘à┘è┘å
                              </div>

                              <div className="mt-3 flex items-center justify-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={contractInfo.insuranceAmount || ""}
                                  onChange={(event) =>
                                    updateApartmentContractField(
                                      selectedApartment.number,
                                      "insuranceAmount",
                                      Math.max(0, Number(event.target.value) || 0)
                                    )
                                  }
                                  placeholder="┘à╪¿┘ä╪║ ╪º┘ä╪¬╪ú┘à┘è┘å"
                                  className="w-full max-w-[190px] rounded-xl border border-white/10 bg-[#071a2d] px-4 py-2.5 text-center text-2xl font-black text-white outline-none transition focus:border-[#f0ad18]/60"
                                />
                                <span className="text-base font-bold text-gray-400">╪▒┘è╪º┘ä</span>
                              </div>

                              <input
                                type="text"
                                value={contractInfo.insuranceNotes}
                                onChange={(event) =>
                                  updateApartmentContractField(
                                    selectedApartment.number,
                                    "insuranceNotes",
                                    event.target.value
                                  )
                                }
                                placeholder="┘à┘ä╪º╪¡╪╕╪º╪¬ ╪º┘ä╪¬╪ú┘à┘è┘å"
                                className="mt-3 w-full rounded-xl border border-white/10 bg-[#071a2d] px-4 py-2.5 text-center text-base font-semibold text-white outline-none transition focus:border-[#f0ad18]/60"
                              />
                            </div>

                          </div>

                        </div>
                      </>
                    );
                  })()}

                </div>

              )}

              {/* PAYMENTS */}

              {activeTab ===
                "╪º┘ä┘à╪»┘ü┘ê╪╣╪º╪¬" && (() => {
                const payments = getApartmentPayments(selectedApartment.number);
                const contractInfo = getApartmentContractInfo(
                  selectedApartment.number
                );
                const contractPayments = payments.filter(
                  (payment) =>
                    Boolean(payment.date) &&
                    (!contractInfo.startDate || payment.date >= contractInfo.startDate)
                );
                const totalPaid = contractPayments.reduce(
                  (sum, payment) => sum + (Number(payment.amount) || 0),
                  0
                );

                const apartmentRent = getApartmentRent(selectedApartment);
                const rentDueCharges = getApartmentRentDueCharges(selectedApartment.number);
                const registeredRentMonths = rentDueCharges.length;
                const totalRentDue = rentDueCharges.reduce(
                  (sum, charge) => sum + (Number(charge.amount) || 0),
                  0
                );

                const otherChargesTotal = getApartmentCharges(
                  selectedApartment.number,
                  contractInfo.startDate
                ).reduce(
                  (sum, charge) => sum + (Number(charge.amount) || 0),
                  0
                );

                const totalDue = totalRentDue + otherChargesTotal;

                const totalRentCollected = contractPayments
                  .filter((payment) => payment.type?.trim() === "╪Ñ┘è╪¼╪º╪▒")
                  .reduce(
                    (sum, payment) => sum + (Number(payment.amount) || 0),
                    0
                  );

                const collectedRentMonths =
                  apartmentRent > 0
                    ? Math.floor(totalRentCollected / apartmentRent)
                    : 0;

                const partialRentCollected =
                  apartmentRent > 0
                    ? totalRentCollected - collectedRentMonths * apartmentRent
                    : 0;

                const totalRemaining = Math.max(totalDue - totalPaid, 0);

                return (
                  <div className="space-y-5">

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

                      <div className="rounded-3xl border border-orange-400/25 bg-orange-500/[0.04] p-6">
                        <div className="text-sm font-bold text-gray-400">
                          ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ + ╪º┘ä╪Ñ┘è╪¼╪º╪▒╪º╪¬
                        </div>
                        <div className="mt-2 text-3xl font-black text-orange-300">
                          {totalDue.toLocaleString("ar-SA")} ╪▒┘è╪º┘ä
                        </div>
                        <div className="mt-2 text-xs font-semibold text-gray-500">
                          {registeredRentMonths} {registeredRentMonths === 1 ? "╪┤┘ç╪▒" : "╪ú╪┤┘ç╪▒"} ╪Ñ┘è╪¼╪º╪▒ ┘à╪│╪¼┘ä + ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ╪º┘ä╪ú╪«╪▒┘ë
                        </div>
                      </div>

                      <div className="rounded-3xl border border-blue-400/20 bg-blue-500/[0.04] p-6">
                        <div className="text-sm font-bold text-gray-400">
                          ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪»┘ü┘ê╪╣
                        </div>
                        <div className="mt-2 text-3xl font-black text-blue-300">
                          {totalPaid.toLocaleString("ar-SA")} ╪▒┘è╪º┘ä
                        </div>
                        <div className="mt-2 text-xs font-semibold text-gray-500">
                          ╪Ñ┘è╪¼╪º╪▒╪º╪¬ + ┘ü┘ê╪º╪¬┘è╪▒ + ┘à╪│╪¬╪¡┘é╪º╪¬ ┘à╪¡╪╡┘ä╪⌐
                        </div>
                      </div>

                      <div className="rounded-3xl border border-red-400/20 bg-red-500/[0.04] p-6">
                        <div className="text-sm font-bold text-gray-400">
                          ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪¬╪¿┘é┘è
                        </div>
                        <div className="mt-2 text-3xl font-black text-red-300">
                          {totalRemaining.toLocaleString("ar-SA")} ╪▒┘è╪º┘ä
                        </div>
                        <div className="mt-2 text-xs font-semibold text-gray-500">
                          ╪º┘ä┘à╪¿┘ä╪║ ╪║┘è╪▒ ╪º┘ä┘à╪»┘ü┘ê╪╣ ╪ú┘ê ╪º┘ä┘à╪¬╪ú╪«╪▒ ╪¡╪¬┘ë ╪º┘ä╪ó┘å
                        </div>
                      </div>

                      <div className="rounded-3xl border border-green-400/20 bg-green-500/[0.04] p-6">
                        <div className="text-sm font-bold text-gray-400">
                          ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪Ñ┘è╪¼╪º╪▒╪º╪¬ ╪º┘ä┘à╪¡╪╡┘ä╪⌐
                        </div>
                        <div className="mt-2 text-3xl font-black text-green-300">
                          {totalRentCollected.toLocaleString("ar-SA")} ╪▒┘è╪º┘ä
                        </div>
                        <div className="mt-2 text-xs font-semibold text-gray-500">
                          {collectedRentMonths} {collectedRentMonths === 1 ? "╪┤┘ç╪▒ ┘à╪¡╪╡┘ä" : "╪ú╪┤┘ç╪▒ ┘à╪¡╪╡┘ä╪⌐"}
                          {partialRentCollected > 0
                            ? ` + ${partialRentCollected.toLocaleString("ar-SA")} ╪▒┘è╪º┘ä ╪¼╪▓╪ª┘è`
                            : ""}
                        </div>
                      </div>

                    </div>

                    {(() => {
                      const rentDueCharges = getApartmentRentDueCharges(selectedApartment.number);
                      return (
                        <div className="mb-5 overflow-hidden rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.03]">
                          <div className="border-b border-white/10 bg-[#071a2d] p-5">
                            <h3 className="text-xl font-bold">╪º┘ä╪Ñ┘è╪¼╪º╪▒╪º╪¬ ╪º┘ä┘à╪│╪¬╪¡┘é╪⌐</h3>
                            <p className="mt-1 text-sm font-semibold text-gray-500">╪º┘ä╪ú╪┤┘ç╪▒ ╪º┘ä╪¬┘è ╪¬┘à ╪¬╪│╪¼┘è┘ä┘ç╪º ┘â┘à╪│╪¬╪¡┘é╪º╪¬ ╪Ñ┘è╪¼╪º╪▒ ┘ä┘ç╪░┘ç ╪º┘ä╪┤┘é╪⌐</p>
                          </div>
                          <div className="overflow-x-auto">
                            <div className="min-w-[700px] divide-y divide-white/5">
                              <div className="grid grid-cols-[70px_180px_150px_1fr] gap-3 bg-[#0a2137] px-5 py-4 text-sm font-black text-gray-300">
                                <div>#</div>
                                <div>╪º┘ä╪┤┘ç╪▒ ╪º┘ä┘à╪│╪¬╪¡┘é</div>
                                <div>╪¬╪º╪▒┘è╪« ╪º┘ä╪Ñ╪»╪«╪º┘ä</div>
                                <div>╪º┘ä┘à╪¿┘ä╪║</div>
                              </div>
                              {rentDueCharges.length > 0 ? (
                                rentDueCharges.map((charge, index) => (
                                  <div key={`${charge.dueMonth || charge.date}-${index}`} className="grid grid-cols-[70px_180px_150px_1fr] gap-3 bg-[#061426] px-5 py-4 text-sm">
                                    <div className="font-bold text-gray-500">{index + 1}</div>
                                    <div className="font-black text-cyan-300">
                                      {charge.dueMonth
                                        ? new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "long" }).format(new Date(`${charge.dueMonth}-01T00:00:00`))
                                        : "╪║┘è╪▒ ┘à╪¡╪»╪»"}
                                    </div>
                                    <div className="font-bold text-gray-300">{formatPaymentDate(charge.date)}</div>
                                    <div className="font-black text-orange-300">{(Number(charge.amount) || 0).toLocaleString("ar-SA")} ╪▒┘è╪º┘ä</div>
                                  </div>
                                ))
                              ) : (
                                <div className="px-5 py-10 text-center text-sm font-bold text-gray-500">┘ä╪º ╪¬┘ê╪¼╪» ┘à╪│╪¬╪¡┘é╪º╪¬ ╪Ñ┘è╪¼╪º╪▒ ┘à╪│╪¼┘ä╪⌐ ┘ä┘ç╪░┘ç ╪º┘ä╪┤┘é╪⌐.</div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="overflow-visible rounded-3xl border border-[#285273]">

                      <div className="relative flex flex-col gap-4 border-b border-white/10 bg-[#071a2d] p-5 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                          <h3 className="text-xl font-bold">
                            ╪│╪¼┘ä ╪º┘ä╪»┘ü╪╣╪º╪¬
                          </h3>
                          <p className="mt-1 text-sm font-semibold text-gray-500">
                            ╪¼┘à┘è╪╣ ╪╣┘à┘ä┘è╪º╪¬ ╪º┘ä╪»┘ü╪╣ ┘ê╪º┘ä╪¬╪¡╪╡┘è┘ä ╪º┘ä╪«╪º╪╡╪⌐ ╪¿┘ç╪░┘ç ╪º┘ä╪┤┘é╪⌐
                          </p>
                        </div>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setIsPaymentExportMenuOpen((current) => !current)
                            }
                            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#f0ad18]/45 bg-[#f0ad18]/10 px-5 py-2.5 text-base font-black text-[#f6c84a] transition hover:border-[#f6c84a]/80 hover:bg-[#f0ad18]/20"
                          >
                            <Download size={19} />
                            ╪¬╪╡╪»┘è╪▒
                          </button>

                          {isPaymentExportMenuOpen && (
                            <div className="absolute left-0 top-[calc(100%+8px)] z-[120] w-48 overflow-hidden rounded-2xl border border-[#285273] bg-[#061426] p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">

                              <button
                                type="button"
                                onClick={exportApartmentPaymentsPdf}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right text-sm font-black text-white transition hover:bg-red-500/10 hover:text-red-300"
                              >
                                <FileText size={18} className="text-red-300" />
                                ╪¬╪╡╪»┘è╪▒ PDF
                              </button>

                              <button
                                type="button"
                                onClick={exportApartmentPaymentsExcel}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right text-sm font-black text-white transition hover:bg-green-500/10 hover:text-green-300"
                              >
                                <Download size={18} className="text-green-300" />
                                ╪¬╪╡╪»┘è╪▒ Excel
                              </button>

                              <button
                                type="button"
                                onClick={printApartmentPayments}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right text-sm font-black text-white transition hover:bg-blue-500/10 hover:text-blue-300"
                              >
                                <Printer size={18} className="text-blue-300" />
                                ╪╖╪¿╪º╪╣╪⌐
                              </button>

                            </div>
                          )}
                        </div>

                      </div>

                      <div className="overflow-x-auto">
                        <div className="min-w-[760px] divide-y divide-white/5">

                          <div className="grid grid-cols-[70px_150px_1fr_150px_1.5fr] gap-3 bg-[#0a2137] px-5 py-4 text-sm font-black text-gray-300">
                            <div>#</div>
                            <div>╪¬╪º╪▒┘è╪« ╪º┘ä╪»┘ü╪╣</div>
                            <div>┘å┘ê╪╣ ╪º┘ä┘à╪│╪¬╪¡┘é</div>
                            <div>╪º┘ä┘à╪¿┘ä╪║</div>
                            <div>╪¬┘ü╪º╪╡┘è┘ä ╪º┘ä┘à╪¿┘ä╪║</div>
                          </div>

                          {payments.length > 0 ? (
                            payments.map((payment, index) => (
                              <div
                                key={`${payment.date}-${payment.type}-${index}`}
                                className="grid grid-cols-[70px_150px_1fr_150px_1.5fr] gap-3 bg-[#061426] px-5 py-4 text-sm"
                              >
                                <div className="font-bold text-gray-500">
                                  {index + 1}
                                </div>

                                <div className="font-bold text-gray-300">
                                  {formatPaymentDate(payment.date)}
                                </div>

                                <div className="font-black text-white">
                                  {payment.type || "╪║┘è╪▒ ┘à╪¡╪»╪»"}
                                </div>

                                <div className="font-black text-green-400">
                                  {(Number(payment.amount) || 0).toLocaleString(
                                    "ar-SA"
                                  )}{" "}
                                  ╪▒┘è╪º┘ä
                                </div>

                                <div className="font-semibold leading-6 text-gray-400">
                                  {payment.notes || "┘ä╪º ╪¬┘ê╪¼╪» ╪¬┘ü╪º╪╡┘è┘ä"}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-5 py-14 text-center">
                              <Receipt
                                size={42}
                                className="mx-auto text-gray-700"
                              />
                              <div className="mt-4 text-base font-bold text-gray-400">
                                ┘ä╪º ╪¬┘ê╪¼╪» ╪»┘ü╪╣╪º╪¬ ┘à╪│╪¼┘ä╪⌐ ┘ä┘ç╪░┘ç ╪º┘ä╪┤┘é╪⌐ ╪¡╪¬┘ë ╪º┘ä╪ó┘å
                              </div>
                              <div className="mt-2 text-sm text-gray-600">
                                ╪╣┘å╪» ╪¬╪│╪¼┘è┘ä ╪¬╪¡╪╡┘è┘ä ┘à┘å ╪┤╪º╪┤╪⌐ ╪º┘ä╪¬╪¡╪╡┘è┘ä ╪│┘è╪╕┘ç╪▒ ┘ç┘å╪º ╪¬┘ä┘é╪º╪ª┘è┘ï╪º.
                              </div>
                            </div>
                          )}

                        </div>
                      </div>

                    </div>

                  </div>
                );
              })()}

              {/* DOCUMENTS */}

              {activeTab ===
                "╪º┘ä┘à╪│╪¬┘å╪»╪º╪¬" && (

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

                  {[
                    "╪╣┘é╪» ╪º┘ä╪Ñ┘è╪¼╪º╪▒",
                    "╪╡┘ê╪▒╪⌐ ╪º┘ä┘ç┘ê┘è╪⌐",
                    "╪Ñ┘è╪╡╪º┘ä ╪º┘ä╪¬╪ú┘à┘è┘å",
                    "┘à╪¡╪╢╪▒ ╪º┘ä╪º╪│╪¬┘ä╪º┘à",
                    "╪╡┘ê╪▒ ╪º┘ä╪┤┘é╪⌐",
                    "┘à╪│╪¬┘å╪»╪º╪¬ ╪Ñ╪╢╪º┘ü┘è╪⌐",
                  ].map((document) => (

                    <div
                      key={document}
                      className="group rounded-3xl border border-[#285273] bg-white/[0.025] p-6 transition hover:border-[#f0ad18]/40"
                    >

                      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0ad18]/10 text-[#f0ad18]">

                        <Paperclip size={25} />

                      </div>

                      <div className="font-bold">
                        {document}
                      </div>

                      <div className="mt-2 text-sm text-gray-500">
                        ┘ä┘à ┘è╪¬┘à ╪▒┘ü╪╣ ╪º┘ä┘à╪│╪¬┘å╪» ╪¿╪╣╪»
                      </div>

                      <button
                        type="button"
                        className="mt-5 rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-400 transition hover:border-[#f0ad18]/40 hover:text-[#f0ad18]"
                      >
                        ╪Ñ╪╢╪º┘ü╪⌐ ┘à╪│╪¬┘å╪»
                      </button>

                    </div>

                  ))}

                </div>

              )}

              {/* NOTES */}

              {activeTab ===
                "╪º┘ä┘à┘ä╪º╪¡╪╕╪º╪¬" && (

                <div className="rounded-3xl border border-[#285273] bg-white/[0.025] p-6">

                  <div className="mb-6 flex items-center gap-3">

                    <div className="rounded-xl bg-purple-400/10 p-3 text-purple-400">
                      <MessageSquare size={23} />
                    </div>

                    <div>

                      <h3 className="text-xl font-bold">
                        ┘à┘ä╪º╪¡╪╕╪º╪¬ ╪º┘ä╪┤┘é╪⌐
                      </h3>

                      <p className="text-sm text-gray-500">
                        ╪│╪¼┘ä ╪º┘ä┘à┘ä╪º╪¡╪╕╪º╪¬ ┘ê╪º┘ä┘à╪╣┘ä┘ê┘à╪º╪¬ ╪º┘ä┘à┘ç┘à╪⌐
                      </p>

                    </div>

                  </div>

                  <div className="rounded-2xl border border-dashed border-white/10 bg-[#061a2d] p-10 text-center">

                    <MessageSquare
                      size={42}
                      className="mx-auto text-gray-600"
                    />

                    <div className="mt-4 text-gray-400">
                      ┘ä╪º ╪¬┘ê╪¼╪» ┘à┘ä╪º╪¡╪╕╪º╪¬ ┘à╪│╪¼┘ä╪⌐ ╪¡╪º┘ä┘è┘ï╪º
                    </div>

                    <button
                      type="button"
                      className="mt-5 rounded-xl bg-[#f0ad18] px-5 py-3 font-bold text-[#07182b] transition hover:bg-[#f6c84a]"
                    >
                      + ╪Ñ╪╢╪º┘ü╪⌐ ┘à┘ä╪º╪¡╪╕╪⌐
                    </button>

                  </div>

                </div>

              )}

            </div>

            {/* ================================================= */}
            {/* MODAL FOOTER                                      */}
            {/* ================================================= */}

            <div className="flex flex-col gap-3 border-t border-white/10 bg-[#050f1d] p-5 sm:flex-row sm:items-center sm:justify-center lg:px-6">

              <button
                type="button"
                onClick={saveApartmentDetails}
                className="flex min-h-[54px] min-w-[180px] items-center justify-center gap-3 rounded-2xl border border-green-400/60 bg-green-500/10 px-8 py-4 text-lg font-black text-green-400 transition hover:bg-green-500/15"
              >
                <CheckCircle2 size={24} />
                ╪¡┘ü╪╕
              </button>

              <button
                type="button"
                onClick={closeApartment}
                className="flex min-h-[54px] min-w-[180px] items-center justify-center gap-3 rounded-2xl border border-[#f0ad18]/60 bg-[#f0ad18]/10 px-8 py-4 text-lg font-black text-[#f6c84a] transition hover:bg-[#f0ad18] hover:text-[#07182b]"
              >
                ╪Ñ╪║┘ä╪º┘é
                <X size={23} />
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ===================================================== */}
      {/* APARTMENT TYPES MANAGEMENT MODAL                        */}
      {/* ===================================================== */}

      {isApartmentTypeModalOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-3 backdrop-blur-xl sm:p-5"
          onClick={closeApartmentTypeModal}
        >
          <div
            dir="rtl"
            className="relative flex max-h-[calc(100vh-24px)] w-full max-w-[1120px] flex-col overflow-hidden rounded-[30px] border border-blue-400/55 bg-[#061426]/[0.97] shadow-[0_0_100px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-300 to-transparent" />

            <div className="shrink-0 border-b border-white/10 bg-gradient-to-r from-[#050d18] via-[#09213a] to-[#061426] px-5 py-4 sm:px-7">
              <div className="flex items-center justify-center gap-4">
                <div className="flex min-w-0 items-center justify-center gap-4 text-center">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-300/40 bg-blue-400/10 text-blue-300">
                    <Building2 size={29} />
                  </div>
                  <div className="min-w-0 text-center">
                    <h2 className="text-xl font-black text-blue-300 sm:text-2xl lg:text-3xl">
                      ╪ú┘å┘ê╪º╪╣ ╪º┘ä╪┤┘é┘é
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-gray-400">
                      ╪ú╪╢┘ü ╪ú┘å┘ê╪º╪╣ ╪º┘ä╪┤┘é┘é ┘ê╪¡╪»╪» ╪ú╪▒┘é╪º┘à ╪º┘ä╪┤┘é┘é ╪º┘ä╪¬╪º╪¿╪╣╪⌐ ┘ä┘â┘ä ┘å┘ê╪╣
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeApartmentTypeModal}
                  aria-label="╪Ñ╪║┘ä╪º┘é"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-400"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
              <div className="grid min-h-0 grid-cols-1 gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-3xl border border-blue-400/20 bg-[#081c31]/80 p-4 backdrop-blur-2xl sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black text-white">╪ú┘å┘ê╪º╪╣ ╪º┘ä╪┤┘é┘é ╪º┘ä┘à╪¬╪º╪¡╪⌐</h3>
                      <p className="mt-1 text-sm font-semibold text-gray-500">╪º╪«╪¬╪▒ ╪º┘ä┘å┘ê╪╣ ┘ä╪Ñ╪»╪º╪▒╪⌐ ╪ú╪▒┘é╪º┘à ╪º┘ä╪┤┘é┘é</p>
                    </div>
                    <span className="rounded-full border border-blue-400/25 bg-blue-400/10 px-3 py-1.5 text-xs font-black text-blue-300">
                      {availableApartmentTypes.length} ╪ú┘å┘ê╪º╪╣
                    </span>
                  </div>

                  <div className="mb-4 space-y-2">
                    <div className="flex gap-2">
                      <input
                        value={newApartmentType}
                        onChange={(event) => setNewApartmentType(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            addNewApartmentTypeFromCard();
                          }
                        }}
                        placeholder="╪º┘â╪¬╪¿ ┘å┘ê╪╣ ╪┤┘é╪⌐ ╪¼╪»┘è╪»"
                        className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#07182b] px-3 text-sm font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-blue-400/60"
                      />
                      <button
                        type="button"
                        onClick={addNewApartmentTypeFromCard}
                        className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-400/10 px-4 text-sm font-black text-blue-300 transition hover:bg-blue-400/20"
                      >
                        <Plus size={17} />
                        ╪Ñ╪╢╪º┘ü╪⌐
                      </button>
                    </div>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newApartmentTypeRent}
                      onChange={(event) => setNewApartmentTypeRent(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          addNewApartmentTypeFromCard();
                        }
                      }}
                      placeholder="┘é┘è┘à╪⌐ ╪º┘ä╪Ñ┘è╪¼╪º╪▒ ╪º┘ä╪┤┘ç╪▒┘è ┘ä┘ä┘å┘ê╪╣ (╪▒┘è╪º┘ä)"
                      className="h-11 w-full rounded-xl border border-[#f0ad18]/20 bg-[#07182b] px-3 text-sm font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-[#f0ad18]/60"
                    />
                  </div>

                  <div className="space-y-2">
                    {availableApartmentTypes.map((type) => {
                      const count = apartments.filter(
                        (apartment) => getApartmentType(apartment) === type
                      ).length;
                      const active = selectedApartmentType === type;
                      const rent = apartmentTypeRents[type] ??
                        apartments.find((apartment) => getApartmentType(apartment) === type)?.rent ?? 0;

                      return (
                        <div
                          key={type}
                          className={`rounded-2xl border p-3 text-right transition ${
                            active
                              ? "border-blue-400/40 bg-blue-400/10"
                              : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.05]"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => selectApartmentTypeForManagement(type)}
                            className="flex w-full items-center justify-between gap-3 text-right"
                          >
                            <span className={`font-black ${active ? "text-blue-300" : "text-white"}`}>
                              {type}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-gray-400">
                              {count} ╪┤┘é╪⌐
                            </span>
                          </button>

                          <div className="mt-2 flex items-center gap-2">
                            <span className="shrink-0 text-xs font-bold text-gray-500">
                              ┘é┘è┘à╪⌐ ╪º┘ä╪Ñ┘è╪¼╪º╪▒
                            </span>
                            <div className="relative min-w-0 flex-1">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={rent || ""}
                                onChange={(event) =>
                                  updateApartmentTypeRent(type, event.target.value)
                                }
                                disabled={!canEditApartmentTypes}
                                placeholder="╪▒┘è╪º┘ä / ╪┤┘ç╪▒┘è╪º┘ï"
                                className="h-9 w-full rounded-lg border border-white/10 bg-[#07182b] px-3 pl-14 text-sm font-black text-[#f6c84a] outline-none transition placeholder:text-gray-600 focus:border-[#f0ad18]/60"
                              />
                              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-gray-500">
                                ╪▒┘è╪º┘ä
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-4 backdrop-blur-2xl sm:p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Home size={22} className="text-blue-300" />
                        <h3 className="text-xl font-black text-white">
                          ╪¬╪¡╪»┘è╪» ╪┤┘é┘é: {selectedApartmentType || "-"}
                        </h3>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-gray-500">
                        ╪¡╪»╪» ╪ú╪▒┘é╪º┘à ╪º┘ä╪┤┘é┘é ╪º┘ä╪¬┘è ╪¬┘å╪¬┘à┘è ╪Ñ┘ä┘ë ╪º┘ä┘å┘ê╪╣ ╪º┘ä┘à╪«╪¬╪º╪▒
                      </p>
                    </div>
                    <div className="rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1.5 text-xs font-black text-blue-300">
                      {selectedTypeApartments.length} ┘à╪¡╪»╪»╪⌐
                    </div>
                  </div>

                  <div className="mb-3 flex gap-2">
                    <button
                      type="button"
                      onClick={toggleAllTypeApartments}
                      className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-blue-400/30 bg-blue-400/10 text-sm font-black text-blue-300 transition hover:bg-blue-400/15"
                    >
                      <Check size={17} />
                      {filteredTypeApartments.length > 0 &&
                      filteredTypeApartments.every((apartment) =>
                        selectedTypeApartments.includes(apartment.number)
                      )
                        ? "╪Ñ┘ä╪║╪º╪í ╪¬╪¡╪»┘è╪» ╪º┘ä┘â┘ä"
                        : "╪¬╪¡╪»┘è╪» ╪º┘ä┘â┘ä"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTypeApartments([])}
                      className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-gray-400 transition hover:bg-white/10 hover:text-white"
                    >
                      ╪Ñ┘ä╪║╪º╪í ╪º┘ä╪¬╪¡╪»┘è╪»
                    </button>
                  </div>

                  <div className="relative mb-3">
                    <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      value={apartmentTypeSearch}
                      onChange={(event) => setApartmentTypeSearch(event.target.value)}
                      placeholder="╪º╪¿╪¡╪½ ╪╣┘å ╪▒┘é┘à ╪º┘ä╪┤┘é╪⌐ ╪ú┘ê ╪º┘ä┘å┘ê╪╣..."
                      className="h-11 w-full rounded-xl border border-white/10 bg-[#07182b] pl-4 pr-10 text-sm font-semibold text-white outline-none transition placeholder:text-gray-600 focus:border-blue-400/50"
                    />
                  </div>

                  <div className="max-h-[420px] overflow-y-auto rounded-2xl border border-white/5 bg-[#061426]/60 p-2 scrollbar-thin">
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {filteredTypeApartments.map((apartment) => {
                        const isSelected = selectedTypeApartments.includes(apartment.number);

                        return (
                          <button
                            key={apartment.number}
                            type="button"
                            onClick={() => toggleTypeApartment(apartment.number)}
                            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-right transition ${
                              isSelected
                                ? "border-blue-400/30 bg-blue-400/10"
                                : "border-transparent bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.045]"
                            }`}
                          >
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${
                                isSelected
                                  ? "border-blue-300 bg-blue-300 text-[#07182b]"
                                  : "border-gray-600 bg-transparent text-transparent"
                              }`}
                            >
                              <Check size={15} strokeWidth={3} />
                            </span>
                            <span className="flex-1">
                              <span className="flex items-center justify-between gap-3">
                                <span className="text-base font-black text-white">
                                  ╪┤┘é╪⌐ {apartment.number}
                                </span>
                                <span className="text-sm font-bold text-gray-300">
                                  {getApartmentType(apartment)}
                                </span>
                              </span>
                            </span>
                          </button>
                        );
                      })}

                      {filteredTypeApartments.length === 0 && (
                        <div className="col-span-full py-10 text-center text-sm font-semibold text-gray-500">
                          ┘ä╪º ╪¬┘ê╪¼╪» ╪┤┘é┘é ┘à╪╖╪º╪¿┘é╪⌐ ┘ä┘ä╪¿╪¡╪½
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl border border-blue-400/20 bg-blue-400/[0.05] px-4 py-3 text-sm font-bold text-gray-300">
                    ╪│┘è╪¬┘à ╪¡┘ü╪╕ ╪ú╪▒┘é╪º┘à ╪º┘ä╪┤┘é┘é ╪º┘ä┘à╪¡╪»╪»╪⌐ ╪¬╪¡╪¬ ╪º┘ä┘å┘ê╪╣: <span className="font-black text-blue-300">{selectedApartmentType || "-"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-white/10 bg-[#061426] p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={saveApartmentTypeAssignments}
                  disabled={!canEditApartmentTypes}
                  className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-blue-400/40 bg-gradient-to-r from-blue-700 to-blue-500 px-5 text-base font-black text-white shadow-[0_8px_30px_rgba(59,130,246,0.16)] transition hover:brightness-110 sm:text-lg"
                >
                  <CheckCircle2 size={21} />
                  ╪¡┘ü╪╕ ╪¬┘ê╪▓┘è╪╣ ╪º┘ä┘å┘ê╪╣
                </button>

                <button
                  type="button"
                  onClick={closeApartmentTypeModal}
                  className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 text-base font-black text-gray-300 transition hover:bg-white/10 hover:text-white sm:text-lg"
                >
                  <X size={21} />
                  ╪Ñ╪║┘ä╪º┘é
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* ADD CHARGE / COLLECTION MODAL                          */}
      {/* ===================================================== */}

      {isChargeModalOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-3 backdrop-blur-xl sm:p-5"
          onClick={() => setIsChargeModalOpen(false)}
        >
          <div
            dir="rtl"
            className={`relative flex max-h-[calc(100vh-24px)] w-full ${
              selectedApartment ? "max-w-[720px]" : "max-w-[1120px]"
            } flex-col overflow-hidden rounded-[30px] border bg-[#061426]/[0.97] shadow-[0_0_100px_rgba(0,0,0,0.55)] ${
              chargeModalMode === "collection"
                ? "border-[#f0ad18]/55 shadow-[0_0_70px_rgba(240,173,24,0.12)]"
                : "border-cyan-400/55 shadow-[0_0_70px_rgba(34,211,238,0.12)]"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent ${
                chargeModalMode === "collection"
                  ? "via-[#f6c84a]"
                  : "via-cyan-300"
              } to-transparent`}
            />

            {/* MODAL HEADER */}
            <div className="shrink-0 border-b border-white/10 bg-gradient-to-r from-[#050d18] via-[#09213a] to-[#061426] px-5 py-4 sm:px-7">
              <div className="flex items-center justify-center gap-4">
                <div className="flex min-w-0 items-center justify-center gap-4 text-center">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-[0_0_28px_rgba(34,211,238,0.10)] ${
                      chargeModalMode === "collection"
                        ? "border-[#f6c84a]/40 bg-[#f0ad18]/10 text-[#f6c84a]"
                        : "border-cyan-300/40 bg-cyan-400/10 text-cyan-300"
                    }`}
                  >
                    {chargeModalMode === "collection" ? (
                      <Coins size={29} />
                    ) : (
                      <Receipt size={29} />
                    )}
                  </div>

                  <div className="min-w-0 text-center">
                    <h2
                      className={`truncate text-xl font-black sm:text-2xl lg:text-3xl ${
                        chargeModalMode === "collection"
                          ? "text-[#f6c84a]"
                          : "text-cyan-300"
                      }`}
                    >
                      {chargeModalMode === "collection"
                        ? chargeForm.type === "╪Ñ┘è╪¼╪º╪▒"
                          ? "╪¬╪¡╪╡┘è┘ä ╪Ñ┘è╪¼╪º╪▒"
                          : "╪¬╪¡╪╡┘è┘ä ┘ü╪º╪¬┘ê╪▒╪⌐ ╪ú┘ê ┘à╪│╪¬╪¡┘é╪º╪¬"
                        : chargeForm.type === "╪Ñ┘è╪¼╪º╪▒"
                        ? "╪Ñ╪╢╪º┘ü╪⌐ ╪Ñ┘è╪¼╪º╪▒"
                        : "╪Ñ╪╢╪º┘ü╪⌐ ┘ü╪º╪¬┘ê╪▒╪⌐ ╪ú┘ê ┘à╪│╪¬╪¡┘é╪º╪¬"}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-gray-400">
                      {selectedApartment
                        ? `╪¬╪│╪¼┘è┘ä ╪º┘ä╪╣┘à┘ä┘è╪⌐ ┘ä┘ä╪┤┘é╪⌐ ╪▒┘é┘à ${selectedApartment.number} ┘ü┘é╪╖`
                        : chargeModalMode === "collection"
                        ? "╪¬╪│╪¼┘è┘ä ╪¬╪¡╪╡┘è┘ä ╪¼╪»┘è╪» ┘ä┘ä╪┤┘é┘é ╪º┘ä┘à╪¡╪»╪»╪⌐"
                        : chargeForm.type === "╪Ñ┘è╪¼╪º╪▒"
                        ? "╪¬╪│╪¼┘è┘ä ╪º╪│╪¬╪¡┘é╪º┘é ╪Ñ┘è╪¼╪º╪▒ ╪¼╪»┘è╪» ┘ä┘ä╪┤┘é┘é ╪º┘ä┘à╪¡╪»╪»╪⌐"
                        : "╪¬╪│╪¼┘è┘ä ┘à╪│╪¬╪¡┘é ╪¼╪»┘è╪» ┘ä┘ä╪┤┘é┘é ╪º┘ä┘à╪¡╪»╪»╪⌐"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsChargeModalOpen(false)}
                  aria-label="╪Ñ╪║┘ä╪º┘é"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-400"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* MODAL BODY */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
              <div
                className={`grid min-h-0 grid-cols-1 gap-5 ${
                  selectedApartment ? "lg:grid-cols-1" : "lg:grid-cols-[1fr_1.08fr]"
                }`}
                dir="ltr"
              >
                {selectedApartment ? (
                  <div
                    className={`rounded-3xl border bg-[#081c31]/80 p-4 backdrop-blur-2xl sm:p-5 ${
                      chargeModalMode === "collection"
                        ? "border-[#f0ad18]/25"
                        : "border-cyan-400/25"
                    }`}
                    dir="rtl"
                  >
                    <div className="relative flex min-h-[88px] items-center justify-center px-14 py-2 text-center">
                      <div
                        className={`absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl border ${
                          chargeModalMode === "collection"
                            ? "border-[#f6c84a]/30 bg-[#f0ad18]/10 text-[#f6c84a]"
                            : "border-cyan-300/30 bg-cyan-400/10 text-cyan-300"
                        }`}
                      >
                        <Home size={22} />
                      </div>

                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-400">╪º┘ä╪┤┘é╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐</p>
                        <h3 className="text-xl font-black text-white">
                          ╪┤┘é╪⌐ {selectedApartment.number}
                        </h3>
                        <div className="mt-1 text-lg font-black text-[#f6c84a]">
                          {getApartmentRent(selectedApartment).toLocaleString("ar-SA")} ╪▒┘è╪º┘ä
                        </div>
                        <div className="text-[11px] font-semibold text-gray-500">
                          {getApartmentType(selectedApartment)} ΓÇó {selectedApartment.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                <div
                  className={`min-h-0 overflow-hidden rounded-3xl border bg-[#081c31]/80 p-4 backdrop-blur-2xl sm:p-5 ${
                    chargeModalMode === "collection"
                      ? "border-[#f0ad18]/25"
                      : "border-cyan-400/25"
                  }`}
                  dir="rtl"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Home
                          size={22}
                          className={
                            chargeModalMode === "collection"
                              ? "text-[#f6c84a]"
                              : "text-cyan-300"
                          }
                        />
                        <h3 className="text-xl font-black text-white">
                          ╪º╪«╪¬╪▒ ╪º┘ä╪┤┘é┘é
                        </h3>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-gray-500">
                        ┘è┘à┘â┘å┘â ╪º╪«╪¬┘è╪º╪▒ ╪┤┘é╪⌐ ┘ê╪º╪¡╪»╪⌐ ╪ú┘ê ╪ú┘â╪½╪▒ ╪ú┘ê ╪º┘ä┘â┘ä
                      </p>
                    </div>

                    <div
                      className={`rounded-full border px-3 py-1.5 text-xs font-black ${
                        selectedChargeApartments.length > 0
                          ? chargeModalMode === "collection"
                            ? "border-[#f0ad18]/30 bg-[#f0ad18]/10 text-[#f6c84a]"
                            : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                          : "border-white/10 bg-white/5 text-gray-500"
                      }`}
                    >
                      {selectedChargeApartments.length} ┘à╪¡╪»╪»╪⌐
                    </div>
                  </div>

                  <div className="mb-3 flex gap-2">
                    <button
                      type="button"
                      onClick={toggleAllVisibleChargeApartments}
                      className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border text-sm font-black transition ${
                        chargeModalMode === "collection"
                          ? "border-[#f0ad18]/30 bg-[#f0ad18]/10 text-[#f6c84a] hover:bg-[#f0ad18]/15"
                          : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/15"
                      }`}
                    >
                      <Check size={17} />
                      {visibleChargeApartments.length > 0 &&
                      visibleChargeApartments.every((apartment) =>
                        selectedChargeApartments.includes(apartment.number)
                      )
                        ? "╪Ñ┘ä╪║╪º╪í ╪¬╪¡╪»┘è╪» ╪º┘ä┘â┘ä"
                        : "╪¬╪¡╪»┘è╪» ╪º┘ä┘â┘ä"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedChargeApartments([])}
                      className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-gray-400 transition hover:bg-white/10 hover:text-white"
                    >
                      ╪Ñ┘ä╪║╪º╪í ╪º┘ä╪¬╪¡╪»┘è╪»
                    </button>
                  </div>

                  <div className="relative mb-3">
                    <select
                      value={apartmentTypeFilter}
                      onChange={(event) =>
                        setApartmentTypeFilter(event.target.value)
                      }
                      className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#07182b] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-400/50"
                    >
                      <option value="">┘â┘ä ╪ú┘å┘ê╪º╪╣ ╪º┘ä╪┤┘é┘é</option>
                      {apartmentTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative mb-3">
                    <select
                      value={apartmentStatusFilter}
                      onChange={(event) =>
                        setApartmentStatusFilter(event.target.value)
                      }
                      className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#07182b] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-400/50"
                    >
                      <option value="">┘â┘ä ╪¡╪º┘ä╪º╪¬ ╪º┘ä╪┤┘é┘é</option>
                      {availableApartmentStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative mb-3">
                    <Search
                      size={18}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                    <input
                      value={apartmentSearch}
                      onChange={(event) =>
                        setApartmentSearch(event.target.value)
                      }
                      placeholder="╪º╪¿╪¡╪½ ╪╣┘å ╪▒┘é┘à ╪º┘ä╪┤┘é╪⌐..."
                      className="h-11 w-full rounded-xl border border-white/10 bg-[#07182b] pl-4 pr-10 text-sm font-semibold text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-400/50"
                    />
                  </div>

                  <div className="max-h-[390px] overflow-y-auto rounded-2xl border border-white/5 bg-[#061426]/60 p-2 scrollbar-thin">
                    <div className="space-y-1.5">
                      {visibleChargeApartments.map((apartment) => {
                        const isSelected =
                          selectedChargeApartments.includes(apartment.number);

                        return (
                          <button
                            key={apartment.number}
                            type="button"
                            onClick={() =>
                              toggleChargeApartment(apartment.number)
                            }
                            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-right transition ${
                              isSelected
                                ? chargeModalMode === "collection"
                                  ? "border-[#f0ad18]/30 bg-[#f0ad18]/10"
                                  : "border-cyan-400/30 bg-cyan-400/10"
                                : "border-transparent bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.045]"
                            }`}
                          >
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${
                                isSelected
                                  ? chargeModalMode === "collection"
                                    ? "border-[#f0ad18] bg-[#f0ad18] text-[#07182b]"
                                    : "border-cyan-300 bg-cyan-300 text-[#07182b]"
                                  : "border-gray-600 bg-transparent text-transparent"
                              }`}
                            >
                              <Check size={15} strokeWidth={3} />
                            </span>

                            <span className="flex-1">
                              <span className="flex items-center justify-between gap-3">
                                <span className="text-base font-black text-white">
                                  ╪┤┘é╪⌐ {apartment.number}
                                </span>
                                <span className="text-sm font-bold text-white">
                                  {getApartmentRent(apartment).toLocaleString("ar-SA")} ╪▒┘è╪º┘ä
                                </span>
                              </span>
                              <span className="mt-0.5 block text-xs font-semibold text-gray-500">
                                {getApartmentType(apartment)} ΓÇó{" "}
                                {apartment.status}
                              </span>
                            </span>
                          </button>
                        );
                      })}

                      {visibleChargeApartments.length === 0 && (
                        <div className="py-10 text-center text-sm font-semibold text-gray-500">
                          ┘ä╪º ╪¬┘ê╪¼╪» ╪┤┘é┘é ┘à╪╖╪º╪¿┘é╪⌐ ┘ä┘ä╪¿╪¡╪½
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={`mt-3 flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black ${
                      chargeModalMode === "collection"
                        ? "border-[#f0ad18]/25 bg-[#f0ad18]/[0.06] text-[#f6c84a]"
                        : "border-cyan-400/25 bg-cyan-400/[0.06] text-cyan-300"
                    }`}
                  >
                    <Users size={18} />
                    ╪¬┘à ╪º╪«╪¬┘è╪º╪▒ {selectedChargeApartments.length} ╪┤┘é╪⌐
                  </div>
                </div>
                )}

                {/* CHARGE FORM */}
                <div
                  className="rounded-3xl border border-white/10 bg-white/[0.025] p-4 text-center backdrop-blur-2xl sm:p-5"
                  dir="rtl"
                >
                  <div className="relative mb-4 flex min-h-[58px] items-center justify-center px-12 text-center">
                    <div
                      className={`absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border ${
                        chargeModalMode === "collection"
                          ? "border-[#f0ad18]/30 bg-[#f0ad18]/10 text-[#f6c84a]"
                          : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                      }`}
                    >
                      <FileText size={20} />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-black text-white">
                        ╪¿┘è╪º┘å╪º╪¬ ╪º┘ä┘à╪│╪¬╪¡┘é
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-gray-500">
                        {selectedApartment
                          ? `╪º┘ä╪╣┘à┘ä┘è╪⌐ ┘à╪«╪╡╪╡╪⌐ ┘ä┘ä╪┤┘é╪⌐ ╪▒┘é┘à ${selectedApartment.number} ┘ü┘é╪╖`
                          : "┘å┘ü╪│ ╪º┘ä╪¿┘è╪º┘å╪º╪¬ ╪│╪¬╪╖╪¿┘é ╪╣┘ä┘ë ┘â┘ä ╪º┘ä╪┤┘é┘é ╪º┘ä┘à╪¡╪»╪»╪⌐"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-center">
                      <span className="mb-2 block text-sm font-black text-gray-300 text-center">
                        ┘å┘ê╪╣ ╪º┘ä┘à╪│╪¬╪¡┘é
                      </span>
                      <select
                        value={chargeForm.type}
                        onChange={(event) =>
                          setChargeForm((current) => ({
                            ...current,
                            type: event.target.value,
                          }))
                        }
                        className={`h-13 w-full rounded-xl border bg-[#0b2039] px-4 text-center text-base font-bold text-white outline-none transition ${
                          chargeModalMode === "collection"
                            ? "border-[#f0ad18]/25 focus:border-[#f0ad18]/70"
                            : "border-cyan-400/20 focus:border-cyan-400/70"
                        }`}
                      >
                        <option value="╪Ñ┘è╪¼╪º╪▒">╪Ñ┘è╪¼╪º╪▒</option>
                        <option value="┘ü╪º╪¬┘ê╪▒╪⌐ ┘à┘è╪º┘ç">┘ü╪º╪¬┘ê╪▒╪⌐ ┘à┘è╪º┘ç</option>
                        <option value="┘ü╪º╪¬┘ê╪▒╪⌐ ┘â┘ç╪▒╪¿╪º╪í">┘ü╪º╪¬┘ê╪▒╪⌐ ┘â┘ç╪▒╪¿╪º╪í</option>
                        <option value="┘à╪╡╪º╪▒┘è┘ü ┘å╪╕╪º┘ü╪⌐">┘à╪╡╪º╪▒┘è┘ü ┘å╪╕╪º┘ü╪⌐</option>
                        <option value="┘à╪│╪¬╪¡┘é╪º╪¬ ╪ú╪«╪▒┘ë">┘à╪│╪¬╪¡┘é╪º╪¬ ╪ú╪«╪▒┘ë</option>
                      </select>
                    </label>

                    <label className="block text-center">
                      <span className="mb-2 block text-sm font-black text-gray-300 text-center">
                        {chargeForm.type === "╪Ñ┘è╪¼╪º╪▒"
                          ? "╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪Ñ┘è╪¼╪º╪▒ ┘ä┘ä╪┤┘é┘é ╪º┘ä┘à╪¡╪»╪»╪⌐ (╪▒┘è╪º┘ä)"
                          : "╪º┘ä┘à╪¿┘ä╪║ ┘ä┘â┘ä ╪┤┘é╪⌐ (╪▒┘è╪º┘ä)"}
                      </span>
                      <div className="relative">
                        {chargeForm.type === "╪Ñ┘è╪¼╪º╪▒" ? (
                          <div
                            className={`flex h-14 w-full items-center justify-center rounded-xl border bg-[#0b2039] px-4 pl-16 text-center text-xl font-black text-white ${
                              chargeModalMode === "collection"
                                ? "border-[#f0ad18]/25"
                                : "border-cyan-400/20"
                            }`}
                          >
                            {selectedRentTotal.toLocaleString("ar-SA")}
                          </div>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={chargeForm.amount}
                            onChange={(event) =>
                              setChargeForm((current) => ({
                                ...current,
                                amount: event.target.value,
                              }))
                            }
                            placeholder="╪º┘â╪¬╪¿ ╪º┘ä┘à╪¿┘ä╪║"
                            className={`h-14 w-full rounded-xl border bg-[#0b2039] px-4 pl-16 text-center text-xl font-black text-white outline-none transition placeholder:text-gray-600 ${
                              chargeModalMode === "collection"
                                ? "border-[#f0ad18]/25 focus:border-[#f0ad18]/70"
                                : "border-cyan-400/20 focus:border-cyan-400/70"
                            }`}
                          />
                        )}
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-gray-500">
                          ╪▒┘è╪º┘ä
                        </span>
                      </div>
                    </label>

                    {chargeModalMode === "collection" && chargeForm.type === "╪Ñ┘è╪¼╪º╪▒" && (
                      <label className="block text-center">
                        <span className="mb-2 block text-sm font-black text-gray-300 text-center">
                          ╪╣╪»╪» ╪ú╪┤┘ç╪▒ ╪º┘ä╪¬╪¡╪╡┘è┘ä
                        </span>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max={Math.max(1, selectedRentCollectionMaxMonths)}
                            step="1"
                            value={rentCollectionMonths}
                            onChange={(event) => {
                              const requested = Math.max(1, Number(event.target.value) || 1);
                              const maxMonths = selectedRentCollectionMaxMonths;
                              setRentCollectionMonths(
                                maxMonths > 0 ? Math.min(requested, maxMonths) : requested
                              );
                            }}
                            className="h-14 w-full rounded-xl border border-[#f0ad18]/25 bg-[#0b2039] px-4 text-center text-xl font-black text-white outline-none transition focus:border-[#f0ad18]/70"
                          />
                          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-gray-500">
                            ╪┤┘ç╪▒
                          </span>
                        </div>
                        <p className="mt-2 text-xs font-semibold text-gray-500">
                          ╪º┘ä╪º┘ü╪¬╪▒╪º╪╢┘è ╪┤┘ç╪▒ ┘ê╪º╪¡╪» ΓÇö ╪º┘ä╪¡╪» ╪º┘ä╪ú┘é╪╡┘ë ╪º┘ä┘à╪¬╪º╪¡ ┘ä┘ä╪¬╪¡╪╡┘è┘ä: {selectedRentCollectionMaxMonths.toLocaleString("ar-SA")} ╪ú╪┤┘ç╪▒
                        </p>
                      </label>
                    )}

                    {chargeForm.type === "╪Ñ┘è╪¼╪º╪▒" && chargeModalMode === "charge" && (
                      <div className="block text-center">
                        <span className="mb-2 block text-sm font-black text-gray-300 text-center">
                          ╪º┘ä╪Ñ┘è╪¼╪º╪▒ ┘à╪│╪¬╪¡┘é ╪╣┘å ╪┤┘ç╪▒ / ╪ú╪┤┘ç╪▒
                        </span>
                        <div className="flex gap-2">
                          <input
                            type="month"
                            value={rentDueMonth}
                            onChange={(event) => setRentDueMonth(event.target.value)}
                            className="h-14 min-w-0 flex-1 rounded-xl border border-cyan-400/20 bg-[#0b2039] px-4 text-center text-base font-bold text-white outline-none transition focus:border-cyan-400/70"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!rentDueMonth || rentDueMonths.includes(rentDueMonth)) return;
                              setRentDueMonths((current) => [...current, rentDueMonth].sort());
                            }}
                            className="h-14 shrink-0 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 text-sm font-black text-cyan-300 transition hover:bg-cyan-400/20"
                          >
                            ╪Ñ╪╢╪º┘ü╪⌐
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap justify-center gap-2">
                          {rentDueMonths.map((month) => (
                            <button
                              key={month}
                              type="button"
                              onClick={() => setRentDueMonths((current) => current.filter((item) => item !== month))}
                              className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-black text-cyan-200"
                            >
                              {new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "long" }).format(new Date(`${month}-01T00:00:00`))} ├ù
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 text-xs font-semibold text-gray-500">
                          ┘è┘à┘â┘å┘â ╪¬╪¡╪»┘è╪» ╪┤┘ç╪▒ ┘ê╪º╪¡╪» ╪ú┘ê ╪╣╪»╪⌐ ╪ú╪┤┘ç╪▒ ┘à╪│╪¬╪¡┘é╪⌐ ┘ä┘å┘ü╪│ ╪º┘ä╪╣┘à┘ä┘è╪⌐.
                        </p>
                      </div>
                    )}

                    {chargeForm.type !== "╪Ñ┘è╪¼╪º╪▒" && (
                      <div className="block text-center">
                        <span className="mb-2 block text-sm font-black text-gray-300 text-center">
                          {chargeModalMode === "collection"
                            ? "╪º┘ä┘à╪│╪¬╪¡┘é ╪╣┘å ╪┤┘ç╪▒ / ╪ú╪┤┘ç╪▒"
                            : "╪º┘ä┘à╪│╪¬╪¡┘é ╪╣┘å ╪┤┘ç╪▒ / ╪ú╪┤┘ç╪▒"}
                        </span>
                        <div className="flex gap-2">
                          <input
                            type="month"
                            value={chargeModalMode === "collection" ? collectionDueMonth : chargeDueMonth}
                            onChange={(event) =>
                              chargeModalMode === "collection"
                                ? setCollectionDueMonth(event.target.value)
                                : setChargeDueMonth(event.target.value)
                            }
                            className={`h-14 min-w-0 flex-1 rounded-xl border bg-[#0b2039] px-4 text-center text-base font-bold text-white outline-none transition ${
                              chargeModalMode === "collection"
                                ? "border-[#f0ad18]/25 focus:border-[#f0ad18]/70"
                                : "border-cyan-400/20 focus:border-cyan-400/70"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const selectedMonth = chargeModalMode === "collection" ? collectionDueMonth : chargeDueMonth;
                              if (!selectedMonth) return;
                              if (chargeModalMode === "collection") {
                                if (collectionDueMonths.includes(selectedMonth)) return;
                                setCollectionDueMonths((current) => [...current, selectedMonth].sort());
                              } else {
                                if (chargeDueMonths.includes(selectedMonth)) return;
                                setChargeDueMonths((current) => [...current, selectedMonth].sort());
                              }
                            }}
                            className={`h-14 shrink-0 rounded-xl border px-4 text-sm font-black transition ${
                              chargeModalMode === "collection"
                                ? "border-[#f0ad18]/30 bg-[#f0ad18]/10 text-[#f6c84a] hover:bg-[#f0ad18]/20"
                                : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20"
                            }`}
                          >
                            ╪Ñ╪╢╪º┘ü╪⌐
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap justify-center gap-2">
                          {(chargeModalMode === "collection" ? collectionDueMonths : chargeDueMonths).map((month) => (
                            <button
                              key={month}
                              type="button"
                              onClick={() =>
                                chargeModalMode === "collection"
                                  ? setCollectionDueMonths((current) => current.filter((item) => item !== month))
                                  : setChargeDueMonths((current) => current.filter((item) => item !== month))
                              }
                              className={`rounded-full border px-3 py-1.5 text-xs font-black ${
                                chargeModalMode === "collection"
                                  ? "border-[#f0ad18]/20 bg-[#f0ad18]/10 text-[#f6c84a]"
                                  : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
                              }`}
                            >
                              {new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "long" }).format(new Date(`${month}-01T00:00:00`))} ├ù
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 text-xs font-semibold text-gray-500">
                          ┘è┘à┘â┘å┘â ╪¬╪¡╪»┘è╪» ╪┤┘ç╪▒ ┘ê╪º╪¡╪» ╪ú┘ê ╪╣╪»╪⌐ ╪ú╪┤┘ç╪▒ ┘ä┘å┘ü╪│ ╪º┘ä┘ü╪º╪¬┘ê╪▒╪⌐ ╪ú┘ê ╪º┘ä┘à╪│╪¬╪¡┘é.
                        </p>
                      </div>
                    )}

                    <label className="block text-center">
                      <span className="mb-2 block text-sm font-black text-gray-300 text-center">
                        ╪¬╪º╪▒┘è╪« ╪º┘ä╪Ñ╪»╪«╪º┘ä
                      </span>
                      <input
                        type="date"
                        value={chargeForm.date}
                        onChange={(event) =>
                          setChargeForm((current) => ({
                            ...current,
                            date: event.target.value,
                          }))
                        }
                        className={`h-14 w-full rounded-xl border bg-[#0b2039] px-4 text-center text-base font-bold text-white outline-none transition ${
                          chargeModalMode === "collection"
                            ? "border-[#f0ad18]/25 focus:border-[#f0ad18]/70"
                            : "border-cyan-400/20 focus:border-cyan-400/70"
                        }`}
                      />
                    </label>

                    <label className="block text-center">
                      <span className="mb-2 block text-sm font-black text-gray-300 text-center">
                        ┘à┘ä╪º╪¡╪╕╪º╪¬
                      </span>
                      <textarea
                        rows={3}
                        value={chargeForm.notes}
                        onChange={(event) =>
                          setChargeForm((current) => ({
                            ...current,
                            notes: event.target.value,
                          }))
                        }
                        placeholder="╪º┘â╪¬╪¿ ╪ú┘è ┘à┘ä╪º╪¡╪╕╪º╪¬ ╪Ñ╪╢╪º┘ü┘è╪⌐..."
                        className={`min-h-[90px] w-full resize-none rounded-xl border bg-[#0b2039] px-4 py-2.5 text-center text-base font-semibold text-white outline-none transition placeholder:text-gray-600 ${
                          chargeModalMode === "collection"
                            ? "border-[#f0ad18]/25 focus:border-[#f0ad18]/70"
                            : "border-cyan-400/20 focus:border-cyan-400/70"
                        }`}
                      />
                    </label>

                    <div
                      className={`rounded-2xl border px-4 py-3 text-center text-sm font-bold ${
                        chargeModalMode === "collection"
                          ? "border-[#f0ad18]/20 bg-[#f0ad18]/[0.06] text-gray-300"
                          : "border-cyan-400/20 bg-cyan-400/[0.05] text-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span>╪╣╪»╪» ╪º┘ä╪┤┘é┘é ╪º┘ä┘à╪¡╪»╪»╪⌐</span>
                        <span
                          className={`text-lg font-black ${
                            chargeModalMode === "collection"
                              ? "text-[#f6c84a]"
                              : "text-cyan-300"
                          }`}
                        >
                          {selectedChargeApartments.length}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <span>╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪╣┘à┘ä┘è╪⌐</span>
                        <span className="text-base font-black text-white">
                          {chargeForm.type === "╪Ñ┘è╪¼╪º╪▒"
                            ? (chargeModalMode === "charge"
                                ? selectedRentChargeTotal
                                : selectedRentCollectionTotal
                              ).toLocaleString("ar-SA")
                            : (chargeModalMode === "charge"
                                ? selectedChargeNonRentTotal
                                : selectedCollectionNonRentTotal
                              ).toLocaleString("ar-SA")}{" "}
                          ╪▒┘è╪º┘ä
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="shrink-0 border-t border-white/10 bg-[#061426] p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    if (denyChargeAdd(chargeModalMode, chargeForm.type)) return;

                    if (selectedChargeApartments.length === 0) {
                      window.alert("┘à┘å ┘ü╪╢┘ä┘â ╪º╪«╪¬╪▒ ╪┤┘é╪⌐ ┘ê╪º╪¡╪»╪⌐ ╪╣┘ä┘ë ╪º┘ä╪ú┘é┘ä");
                      return;
                    }

                    if (
                      chargeForm.type !== "╪Ñ┘è╪¼╪º╪▒" &&
                      (!chargeForm.amount.trim() || Number(chargeForm.amount) <= 0)
                    ) {
                      window.alert("┘à┘å ┘ü╪╢┘ä┘â ╪º┘â╪¬╪¿ ┘à╪¿┘ä╪║┘ï╪º ╪╡╪¡┘è╪¡┘ï╪º ╪ú┘ê┘ä╪º┘ï");
                      return;
                    }

                    if (chargeModalMode === "charge" && chargeForm.type === "╪Ñ┘è╪¼╪º╪▒" && rentDueMonths.length === 0) {
                      window.alert("┘à┘å ┘ü╪╢┘ä┘â ╪¡╪»╪» ╪┤┘ç╪▒┘ï╪º ┘à╪│╪¬╪¡┘é┘ï╪º ┘ê╪º╪¡╪»┘ï╪º ╪╣┘ä┘ë ╪º┘ä╪ú┘é┘ä ┘ä┘ä╪Ñ┘è╪¼╪º╪▒.");
                      return;
                    }

                    if (chargeModalMode === "charge" && chargeForm.type !== "╪Ñ┘è╪¼╪º╪▒" && chargeDueMonths.length === 0) {
                      window.alert("┘à┘å ┘ü╪╢┘ä┘â ╪¡╪»╪» ╪┤┘ç╪▒┘ï╪º ┘à╪│╪¬╪¡┘é┘ï╪º ┘ê╪º╪¡╪»┘ï╪º ╪╣┘ä┘ë ╪º┘ä╪ú┘é┘ä ┘ä┘ä┘ü╪º╪¬┘ê╪▒╪⌐ ╪ú┘ê ╪º┘ä┘à╪│╪¬╪¡┘é.");
                      return;
                    }

                    if (chargeModalMode === "collection" && chargeForm.type !== "╪Ñ┘è╪¼╪º╪▒" && collectionDueMonths.length === 0) {
                      window.alert("┘à┘å ┘ü╪╢┘ä┘â ╪¡╪»╪» ╪┤┘ç╪▒┘ï╪º ┘ê╪º╪¡╪»┘ï╪º ╪╣┘ä┘ë ╪º┘ä╪ú┘é┘ä ┘ä┘ä╪¬╪¡╪╡┘è┘ä.");
                      return;
                    }

                    if (chargeModalMode === "collection" && chargeForm.type === "╪Ñ┘è╪¼╪º╪▒") {
                      if (rentCollectionMonths < 1) {
                        window.alert("╪╣╪»╪» ╪ú╪┤┘ç╪▒ ╪º┘ä╪¬╪¡╪╡┘è┘ä ┘è╪¼╪¿ ╪ú┘å ┘è┘â┘ê┘å ╪┤┘ç╪▒┘ï╪º ┘ê╪º╪¡╪»┘ï╪º ╪╣┘ä┘ë ╪º┘ä╪ú┘é┘ä.");
                        return;
                      }

                      const invalidApartment = selectedChargeApartments
                        .map((apartmentNumber) =>
                          apartments.find((item) => item.number === apartmentNumber)
                        )
                        .find(
                          (apartment) =>
                            apartment &&
                            rentCollectionMonths > getApartmentRemainingRentMonths(apartment)
                        );

                      if (invalidApartment) {
                        const maxMonths = getApartmentRemainingRentMonths(invalidApartment);
                        window.alert(
                          maxMonths > 0
                            ? `┘ä╪º ┘è┘à┘â┘å ╪¬╪¡╪╡┘è┘ä ╪ú┘â╪½╪▒ ┘à┘å ${maxMonths} ╪┤┘ç╪▒ ┘ä┘ä╪┤┘é╪⌐ ╪▒┘é┘à ${invalidApartment.number} ┘ä╪ú┘å ┘ç╪░╪º ┘ç┘ê ╪º┘ä┘à╪¬╪¿┘é┘è ┘à┘å ┘é┘è┘à╪⌐ ╪╣┘é╪»┘ç╪º ╪¿╪╣╪» ╪º┘ä╪¬╪¡╪╡┘è┘ä╪º╪¬ ╪º┘ä╪│╪º╪¿┘é╪⌐.`
                            : `┘ä╪º ┘è┘ê╪¼╪» ┘à╪¬╪¿┘é┘è ┘à┘å ┘é┘è┘à╪⌐ ╪╣┘é╪» ╪º┘ä╪┤┘é╪⌐ ╪▒┘é┘à ${invalidApartment.number} ┘è┘à┘â┘å ╪¬╪¡╪╡┘è┘ä┘ç.`
                        );
                        return;
                      }
                    }

                    try {
                      const storageKey =
                        chargeModalMode === "collection"
                          ? "tumouh_star_building_collections"
                          : "tumouh_star_building_charges";

                      const saved = getBuildingStorageValue(storageKey);
                      const currentCharges: BuildingCharge[] = saved
                        ? JSON.parse(saved)
                        : [];

                      const newCharges = selectedChargeApartments.flatMap(
                        (apartmentNumber) => {
                          const apartment = apartments.find(
                            (item) => item.number === apartmentNumber
                          );
                          const monthlyRent = apartment ? getApartmentRent(apartment) : 0;
                          const rentMonths =
                            chargeModalMode === "collection" && chargeForm.type === "╪Ñ┘è╪¼╪º╪▒"
                              ? Math.max(1, rentCollectionMonths)
                              : undefined;

                          if (chargeModalMode === "charge" && chargeForm.type === "╪Ñ┘è╪¼╪º╪▒") {
                            return rentDueMonths.map((dueMonth) => ({
                              ...chargeForm,
                              amount: String(monthlyRent),
                              notes: chargeForm.notes,
                              apartmentNumber,
                              dueMonth,
                            }));
                          }

                          if (chargeForm.type !== "╪Ñ┘è╪¼╪º╪▒") {
                            const selectedMonths =
                              chargeModalMode === "collection"
                                ? collectionDueMonths
                                : chargeDueMonths;

                            return selectedMonths.map((dueMonth) => ({
                              ...chargeForm,
                              amount: chargeForm.amount,
                              notes: chargeForm.notes,
                              apartmentNumber,
                              dueMonth,
                            }));
                          }

                          return [{
                            ...chargeForm,
                            amount: String(monthlyRent * (rentMonths ?? 1)),
                            notes:
                              rentMonths
                                ? `${chargeForm.notes ? `${chargeForm.notes} ΓÇö ` : ""}╪¬╪¡╪╡┘è┘ä ╪Ñ┘è╪¼╪º╪▒ ╪╣┘å ${rentMonths} ${rentMonths === 1 ? "╪┤┘ç╪▒" : "╪ú╪┤┘ç╪▒"}`
                                : chargeForm.notes,
                            apartmentNumber,
                            ...(rentMonths ? { rentMonths } : {}),
                          }];
                        }
                      );

                      setBuildingStorageValue(
                        storageKey,
                        JSON.stringify([...currentCharges, ...newCharges])
                      );
                    } catch {
                      // ╪¬╪¼╪º┘ç┘ä ╪«╪╖╪ú ╪º┘ä╪¬╪«╪▓┘è┘å ╪º┘ä┘à╪¡┘ä┘è ┘à╪╣ ╪Ñ╪║┘ä╪º┘é ╪º┘ä┘å┘à┘ê╪░╪¼.
                    }

                    setChargeForm({
                      type: "╪Ñ┘è╪¼╪º╪▒",
                      amount: "",
                      date: new Date().toISOString().slice(0, 10),
                      notes: "",
                    });
                    setSelectedChargeApartments([]);
                    setApartmentTypeFilter("");
                    setApartmentStatusFilter("");
                    setApartmentSearch("");
                    setRentCollectionMonths(1);
                    setRentDueMonth(new Date().toISOString().slice(0, 7));
                    setRentDueMonths([]);
                    setChargeDueMonth(new Date().toISOString().slice(0, 7));
                    setChargeDueMonths([]);
                    setCollectionDueMonth(new Date().toISOString().slice(0, 7));
                    setCollectionDueMonths([]);
                    setIsChargeModalOpen(false);
                  }}
                  className={`flex h-14 items-center justify-center gap-2 rounded-2xl border px-5 text-base font-black transition sm:text-lg ${
                    chargeModalMode === "collection"
                      ? "border-[#f0ad18]/50 bg-gradient-to-r from-[#d89b18] to-[#f6c84a] text-[#07182b] shadow-[0_8px_30px_rgba(240,173,24,0.18)] hover:brightness-110"
                      : "border-green-400/40 bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-[0_8px_30px_rgba(34,197,94,0.16)] hover:brightness-110"
                  }`}
                >
                  <CheckCircle2 size={21} />
                  <span>
                    ╪¡┘ü╪╕{" "}
                    {selectedChargeApartments.length > 0
                      ? `┘ä┘ä╪┤┘é┘é ╪º┘ä┘à╪¡╪»╪»╪⌐ (${selectedChargeApartments.length})`
                      : ""}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsChargeModalOpen(false)}
                  className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 text-base font-black text-gray-300 transition hover:bg-white/10 hover:text-white sm:text-lg"
                >
                  <X size={21} />
                  ╪Ñ╪║┘ä╪º┘é
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* APARTMENT TYPE DETAILS REPORT MODAL                      */}
      {/* ===================================================== */}

      {selectedApartmentTypeReport && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/85 p-2 backdrop-blur-md sm:p-4"
          onClick={() => setSelectedApartmentTypeReport(null)}
        >
          <div
            dir="rtl"
            className="flex max-h-[94vh] w-full max-w-[98vw] flex-col overflow-hidden rounded-3xl border border-[#d89b18]/40 bg-[#07182b] shadow-[0_25px_90px_rgba(0,0,0,0.65)]"
            onClick={(event) => event.stopPropagation()}
          >
            {(() => {
              const rows = getApartmentTypeReportData();
              const totalRent = rows.reduce(
                (sum, row) => sum + getApartmentRent(row.apartment),
                0
              );
              const totalPaid = rows.reduce(
                (sum, row) => sum + row.totalPaid,
                0
              );

              return (
                <>
                  <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#061426] px-5 py-4">
                    <div className="text-right">
                      <h2 className="text-xl font-black text-[#f6c84a] sm:text-2xl">
                        {getApartmentTypeReportTitle()}
                      </h2>
                      <p className="mt-1 text-xs font-semibold text-gray-400 sm:text-sm">
                        ╪¬┘ü╪º╪╡┘è┘ä ╪¼┘à┘è╪╣ ╪º┘ä╪┤┘é┘é ╪º┘ä┘à╪│╪¼┘ä╪⌐ ╪¬╪¡╪¬ ┘ç╪░╪º ╪º┘ä┘å┘ê╪╣
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedApartmentTypeReport(null)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-300"
                      aria-label="╪Ñ╪║┘ä╪º┘é ╪º┘ä╪¬┘é╪▒┘è╪▒"
                    >
                      <X size={21} />
                    </button>
                  </div>

                  <div className="shrink-0 grid grid-cols-2 gap-3 border-b border-white/10 bg-[#0b2039] p-4 sm:grid-cols-4">
                    <div className="rounded-2xl border border-[#f0ad18]/20 bg-[#07182b] p-3 text-center">
                      <div className="text-xs font-bold text-gray-400">╪╣╪»╪» ╪º┘ä╪┤┘é┘é</div>
                      <div className="mt-1 text-2xl font-black text-[#f6c84a]">
                        {rows.length}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-green-400/20 bg-[#07182b] p-3 text-center">
                      <div className="text-xs font-bold text-gray-400">╪Ñ┘è╪¼╪º╪▒ ╪º┘ä╪┤┘é╪⌐</div>
                      <div className="mt-1 text-2xl font-black text-green-300">
                        {rows.length
                          ? getApartmentRent(rows[0].apartment).toLocaleString("ar-SA")
                          : "0"}{" "}
                        ╪▒┘è╪º┘ä
                      </div>
                    </div>

                    <div className="rounded-2xl border border-blue-400/20 bg-[#07182b] p-3 text-center">
                      <div className="text-xs font-bold text-gray-400">╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪Ñ┘è╪¼╪º╪▒ ╪º┘ä╪┤┘ç╪▒┘è</div>
                      <div className="mt-1 text-2xl font-black text-blue-300">
                        {totalRent.toLocaleString("ar-SA")} ╪▒┘è╪º┘ä
                      </div>
                    </div>

                    <div className="rounded-2xl border border-purple-400/20 bg-[#07182b] p-3 text-center">
                      <div className="text-xs font-bold text-gray-400">╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪»┘ü┘ê╪╣╪º╪¬</div>
                      <div className="mt-1 text-2xl font-black text-purple-300">
                        {totalPaid.toLocaleString("ar-SA")} ╪▒┘è╪º┘ä
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-auto p-4">
                    <div className="overflow-x-auto rounded-2xl border border-white/10">
                      <table className="w-full min-w-[2200px] border-collapse text-xs">
                        <thead className="sticky top-0 z-10 bg-[#0b2039]">
                          <tr className="text-gray-300">
                            <th className="border-b border-white/10 px-3 py-3 text-center">╪▒┘é┘à ╪º┘ä╪┤┘é╪⌐</th>
                            <th className="border-b border-white/10 px-3 py-3 text-center">╪º┘ä┘å┘ê╪╣</th>
                            <th className="border-b border-white/10 px-3 py-3 text-center">╪º┘ä╪¡╪º┘ä╪⌐</th>
                            <th className="border-b border-white/10 px-3 py-3 text-center">╪º┘ä╪Ñ┘è╪¼╪º╪▒ ╪º┘ä╪┤┘ç╪▒┘è</th>
                            <th className="border-b border-white/10 px-3 py-3 text-center">╪º╪│┘à ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒ / ╪º┘ä╪¼┘ç╪⌐</th>
                            <th className="border-b border-white/10 px-3 py-3 text-center">╪º┘ä╪¼┘ê╪º┘ä</th>
                            <th className="border-b border-white/10 px-3 py-3 text-center">╪▒┘é┘à ╪º┘ä┘ç┘ê┘è╪⌐</th>
                            <th className="border-b border-white/10 px-3 py-3 text-center">╪º┘ä╪»┘ê╪▒</th>
                            <th className="border-b border-white/10 px-3 py-3 text-center">╪º┘ä┘à┘ê╪º┘é┘ü</th>
                            <th className="border-b border-white/10 px-3 py-3 text-center">╪╣╪»╪º╪» ╪º┘ä┘â┘ç╪▒╪¿╪º╪í</th>
                            <th className="border-b border-white/10 px-3 py-3 text-center">╪╣╪»╪º╪» ╪º┘ä┘à┘è╪º┘ç</th>
                            <th className="border-b border-white/10 px-3 py-3 text-center">╪¡╪º┘ä╪⌐ ╪º┘ä┘ü╪▒╪┤</th>
                            <th className="border-b border-white/10 px-3 py-3 text-center">╪▒┘é┘à ╪º┘ä╪╣┘é╪»</th>
                            <th className="border-b border-white/10 px-3 py-3 text-center">╪¿╪»╪º┘è╪⌐ ╪º┘ä╪╣┘é╪»</th>
                            <th className="border-b border-white/10 px-3 py-3 text-center">┘å┘ç╪º┘è╪⌐ ╪º┘ä╪╣┘é╪»</th>
                            <th className="border-b border-white/10 px-3 py-3 text-center">┘à╪»╪⌐ ╪º┘ä╪╣┘é╪»</th>
                            <th className="border-b border-white/10 px-3 py-3 text-center">╪º┘ä╪¬╪ú┘à┘è┘å</th>
                            <th className="border-b border-white/10 px-3 py-3 text-center">┘à┘ä╪º╪¡╪╕╪º╪¬ ╪º┘ä╪¬╪ú┘à┘è┘å</th>
                            <th className="border-b border-white/10 px-3 py-3 text-center">╪╣╪»╪» ╪º┘ä╪»┘ü╪╣╪º╪¬</th>
                            <th className="border-b border-white/10 px-3 py-3 text-center">╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪»┘ü┘ê╪╣</th>
                          </tr>
                        </thead>

                        <tbody>
                          {rows.map(
                            ({
                              apartment,
                              extraInfo,
                              tenantInfo,
                              contractInfo,
                              paymentCount,
                              totalPaid: apartmentTotalPaid,
                            }) => {
                              const effectiveStatus = getEffectiveApartmentStatus(apartment);
                            const statusColor = getStatusColor(effectiveStatus);

                              return (
                                <tr
                                  key={apartment.number}
                                  className="border-b border-white/5 bg-white/[0.02] transition hover:bg-white/[0.05]"
                                >
                                  <td className="px-3 py-3 text-center font-black text-[#f6c84a]">
                                    {apartment.number}
                                  </td>
                                  <td className="px-3 py-3 text-center font-semibold text-gray-200">
                                    {getApartmentType(apartment)}
                                  </td>
                                  <td className="px-3 py-3 text-center">
                                    <span
                                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${statusColor.badge}`}
                                    >
                                      <span className={`h-2 w-2 rounded-full ${statusColor.dot}`} />
                                      {apartment.status === "╪┤╪º╪║╪▒╪⌐"
                                        ? "┘ü╪º╪▒╪║╪⌐"
                                        : apartment.status}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 text-center font-black text-green-300">
                                    {getApartmentRent(apartment).toLocaleString("ar-SA")} ╪▒┘è╪º┘ä
                                  </td>
                                  <td className="px-3 py-3 text-center font-semibold text-gray-300">
                                    {tenantInfo.tenantName || apartment.tenant || "╪║┘è╪▒ ┘à╪╢╪º┘ü"}
                                  </td>
                                  <td className="px-3 py-3 text-center font-semibold text-gray-300">
                                    {tenantInfo.phone || "╪║┘è╪▒ ┘à╪╢╪º┘ü"}
                                  </td>
                                  <td className="px-3 py-3 text-center font-semibold text-gray-300">
                                    {tenantInfo.identityNumber || "╪║┘è╪▒ ┘à╪╢╪º┘ü"}
                                  </td>
                                  <td className="px-3 py-3 text-center font-semibold text-gray-300">
                                    {extraInfo.floor || "╪║┘è╪▒ ┘à╪¡╪»╪»"}
                                  </td>
                                  <td className="px-3 py-3 text-center font-semibold text-gray-300">
                                    {extraInfo.parking}
                                  </td>
                                  <td className="px-3 py-3 text-center font-semibold text-gray-300">
                                    {extraInfo.electricityMeter}
                                  </td>
                                  <td className="px-3 py-3 text-center font-semibold text-gray-300">
                                    {extraInfo.waterMeter}
                                  </td>
                                  <td className="px-3 py-3 text-center font-semibold text-gray-300">
                                    {extraInfo.furnitureStatus}
                                  </td>
                                  <td className="px-3 py-3 text-center font-semibold text-gray-300">
                                    {contractInfo.contractNumber || "╪║┘è╪▒ ┘à╪¡╪»╪»"}
                                  </td>
                                  <td className="px-3 py-3 text-center font-semibold text-gray-300">
                                    {formatContractDate(contractInfo.startDate)}
                                  </td>
                                  <td className="px-3 py-3 text-center font-semibold text-gray-300">
                                    {formatContractDate(contractInfo.endDate)}
                                  </td>
                                  <td className="px-3 py-3 text-center font-semibold text-gray-300">
                                    {formatContractDuration(
                                      contractInfo.durationUnit,
                                      contractInfo.durationValue
                                    )}
                                  </td>
                                  <td className="px-3 py-3 text-center font-black text-[#f6c84a]">
                                    {Number(contractInfo.insuranceAmount || 0).toLocaleString("ar-SA")} ╪▒┘è╪º┘ä
                                  </td>
                                  <td className="px-3 py-3 text-center font-semibold text-gray-400">
                                    {contractInfo.insuranceNotes || "┘ä╪º ╪¬┘ê╪¼╪» ┘à┘ä╪º╪¡╪╕╪º╪¬"}
                                  </td>
                                  <td className="px-3 py-3 text-center font-black text-blue-300">
                                    {paymentCount}
                                  </td>
                                  <td className="px-3 py-3 text-center font-black text-purple-300">
                                    {apartmentTotalPaid.toLocaleString("ar-SA")} ╪▒┘è╪º┘ä
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="shrink-0 border-t border-white/10 bg-[#061426] p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={exportApartmentTypeReportExcel}
                        className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-green-400/30 bg-green-500/10 px-4 text-sm font-black text-green-300 transition hover:bg-green-500/20"
                      >
                        <Download size={19} />
                        ╪¬╪╡╪»┘è╪▒ Excel
                      </button>

                      <button
                        type="button"
                        onClick={printApartmentTypeReport}
                        className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-blue-400/30 bg-blue-500/10 px-4 text-sm font-black text-blue-300 transition hover:bg-blue-500/20"
                      >
                        <Printer size={19} />
                        ╪╖╪¿╪º╪╣╪⌐
                      </button>

                      <button
                        type="button"
                        onClick={exportApartmentTypeReportPdf}
                        className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 text-sm font-black text-red-300 transition hover:bg-red-500/20"
                      >
                        <FileText size={19} />
                        ╪¬╪╡╪»┘è╪▒ PDF
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* APARTMENT REPORT MODAL                                  */}
      {/* ===================================================== */}

      {apartmentReportType && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={closeApartmentReport}
        >
          <div
            dir="rtl"
            className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-[#d89b18]/40 bg-[#07182b] shadow-[0_25px_90px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            {(() => {
              const report = getApartmentReport();
              const totalReportRent = report.data.reduce(
                (sum, apartment) => sum + getApartmentRent(apartment),
                0
              );

              return (
                <>
                  <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#061426] px-5 py-4">
                    <div className="text-right">
                      <h2 className="text-xl font-black text-[#f6c84a] sm:text-2xl">
                        {report.title}
                      </h2>
                      <p className="mt-1 text-xs font-semibold text-gray-400 sm:text-sm">
                        {report.subtitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={closeApartmentReport}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-300"
                      aria-label="╪Ñ╪║┘ä╪º┘é ╪º┘ä╪¬┘é╪▒┘è╪▒"
                    >
                      <X size={21} />
                    </button>
                  </div>

                  <div className="shrink-0 grid grid-cols-2 gap-3 border-b border-white/10 bg-[#0b2039] p-4 sm:grid-cols-4">
                    <div className="rounded-2xl border border-[#f0ad18]/20 bg-[#07182b] p-3 text-center">
                      <div className="text-xs font-bold text-gray-400">╪╣╪»╪» ╪º┘ä╪┤┘é┘é</div>
                      <div className="mt-1 text-2xl font-black text-[#f6c84a]">
                        {report.data.length}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-green-400/20 bg-[#07182b] p-3 text-center">
                      <div className="text-xs font-bold text-gray-400">╪º┘ä╪Ñ┘è╪¼╪º╪▒ ╪º┘ä╪┤┘ç╪▒┘è</div>
                      <div className="mt-1 text-2xl font-black text-green-300">
                        {totalReportRent.toLocaleString("ar-SA")}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-blue-400/20 bg-[#07182b] p-3 text-center">
                      <div className="text-xs font-bold text-gray-400">╪º┘ä┘ü╪¬╪▒╪⌐</div>
                      <div className="mt-1 text-sm font-black text-blue-300">
                        ╪¬┘é╪▒┘è╪▒ ╪¡╪º┘ä┘è
                      </div>
                    </div>

                    <div className="rounded-2xl border border-purple-400/20 bg-[#07182b] p-3 text-center">
                      <div className="text-xs font-bold text-gray-400">┘å╪│╪¿╪⌐ ╪º┘ä╪Ñ╪┤╪║╪º┘ä</div>
                      <div className="mt-1 text-2xl font-black text-purple-300">
                        {occupancyRate}%
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-auto p-4">
                    <div className="overflow-hidden rounded-2xl border border-white/10">
                      <table className="w-full min-w-[760px] border-collapse text-sm">
                        <thead className="sticky top-0 z-10 bg-[#0b2039]">
                          <tr className="text-gray-300">
                            <th className="border-b border-white/10 px-4 py-3 text-center">╪▒┘é┘à ╪º┘ä╪┤┘é╪⌐</th>
                            <th className="border-b border-white/10 px-4 py-3 text-center">┘å┘ê╪╣ ╪º┘ä╪┤┘é╪⌐</th>
                            <th className="border-b border-white/10 px-4 py-3 text-center">╪º┘ä╪¡╪º┘ä╪⌐</th>
                            <th className="border-b border-white/10 px-4 py-3 text-center">╪º┘ä╪Ñ┘è╪¼╪º╪▒ ╪º┘ä╪┤┘ç╪▒┘è</th>
                            <th className="border-b border-white/10 px-4 py-3 text-center">╪º┘ä┘à╪│╪¬╪ú╪¼╪▒ / ╪º┘ä╪¼┘ç╪⌐</th>
                          </tr>
                        </thead>

                        <tbody>
                          {report.data.map((apartment) => {
                            const effectiveStatus = getEffectiveApartmentStatus(apartment);
                            const statusColor = getStatusColor(effectiveStatus);

                            return (
                              <tr
                                key={apartment.number}
                                className="border-b border-white/5 bg-white/[0.02] transition hover:bg-white/[0.05]"
                              >
                                <td className="px-4 py-3 text-center font-black text-[#f6c84a]">
                                  {apartment.number}
                                </td>
                                <td className="px-4 py-3 text-center font-semibold text-gray-200">
                                  {getApartmentType(apartment)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span
                                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${statusColor.badge}`}
                                  >
                                    <span className={`h-2 w-2 rounded-full ${statusColor.dot}`} />
                                    {effectiveStatus === "╪┤╪º╪║╪▒╪⌐"
                                      ? "┘ü╪º╪▒╪║╪⌐"
                                      : effectiveStatus}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center font-black text-green-300">
                                  {getApartmentRent(apartment).toLocaleString("ar-SA")} ╪▒┘è╪º┘ä
                                </td>
                                <td className="px-4 py-3 text-center font-semibold text-gray-300">
                                  {apartment.tenant || "╪║┘è╪▒ ┘à╪╢╪º┘ü"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="shrink-0 border-t border-white/10 bg-[#061426] p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={exportApartmentReportExcel}
                        className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-green-400/30 bg-green-500/10 px-4 text-sm font-black text-green-300 transition hover:bg-green-500/20"
                      >
                        <Download size={19} />
                        ╪¬╪╡╪»┘è╪▒ Excel
                      </button>

                      <button
                        type="button"
                        onClick={printApartmentReport}
                        className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-blue-400/30 bg-blue-500/10 px-4 text-sm font-black text-blue-300 transition hover:bg-blue-500/20"
                      >
                        <Printer size={19} />
                        ╪╖╪¿╪º╪╣╪⌐
                      </button>

                      <button
                        type="button"
                        onClick={exportApartmentReportPdf}
                        className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 text-sm font-black text-red-300 transition hover:bg-red-500/20"
                      >
                        <FileText size={19} />
                        ╪¬╪╡╪»┘è╪▒ PDF
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* MONTHLY FINANCIAL REPORT MODAL                           */}
      {/* ===================================================== */}

      {isMonthlyDueReportOpen && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setIsMonthlyDueReportOpen(false)}
        >
          <div
            dir="rtl"
            className="flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-orange-400/30 bg-[#07182b] shadow-[0_25px_90px_rgba(0,0,0,0.6)]"
            onClick={(event) => event.stopPropagation()}
          >
            {(() => {
              const report = getMonthlyReportData();

              return (
                <>
                  <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#061426] px-5 py-4">
                    <div className="text-right">
                      <h2 className="text-xl font-black text-[#f6c84a] sm:text-2xl">
                        {report.title}
                      </h2>
                      <p className="mt-1 text-xs font-semibold text-gray-400 sm:text-sm">
                        {report.subtitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsMonthlyDueReportOpen(false)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-300"
                      aria-label="╪Ñ╪║┘ä╪º┘é ╪º┘ä╪¬┘é╪▒┘è╪▒"
                    >
                      <X size={21} />
                    </button>
                  </div>

                  <div className="shrink-0 grid grid-cols-1 gap-3 border-b border-white/10 bg-[#0b2039] p-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-orange-400/20 bg-[#07182b] p-3 text-center">
                      <div className="text-xs font-bold text-gray-400">
                        ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪│╪¬╪¡┘é
                      </div>
                      <div className="mt-1 text-2xl font-black text-orange-300">
                        {report.total.toLocaleString("ar-SA")} ╪▒┘è╪º┘ä
                      </div>
                    </div>

                    <div className="rounded-2xl border border-blue-400/20 bg-[#07182b] p-3 text-center">
                      <div className="text-xs font-bold text-gray-400">
                        ╪╣╪»╪» ╪º┘ä╪╣┘à┘ä┘è╪º╪¬
                      </div>
                      <div className="mt-1 text-2xl font-black text-blue-300">
                        {report.rows.length}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-green-400/20 bg-[#07182b] p-3 text-center">
                      <div className="text-xs font-bold text-gray-400">
                        ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐
                      </div>
                      <div className="mt-1 text-sm font-black text-green-300">
                        {formatContractDate(fromDate)} ΓÇö{" "}
                        {formatContractDate(toDate)}
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-auto p-4">
                    <div className="overflow-hidden rounded-2xl border border-white/10">
                      <table className="w-full min-w-[1050px] border-collapse text-sm">
                        <thead className="sticky top-0 z-10 bg-[#0b2039]">
                          <tr className="text-gray-300">
                            <th className="border-b border-white/10 px-4 py-3 text-center">
                              #
                            </th>
                            <th className="border-b border-white/10 px-4 py-3 text-center">
                              ╪▒┘é┘à ╪º┘ä╪┤┘é╪⌐
                            </th>
                            <th className="border-b border-white/10 px-4 py-3 text-center">
                              ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒ / ╪º┘ä╪¼┘ç╪⌐
                            </th>
                            <th className="border-b border-white/10 px-4 py-3 text-center">
                              ╪º┘ä╪¬╪º╪▒┘è╪«
                            </th>
                            <th className="border-b border-white/10 px-4 py-3 text-center">
                              ┘å┘ê╪╣ ╪º┘ä┘à╪│╪¬╪¡┘é
                            </th>
                            <th className="border-b border-white/10 px-4 py-3 text-center">
                              ╪º┘ä┘à╪¿┘ä╪║
                            </th>
                            <th className="border-b border-white/10 px-4 py-3 text-center">
                              ╪¬┘ü╪º╪╡┘è┘ä / ┘à┘ä╪º╪¡╪╕╪º╪¬
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {report.rows.length > 0 ? (
                            report.rows.map((row, index) => (
                              <tr
                                key={`${row.date}-${row.apartmentNumber}-${row.type}-${index}`}
                                className="border-b border-white/5 bg-white/[0.02] transition hover:bg-white/[0.05]"
                              >
                                <td className="px-4 py-3 text-center font-bold text-gray-500">
                                  {index + 1}
                                </td>
                                <td className="px-4 py-3 text-center font-black text-[#f6c84a]">
                                  {row.apartmentNumber ?? "╪║┘è╪▒ ┘à╪¡╪»╪»"}
                                </td>
                                <td className="px-4 py-3 text-center font-semibold text-gray-200">
                                  {row.tenant}
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-gray-300">
                                  {formatContractDate(row.date)}
                                </td>
                                <td className="px-4 py-3 text-center font-black text-white">
                                  {row.type}
                                </td>
                                <td className="px-4 py-3 text-center font-black text-green-300">
                                  {row.amount.toLocaleString("ar-SA")} ╪▒┘è╪º┘ä
                                </td>
                                <td className="px-4 py-3 text-center font-semibold leading-6 text-gray-400">
                                  {row.notes}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={7}
                                className="px-5 py-16 text-center"
                              >
                                <Receipt
                                  size={42}
                                  className="mx-auto text-gray-700"
                                />
                                <div className="mt-4 text-base font-bold text-gray-400">
                                  ┘ä╪º ╪¬┘ê╪¼╪» ╪¿┘è╪º┘å╪º╪¬ ┘à╪│╪¼┘ä╪⌐ ╪«┘ä╪º┘ä ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐
                                </div>
                                <div className="mt-2 text-sm text-gray-600">
                                  ╪╣┘å╪» ╪Ñ╪╢╪º┘ü╪⌐ ╪º┘ä╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪«╪º╪╡╪⌐ ╪¿┘ç╪░╪º ╪º┘ä┘å┘ê╪╣ ╪│╪¬╪╕┘ç╪▒ ┘ç┘å╪º ╪¬┘ä┘é╪º╪ª┘è┘ï╪º.
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="shrink-0 border-t border-white/10 bg-[#061426] p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={exportMonthlyDueExcel}
                        className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-green-400/30 bg-green-500/10 px-4 text-sm font-black text-green-300 transition hover:bg-green-500/20"
                      >
                        <Download size={19} />
                        ╪¬╪╡╪»┘è╪▒ Excel
                      </button>

                      <button
                        type="button"
                        onClick={printMonthlyDueReport}
                        className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-blue-400/30 bg-blue-500/10 px-4 text-sm font-black text-blue-300 transition hover:bg-blue-500/20"
                      >
                        <Printer size={19} />
                        ╪╖╪¿╪º╪╣╪⌐
                      </button>

                      <button
                        type="button"
                        onClick={exportMonthlyDuePdf}
                        className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 text-sm font-black text-red-300 transition hover:bg-red-500/20"
                      >
                        <FileText size={19} />
                        ╪¬╪╡╪»┘è╪▒ PDF
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* MONTHLY COLLECTION REPORT MODAL                        */}
      {/* ===================================================== */}

      {isMonthlyCollectionReportOpen && (
        <div
          className="fixed inset-0 z-[96] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setIsMonthlyCollectionReportOpen(false)}
        >
          <div
            dir="rtl"
            className="flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-green-400/30 bg-[#07182b] shadow-[0_25px_90px_rgba(0,0,0,0.6)]"
            onClick={(event) => event.stopPropagation()}
          >
            {(() => {
              const report = getMonthlyCollectionReportData();

              return (
                <>
                  <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#061426] px-5 py-4">
                    <div className="text-right">
                      <h2 className="text-xl font-black text-green-300 sm:text-2xl">
                        {report.title}
                      </h2>
                      <p className="mt-1 text-xs font-semibold text-gray-400 sm:text-sm">
                        {report.subtitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsMonthlyCollectionReportOpen(false)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-300"
                      aria-label="╪Ñ╪║┘ä╪º┘é ╪¬┘é╪▒┘è╪▒ ╪º┘ä╪¬╪¡╪╡┘è┘ä╪º╪¬"
                    >
                      <X size={21} />
                    </button>
                  </div>

                  <div className="shrink-0 grid grid-cols-1 gap-3 border-b border-white/10 bg-[#0b2039] p-4 sm:grid-cols-4">
                    <div className="rounded-2xl border border-orange-400/20 bg-[#07182b] p-3 text-center">
                      <div className="text-xs font-bold text-gray-400">
                        ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪│╪¬╪¡┘é
                      </div>
                      <div className="mt-1 text-2xl font-black text-orange-300">
                        {report.dueTotal.toLocaleString("ar-SA")} ╪▒┘è╪º┘ä
                      </div>
                    </div>

                    <div className="rounded-2xl border border-green-400/20 bg-[#07182b] p-3 text-center">
                      <div className="text-xs font-bold text-gray-400">
                        ╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à╪¡╪╡┘ä
                      </div>
                      <div className="mt-1 text-2xl font-black text-green-300">
                        {report.collectedTotal.toLocaleString("ar-SA")} ╪▒┘è╪º┘ä
                      </div>
                    </div>

                    <div className="rounded-2xl border border-red-400/20 bg-[#07182b] p-3 text-center">
                      <div className="text-xs font-bold text-gray-400">
                        ╪º┘ä┘à╪¬╪¿┘é┘è
                      </div>
                      <div className="mt-1 text-2xl font-black text-red-300">
                        {report.remainingTotal.toLocaleString("ar-SA")} ╪▒┘è╪º┘ä
                      </div>
                    </div>

                    <div className="rounded-2xl border border-blue-400/20 bg-[#07182b] p-3 text-center">
                      <div className="text-xs font-bold text-gray-400">
                        ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐
                      </div>
                      <div className="mt-1 text-sm font-black text-blue-300">
                        {formatContractDate(fromDate)} ΓÇö{" "}
                        {formatContractDate(toDate)}
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-auto p-4">
                    <div className="overflow-hidden rounded-2xl border border-white/10">
                      <table className="w-full min-w-[1200px] border-collapse text-sm">
                        <thead className="sticky top-0 z-10 bg-[#0b2039]">
                          <tr className="text-gray-300">
                            <th className="border-b border-white/10 px-4 py-3 text-center">
                              #
                            </th>
                            <th className="border-b border-white/10 px-4 py-3 text-center">
                              ╪▒┘é┘à ╪º┘ä╪┤┘é╪⌐
                            </th>
                            <th className="border-b border-white/10 px-4 py-3 text-center">
                              ╪º┘ä┘à╪│╪¬╪ú╪¼╪▒ / ╪º┘ä╪¼┘ç╪⌐
                            </th>
                            <th className="border-b border-white/10 px-4 py-3 text-center">
                              ╪º┘ä╪¬╪º╪▒┘è╪«
                            </th>
                            <th className="border-b border-white/10 px-4 py-3 text-center">
                              ┘å┘ê╪╣ ╪º┘ä┘à╪│╪¬╪¡┘é
                            </th>
                            <th className="border-b border-white/10 px-4 py-3 text-center">
                              ┘å┘ê╪╣ ╪º┘ä╪╣┘à┘ä┘è╪⌐
                            </th>
                            <th className="border-b border-white/10 px-4 py-3 text-center">
                              ╪º┘ä┘à╪¿┘ä╪║
                            </th>
                            <th className="border-b border-white/10 px-4 py-3 text-center">
                              ╪¬┘ü╪º╪╡┘è┘ä / ┘à┘ä╪º╪¡╪╕╪º╪¬
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {report.rows.length > 0 ? (
                            report.rows.map((row, index) => (
                              <tr
                                key={`${row.date}-${row.apartmentNumber}-${row.type}-${row.transactionType}-${index}`}
                                className="border-b border-white/5 bg-white/[0.02] transition hover:bg-white/[0.05]"
                              >
                                <td className="px-4 py-3 text-center font-bold text-gray-500">
                                  {index + 1}
                                </td>
                                <td className="px-4 py-3 text-center font-black text-[#f6c84a]">
                                  {row.apartmentNumber ?? "╪║┘è╪▒ ┘à╪¡╪»╪»"}
                                </td>
                                <td className="px-4 py-3 text-center font-semibold text-gray-200">
                                  {row.tenant}
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-gray-300">
                                  {formatContractDate(row.date)}
                                </td>
                                <td className="px-4 py-3 text-center font-black text-white">
                                  {row.type}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span
                                    className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black ${
                                      row.transactionType === "╪¬╪¡╪╡┘è┘ä"
                                        ? "border-green-400/25 bg-green-400/10 text-green-300"
                                        : "border-orange-400/25 bg-orange-400/10 text-orange-300"
                                    }`}
                                  >
                                    {row.transactionType}
                                  </span>
                                </td>
                                <td
                                  className={`px-4 py-3 text-center font-black ${
                                    row.transactionType === "╪¬╪¡╪╡┘è┘ä"
                                      ? "text-green-300"
                                      : "text-orange-300"
                                  }`}
                                >
                                  {row.amount.toLocaleString("ar-SA")} ╪▒┘è╪º┘ä
                                </td>
                                <td className="px-4 py-3 text-center font-semibold leading-6 text-gray-400">
                                  {row.notes}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={8}
                                className="px-5 py-16 text-center"
                              >
                                <Receipt
                                  size={42}
                                  className="mx-auto text-gray-700"
                                />
                                <div className="mt-4 text-base font-bold text-gray-400">
                                  ┘ä╪º ╪¬┘ê╪¼╪» ╪¿┘è╪º┘å╪º╪¬ ┘à╪│╪¼┘ä╪⌐ ╪«┘ä╪º┘ä ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐
                                </div>
                                <div className="mt-2 text-sm text-gray-600">
                                  ╪╣┘å╪» ╪Ñ╪╢╪º┘ü╪⌐ ╪º┘ä┘à╪│╪¬╪¡┘é╪º╪¬ ╪ú┘ê ╪¬╪│╪¼┘è┘ä ╪º┘ä╪¬╪¡╪╡┘è┘ä╪º╪¬ ╪│╪¬╪╕┘ç╪▒
                                  ┘ç┘å╪º ╪¬┘ä┘é╪º╪ª┘è┘ï╪º.
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="shrink-0 border-t border-white/10 bg-[#061426] p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={exportMonthlyCollectionExcel}
                        className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-green-400/30 bg-green-500/10 px-4 text-sm font-black text-green-300 transition hover:bg-green-500/20"
                      >
                        <Download size={19} />
                        ╪¬╪╡╪»┘è╪▒ Excel
                      </button>

                      <button
                        type="button"
                        onClick={printMonthlyCollectionReport}
                        className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-blue-400/30 bg-blue-500/10 px-4 text-sm font-black text-blue-300 transition hover:bg-blue-500/20"
                      >
                        <Printer size={19} />
                        ╪╖╪¿╪º╪╣╪⌐
                      </button>

                      <button
                        type="button"
                        onClick={exportMonthlyCollectionPdf}
                        className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 text-sm font-black text-red-300 transition hover:bg-red-500/20"
                      >
                        <FileText size={19} />
                        ╪¬╪╡╪»┘è╪▒ PDF
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* SELECTED APARTMENT FINANCIAL REPORT                    */}
      {/* ===================================================== */}

      {selectedApartmentFinancialReport && selectedApartment && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-5"
          onClick={() => setSelectedApartmentFinancialReport(null)}
        >
          <div
            dir="rtl"
            className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-[#f0ad18]/30 bg-[#07182b] shadow-[0_25px_90px_rgba(0,0,0,0.65)]"
            onClick={(event) => event.stopPropagation()}
          >
            {(() => {
              const report = getSelectedApartmentFinancialReport();
              return (
                <>
                  <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#061426] px-5 py-4">
                    <div>
                      <h2 className="text-xl font-black text-[#f6c84a] sm:text-2xl">
                        {report.title}
                      </h2>
                      <p className="mt-1 text-sm font-semibold text-gray-400">
                        ╪┤┘é╪⌐ ╪▒┘é┘à {selectedApartment.number} ΓÇö {formatContractDate(fromDate)} ╪Ñ┘ä┘ë {formatContractDate(toDate)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedApartmentFinancialReport(null)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-300"
                    >
                      <X size={21} />
                    </button>
                  </div>

                  <div className="grid shrink-0 grid-cols-1 gap-3 border-b border-white/10 bg-[#0b2039] p-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-[#f0ad18]/20 bg-[#07182b] p-4 text-center">
                      <div className="text-xs font-bold text-gray-400">╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä╪¬┘é╪▒┘è╪▒</div>
                      <div className="mt-1 text-2xl font-black text-[#f6c84a]">
                        {report.total.toLocaleString("ar-SA")} ╪▒┘è╪º┘ä
                      </div>
                    </div>
                    <div className="rounded-2xl border border-blue-400/20 bg-[#07182b] p-4 text-center">
                      <div className="text-xs font-bold text-gray-400">╪╣╪»╪» ╪º┘ä╪╣┘à┘ä┘è╪º╪¬</div>
                      <div className="mt-1 text-2xl font-black text-blue-300">
                        {report.rows.length}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-green-400/20 bg-[#07182b] p-4 text-center">
                      <div className="text-xs font-bold text-gray-400">╪º┘ä┘ü╪¬╪▒╪⌐</div>
                      <div className="mt-1 text-sm font-black text-green-300">
                        {formatContractDate(fromDate)} ΓÇö {formatContractDate(toDate)}
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-auto p-4">
                    <div className="overflow-hidden rounded-2xl border border-white/10">
                      <table className="w-full min-w-[850px] border-collapse text-sm">
                        <thead className="sticky top-0 z-10 bg-[#0b2039]">
                          <tr className="text-gray-300">
                            <th className="border-b border-white/10 px-4 py-3 text-center">#</th>
                            <th className="border-b border-white/10 px-4 py-3 text-center">╪º┘ä╪¬╪º╪▒┘è╪«</th>
                            <th className="border-b border-white/10 px-4 py-3 text-center">┘å┘ê╪╣ ╪º┘ä╪╣┘à┘ä┘è╪⌐</th>
                            <th className="border-b border-white/10 px-4 py-3 text-center">╪º┘ä┘à╪¿┘ä╪║</th>
                            <th className="border-b border-white/10 px-4 py-3 text-center">╪º┘ä╪¬┘ü╪º╪╡┘è┘ä</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.rows.length ? (
                            report.rows.map((row, index) => (
                              <tr key={`${row.date}-${row.type}-${index}`} className="border-b border-white/5 bg-white/[0.02] hover:bg-white/[0.05]">
                                <td className="px-4 py-3 text-center font-bold text-gray-500">{index + 1}</td>
                                <td className="px-4 py-3 text-center font-bold text-gray-300">{formatContractDate(row.date)}</td>
                                <td className="px-4 py-3 text-center font-black text-white">{row.type || "╪║┘è╪▒ ┘à╪¡╪»╪»"}</td>
                                <td className="px-4 py-3 text-center font-black text-green-300">{(Number(row.amount) || 0).toLocaleString("ar-SA")} ╪▒┘è╪º┘ä</td>
                                <td className="px-4 py-3 text-center font-semibold text-gray-400">{row.notes || "┘ä╪º ╪¬┘ê╪¼╪» ╪¬┘ü╪º╪╡┘è┘ä"}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-5 py-14 text-center text-gray-500">┘ä╪º ╪¬┘ê╪¼╪» ╪¿┘è╪º┘å╪º╪¬ ╪«┘ä╪º┘ä ╪º┘ä┘ü╪¬╪▒╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="shrink-0 border-t border-white/10 bg-[#061426] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <button
                          type="button"
                          onClick={printSelectedApartmentFinancialReport}
                          className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-400/30 bg-blue-500/10 px-5 text-sm font-black text-blue-300 transition hover:bg-blue-500/20"
                        >
                          <Printer size={18} />
                          ╪╖╪¿╪º╪╣╪⌐
                        </button>

                        <button
                          type="button"
                          onClick={exportSelectedApartmentFinancialReportPdf}
                          className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-5 text-sm font-black text-red-300 transition hover:bg-red-500/20"
                        >
                          <FileText size={18} />
                          ╪¬╪╡╪»┘è╪▒ PDF
                        </button>

                        <button
                          type="button"
                          onClick={exportSelectedApartmentFinancialReportExcel}
                          className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-green-400/30 bg-green-500/10 px-5 text-sm font-black text-green-300 transition hover:bg-green-500/20"
                        >
                          <Download size={18} />
                          ╪¬╪╡╪»┘è╪▒ Excel
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedApartmentFinancialReport(null)}
                        className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 text-sm font-black text-gray-300 transition hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-300"
                      >
                        <X size={19} />
                        ╪Ñ╪║┘ä╪º┘é
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* FOOTER                                                 */}
      {/* ===================================================== */}

      <div className="mt-6 rounded-2xl border border-emerald-400/10 bg-[#06382b]/35 py-3 text-center text-sm text-gray-400 backdrop-blur-sm">
        Aqary Smart ERP System ΓÇö ╪¬┘ü╪º╪╡┘è┘ä {buildingName}
      </div>

      <PermissionDeniedModal
        open={Boolean(permissionMessage)}
        message={
          permissionMessage ??
          "╪╣╪░╪▒┘ï╪º╪î ╪║┘è╪▒ ┘à╪│┘à┘ê╪¡ ┘ä┘ä┘à╪│╪¬╪«╪»┘à ╪º┘ä╪¡╪º┘ä┘è ╪¿┘ç╪░╪º ╪º┘ä╪Ñ╪¼╪▒╪º╪í."
        }
        onClose={() => setPermissionMessage(null)}
      />
    </div>
  );
}

