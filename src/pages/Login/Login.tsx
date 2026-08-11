import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("من فضلك أدخل اسم المستخدم وكلمة المرور");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error(error);
        setError("اسم المستخدم أو كلمة المرور غير صحيحة");
        return;
      }

      navigate("/home");
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="
        relative
        min-h-screen
        w-full
        overflow-hidden
        bg-[#071321]
        text-white
      "
    >

      {/* =========================================
          الخلفية
      ========================================= */}

      <div className="absolute inset-0">

        {/* إضاءة يمين */}
        <div
          className="
            absolute
            -right-40
            -top-40
            h-[650px]
            w-[650px]
            rounded-full
            bg-yellow-400/10
            blur-[130px]
          "
        />

        {/* إضاءة يسار */}
        <div
          className="
            absolute
            -left-40
            top-20
            h-[550px]
            w-[550px]
            rounded-full
            bg-emerald-400/5
            blur-[120px]
          "
        />

        {/* إضاءة خلف الكارت */}
        <div
          className="
            absolute
            left-1/2
            top-1/2
            h-[500px]
            w-[500px]
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            bg-yellow-400/5
            blur-[100px]
          "
        />

      </div>


      {/* =========================================
          اللوجو الكبير في الخلفية
      ========================================= */}

      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          z-0
          -translate-x-1/2
          -translate-y-1/2
          opacity-[0.07]
        "
      >

        <div
          className="
            flex
            h-[700px]
            w-[700px]
            items-center
            justify-center
          "
        >

          <div
            className="
              relative
              h-[520px]
              w-[520px]
            "
          >

            {/* نجمة كبيرة */}
            <div
              className="
                absolute
                left-1/2
                top-1/2
                h-[360px]
                w-[360px]
                -translate-x-1/2
                -translate-y-1/2
                rotate-45
                border-[35px]
                border-yellow-400
              "
              style={{
                clipPath:
                  "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 92%, 50% 70%, 21% 92%, 32% 57%, 2% 35%, 39% 35%)",
              }}
            />

          </div>

        </div>

      </div>


      {/* =========================================
          اللوجو الكبير ناحية اليمين
      ========================================= */}

      <div
        className="
          absolute
          right-0
          top-1/2
          z-10
          hidden
          -translate-y-1/2
          xl:block
        "
      >

        <div
          className="
            flex
            h-28
            w-28
            items-center
            justify-center
            rounded-[30px]
            border
            border-yellow-400/40
            bg-yellow-400/5
            shadow-[0_0_50px_rgba(250,204,21,0.08)]
          "
        >

          <div
            className="
              flex
              h-20
              w-20
              items-center
              justify-center
              rounded-[24px]
              border
              border-yellow-400/20
              bg-[#101d1b]
            "
          >

            <span
              className="
                text-5xl
                font-black
                text-yellow-400
              "
            >
              ★
            </span>

          </div>

        </div>

      </div>


      {/* =========================================
          كارت تسجيل الدخول
          في منتصف الشاشة بالضبط
      ========================================= */}

      <div
        className="
          relative
          z-20
          flex
          min-h-screen
          w-full
          items-center
          justify-center
          px-5
          py-10
        "
      >

        <div
          className="
            w-full
            max-w-[520px]
          "
        >

          {/* اللوجو فوق الكارت */}

          <div
            className="
              mb-5
              flex
              flex-col
              items-center
              justify-center
            "
          >

            <div
              className="
                mb-3
                flex
                h-20
                w-20
                items-center
                justify-center
                rounded-[24px]
                border
                border-yellow-400/40
                bg-yellow-400/5
                shadow-[0_0_35px_rgba(250,204,21,0.08)]
              "
            >

              <div
                className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-[18px]
                  bg-[#111d1b]
                "
              >

                <span
                  className="
                    text-3xl
                    font-black
                    text-yellow-400
                  "
                >
                  ★
                </span>

              </div>

            </div>


            {/* اسم النظام */}

            <div
              className="
                mb-1
                rounded-full
                border
                border-yellow-400/30
                bg-yellow-400/10
                px-4
                py-1
                text-xs
                font-bold
                text-yellow-400
              "
            >
              Tumouh Star ERP
            </div>

            <h1
              className="
                mt-1
                text-4xl
                font-extrabold
                tracking-tight
                text-white
              "
            >
              تسجيل الدخول
            </h1>

            <p
              className="
                mt-1
                text-sm
                text-gray-400
              "
            >
              مرحبًا بك في نظام طموح ستار لإدارة الأعمال
            </p>

          </div>


          {/* =====================================
              الكارت
          ===================================== */}

          <div
            className="
              rounded-[30px]
              border
              border-white/10
              bg-[#0b1b2e]/90
              p-7
              shadow-2xl
              backdrop-blur-xl
            "
          >

            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >

              {/* اسم المستخدم */}

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-semibold
                    text-gray-200
                  "
                >
                  اسم المستخدم
                </label>

                <div className="relative">

                  <Mail
                    size={21}
                    className="
                      absolute
                      right-4
                      top-1/2
                      -translate-y-1/2
                      text-gray-500
                    "
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="أدخل اسم المستخدم"
                    autoComplete="username"
                    disabled={loading}
                    className="
                      h-16
                      w-full
                      rounded-2xl
                      border
                      border-white/10
                      bg-[#071321]
                      pr-12
                      pl-4
                      text-base
                      text-white
                      outline-none
                      transition-all
                      placeholder:text-gray-600
                      focus:border-yellow-400/60
                      focus:ring-2
                      focus:ring-yellow-400/10
                      disabled:opacity-60
                    "
                  />

                </div>

              </div>


              {/* كلمة المرور */}

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-semibold
                    text-gray-200
                  "
                >
                  كلمة المرور
                </label>

                <div className="relative">

                  <LockKeyhole
                    size={21}
                    className="
                      absolute
                      right-4
                      top-1/2
                      -translate-y-1/2
                      text-gray-500
                    "
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    autoComplete="current-password"
                    disabled={loading}
                    className="
                      h-16
                      w-full
                      rounded-2xl
                      border
                      border-white/10
                      bg-[#071321]
                      pr-12
                      pl-14
                      text-base
                      text-white
                      outline-none
                      transition-all
                      placeholder:text-gray-600
                      focus:border-yellow-400/60
                      focus:ring-2
                      focus:ring-yellow-400/10
                      disabled:opacity-60
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    disabled={loading}
                    className="
                      absolute
                      left-4
                      top-1/2
                      -translate-y-1/2
                      text-gray-500
                      transition
                      hover:text-yellow-400
                    "
                  >

                    {showPassword ? (
                      <EyeOff size={21} />
                    ) : (
                      <Eye size={21} />
                    )}

                  </button>

                </div>

              </div>


              {/* رسالة الخطأ */}

              {error && (
                <div
                  className="
                    rounded-2xl
                    border
                    border-red-500/20
                    bg-red-500/10
                    px-4
                    py-3
                    text-center
                    text-sm
                    text-red-300
                  "
                >
                  {error}
                </div>
              )}


              {/* زر تسجيل الدخول */}

              <button
                type="submit"
                disabled={loading}
                className="
                  flex
                  h-16
                  w-full
                  items-center
                  justify-center
                  gap-3
                  rounded-2xl
                  bg-gradient-to-r
                  from-yellow-400
                  to-yellow-500
                  text-base
                  font-extrabold
                  text-[#081B33]
                  shadow-lg
                  shadow-yellow-400/10
                  transition-all
                  duration-300
                  hover:scale-[1.01]
                  hover:shadow-yellow-400/20
                  active:scale-[0.99]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >

                {loading ? (
                  <>
                    <span
                      className="
                        h-5
                        w-5
                        animate-spin
                        rounded-full
                        border-2
                        border-[#081B33]/30
                        border-t-[#081B33]
                      "
                    />

                    جاري تسجيل الدخول...
                  </>
                ) : (
                  <>
                    <LogIn size={21} />

                    تسجيل الدخول
                  </>
                )}

              </button>

            </form>


            {/* بيانات المستخدم المؤقت */}

            <div
              className="
                mt-6
                rounded-2xl
                border
                border-yellow-400/10
                bg-yellow-400/5
                p-4
                text-center
              "
            >

              <p
                className="
                  text-xs
                  text-gray-500
                "
              >
                المستخدم التجريبي الحالي
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-bold
                  text-yellow-400
                "
              >
                test@tumouh-star.local
              </p>

            </div>

          </div>


          {/* أسفل الصفحة */}

          <p
            className="
              mt-4
              text-center
              text-xs
              text-gray-500
            "
          >
            Tumouh Star ERP System
          </p>

        </div>

      </div>

    </div>
  );
}