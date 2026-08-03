import logo from "../assets/logo.png";

function Header() {
  return (
    <header className="main-header">
      
      <div className="header-company">
        <img
          src={logo}
          alt="طموح ستار"
          className="company-logo"
        />

        <div className="company-info">
          <h1>مؤسسة طموح ستار للتطوير العقاري</h1>
          <p>نظام إدارة الاستثمارات والمشاريع</p>
        </div>
      </div>

      <div className="header-project">
        <span>المشروع الحالي</span>
        <strong>مشروع فلل تبوك</strong>
      </div>

      <div className="header-update">
        <span>آخر تحديث</span>
        <strong>27 يوليو 2026</strong>
      </div>

    </header>
  );
}

export default Header;