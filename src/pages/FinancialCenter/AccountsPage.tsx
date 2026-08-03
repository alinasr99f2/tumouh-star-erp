import { financialAccounts } from "../../data/financialAccounts";

export default function AccountsPage() {
  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-3xl font-bold text-white">
            الحسابات المالية
          </h2>

          <p className="mt-2 text-gray-400">
            إدارة جميع الحسابات والعهد والصناديق.
          </p>

        </div>

        <button
          className="
          rounded-xl
          bg-yellow-400
          px-6
          py-3
          font-bold
          text-[#081B33]
          hover:bg-yellow-500
          transition
          "
        >
          + حساب جديد
        </button>

      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        {financialAccounts.map((account) => (

          <div
            key={account.id}
            className="
            rounded-3xl
            border
            border-white/10
            bg-[#081B33]
            p-6
            "
          >

            <h3 className="text-2xl font-bold">
              {account.name}
            </h3>

            <p className="mt-2 text-gray-400">
              {account.type}
            </p>

            <div className="mt-6 space-y-3">

              <div className="flex justify-between">

                <span>الرصيد الحالي</span>

                <span className="font-bold text-yellow-400">
                  {account.currentBalance.toLocaleString()} ريال
                </span>

              </div>

              <div className="flex justify-between">

                <span>إجمالي التغذية</span>

                <span>
                  {account.totalFunding.toLocaleString()}
                </span>

              </div>

              <div className="flex justify-between">

                <span>إجمالي المصروفات</span>

                <span className="text-red-400">
                  {account.totalExpenses.toLocaleString()}
                </span>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}