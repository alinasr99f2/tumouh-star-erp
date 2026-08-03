import type { Project } from "../types/project";

export const projects: Project[] = [
  {
    id: 1,
    name: "مشروع فلل تبوك",
    city: "تبوك",
    progress: 72,
    units: 18,
    status: "قيد التنفيذ",
  },
  {
    id: 2,
    name: "عمارة سنتر",
    city: "تبوك",
    progress: 100,
    units: 44,
    status: "مكتمل",
  },
  {
    id: 3,
    name: "مجمع الرياض",
    city: "الرياض",
    progress: 35,
    units: 60,
    status: "قيد التنفيذ",
  },
  {
    id: 4,
    name: "مشروع جدة",
    city: "جدة",
    progress: 15,
    units: 24,
    status: "متوقف",
  },
];