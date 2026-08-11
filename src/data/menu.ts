import {
  Home,
  LayoutDashboard,
  FolderKanban,
  Receipt,
} from "lucide-react";

export const sidebarMenu = [
  {
    title: "الشاشة الرئيسية",
    icon: Home,
    path: "/home"
  },

  {
    title: "لوحة التحكم",
    icon: LayoutDashboard,
    path: "/dashboard",
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