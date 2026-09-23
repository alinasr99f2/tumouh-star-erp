import {
  Home,
  LayoutDashboard,
  FolderKanban,
  Building2,
  Receipt,
  BarChart3,
  UsersRound,
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
    children: [
      {
        title: "التفاصيل المالية",
        icon: BarChart3,
        path: "/buildings/financial-details",
      },
      {
        title: "تفاصيل المستأجرين",
        icon: UsersRound,
        path: "/buildings/tenant-details",
      },
    ],
  },

  {
    title: "المركز المالي",
    icon: Receipt,
    path: "/financial",
  },
];
