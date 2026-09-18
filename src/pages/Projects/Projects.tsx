import { useMemo, useState } from "react";
import ProjectSearch from "../../components/projects/ProjectSearch";
import ProjectFilters from "../../components/projects/ProjectFilters";
import ProjectStats from "../../components/projects/ProjectStats";
import ProjectsList from "../../components/projects/ProjectsList";
import AddProjectModal from "../../components/projects/AddProjectModal";

import { projects as projectsData } from "../../data/projects";

import type { Project, ProjectStatus } from "../../types/project";

type Filter = "الكل" | ProjectStatus;

export default function Projects() {
  const [projects] = useState<Project[]>(projectsData);

  const [search, setSearch] = useState("");

  const [filter, setFilter] =
    useState<Filter>("الكل");

  const [openModal, setOpenModal] =
    useState(false);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        project.city
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        filter === "الكل" ||
        project.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [projects, search, filter]);

  return (
    <>
      <div className="w-full min-w-0 space-y-4 sm:space-y-5 lg:space-y-6">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="min-w-0">

            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              المشاريع
            </h1>

            <p className="mt-2 text-sm sm:text-base text-gray-400">
              إدارة جميع مشاريع شركة طموح ستار.
            </p>

          </div>

          <button
            onClick={() => setOpenModal(true)}
            className="w-full sm:w-auto shrink-0 rounded-xl bg-yellow-400 px-5 sm:px-6 py-3 font-bold text-[#081B33] transition hover:bg-yellow-500"
          >
            + مشروع جديد
          </button>

        </div>

        <ProjectSearch
          value={search}
          onChange={setSearch}
        />

        <ProjectFilters
          active={filter}
          onChange={setFilter}
        />

        <ProjectStats
          total={filteredProjects.length}
          active={
            filteredProjects.filter(
              p => p.status === "قيد التنفيذ"
            ).length
          }
          completed={
            filteredProjects.filter(
              p => p.status === "مكتمل"
            ).length
          }
          stopped={
            filteredProjects.filter(
              p => p.status === "متوقف"
            ).length
          }
        />

        <ProjectsList
          projects={filteredProjects}
        />

      </div>

      <AddProjectModal
        open={openModal}
        onClose={() => setOpenModal(false)}
      />
    </>
  );
}
