import ProjectCard from "./ProjectCard";
import type { Project } from "../../types/project";

type Props = {
  projects: Project[];
};

export default function ProjectsList({
  projects,
}: Props) {
  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-[#081B33] p-10 text-center">
        <h2 className="text-xl font-bold text-white">
          لا توجد مشاريع
        </h2>

        <p className="mt-2 text-gray-400">
          لا توجد مشاريع تطابق البحث الحالي.
        </p>
      </div>
    );
  }

  return (
    <div
      className="
        grid
        gap-8
        grid-cols-1
        lg:grid-cols-2
        2xl:grid-cols-3
      "
    >
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
        />
      ))}
    </div>
  );
}