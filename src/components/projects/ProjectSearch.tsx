import { Search } from "lucide-react";

type ProjectSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function ProjectSearch({
  value,
  onChange,
}: ProjectSearchProps) {
  return (
    <div className="relative">
      <Search
        size={20}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
      />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ابحث عن مشروع..."
        className="w-full rounded-2xl border border-white/10 bg-[#081B33] py-3 pl-12 pr-4 text-white outline-none transition focus:border-yellow-400"
      />
    </div>
  );
}