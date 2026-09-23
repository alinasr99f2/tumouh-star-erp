
import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  LogIn,
  Building2,
  Users,
  ChartNoAxesCombined,
  Settings,
  ShieldCheck,
  Zap,
  Headset,
  Globe,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import "./Login.css";

const features = [
  { icon: ChartNoAxesCombined, title: "تقارير دقيقة" },
  { icon: Users, title: "إدارة المستأجرين" },
  { icon: Building2, title: "إدارة العقارات" },
  { icon: Settings, title: "تشغيل متكامل" },
];

const loginBenefits = [
  { icon: ShieldCheck, title: "أمان عالي" },
  { icon: Zap, title: "أداء سريع" },
  { icon: Headset, title: "دعم مستمر" },
];

export default function Login() {
  const navigate = useNavigate();

  /*
   * وضع جهاز العمل:
   * أضف VITE_WORK_DEVICE_MODE=true داخل ملف .env.local
   * ويمكن أيضًا استخدام VITE_DEV_MODE=true كما كان سابقًا.
   */
  const workDeviceMode =
    import.meta.env.VITE_WORK_DEVICE_MODE === "true" ||
    import.meta.env.VITE_DEV_MODE === "true";

  useEffect(() => {
    if (workDeviceMode) {
      navigate("/home", { replace: true });
    }
  }, [navigate, workDeviceMode]);

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

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (loginError) {
        console.error(loginError);
        setError("اسم المستخدم أو كلمة المرور غير صحيحة");
        return;
      }

      navigate("/home");
    } catch (loginException) {
      console.error(loginException);
      setError("حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  // منع ظهور صفحة تسجيل الدخول لحظة واحدة أثناء التحويل في وضع جهاز العمل.
  if (workDeviceMode) {
    return null;
  }

  return (
    <div className="login-page" dir="rtl">
      {/* الخلفية العامة */}
      <div className="login-background" aria-hidden="true">
        <div className="login-glow login-glow-top" />
        <div className="login-glow login-glow-bottom" />
        <div className="login-grid-pattern" />
        <div className="login-corner login-corner-top" />
        <div className="login-corner login-corner-bottom" />
      </div>

      {/* زر اللغة */}
      <div className="language-switcher">
        <button type="button" className="language-button">
          <Globe size={18} />
          <span>العربية</span>
          <span className="language-arrow">⌄</span>
        </button>
      </div>

      {/* الهيكل الرئيسي */}
      <main className="login-main" dir="ltr">
        <div className="login-layout">
          {/* =====================================
              كارت تسجيل الدخول - الشمال
          ===================================== */}
          <section className="login-section" dir="rtl">
            <div className="login-card">
              <div className="login-card-top-line" />

              {/* رأس الكارت */}
              <div className="login-card-header">
                <div className="login-logo-wrapper">
                  <img
                    src="/aqar-smart-logo.png"
                    alt="عقار سمارت"
                    className="login-logo"
                  />
                </div>

                <h1 className="login-brand-title">عقار سمارت</h1>

                <p className="login-brand-english">Aqar Smart</p>

                <h2 className="login-welcome-title">
                  مرحبًا بك مرة أخرى
                </h2>

                <p className="login-welcome-description">
                  سجل الدخول إلى حسابك للمتابعة
                </p>
              </div>

              {/* نموذج الدخول */}
              <form onSubmit={handleLogin} className="login-form">
                {/* اسم المستخدم */}
                <div className="login-field">
                  <label htmlFor="email" className="login-field-label">
                    اسم المستخدم
                  </label>

                  <div className="login-input-wrapper">
                    <Mail className="login-input-icon" size={21} />

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="أدخل اسم المستخدم"
                      autoComplete="username"
                      disabled={loading}
                      className="login-input"
                    />
                  </div>
                </div>

                {/* كلمة المرور */}
                <div className="login-field">
                  <label htmlFor="password" className="login-field-label">
                    كلمة المرور
                  </label>

                  <div className="login-input-wrapper">
                    <LockKeyhole
                      className="login-input-icon"
                      size={21}
                    />

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور"
                      autoComplete="current-password"
                      disabled={loading}
                      className="login-input login-password-input"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      disabled={loading}
                      aria-label={
                        showPassword
                          ? "إخفاء كلمة المرور"
                          : "إظهار كلمة المرور"
                      }
                      className="password-toggle-button"
                    >
                      {showPassword ? (
                        <EyeOff size={21} />
                      ) : (
                        <Eye size={21} />
                      )}
                    </button>
                  </div>
                </div>

                {/* تذكرني ونسيت كلمة المرور */}
                <div className="login-options">
                  <label className="remember-option">
                    <input
                      type="checkbox"
                      className="remember-checkbox"
                    />
                    <span>تذكرني</span>
                  </label>

                  <button
                    type="button"
                    className="forgot-password-button"
                    onClick={() =>
                      setError(
                        "يرجى التواصل مع مسؤول النظام لاستعادة كلمة المرور"
                      )
                    }
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>

                {/* رسالة الخطأ */}
                {error && (
                  <div className="login-error-message">
                    {error}
                  </div>
                )}

                {/* زر الدخول */}
                <button
                  type="submit"
                  disabled={loading}
                  className="login-submit-button"
                >
                  {loading ? (
                    <>
                      <span className="login-spinner" />
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    <>
                      تسجيل الدخول
                      <LogIn size={22} />
                    </>
                  )}
                </button>
              </form>

              {/* الفاصل */}
              <div className="login-divider">
                <span />
                <strong>أو</strong>
                <span />
              </div>

              {/* الدخول بحساب الشركة */}
              <button
                type="button"
                className="company-login-button"
                onClick={() =>
                  setError("خدمة الدخول بحساب الشركة ستكون متاحة قريبًا")
                }
              >
                <Building2 size={21} />
                الدخول بحساب الشركة
              </button>

              {/* المزايا */}
              <div className="login-benefits">
                {loginBenefits.map((benefit) => {
                  const Icon = benefit.icon;

                  return (
                    <div
                      key={benefit.title}
                      className="login-benefit-item"
                    >
                      <Icon size={23} />
                      <span>{benefit.title}</span>
                    </div>
                  );
                })}
              </div>

              {/* الحساب التجريبي */}
              <div className="demo-account-box">
                <p>المستخدم التجريبي الحالي</p>
                <strong>test@tumouh-star.local</strong>
              </div>
            </div>

            <div className="login-footer">
              <p>© عقار سمارت. جميع الحقوق محفوظة.</p>
              <span>Aqar Smart Real Estate Management System</span>
            </div>
          </section>

          {/* =====================================
              الكارت التعريفي الزجاجي - اليمين
          ===================================== */}
          <section className="hero-section" dir="rtl">
            <div className="hero-panel">
              {/* صورة الخلفية */}
              <div className="hero-background-image" />

              {/* طبقات التدرج */}
              <div className="hero-overlay" />

              {/* العلامة المائية الكبيرة */}
              <img
                src="/aqar-smart-logo.png"
                alt=""
                aria-hidden="true"
                className="hero-watermark"
              />

              {/* الخطوط والزخارف */}
              <div className="hero-decoration hero-decoration-one" />
              <div className="hero-decoration hero-decoration-two" />

              {/* محتوى الكارت */}
              <div className="hero-content">
                {/* اللوجو */}
                <div className="hero-logo-wrapper">
                  <img
                    src="/aqar-smart-logo.png"
                    alt="عقار سمارت"
                    className="hero-logo"
                  />
                </div>

                <h2 className="hero-title">عقار سمارت</h2>

                <p className="hero-english-title">AQAR SMART</p>

                <p className="hero-subtitle">
                  نظام سمارت لإدارة العقارات
                </p>

                <p className="hero-management-title">
                  SMART REAL ESTATE MANAGEMENT
                </p>

                <h1 className="hero-main-title">
                  إدارة أذكى...
                  <br />
                  <span>لعقارات أكثر نجاحًا</span>
                </h1>

                <p className="hero-description">
                  كل ما تحتاجه لإدارة عقاراتك ومتابعة مستأجريك
                  <br />
                  ومصروفاتك وتقاريرك من مكان واحد.
                </p>

                {/* المزايا */}
                <div className="hero-features">
                  {features.map((feature) => {
                    const Icon = feature.icon;

                    return (
                      <div
                        key={feature.title}
                        className="hero-feature-card"
                      >
                        <div className="hero-feature-icon">
                          <Icon size={34} />
                        </div>

                        <span>{feature.title}</span>
                      </div>
                    );
                  })}
                </div>

                {/* الصورة السفلية */}
                <div className="hero-bottom-image">
                  <div className="hero-bottom-background" />
                  <div className="hero-bottom-overlay" />

                  <div className="hero-bottom-content">
                    <p>عقاراتك تحت السيطرة</p>
                    <span>إدارة احترافية في مكان واحد</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
