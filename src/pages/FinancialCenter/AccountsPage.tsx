type Account = {
  id: number;
  name: string;
  type: string;
  currentBalance: number;
  totalFunding: number;
  totalExpenses: number;
  operationsCount: number;
};

type Props = {
  accounts: Account[];

  // إضافة عهدة جديدة
  onAddAccount: () => void;

  // فتح صفحة التغذية مع اختيار العهدة تلقائيًا
  onAddFunding: (accountId: number) => void;

  // فتح ملخص حركات العهدة
  onViewAccount: (account: Account) => void;
};

export default function AccountsPage({
  accounts,
  onAddAccount,
  onAddFunding,
  onViewAccount,
}: Props) {
  return (
    <div className="space-y-8">

      {/* ================= Header ================= */}

      <div className="flex items-center justify-between gap-4">

        <div>
          <h2 className="text-3xl font-bold text-white">
            العهد المالية
          </h2>

          <p className="mt-2 text-base text-gray-400">
            إدارة جميع العهد والأرصدة والحركات المالية.
          </p>
        </div>

        <div className="flex items-center gap-3">

          {/* إجمالي العهد */}

          <div
            className="
              flex items-center gap-3
              rounded-2xl
              border border-yellow-400/20
              bg-[#081B33]
              px-5 py-3
            "
          >
            <div
              className="
                flex h-11 w-11
                items-center justify-center
                rounded-xl
                border border-yellow-400/30
                bg-yellow-400/10
                text-2xl
              "
            >
              💼
            </div>

            <div>
              <p className="text-xs text-gray-400">
                إجمالي العهد
              </p>

              <p className="text-xl font-bold text-white">
                {accounts.length}
              </p>
            </div>
          </div>

          {/* إضافة عهدة */}

          <button
            type="button"
            onClick={onAddAccount}
            className="
              flex h-14 items-center gap-2
              rounded-2xl
              border border-green-400/30
              bg-green-500/10
              px-5
              text-base font-bold
              text-green-400
              transition-all
              hover:border-green-400
              hover:bg-green-500
              hover:text-white
            "
          >
            <span className="text-2xl font-bold leading-none">
              +
            </span>

            إضافة عهدة
          </button>

        </div>

      </div>


      {/* ================= Accounts ================= */}

      {accounts.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">

          {accounts.map((account) => (

            <div
              key={account.id}
              className="
                group
                overflow-hidden
                rounded-3xl
                border border-white/10
                bg-[#081B33]
                shadow-lg
                transition-all
                duration-300
                hover:-translate-y-1
                hover:border-yellow-400/30
                hover:shadow-2xl
              "
            >

              <div className="p-6">

                {/* ================= Card Header ================= */}

                <div className="flex items-start justify-between gap-4">

                  <div className="min-w-0 flex-1">

                    <p className="mb-2 text-sm font-medium text-gray-400">
                      عهدة مالية
                    </p>

                    <h3
                      className="
                        text-xl
                        font-extrabold
                        leading-relaxed
                        text-white
                      "
                    >
                      {account.name}
                    </h3>

                  </div>

                  <div
                    className="
                      flex
                      h-16
                      w-16
                      shrink-0
                      items-center
                      justify-center
                      rounded-2xl
                      border
                      border-yellow-400/30
                      bg-yellow-400/10
                      text-3xl
                      shadow-inner
                    "
                  >
                    💼
                  </div>

                </div>


                {/* ================= Balance ================= */}

                <div className="mt-6">

                  <p className="text-sm text-gray-400">
                    الرصيد الحالي
                  </p>

                  <div className="mt-1 flex items-baseline gap-2">

                    <span className="text-3xl font-extrabold text-yellow-400">
                      {Number(
                        account.currentBalance || 0
                      ).toLocaleString()}
                    </span>

                    <span className="text-sm font-medium text-gray-400">
                      ريال
                    </span>

                  </div>

                </div>


                {/* ================= Statistics ================= */}

                <div
                  className="
                    mt-6
                    grid
                    grid-cols-3
                    divide-x
                    divide-x-reverse
                    divide-white/10
                    rounded-2xl
                    border
                    border-white/10
                    bg-[#102947]/70
                    py-4
                  "
                >

                  {/* العمليات */}

                  <div className="px-3 text-center">

                    <p className="text-xs text-gray-400">
                      عدد العمليات
                    </p>

                    <p className="mt-2 text-xl font-bold text-sky-400">
                      {account.operationsCount ?? 0}
                    </p>

                  </div>


                  {/* التغذية */}

                  <div className="px-3 text-center">

                    <p className="text-xs text-gray-400">
                      التغذية
                    </p>

                    <p className="mt-2 text-xl font-bold text-green-400">
                      {Number(
                        account.totalFunding || 0
                      ).toLocaleString()}
                    </p>

                  </div>


                  {/* المصروفات */}

                  <div className="px-3 text-center">

                    <p className="text-xs text-gray-400">
                      المصروفات
                    </p>

                    <p className="mt-2 text-xl font-bold text-red-400">
                      {Number(
                        account.totalExpenses || 0
                      ).toLocaleString()}
                    </p>

                  </div>

                </div>


                {/* ================= Actions ================= */}

                <div className="mt-6 grid grid-cols-2 gap-3">

                  {/* عرض */}

                  <button
                    type="button"
                    onClick={() => onViewAccount(account)}
                    className="
                      flex
                      h-12
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      border
                      border-sky-400/30
                      bg-sky-500/10
                      text-base
                      font-bold
                      text-sky-400
                      transition-all
                      hover:border-sky-400
                      hover:bg-sky-500
                      hover:text-white
                    "
                  >
                    <span className="text-xl">
                      👁
                    </span>

                    عرض
                  </button>


                  {/* تغذية */}

                  <button
                    type="button"
                    onClick={() => onAddFunding(account.id)}
                    className="
                      flex
                      h-12
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      border
                      border-green-400/30
                      bg-green-500/10
                      text-base
                      font-bold
                      text-green-400
                      transition-all
                      hover:border-green-400
                      hover:bg-green-500
                      hover:text-white
                    "
                  >
                    <span className="text-2xl font-bold leading-none">
                      +
                    </span>

                    تغذية
                  </button>

                </div>

              </div>

            </div>

          ))}

        </div>
      )}


      {/* ================= Empty State ================= */}

      {accounts.length === 0 && (

        <div
          className="
            rounded-3xl
            border border-white/10
            bg-[#081B33]
            py-20
            text-center
          "
        >

          <div className="text-5xl">
            💼
          </div>

          <h3 className="mt-4 text-xl font-bold text-white">
            لا توجد عهد مالية
          </h3>

          <p className="mt-2 text-gray-400">
            لم يتم إنشاء أي عهد مالية حتى الآن.
          </p>

          <button
            type="button"
            onClick={onAddAccount}
            className="
              mx-auto
              mt-6
              flex
              h-12
              items-center
              gap-2
              rounded-xl
              border
              border-green-400/30
              bg-green-500/10
              px-6
              text-base
              font-bold
              text-green-400
              transition-all
              hover:border-green-400
              hover:bg-green-500
              hover:text-white
            "
          >
            <span className="text-2xl">
              +
            </span>

            إضافة أول عهدة
          </button>

        </div>

      )}

    </div>
  );
}