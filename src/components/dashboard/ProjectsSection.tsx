import {
  ArrowLeft,
  Calendar,
  Building2,
  MapPin,
} from "lucide-react";

const projects = [
  {
    id: 1,
    name: "فلل تبوك",
    city: "تبوك",
    status: "قيد التنفيذ",
    progress: 74,
    value: "8.5M",
    units: 18,
    start: "01/03/2026",
  },
  {
    id: 2,
    name: "برج الرياض",
    city: "الرياض",
    status: "التشطيبات",
    progress: 91,
    value: "21M",
    units: 36,
    start: "14/11/2025",
  },
  {
    id: 3,
    name: "فندق جدة",
    city: "جدة",
    status: "الإنشاء",
    progress: 43,
    value: "15.7M",
    units: 120,
    start: "18/02/2026",
  },
  {
    id: 4,
    name: "مول الدمام",
    city: "الدمام",
    status: "التخطيط",
    progress: 18,
    value: "30M",
    units: 48,
    start: "01/07/2026",
  },
];

export default function ProjectsSection() {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#081B33] p-7">

      <div className="mb-8 flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold">
            المشاريع النشطة
          </h2>

          <p className="mt-2 text-gray-400">
            متابعة آخر المشاريع وحالة التنفيذ
          </p>

        </div>

        <button className="rounded-xl bg-yellow-400 px-5 py-2 font-bold text-[#081B33] hover:bg-yellow-500 transition">
          عرض الكل
        </button>

      </div>

      <div className="grid gap-6 xl:grid-cols-2">

        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            {...project}
          />
        ))}

      </div>

    </section>
  );
}

type ProjectCardProps = {
  name: string;
  city: string;
  status: string;
  progress: number;
  value: string;
  units: number;
  start: string;
};

function ProjectCard({
  name,
  city,
  status,
  progress,
  value,
  units,
  start,
}: ProjectCardProps) {
  return (
    <div className="group rounded-3xl border border-white/10 bg-[#102947] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-yellow-400/40">

      <div className="flex items-start justify-between">

        <div>

          <h3 className="text-xl font-bold">
            {name}
          </h3>

          <div className="mt-3 flex items-center gap-2 text-gray-400">

            <MapPin size={16} />

            {city}

          </div>

        </div>

        <span className="rounded-full bg-yellow-400/20 px-3 py-1 text-sm text-yellow-400">
          {status}
        </span>

      </div>

      <div className="mt-7">

        <div className="mb-2 flex justify-between text-sm">

          <span className="text-gray-400">
            نسبة الإنجاز
          </span>

          <span className="font-bold text-white">
            {progress}%
          </span>

        </div>

        <div className="h-3 overflow-hidden rounded-full bg-[#1C3B60]">

          <div
            className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>

      <div className="mt-7 grid grid-cols-3 gap-4">

        <InfoCard
          icon={<Building2 size={18} />}
          title="الوحدات"
          value={String(units)}
        />

        <InfoCard
          icon={<Calendar size={18} />}
          title="البداية"
          value={start}
        />

        <InfoCard
          icon={<Building2 size={18} />}
          title="القيمة"
          value={value}
        />

      </div>

      <button className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#17385D] py-3 font-semibold transition hover:bg-[#204B79] group-hover:bg-yellow-400 group-hover:text-[#081B33]">

        دخول المشروع

        <ArrowLeft size={18} />

      </button>

    </div>
  );
}

type InfoCardProps = {
  icon: React.ReactNode;
  title: string;
  value: string;
};

function InfoCard({
  icon,
  title,
  value,
}: InfoCardProps) {
  return (
    <div className="rounded-2xl bg-[#0D223D] p-4">

      <div className="mb-3 flex items-center gap-2 text-yellow-400">

        {icon}

      </div>

      <p className="text-xs text-gray-500">
        {title}
      </p>

      <h4 className="mt-2 font-bold text-white">
        {value}
      </h4>

    </div>
  );
}