export default function ExpensesPage() {
  return (
    <div className="space-y-6">

      {/* Statistics */}

      <div className="grid grid-cols-4 gap-6">

        <div className="rounded-2xl bg-[#081B33] border border-white/10 p-6">
          <p className="text-gray-400">مصروفات اليوم</p>
          <h2 className="mt-3 text-3xl font-bold text-white">
            0 ريال
          </h2>
        </div>

        <div className="rounded-2xl bg-[#081B33] border border-white/10 p-6">
          <p className="text-gray-400">مصروفات الأسبوع</p>
          <h2 className="mt-3 text-3xl font-bold text-white">
            0 ريال
          </h2>
        </div>

        <div className="rounded-2xl bg-[#081B33] border border-white/10 p-6">
          <p className="text-gray-400">مصروفات الشهر</p>
          <h2 className="mt-3 text-3xl font-bold text-white">
            0 ريال
          </h2>
        </div>

        <div className="rounded-2xl bg-[#081B33] border border-white/10 p-6">
          <p className="text-gray-400">إجمالي السنة</p>
          <h2 className="mt-3 text-3xl font-bold text-yellow-400">
            0 ريال
          </h2>
        </div>

      </div>

      {/* Toolbar */}

      <div className="rounded-2xl bg-[#081B33] border border-white/10 p-5">

        <div className="flex items-center justify-between">

          <button
            className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-[#081B33]"
          >
            + إضافة مصروف
          </button>

          <input
            type="text"
            placeholder="بحث..."
            className="w-80 rounded-xl bg-[#102947] px-4 py-3 outline-none border border-white/10"
          />

        </div>

      </div>

      {/* Table */}

      <div className="rounded-2xl border border-white/10 bg-[#081B33] overflow-hidden">

        <table className="w-full">

          <thead className="bg-[#102947]">

            <tr>

              <th className="p-4">التاريخ</th>

              <th>المشروع</th>

              <th>العهدة</th>

              <th>البند</th>

              <th>المورد</th>

              <th>قبل الضريبة</th>

              <th>الضريبة</th>

              <th>الإجمالي</th>

              <th>الإجراءات</th>

            </tr>

          </thead>

          <tbody>

            <tr>

              <td
                colSpan={9}
                className="text-center py-20 text-gray-500"
              >
                لا توجد بيانات حتى الآن
              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </div>
  );
}