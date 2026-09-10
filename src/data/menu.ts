import {
  Home,
  LayoutDashboard,
  FolderKanban,
  Building2,
  Receipt,
} from "lucide-react";

export const sidebarMenu = [
  {
    title: "الشاشة الرئيسية",
    icon: Home,
    path: "/home",
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
    title: "العمائر",
    icon: Building2,
    path: "/buildings",
    isSubItem: true,
  },

  {
    title: "المركز المالي",
    icon: Receipt,
    path: "/financial",
  },
];
