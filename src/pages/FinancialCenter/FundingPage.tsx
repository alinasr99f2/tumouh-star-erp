type FundingPageProps = {
  onAddFunding: () => void;
};

export default function FundingPage({
  onAddFunding,
}: FundingPageProps) {
  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-3xl font-bold text-white">
            التغذية المالية
          </h2>

          <p className="mt-2 text-gray-400">
            جميع عمليات تغذية الحسابات والعهد.
          </p>

        </div>

        <button
          onClick={onAddFunding}
          className="
            rounded-xl
            bg-yellow-400
            px-6
            py-3
            font-bold
            text-[#081B33]
            transition
            hover:bg-yellow-500
          "
        >
          + إضافة تغذية
        </button>

      </div>

      {/* Statistics */}

      <div className="grid grid-cols-4 gap-6">

        <div className="rounded-2xl border border-white/10 bg-[#081B33] p-6">

          <p className="text-gray-400">
            تغذية اليوم
          </p>

          <h2 className="mt-3 text-3xl font-bold text-white">
            0 ريال
          </h2>

        </div>

        <div className="rounded-2xl border border-white/10 bg-[#081B33] p-6">

          <p className="text-gray-400">
            تغذية الأسبوع
          </p>

          <h2 className="mt-3 text-3xl font-bold text-white">
            0 ريال
          </h2>

        </div>

        <div className="rounded-2xl border border-white/10 bg-[#081B33] p-6">

          <p className="text-gray-400">
            تغذية الشهر
          </p>

          <h2 className="mt-3 text-3xl font-bold text-white">
            0 ريال
          </h2>

        </div>

        <div className="rounded-2xl border border-white/10 bg-[#081B33] p-6">

          <p className="text-gray-400">
            إجمالي التغذية
          </p>

          <h2 className="mt-3 text-3xl font-bold text-green-400">
            0 ريال
          </h2>

        </div>

      </div>
            {/* Table */}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#081B33]">

        <table className="w-full">

          <thead className="bg-[#102947]">

            <tr>

              <th className="p-4">تاريخ الإدخال</th>

              <th>تاريخ التغذية</th>

              <th>المشروع</th>

              <th>العهدة</th>

              <th>رقم المرجع</th>

              <th>طريقة الدفع</th>

              <th>المبلغ</th>

              <th>الإجراءات</th>

            </tr>

          </thead>

          <tbody>

            <tr>

              <td
                colSpan={8}
                className="py-20 text-center text-gray-500"
              >
                لا توجد عمليات تغذية حتى الآن
              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </div>

  );

}