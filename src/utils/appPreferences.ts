import { useEffect, useState } from "react";

export type AppLanguage = "ar" | "en";
export type AppTheme = "default" | "light" | "dark";
const LANG_KEY = "aqary:language";
const THEME_KEY = "aqary:theme";
const EVENT = "aqary:preferences-changed";

function readLanguage(): AppLanguage {
  try { return localStorage.getItem(LANG_KEY) === "en" ? "en" : "ar"; } catch { return "ar"; }
}
function readTheme(): AppTheme {
  try { const value = localStorage.getItem(THEME_KEY); return value === "light" || value === "dark" ? value : "default"; } catch { return "default"; }
}
export function applyAppPreferences() {
  if (typeof document === "undefined") return;
  const lang = readLanguage();
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "en" ? "ltr" : "rtl";
  document.documentElement.dataset.aqaryTheme = readTheme();
}
export function useAppPreferences() {
  const [language, setLanguageState] = useState<AppLanguage>(readLanguage);
  const [theme, setThemeState] = useState<AppTheme>(readTheme);
  useEffect(() => {
    const sync = () => { setLanguageState(readLanguage()); setThemeState(readTheme()); applyAppPreferences(); };
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  const setLanguage = (value: AppLanguage) => { try { localStorage.setItem(LANG_KEY, value); } catch { /* blocked storage */ } setLanguageState(value); document.documentElement.lang = value; document.documentElement.dir = value === "en" ? "ltr" : "rtl"; window.dispatchEvent(new Event(EVENT)); };
  const setTheme = (value: AppTheme) => { try { localStorage.setItem(THEME_KEY, value); } catch { /* blocked storage */ } setThemeState(value); document.documentElement.dataset.aqaryTheme = value; window.dispatchEvent(new Event(EVENT)); };
  return { language, theme, setLanguage, setTheme, isEnglish: language === "en" };
}

const labels: Record<string, string> = {
  "الشاشة الرئيسية": "Home", "التقارير": "Reports", "المستخدمين والصلاحيات": "Users & Permissions", "الشقق المؤجرة / الفارغة": "Rented / Vacant Apartments", "لوحة التحكم": "Dashboard", "المشاريع": "Projects", "المركز المالي": "Financial Center",
  "المركز المالي للمشاريع": "Project Financial Center", "مشروع فلل تبوك": "Tabuk Villas Project", "العمائر": "Buildings",
  "العقارات": "Properties", "إدارة الوحدات العقارية": "Property Units", "الشقق المتاحة / المؤجرة": "Available / Rented Apartments",
  "الشقق المتاحة والمؤجرة": "Available and Rented Apartments", "خريطة الشقق السكنية": "Apartment Map",
  "الغرف": "Rooms", "المنازل": "Houses", "المحلات التجارية": "Commercial Shops", "الأراضي العقارية": "Land Plots",
  "سجل النشاط": "Activity Log", "تواصل معنا": "Contact Us", "تسجيل الخروج": "Log Out",
  "إخفاء المشاريع": "Collapse projects", "إظهار المشاريع": "Expand projects", "إخفاء العمائر": "Collapse buildings",
  "إظهار العمائر": "Expand buildings", "إخفاء أقسام الوحدات العقارية": "Collapse unit sections", "إظهار أقسام الوحدات العقارية": "Expand unit sections",
  "إلغاء": "Cancel", "لا، إلغاء": "No, cancel", "نعم، تسجيل الخروج": "Yes, log out",
  "جاري تسجيل الخروج...": "Logging out...", "هل أنت متأكد من رغبتك في تسجيل الخروج؟": "Are you sure you want to log out?",
  "نتائج البحث المركزي": "Global search results", "لا توجد نتائج مطابقة": "No matching results",
  "جاري البحث...": "Searching...", "المستخدم": "User", "موظف": "Employee", "مسؤول النظام": "System Owner",
  "الصفحات": "Pages", "الشقق": "Apartments", "شقق العمائر": "Building Apartments",
  "العقود": "Contracts", "العملاء": "Customers", "الملاك": "Owners", "اللغة": "Language", "المظهر": "Appearance",
  "قريبًا": "Coming soon", "سيتم تفعيل الصفحة عند تجهيزها": "This page will be available soon", "لا توجد عمائر مضافة حاليًا": "No buildings added yet", "النظام": "System", "مدير النظام": "System Admin", "مدير": "Manager", "مشرف": "Supervisor", "محاسب": "Accountant", "مدخل بيانات": "Data Entry", "الأساسي": "Default", "الصباحي": "Light", "الليلي": "Dark", "العربية": "Arabic", "الإنجليزية": "English"
};
export function translateLabel(value: string, language: AppLanguage): string {
  return language === "en" ? labels[value] ?? value : value;
}
