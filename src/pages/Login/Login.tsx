
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
import { startManagedSession, clearManagedSession } from "../../utils/sessionGuard";

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
  const [language, setLanguage] = useState<"ar" | "en">(() =>
    typeof window !== "undefined" && window.localStorage.getItem("aqary-login-language") === "en" ? "en" : "ar"
  );
  const translate = (arabic: string, english: string) => language === "ar" ? arabic : english;
  const chooseLanguage = (next: "ar" | "en") => {
    setLanguage(next);
    window.localStorage.setItem("aqary-login-language", next);
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // استعادة كلمة المرور
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    let isMounted = true;

    const showRecoveryMode = () => {
      if (!isMounted) return;

      setRecoveryMode(true);
      setResetMode(false);
      setResetSent(false);
      setError("");
    };

    const recoveryParam =
      new URLSearchParams(window.location.search).get("recovery") === "1";

    // The recovery query parameter is intentionally added to the redirect URL.
    // Supabase can consume the hash before this component mounts, so the query
    // parameter gives the page a reliable way to recognize a password reset.
    if (recoveryParam) {
      showRecoveryMode();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        showRecoveryMode();
      }
    });

    const checkRecoverySession = async () => {
      try {
        if (!recoveryParam) return;

        // Give Supabase Auth a moment to finish restoring the recovery session.
        for (let attempt = 0; attempt < 10; attempt += 1) {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            showRecoveryMode();
            return;
          }

          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } catch (recoveryCheckError) {
        console.error(recoveryCheckError);
      }
    };

    void checkRecoverySession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleForgotPassword = () => {
    setError("");
    setResetEmail(email);
    setResetSent(false);
    setResetMode(true);
  };

  const handleSendResetEmail = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError("");

    const emailToReset = resetEmail.trim();

    if (!emailToReset) {
      setError("من فضلك أدخل البريد الإلكتروني أولًا");
      return;
    }

    try {
      setLoading(true);

      // يعمل على دومين البيئة الحالية (Staging أو Production).
      const redirectUrl = `${window.location.origin}/login?recovery=1`;

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(emailToReset, {
          redirectTo: redirectUrl,
        });

      if (resetError) {
        console.error(resetError);
        setError(
          "تعذر إرسال رابط استعادة كلمة المرور. تأكد من البريد الإلكتروني وحاول مرة أخرى."
        );
        return;
      }

      setResetSent(true);
    } catch (resetException) {
      console.error(resetException);
      setError("حدث خطأ أثناء إرسال رابط الاستعادة، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmNewPassword) {
      setError("من فضلك أدخل كلمة المرور الجديدة وتأكيدها");
      return;
    }

    if (newPassword.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف أو أكثر");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    try {
      setLoading(true);

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error(updateError);
        setError(
          "تعذر تغيير كلمة المرور. قد يكون رابط الاستعادة منتهي الصلاحية، أعد طلب رابط جديد."
        );
        return;
      }

      await supabase.auth.signOut({ scope: "local" });
      clearManagedSession();
      setRecoveryMode(false);
      setResetMode(false);
      setNewPassword("");
      setConfirmNewPassword("");
      setResetEmail("");
      setResetSent(false);
      setError("تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.");
    } catch (updateException) {
      console.error(updateException);
      setError("حدث خطأ أثناء تغيير كلمة المرور، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("من فضلك أدخل اسم المستخدم وكلمة المرور");
      return;
    }

    try {
      setLoading(true);

      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (loginError) {
        console.error(loginError);
        setError("اسم المستخدم أو كلمة المرور غير صحيحة");
        return;
      }

      // لا يكفي نجاح Auth: نتحقق من عضوية نشطة داخل عميل نشط.
      // التحقق يتم على الخادم من auth.uid() ولا نقرأ public.users من المتصفح.
      const authUserId = loginData.user?.id;
      if (!authUserId) {
        await supabase.auth.signOut();
        setError("تعذر التحقق من حساب المستخدم. حاول مرة أخرى.");
        return;
      }

      const { data: access, error: accessError } = await supabase.rpc(
        "get_my_login_access"
      );

      if (accessError) {
        await supabase.auth.signOut();
        console.error("تعذر التحقق من عضوية العميل:", accessError);
        setError("تعذر التحقق من صلاحية الدخول حاليًا. تواصل مع مسؤول النظام.");
        return;
      }

      if (!access || access.allowed !== true) {
        await supabase.auth.signOut();
        setError("الحساب غير مربوط بمكتب أو شركة عقارية نشطة. تواصل مع مسؤول النظام.");
        return;
      }

      // تسجيل الدخول في سجل النشاط عبر دالة محمية في قاعدة البيانات.
      // فشل التسجيل لا يمنع المستخدم من الدخول بعد نجاح المصادقة.
      try {
        const { error: auditError } = await supabase.rpc("record_auth_activity", {
          p_action: "login",
        });
        if (auditError) console.error("تعذر تسجيل نشاط الدخول:", auditError);
      } catch (auditException) {
        console.error("تعذر تسجيل نشاط الدخول:", auditException);
      }

      startManagedSession(authUserId);
      navigate("/home");
    } catch (loginException) {
      console.error(loginException);
      setError("حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page aqary-login-redesign" dir={language === "ar" ? "rtl" : "ltr"}>
      <style>{`
        .aqary-login-redesign { min-height: 100vh; overflow-x: hidden; position: relative; background: #07392e url('/aqary-smart-background.png') center center / 100% 100% no-repeat fixed; }
        .aqary-login-redesign .aqary-full-background { position: fixed; inset: 0; background: rgba(3, 41, 31, .65); pointer-events:none; z-index: 0; }
        .aqary-login-redesign .login-main { position:relative; z-index:1; width:100%; max-width: none; min-height:100vh; display:flex; align-items:center; justify-content:center; padding: 76px 20px 35px; box-sizing:border-box; }
        .aqary-login-redesign .aqary-single-panel { position:relative; isolation:isolate; width:min(100%,930px); min-height:640px; border:1px solid rgba(224,186,65,.55); border-radius:28px; overflow:hidden; box-shadow:0 25px 70px rgba(0,0,0,.3); display:flex; flex-direction:column; align-items:center; justify-content:space-between; padding:38px 35px 22px; box-sizing:border-box; background:linear-gradient(155deg,rgba(0,47,35,.8),rgba(0,28,22,.9)); }
        .aqary-login-redesign .aqary-panel-logo { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; opacity:.13; pointer-events:none; z-index:-1; padding:70px 50px 105px; box-sizing:border-box; }
        .aqary-login-redesign .aqary-form-area { width:min(100%,430px); margin:auto; padding:8px 0 24px; }
        .aqary-login-redesign .login-card-header { text-align:center; margin-bottom:24px; }
        .aqary-login-redesign .login-welcome-title { color:#f9d36a !important; font-size:clamp(26px,3vw,36px); margin:0 0 8px; }
        .aqary-login-redesign .login-welcome-description { color:#d3f4e9 !important; }
        .aqary-login-redesign .login-field-label { color:#f2f9f4 !important; }
        .aqary-login-redesign .login-options, .aqary-login-redesign .remember-option { color:#e2f6ed !important; }
        .aqary-login-redesign .forgot-password-button { color:#f9d36a !important; }
        .aqary-login-redesign .login-form { width:100%; }
        .aqary-login-redesign .hero-features { position:relative; z-index:2; width:100%; display:grid !important; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin:0 !important; }
        .aqary-login-redesign .hero-feature-card { min-width:0; background:rgba(0,39,30,.85); border:1px solid rgba(239,194,71,.48); border-radius:16px; }
        .aqary-login-redesign .language-switcher { z-index:5; }
        .aqary-login-redesign .aqary-language-menu { position:absolute; top:calc(100% + 8px); inset-inline-start:0; width:150px; padding:6px; border-radius:13px; background:#063b30; border:1px solid rgba(239,194,71,.55); box-shadow:0 12px 24px rgba(0,0,0,.3); }
        .aqary-login-redesign .aqary-language-choice { width:100%; padding:9px 12px; text-align:start; border:0; border-radius:8px; background:transparent; color:#fff; cursor:pointer; font-weight:700; }
        .aqary-login-redesign .aqary-language-choice:hover, .aqary-login-redesign .aqary-language-choice[aria-selected="true"] { background:rgba(239,194,71,.2); color:#f9d36a; }
         .aqary-login-redesign .login-background { display:none !important; }
        @media(max-width:650px) { .aqary-login-redesign .login-main { padding:72px 12px 18px; } .aqary-login-redesign .aqary-single-panel { min-height:650px; padding:28px 15px 16px; border-radius:20px; } .aqary-login-redesign .hero-features { grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; } .aqary-login-redesign .aqary-form-area { padding:15px 4px 25px; } }
      `}</style>
      <div className="login-background" aria-hidden="true">
        <div className="login-glow login-glow-top" />
        <div className="login-glow login-glow-bottom" />
        <div className="login-grid-pattern" />
      </div>
      <div className="aqary-full-background" aria-hidden="true" />
      <div className="language-switcher">
        <button type="button" className="language-button" aria-expanded={languageOpen} aria-haspopup="listbox" onClick={() => setLanguageOpen((open) => !open)}>
          <Globe size={18} /><span>{language === "ar" ? "العربية" : "English"}</span><span className="language-arrow">⌄</span>
        </button>
        {languageOpen && (
          <div className="aqary-language-menu" role="listbox" aria-label="Language">
            <button type="button" role="option" aria-selected={language === "ar"} className="aqary-language-choice" onClick={() => { chooseLanguage("ar"); setLanguageOpen(false); }}>العربية</button>
            <button type="button" role="option" aria-selected={language === "en"} className="aqary-language-choice" onClick={() => { chooseLanguage("en"); setLanguageOpen(false); }}>English</button>
          </div>
        )}
      </div>
      <main className="login-main">
        <section className="aqary-single-panel" aria-label="تسجيل الدخول إلى عقاري سمارت">
          <img src="/aqary-smart-logo.png" className="aqary-panel-logo" alt="" aria-hidden="true" />
          <div className="aqary-form-area">
            <div className="login-card-header">
              <h2 className="login-welcome-title">{translate("مرحبًا بك مرة أخرى", "Welcome Back")}</h2>
              <p className="login-welcome-description">{translate("سجل الدخول إلى حسابك للمتابعة", "Sign in to your account to continue")}</p>
            </div>
              {/* نموذج الدخول */}
              <form
                onSubmit={handleLogin}
                className="login-form"
                style={{
                  display: resetMode || recoveryMode ? "none" : undefined,
                }}
              >
                {/* اسم المستخدم */}
                <div className="login-field">
                  <label htmlFor="email" className="login-field-label">{translate("اسم المستخدم", "Username")}</label>

                  <div className="login-input-wrapper">
                    <Mail className="login-input-icon" size={21} />

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={translate("أدخل اسم المستخدم", "Enter your email")}
                      autoComplete="username"
                      disabled={loading}
                      className="login-input"
                    />
                  </div>
                </div>

                {/* كلمة المرور */}
                <div className="login-field">
                  <label htmlFor="password" className="login-field-label">{translate("كلمة المرور", "Password")}</label>

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
                      placeholder={translate("أدخل كلمة المرور", "Enter your password")}
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
                          ? translate("إخفاء كلمة المرور", "Hide password")
                          : translate("إظهار كلمة المرور", "Show password")
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
                    <span>{translate("تذكرني", "Remember me")}</span>
                  </label>

                  <button
                      type="button"
                      className="forgot-password-button"
                      onClick={handleForgotPassword}
                      disabled={loading}
                    >{translate("نسيت كلمة المرور؟", "Forgot password?")}</button>
                </div>

                {/* رسالة الخطأ */}
                {error && (
                  <div className="login-error-message">
                    {language === "ar" ? error : "Please check your details and try again."}
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
                      <span className="login-spinner" />{translate("جاري تسجيل الدخول...", "Signing in...")}</>
                  ) : (
                    <>{translate("تسجيل الدخول", "Sign In")}<LogIn size={22} />
                    </>
                  )}
                </button>
              </form>
              {recoveryMode ? (
                <form onSubmit={handleUpdatePassword} className="login-form">
                  <div style={{ textAlign: "center", marginBottom: "18px" }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "22px",
                        color: "#064f3f",
                        fontWeight: 800,
                      }}
                    >{translate("تغيير كلمة المرور", "Change Password")}</h3>
                    <p
                      style={{
                        margin: "8px 0 0",
                        color: "#718096",
                        fontSize: "14px",
                        lineHeight: 1.7,
                      }}
                    >{translate("أدخل كلمة المرور الجديدة لحسابك", "Enter your new account password")}</p>
                  </div>

                  <div className="login-field">
                    <label htmlFor="new-password" className="login-field-label">{translate("كلمة المرور الجديدة", "New Password")}</label>
                    <div className="login-input-wrapper">
                      <LockKeyhole className="login-input-icon" size={21} />
                      <input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={translate("أدخل كلمة المرور الجديدة", "Enter new password")}
                        autoComplete="new-password"
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
                            ? translate("إخفاء كلمة المرور", "Hide password")
                            : translate("إظهار كلمة المرور", "Show password")
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

                  <div className="login-field">
                    <label
                      htmlFor="confirm-new-password"
                      className="login-field-label"
                    >{translate("تأكيد كلمة المرور", "Confirm Password")}</label>
                    <div className="login-input-wrapper">
                      <LockKeyhole className="login-input-icon" size={21} />
                      <input
                        id="confirm-new-password"
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) =>
                          setConfirmNewPassword(e.target.value)
                        }
                        placeholder={translate("أعد إدخال كلمة المرور", "Confirm new password")}
                        autoComplete="new-password"
                        disabled={loading}
                        className="login-input login-password-input"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="login-error-message">{language === "ar" ? error : "Please check your details and try again."}</div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="login-submit-button"
                  >
                    {loading ? (
                      <>
                        <span className="login-spinner" />{translate("جاري تغيير كلمة المرور...", "Updating password...")}</>
                    ) : (
                      <>{translate("حفظ كلمة المرور", "Save Password")}<LogIn size={22} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setRecoveryMode(false);
                      setResetMode(false);
                      setNewPassword("");
                      setConfirmNewPassword("");
                      setError("");
                    }}
                    style={{
                      width: "100%",
                      marginTop: "10px",
                      border: "none",
                      background: "transparent",
                      color: "#0b6b57",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontWeight: 700,
                      padding: "8px",
                    }}
                  >{translate("العودة لتسجيل الدخول", "Back to Sign In")}</button>
                </form>
              ) : resetMode ? (
                <form onSubmit={handleSendResetEmail} className="login-form">
                  <div style={{ textAlign: "center", marginBottom: "18px" }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "22px",
                        color: "#064f3f",
                        fontWeight: 800,
                      }}
                    >{translate("استعادة كلمة المرور", "Reset Password")}</h3>
                    <p
                      style={{
                        margin: "8px 0 0",
                        color: "#718096",
                        fontSize: "14px",
                        lineHeight: 1.7,
                      }}
                    >
                      {translate("أدخل بريدك الإلكتروني وسنرسل لك رابطًا آمنًا لتغيير كلمة المرور.", "Enter your email and we will send you a secure password reset link.")}
                    </p>
                  </div>

                  <div className="login-field">
                    <label htmlFor="reset-email" className="login-field-label">{translate("البريد الإلكتروني", "Email Address")}</label>
                    <div className="login-input-wrapper">
                      <Mail className="login-input-icon" size={21} />
                      <input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder={translate("أدخل بريدك الإلكتروني", "Enter your email")}
                        autoComplete="email"
                        disabled={loading || resetSent}
                        className="login-input"
                      />
                    </div>
                  </div>

                  {resetSent && (
                    <div
                      style={{
                        marginBottom: "14px",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        background: "#edf9f3",
                        border: "1px solid #b7e5cf",
                        color: "#176b4d",
                        fontSize: "14px",
                        lineHeight: 1.7,
                        textAlign: "center",
                      }}
                    >
                      تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.
                      افتح الرسالة واضغط على الرابط لتعيين كلمة مرور جديدة.
                    </div>
                  )}

                  {error && (
                    <div className="login-error-message">{language === "ar" ? error : "Please check your details and try again."}</div>
                  )}

                  {!resetSent && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="login-submit-button"
                    >
                      {loading ? (
                        <>
                          <span className="login-spinner" />{translate("جاري إرسال الرابط...", "Sending link...")}</>
                      ) : (
                        <>{translate("إرسال رابط الاستعادة", "Send Reset Link")}<Mail size={22} />
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setResetMode(false);
                      setResetSent(false);
                      setResetEmail("");
                      setError("");
                    }}
                    style={{
                      width: "100%",
                      marginTop: "10px",
                      border: "none",
                      background: "transparent",
                      color: "#0b6b57",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontWeight: 700,
                      padding: "8px",
                    }}
                  >{translate("العودة لتسجيل الدخول", "Back to Sign In")}</button>
                </form>
              ) : null}

          </div>
                {/* المزايا */}
                <div className="hero-features" style={{ marginTop: "auto", width: "100%" }}>
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

                        <span>{language === "ar" ? feature.title : ({"تقارير دقيقة":"Accurate Reports","إدارة المستأجرين":"Tenant Management","إدارة العقارات":"Property Management","تشغيل متكامل":"Integrated Operations"} as Record<string,string>)[feature.title]}</span>
                      </div>
                    );
                  })}
                </div>
        </section>
      </main>
    </div>
  );
}
