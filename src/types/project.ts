export type ProjectStatus =
  | "قيد التنفيذ"
  | "مكتمل"
  | "متوقف";

export interface Project {
  id: number;
  name: string;
  city: string;
  progress: number;
  units: number;
  status: ProjectStatus;
}