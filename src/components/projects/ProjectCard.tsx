import {
  Building2,
  MapPin,
  CalendarDays,
} from "lucide-react";

import { Link } from "react-router-dom";

import type { Project } from "../../types/project";

type Props = {
  project: Project;
};

export default function ProjectCard({
  project,
}: Props) {

  const statusColor =
    project.status === "مكتمل"
      ? "bg-green-500/20 text-green-400"
      : project.status === "متوقف"
      ? "bg-red-500/20 text-red-400"
      : "bg-yellow-500/20 text-yellow-400";

  return (
    <Link
      to={`/projects/${project.id}`}
      className="
        block
        rounded-3xl
        border
        border-white/10
        bg-[#081B33]
        p-7
        min-h-[240px]
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-yellow-400/50
        hover:shadow-2xl
        hover:shadow-yellow-500/10
      "
    >
      <div className="flex items-center justify-between">

        <Building2
          size={32}
          className="text-yellow-400"
        />

        <span
          className={`rounded-full px-4 py-1.5 text-sm font-bold ${statusColor}`}
        >
          {project.status}
        </span>

      </div>

      <h3 className="mt-6 text-2xl font-bold text-white">
        {project.name}
      </h3>

      <div className="mt-3 flex items-center gap-2 text-gray-400">

        <MapPin size={17} />

        <span>{project.city}</span>

      </div>

      <div className="mt-8">

        <div className="mb-3 flex justify-between text-sm text-gray-300">

          <span>نسبة الإنجاز</span>

          <span className="font-bold">
            {project.progress}%
          </span>

        </div>

        <div className="h-3 overflow-hidden rounded-full bg-[#132847]">

          <div
            className="h-full rounded-full bg-yellow-400 transition-all"
            style={{
              width: `${project.progress}%`,
            }}
          />

        </div>

      </div>

      <div className="mt-8 flex items-center justify-between text-gray-300">

        <span className="font-semibold">
          {project.units} وحدة
        </span>

        <div className="flex items-center gap-2">

          <CalendarDays size={17} />

          <span>2026</span>

        </div>

      </div>
    </Link>
  );
}