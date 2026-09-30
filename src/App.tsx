import { useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Building2,
  CreditCard,
  Layers3,
  ChartNoAxesCombined,
  Settings,
  Landmark,
  ChevronLeft,
  ShieldCheck,
  Menu,
  X,
  CircleCheck,
  Plus,
  Clock3,
  LoaderCircle,
} from "lucide-react";
import { repository, users } from "./services/repository";
import { AppContext, Empty } from "./components/ui";
import Dashboard from "./pages/Dashboard";
import { Requests, NewRequest, RequestDetails } from "./pages/Requests";
import {
  Companies,
  CompanyDetails,
  Cards,
  CardDetails,
  Services,
  Reports,
  SettingsPage,
} from "./pages/Directory";
export default function App() {
  const [db, setDb] = useState(() => repository.snapshot()),
    [user, setUser] = useState(() => repository.user()),
    [toast, setToast] = useState(""),
    [mobile, setMobile] = useState(false);
  const location = useLocation();
  const notify = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 5000);
  };
  const refresh = () => setDb(repository.snapshot());
  const run = (fn: () => void, message = "تم حفظ التغييرات بنجاح") => {
    try {
      fn();
      refresh();
      notify(message);
      return true;
    } catch (e) {
      notify(e instanceof Error ? e.message : "تعذر تنفيذ الإجراء");
      return false;
    }
  };
  const nav = [
    ["/", "الرئيسية", LayoutDashboard],
    ["/requests", "جميع الطلبات", FileText],
    ["/companies", "الشركات", Building2],
    ["/cards", "البطاقات", CreditCard],
    ["/services", "الخدمات", Layers3],
    ["/reports", "التقارير", ChartNoAxesCombined],
    ["/settings", "الإعدادات", Settings],
  ] as const;
  return (
    <AppContext.Provider value={{ db, user, refresh, notify, run }}>
      <div className="app-shell">
        <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
          <Link to="/" className="brand">
            <span className="brand-icon">
              <Landmark size={26} />
            </span>
            <div>
              <b>مصرف الخليج الأول الليبي</b>
              <small>الخدمات الإلكترونية</small>
            </div>
          </Link>
          <div className="branch">
            <span className="branch-dot" />
            الفرع الرئيسي <span>طرابلس</span>
          </div>
          <div className="nav-label">مساحة العمل</div>
          <nav>
            {nav.map(([path, label, Icon]) => (
              <div key={path}>
                <NavLink
                  end={path === "/"}
                  to={path}
                  onClick={() => setMobile(false)}
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  <Icon size={19} />
                  <span>{label}</span>
                  {path === "/requests" && <em>{db.requests.length}</em>}
                </NavLink>
                {path === "/requests" && (
                  <div className="subnav">
                    {user.permissions.includes("create") && (
                      <Link to="/requests/new" onClick={() => setMobile(false)}>
                        <Plus size={14} />
                        طلب جديد
                      </Link>
                    )}
                    <Link
                      to="/requests?status=Pending"
                      onClick={() => setMobile(false)}
                    >
                      <Clock3 size={14} />
                      قيد الانتظار
                      <span>
                        {
                          db.requests.filter((r) => r.status === "Pending")
                            .length
                        }
                      </span>
                    </Link>
                    <Link
                      to="/requests?status=InProgress"
                      onClick={() => setMobile(false)}
                    >
                      <LoaderCircle size={14} />
                      قيد التنفيذ
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <ShieldCheck size={21} />
            <b>بيئة العرض التجريبي</b>
            <p>رحلة واضحة لخدمات مصرفية أفضل</p>
            <span>مصرف الخليج الأول الليبي · 2026</span>
          </div>
        </aside>
        {mobile && (
          <button
            className="mobile-backdrop"
            aria-label="إغلاق القائمة"
            onClick={() => setMobile(false)}
          />
        )}
        <div className="workspace">
          <header className="topbar">
            <div className="topbar-title">
              <button
                className="icon-button mobile-menu"
                onClick={() => setMobile(!mobile)}
                aria-label="القائمة"
              >
                <Menu />
              </button>
              <span>بوابة خدمات الشركات</span>
              <ChevronLeft size={14} />
              <strong>
                {nav.find(([p]) =>
                  p === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(p),
                )?.[1] || "تفاصيل"}
              </strong>
            </div>
            <div className="header-right">
              <span className="demo-badge">نسخة عرض تجريبية</span>
              <span className="header-divider" />
              <div className="avatar">{user.name.charAt(0)}</div>
              <label className="user-switch">
                <span>{user.name}</span>
                <select
                  aria-label="تبديل مستخدم العرض"
                  value={user.id}
                  onChange={(e) =>
                    run(() => {
                      repository.setUser(e.target.value);
                      setUser(repository.user());
                    }, "تم تبديل مستخدم العرض")
                  }
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.role}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </header>
          <main className="main">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/requests/new" element={<NewRequest />} />
              <Route path="/requests/:id" element={<RequestDetails />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/companies/:id" element={<CompanyDetails />} />
              <Route path="/cards" element={<Cards />} />
              <Route path="/cards/:id" element={<CardDetails />} />
              <Route path="/services" element={<Services />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Empty text="الصفحة غير موجودة" />} />
            </Routes>
            <footer className="footer">
              <span>مصرف الخليج الأول الليبي · نظام إدارة طلبات الخدمات الإلكترونية</span>
              <span>بيانات تجريبية فقط — لا توجد معاملات مالية فعلية</span>
            </footer>
          </main>
        </div>
        {toast && (
          <div className="toast" role="status">
            <CircleCheck size={20} />
            {toast}
            <button aria-label="إغلاق التنبيه" onClick={() => setToast("")}>
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}
