import {
  LayoutDashboard,
  FolderKanban,
  Receipt,
} from "lucide-react";

export const sidebarMenu = [
  {
    title: "لوحة التحكم",
    icon: LayoutDashboard,
    path: "/",
  },

  {
    title: "المشاريع",
    icon: FolderKanban,
    path: "/projects",
  },

  {
    title: "المركز المالي",
    icon: Receipt,
    path: "/financial",
  },
];