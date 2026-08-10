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
];

export default function ProjectsSection() {
  return (
    <section>

      {/* Header */}

      <div className="mb-8">

        <div>

          <h2 className="text-2xl font-bold text-white">
            المشاريع النشطة
          </h2>

          <p className="mt-2 text-gray-400">
            متابعة آخر المشاريع وحالة التنفيذ
          </p>

        </div>

      </div>

      {/* Projects */}

      <div className="grid gap-6">

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
    <div
      className="
        group
        rounded-3xl
        border
        border-white/10
        bg-[#081B33]
        p-7
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-yellow-400/30
        hover:shadow-2xl
      "
    >

      {/* Project Header */}

      <div className="flex items-start justify-between">

        <div>

          <h3 className="text-xl font-bold text-white">
            {name}
          </h3>

          <div className="mt-3 flex items-center gap-2 text-gray-400">

            <MapPin size={16} />

            {city}

          </div>

        </div>

        <span
          className="
            rounded-full
            bg-yellow-400/20
            px-3
            py-1
            text-sm
            text-yellow-400
          "
        >
          {status}
        </span>

      </div>

      {/* Progress */}

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
            className="
              h-full
              rounded-full
              bg-gradient-to-r
              from-yellow-400
              to-yellow-500
              transition-all
              duration-500
            "
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>

      {/* Project Information */}

      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">

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

      {/* Project Button */}

      <button
        type="button"
        className="
          mt-7
          flex
          w-full
          items-center
          justify-center
          gap-2
          rounded-xl
          bg-[#17385D]
          py-3
          font-semibold
          text-white
          transition-all
          duration-300
          hover:bg-yellow-400
          hover:text-[#081B33]
        "
      >

        دخول المشروع

        <ArrowLeft
          size={18}
          className="
            transition-transform
            duration-300
            group-hover:-translate-x-1
          "
        />

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
    <div
      className="
        rounded-2xl
        border
        border-white/10
        bg-white/5
        p-4
      "
    >

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