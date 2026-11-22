import React, { useEffect, useRef, useState } from "react";
import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { tr } from "../i18n";

const API = "/api";
export default function Navbar({
  lang,
  setLang,
  currentUser,
  isAdmin,
  handleLogout,
}) {
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const translations = {
    en: {
      localServices: "Local Services",
      providerDashboard: "Provider Dashboard",
      myRequests: "My Requests",
      adminDashboard: "Admin Dashboard",
      login: "Login",
      register: "Register",
      home: "Home",
      contact: "Contact",
      about: "About",
      faq: "FAQ",
      signOut: "Sign Out",
      user: "User",
      customer: "Customer",
      switchLanguage: "دری",
      notifications: "Notifications",
      noNotifications: "No new notifications",
      markRead: "Mark read",
    },
      fa: {
      localServices: "خدمات محلی",
      providerDashboard: "داشبورد ارائه‌دهندگان خدمات",
      myRequests: "درخواست‌های من",
      adminDashboard: "پنل مدیریت",
      login: "ورود",
      register: "ثبت‌نام",
      home: "خانه",
      contact: "تماس با ما",
      about: "درباره ما",
      faq: "سوالات متداول",
      signOut: "خروج",
      user: "کاربر",
      customer: "مشتری",
      switchLanguage: "English",
      notifications: "اعلان‌ها",
      noNotifications: "اعلان تازه‌ای وجود ندارد",
      markRead: "خوانده شد",
    },
  };

  const t = translations[lang] || translations.en;
  const translateNotification = (value) => {
    if (lang !== "fa" || !value) return value;
    const text = String(value);
    const exact = {
      "Service request completed": "درخواست خدمت تکمیل شد",
      "Work has started": "کار آغاز شد",
      "Request accepted": "درخواست پذیرفته شد",
      "Request declined": "درخواست رد شد",
      "Request cancelled": "درخواست لغو شد",
      "Service request updated": "درخواست خدمت به‌روز شد",
      "Service request accepted": "درخواست خدمت پذیرفته شد",
      "Service request declined": "درخواست خدمت رد شد",
      "Service request cancelled": "درخواست خدمت لغو شد",
      "New service request": "درخواست تازهٔ خدمت",
      "New request received": "درخواست تازه دریافت شد",
      "Your request was accepted": "درخواست شما پذیرفته شد",
      "Your request was declined": "درخواست شما رد شد",
      "Your request was completed": "درخواست شما تکمیل شد",
    };
    if (exact[text]) return exact[text];
    const marked = text.match(/^(?:The provider|Provider)\s+(?:has\s+)?marked\s+["“]?(.+?)["”]?\s+as completed\.?$/i);
    if (marked) return `ارائه‌دهنده درخواست «${marked[1]}» را تکمیل کرد`;
    const progress = text.match(/^(?:The provider|Provider)\s+(?:has\s+)?marked\s+["“]?(.+?)["”]?\s+as in progress\.?$/i);
    if (progress) return `ارائه‌دهنده کار «${progress[1]}» را آغاز کرد`;
    const acceptedDetail = text.match(/^Your request\s+["“]?(.+?)["”]?\s+was accepted\.(.*)$/i);
    if (acceptedDetail) {
      const job = acceptedDetail[1];
      const detail = acceptedDetail[2];
      const fee = detail.match(/agreed labor fee\s+is\s+([\d,.]+\s*[A-Z]{3})/i)?.[1];
      const schedule = detail.match(/provider is scheduled for\s+(.+)$/i)?.[1]?.replace(/\.$/, "");
      const parts = [];
      if (fee) parts.push(`دستمزد توافق‌شده ${fee} است`);
      if (schedule) parts.push(`زمان تعیین‌شدهٔ ارائه‌دهنده ${schedule} است`);
      return `درخواست «${job}» پذیرفته شد${parts.length ? `. ${parts.join("؛ ")}.` : ""}`;
    }
    const accepted = text.match(/^(.*?) accepted (.+)$/i);
    if (accepted) return `درخواست «${accepted[2]}» پذیرفته شد`;
    const declined = text.match(/^(.*?) declined (.+)$/i);
    if (declined) return `درخواست «${declined[2]}» رد شد`;
    const cancelled = text.match(/^(.*?) cancelled (.+)$/i);
    if (cancelled) return `درخواست «${cancelled[2]}» لغو شد`;
    return tr(lang, text);
  };
  const [authUser, setAuthUser] = useState(currentUser || null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const currentLang = lang === "fa" ? "fa" : "en";
    const direction = currentLang === "fa" ? "rtl" : "ltr";
    document.documentElement.lang = currentLang;
    document.documentElement.dir = direction;
    document.body.dir = direction;
    document.documentElement.classList.toggle("rtl", currentLang === "fa");
    document.documentElement.classList.toggle("ltr", currentLang === "en");
    localStorage.setItem("language", currentLang);
  }, [lang]);

  useEffect(() => {
    const readUser = () => {
      try {
        const rawUser =
          localStorage.getItem("userInfo") || localStorage.getItem("user");
        if (!rawUser) {
          setAuthUser(null);
          return;
        }
        const parsed = JSON.parse(rawUser);
        setAuthUser(parsed?.user || parsed);
      } catch (error) {
        console.error("Navbar auth error:", error);
        setAuthUser(null);
      }
    };

    readUser();
    window.addEventListener("storage", readUser);
    return () => window.removeEventListener("storage", readUser);
  }, [currentUser]);

  const role = authUser?.role?.toLowerCase();
  const provider = role === "provider" || authUser?.isProvider === true;
  const admin = role === "admin" || authUser?.isAdmin === true || isAdmin === true;
  const customer = Boolean(authUser) && !provider && !admin && role === "customer";
  const loggedIn = Boolean(authUser);

  const loadNotifications = async () => {
    if (!customer) {
      setNotifications([]);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API}/service-requests/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return;
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Navbar notifications error:", error);
    }
  };

  useEffect(() => {
    loadNotifications();
    if (!customer) return undefined;

    const timer = setInterval(loadNotifications, 30000);
    return () => clearInterval(timer);
  }, [customer]);

  const logout = () => {
    localStorage.removeItem("userInfo");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setAuthUser(null);
    setProfileOpen(false);
    setNotificationOpen(false);
    setMenuOpen(false);
    if (handleLogout) handleLogout();
    else navigate("/login");
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setNotificationOpen(false);
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const unreadCount = notifications.filter((item) => !item.read).length;

  const markRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/service-requests/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((items) =>
        items.map((item) =>
          item._id === id ? { ...item, read: true } : item
        )
      );
    } catch (error) {
      console.error("Unable to mark notification as read:", error);
    }
  };

  const changeLanguage = () => {
    const nextLang = lang === "en" ? "fa" : "en";
    setLang(nextLang);
    localStorage.setItem("language", nextLang);
  };

  return (
    <nav
      className={`navbar ${lang === "fa" ? "navbar-fa" : "navbar-en"}`}
      dir={lang === "fa" ? "rtl" : "ltr"}
    >
      <div className="navbar-left">
        <button
          type="button"
          className="navbar-menu-button"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label="Menu"
        >
          ☰
        </button>
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          🏠 <span>{t.localServices}</span>
        </Link>
      </div>

      <div className="navbar-right">
        {loggedIn && (provider || admin) && (
          <Link to="/provider-dashboard" className="navbar-dashboard provider-dashboard-link">
            {t.providerDashboard}
          </Link>
        )}

        {loggedIn && customer && (
          <Link to="/my-requests" className="navbar-dashboard customer-requests-link">
            {t.myRequests}
          </Link>
        )}

        {loggedIn && admin && (
          <Link to="/admin" className="navbar-dashboard admin-dashboard-link">
            {t.adminDashboard}
          </Link>
        )}

        {!loggedIn && (
          <>
            <Link to="/login" className="navbar-login-link">{t.login}</Link>
            <Link to="/register" className="navbar-register-link">{t.register}</Link>
          </>
        )}

        {loggedIn && customer && (
          <div className="navbar-notifications" ref={notificationRef}>
            <button
              type="button"
              className="navbar-notification-button"
              onClick={() => {
                setNotificationOpen((previous) => !previous);
                setProfileOpen(false);
                loadNotifications();
              }}
              aria-label={t.notifications}
            >
              🔔
              {unreadCount > 0 && (
                <span className="navbar-notification-badge">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="navbar-notification-dropdown">
                <div className="navbar-notification-title">
                  <strong>{t.notifications}</strong>
                  {unreadCount > 0 && <span>{unreadCount} {lang === "fa" ? "جدید" : "new"}</span>}
                </div>

                {notifications.length === 0 ? (
                  <div className="navbar-notification-empty">
                    {t.noNotifications}
                  </div>
                ) : (
                  notifications.slice(0, 6).map((notification) => (
                    <div
                      className={`navbar-notification-item ${
                        notification.read ? "read" : "unread"
                      }`}
                      key={notification._id}
                    >
                      <strong>{translateNotification(notification.title)}</strong>
                      <p>{translateNotification(notification.message)}</p>
                      <small>
                        {new Date(notification.createdAt).toLocaleString()}
                      </small>
                      {!notification.read && (
                        <button
                          type="button"
                          onClick={() => markRead(notification._id)}
                        >
                          {t.markRead}
                        </button>
                      )}
                    </div>
                  ))
                )}

                <Link
                  to="/my-requests"
                  className="navbar-notification-footer"
                  onClick={() => setNotificationOpen(false)}
                >
                  {t.myRequests} →
                </Link>
              </div>
            )}
          </div>
        )}

        {loggedIn && (
          <div className="navbar-profile" ref={profileRef}>
            <button
              type="button"
              className="navbar-avatar"
              onClick={() => {
                setProfileOpen((previous) => !previous);
                setNotificationOpen(false);
              }}
              aria-label="Profile"
            >
              {authUser?.name?.charAt(0)?.toUpperCase() || "U"}
            </button>

            {profileOpen && (
              <div className="profile-dropdown" dir={lang === "fa" ? "rtl" : "ltr"}>
                <div className="profile-header">
                  <strong>{authUser?.name || t.user}</strong>
                  <span>{lang === "fa"
                    ? admin ? "مدیر" : provider ? "ارائه‌دهندهٔ خدمات" : "مشتری"
                    : role || t.customer}</span>
                </div>
                {(provider || admin) && (
                  <Link to="/provider-dashboard" onClick={() => setProfileOpen(false)}>
                    {t.providerDashboard}
                  </Link>
                )}
                {customer && (
                  <Link to="/my-requests" onClick={() => setProfileOpen(false)}>
                    {t.myRequests}
                  </Link>
                )}
                {admin && (
                  <Link to="/admin" onClick={() => setProfileOpen(false)}>
                    {t.adminDashboard}
                  </Link>
                )}
                <button type="button" onClick={logout}>↪ {t.signOut}</button>
              </div>
            )}
          </div>
        )}

        <button type="button" className="navbar-language" onClick={changeLanguage}>
          {t.switchLanguage}
        </button>
      </div>

      {menuOpen && (
        <div className="navbar-mobile-menu" dir={lang === "fa" ? "rtl" : "ltr"}>
          <button type="button" className="navbar-menu-close" onClick={closeMenu} aria-label={lang === "fa" ? "بستن فهرست" : "Close menu"}>×</button>
          <Link to="/" onClick={closeMenu}>{t.home}</Link>
          {!loggedIn && (
            <>
              <Link to="/login" onClick={closeMenu}>{t.login}</Link>
              <Link to="/register" onClick={closeMenu}>{t.register}</Link>
            </>
          )}
          {(provider || admin) && (
            <Link to="/provider-dashboard" onClick={closeMenu}>{t.providerDashboard}</Link>
          )}
          {customer && (
            <Link to="/my-requests" onClick={closeMenu}>{t.myRequests}</Link>
          )}
          {admin && <Link to="/admin" onClick={closeMenu}>{t.adminDashboard}</Link>}
          <Link to="/contact" onClick={closeMenu}>{t.contact}</Link>
          <Link to="/about" onClick={closeMenu}>ℹ️ {t.about}</Link>
          <Link to="/faq" onClick={closeMenu}>❓ {t.faq}</Link>
          {loggedIn && (
            <button type="button" onClick={logout} className="mobile-logout">
              ↪ {t.signOut}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
