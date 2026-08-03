import {
  LayoutDashboard,
  Wallet,
  FolderKanban,
  Building2,
  Building,
  Hotel,
  Store,
  Coffee,
  Receipt,
  BarChart3,
  Users,
  Settings,
} from "lucide-react";

export const sidebarMenu = [
  {
    title: "لوحة التحكم",
    icon: LayoutDashboard,
    path: "/",
  },

  {
    title: "المحفظة",
    icon: Wallet,
    path: "/portfolio",
  },

  {
    title: "المشاريع",
    icon: FolderKanban,
    path: "/projects",
  },

  {
    title: "العمائر المؤجرة",
    icon: Building2,
    path: "/rental-buildings",
  },

  {
    title: "العمائر تحت الإنشاء",
    icon: Building,
    path: "/construction-buildings",
  },

  {
    title: "الفنادق",
    icon: Hotel,
    path: "/hotels",
  },

  {
    title: "المطاعم",
    icon: Store,
    path: "/restaurants",
  },

  {
    title: "الكافيهات",
    icon: Coffee,
    path: "/cafes",
  },

  {
  title: "المركز المالي",
  icon: Receipt,
  path: "/financial",
},

  {
    title: "التقارير",
    icon: BarChart3,
    path: "/reports",
  },

  {
    title: "المستخدمون",
    icon: Users,
    path: "/users",
  },

  {
    title: "الإعدادات",
    icon: Settings,
    path: "/settings",
  },
];