import React, { useState, useEffect } from "react";
import axios from "axios";
import { translations } from "../translations.js";
import ServiceCard from "./ServiceCard";
import Navbar from "../components/Navbar";
import "./Home.css";
import { useLanguage } from "../useLanguage";

export default function Home() {
  const { lang, setLang } = useLanguage();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState("grid");

  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const rawUser =
        localStorage.getItem("userInfo") ||
        localStorage.getItem("user");

      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        const userData = parsed.user || parsed;

        setCurrentUser(userData);

        if (userData.role === "admin" || userData.isAdmin) {
          setIsAdmin(true);
        }
      }
    } catch (e) {
      console.error("Error reading user information", e);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setCurrentUser(null);
    setIsAdmin(false);
    window.location.href = "/login";
  };

  const t = translations[lang] || translations["en"];
  const isRtl = lang === "fa";

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await axios.get(
          "/api/providers"
        );

        setProviders(res.data);
      } catch (err) {
        console.error("Error fetching services:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const categories = [
    { key: "all", label: t.all, icon: "✦" },
    { key: "electrician", label: t.electrician, icon: "⚡" },
    { key: "plumber", label: t.plumber, icon: "🔧" },
    { key: "carpenter", label: t.carpenter, icon: "🪚" },
    { key: "painter", label: t.painter, icon: "🎨" },
    { key: "repairs", label: t.repairs, icon: "🛠" },
  ];

  const filteredProviders = providers.filter((p) => {
    const providerName =
      p.user?.name || p.name || "Service Provider";
    const skillsText = Array.isArray(p.skills)
      ? p.skills.join(" ")
      : p.skills || "";
    const locationText = p.location || "";
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      providerName.toLowerCase().includes(search) ||
      skillsText.toLowerCase().includes(search) ||
      locationText.toLowerCase().includes(search);

    const categoryTarget =
      t[selectedCategory]?.toLowerCase() || "";

    const matchesCategory =
      selectedCategory === "all" ||
      skillsText
        .toLowerCase()
        .includes(selectedCategory.toLowerCase()) ||
      (categoryTarget &&
        skillsText.toLowerCase().includes(categoryTarget));

    return matchesSearch && matchesCategory;
  });

  const sortedProviders = [...filteredProviders].sort((a, b) => {
    if (sortBy === "rating") {
      return (b.rating || 0) - (a.rating || 0);
    } else if (sortBy === "newest") {
      return new Date(b.createdAt || 0) - new Date(b.createdAt || 0);
    }

    return (b.reviewCount || 0) - (a.reviewCount || 0);
  });

  const heroDescription =
    lang === "fa"
      ? "برای خدمات خانه، کاروبار و ترمیم، با متخصصان ماهر و قابل اعتماد در تماس شوید."
      : "Connect with skilled professionals for all your home, business and repair needs.";

  const availableTitle =
    lang === "fa" ? "خدمات موجود" : "Available Services";

  const availableSubtitle =
    lang === "fa"
      ? "از میان ارائه‌دهندگان خدمات معتبر انتخاب کنید."
      : "Choose from trusted and verified service providers.";

  return (
    <div
      className={`home-page ${isRtl ? "rtl" : "ltr"}`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <Navbar
        lang={lang}
        setLang={setLang}
        currentUser={currentUser}
        isAdmin={isAdmin}
        handleLogout={handleLogout}
      />

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <span>📍</span>
            {lang === "fa"
              ? "متخصصان محلی مورد اعتماد"
              : "Find Trusted Local Professionals"}
          </div>

          <div className="hero-grid">
            <div className="hero-copy">
              <h1>
                {lang === "fa" ? (
                  <>
                    خدمات مورد نیازتان را
                    <span> در نزدیکی‌تان </span>
                    پیدا کنید
                  </>
                ) : (
                  <>
                    Find the Right Service,
                    <span> Near You</span>
                  </>
                )}
              </h1>

              <p>{heroDescription}</p>
            </div>

            <div className="hero-search-area">
              <div className="hero-search">
                <span className="search-icon">⌕</span>
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("services-section")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      })
                  }
                >
                  <span>⌕</span>
                  {lang === "fa" ? "جستجو" : "Search"}
                </button>
              </div>

              <div className="hero-categories">
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    className={
                      selectedCategory === cat.key
                        ? "category-pill active"
                        : "category-pill"
                    }
                    onClick={() =>
                      setSelectedCategory(cat.key)
                    }
                  >
                    <span>{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <main
        id="services-section"
        className="services-container"
      >
        <div className="services-heading">
          <div className="section-title-area">
            <div className="section-icon">✦</div>
            <div>
              <h2>{availableTitle}</h2>
              <p>{availableSubtitle}</p>
            </div>
          </div>

          <div className="service-tools">
            <span className="result-count">
              {sortedProviders.length}{" "}
              {lang === "fa" ? "متخصص" : "Professionals"}
            </span>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-dropdown-select"
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#fff",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <option value="popular">
                {lang === "fa" ? "محبوب‌ترین" : "Sort by: Most Popular"}
              </option>
              <option value="rating">
                {lang === "fa" ? "بالاترین امتیاز" : "Sort by: Highest Rating"}
              </option>
              <option value="newest">
                {lang === "fa" ? "جدیدترین" : "Sort by: Newest"}
              </option>
            </select>

            <button
              className={`view-button ${
                viewMode === "grid" ? "active-view" : ""
              }`}
              onClick={() => setViewMode("grid")}
            >
              ▦
            </button>

            <button
              className={`view-button ${
                viewMode === "list" ? "active-view" : ""
              }`}
              onClick={() => setViewMode("list")}
            >
              ☷
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>
              {lang === "fa"
                ? "در حال بارگذاری اطلاعات..."
                : "Loading information..."}
            </p>
          </div>
        ) : sortedProviders.length === 0 ? (
          <div className="empty-state">
            <div>🔎</div>
            <h3>
              {lang === "fa"
                ? "نتیجه‌ای پیدا نشد"
                : "No services found"}
            </h3>
            <p>{t.notFound}</p>
          </div>
        ) : (
          <div
            className="services-grid"
            style={{
              display: viewMode === "grid" ? "grid" : "flex",
              flexDirection: viewMode === "grid" ? "unset" : "column",
              gap: "20px",
            }}
          >
            {sortedProviders.map((provider) => (
              <ServiceCard
                key={provider._id || provider.id}
                provider={provider}
              />
            ))}
          </div>
        )}
      </main>

      {/* FEATURES */}
      <section className="features-section">
        <div className="feature-item">
          <div className="feature-icon">✓</div>
          <div>
            <h3>
              {lang === "fa"
                ? "متخصصان تأیید شده"
                : "Verified Professionals"}
            </h3>
            <p>
              {lang === "fa"
                ? "ارائه‌دهندگان خدمات معتبر و قابل اعتماد."
                : "Trusted and verified service providers."}
            </p>
          </div>
        </div>

        <div className="feature-item">
          <div className="feature-icon">ϟ</div>
          <div>
            <h3>
              {lang === "fa"
                ? "سریع و قابل اعتماد"
                : "Fast & Reliable"}
            </h3>
            <p>
              {lang === "fa"
                ? "پاسخ سریع و خدمات به موقع."
                : "Quick response and on-time service."}
            </p>
          </div>
        </div>

        <div className="feature-item">
          <div className="feature-icon">◉</div>
          <div>
            <h3>
              {lang === "fa"
                ? "پشتیبانی ۲۴/۷"
                : "24/7 Support"}
            </h3>
            <p>
              {lang === "fa"
                ? "هر زمان که نیاز داشته باشید."
                : "We're here to help, anytime."}
            </p>
          </div>
        </div>

        <div className="feature-item">
          <div className="feature-icon">★</div>
          <div>
            <h3>
              {lang === "fa"
                ? "خدمات با کیفیت"
                : "Quality Service"}
            </h3>
            <p>
              {lang === "fa"
                ? "رضایت شما اولویت ماست."
                : "Your satisfaction is our priority."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
