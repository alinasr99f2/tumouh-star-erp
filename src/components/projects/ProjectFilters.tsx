const filters = [
  "الكل",
  "قيد التنفيذ",
  "مكتمل",
  "متوقف",
] as const;

type Filter = (typeof filters)[number];

type ProjectFiltersProps = {
  active: Filter;
  onChange: (filter: Filter) => void;
};

export default function ProjectFilters({
  active,
  onChange,
}: ProjectFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onChange(filter)}
          className={`rounded-xl px-5 py-2 font-medium transition ${
            active === filter
              ? "bg-yellow-400 text-[#081B33]"
              : "bg-[#081B33] text-gray-300 border border-white/10 hover:border-yellow-400"
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}