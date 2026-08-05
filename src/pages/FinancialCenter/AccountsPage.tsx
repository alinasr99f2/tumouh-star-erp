type Account = {
  id: number;
  name: string;
  type: string;
  currentBalance: number;
  totalFunding: number;
  totalExpenses: number;
};

type Props = {
  accounts: Account[];
};

export default function AccountsPage({
  accounts,
}: Props) {
  return (
    <div className="space-y-6">

      {/* Header */}

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
          transition
          hover:bg-yellow-500
          "
        >
          + حساب جديد
        </button>

      </div>

      {/* Cards */}

      <div className="grid gap-6 lg:grid-cols-3">

        {accounts.map((account) => (

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

            <h3 className="text-2xl font-bold text-white">
              {account.name}
            </h3>

            <p className="mt-2 text-gray-400">
              {account.type}
            </p>

            <div className="mt-6 space-y-3">

              <div className="flex justify-between">

                <span className="text-gray-400">
                  الرصيد الحالي
                </span>

                <span className="font-bold text-yellow-400">
                  {account.currentBalance.toLocaleString()} ريال
                </span>

              </div>

              <div className="flex justify-between">

                <span className="text-gray-400">
                  إجمالي التغذية
                </span>

                <span className="text-green-400">
                  {account.totalFunding.toLocaleString()} ريال
                </span>

              </div>

              <div className="flex justify-between">

                <span className="text-gray-400">
                  إجمالي المصروفات
                </span>

                <span className="text-red-400">
                  {account.totalExpenses.toLocaleString()} ريال
                </span>

              </div>
                            <div className="mt-6 flex gap-2">

                <button
                  className="
                  flex-1
                  rounded-xl
                  bg-sky-500
                  py-2
                  font-bold
                  text-white
                  transition
                  hover:bg-sky-600
                  "
                >
                  عرض
                </button>

                <button
                  className="
                  flex-1
                  rounded-xl
                  bg-green-500
                  py-2
                  font-bold
                  text-white
                  transition
                  hover:bg-green-600
                  "
                >
                  تغذية
                </button>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}