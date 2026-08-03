import { useNavigate, useParams } from "react-router-dom";
import { projects } from "../../data/projects";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const project = projects.find(
    (p) => p.id === Number(id)
  );

  if (!project) {
    return (
      <div className="text-center text-white mt-20">
        <h1 className="text-3xl font-bold">
          المشروع غير موجود
        </h1>

        <button
          onClick={() => navigate("/projects")}
          className="mt-6 rounded-xl bg-yellow-400 px-6 py-3 font-bold text-[#081B33]"
        >
          رجوع للمشاريع
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <button
        onClick={() => navigate("/projects")}
        className="rounded-xl border border-white/10 px-5 py-2 text-white hover:bg-white/10"
      >
        ← رجوع للمشاريع
      </button>

      <div className="rounded-3xl bg-[#081B33] border border-white/10 p-8">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-4xl font-bold text-white">
              {project.name}
            </h1>

            <p className="mt-2 text-gray-400">
              📍 {project.city}
            </p>

          </div>

          <span className="rounded-full bg-yellow-500/20 px-4 py-2 text-yellow-400">
            {project.status}
          </span>

        </div>

      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl bg-[#081B33] p-6 border border-white/10">
          <p className="text-gray-400">عدد الوحدات</p>
          <h2 className="mt-3 text-3xl font-bold text-white">
            {project.units}
          </h2>
        </div>

        <div className="rounded-2xl bg-[#081B33] p-6 border border-white/10">
          <p className="text-gray-400">نسبة الإنجاز</p>
          <h2 className="mt-3 text-3xl font-bold text-white">
            {project.progress}%
          </h2>
        </div>

        <div className="rounded-2xl bg-[#081B33] p-6 border border-white/10">
          <p className="text-gray-400">الحالة</p>
          <h2 className="mt-3 text-2xl font-bold text-white">
            {project.status}
          </h2>
        </div>

        <div className="rounded-2xl bg-[#081B33] p-6 border border-white/10">
          <p className="text-gray-400">المدينة</p>
          <h2 className="mt-3 text-2xl font-bold text-white">
            {project.city}
          </h2>
        </div>

      </div>

    </div>
  );
}