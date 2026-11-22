import React, { useCallback, useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../useLanguage";
import { tr } from "../i18n";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [pendingProviders, setPendingProviders] = useState([]);
  const [approvedProviders, setApprovedProviders] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const t = useCallback((text) => tr(lang, text), [lang]);

  /* =====================================
     FETCH DATA
  ===================================== */

  const fetchData = useCallback(() => {
    setLoading(true);

    Promise.all([
      axios.get("/api/admin/pending")
        .catch(() => ({ data: [] })),

      axios
        .get("/api/admin/reports")
        .catch(() => ({ data: [] })),
    ])
      .then(([pendingRes, reportsRes]) => {
        const all = pendingRes.data || [];

        const approved = all.filter(
          (p) =>
            p.isApproved === true ||
            p.isApproved === "true"
        );

        const pending = all.filter(
          (p) =>
            p.isApproved !== true &&
            p.isApproved !== "true"
        );

        setPendingProviders(pending);
        setApprovedProviders(approved);
        setReports(reportsRes.data || []);
      })
      .catch((err) => {
        console.error(
          "خطا در دریافت اطلاعات ادمین:",
          err
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  /* =====================================
     AUTHORIZATION
  ===================================== */

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    if (userInfo.role !== "admin") {
      alert(t("You are not authorized to access this page!"));
      navigate("/");
      return;
    }
    fetchData();
  }, [fetchData, navigate, t]);

  /* =====================================
     APPROVE PROVIDER
  ===================================== */

  const handleApprove = async (id) => {
    try {
      await axios.put(
        `/api/admin/approve/${id}`
      );

      alert(t("Provider approved successfully."));

      fetchData();
    } catch (err) {
      console.error(err);
      alert(t("Error approving provider"));
    }
  };

  /* =====================================
     DELETE PROVIDER
  ===================================== */

  const handleDeleteProvider = async (id) => {
    if (
      !window.confirm(
        t("Are you sure you want to delete this item?")
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `/api/admin/providers/${id}`
      );

      alert(t("Successfully deleted."));

      fetchData();
    } catch (err) {
      console.error("خطا در حذف:", err);
      alert(t("Error deleting provider"));
    }
  };

  /* =====================================
     DELETE REPORT
  ===================================== */

  const handleDeleteReport = async (id) => {
    if (
      !window.confirm(
        t("Are you sure you want to delete this report?")
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `/api/admin/reports/${id}`
      );

      alert(t("Report deleted successfully."));

      fetchData();
    } catch (err) {
      console.error(err);
      alert(t("Error deleting report"));
    }
  };

  /* =====================================
     COPY EVIDENCE LINK
  ===================================== */

  const handleCopyEvidence = async (fileUrl) => {
    try {
      await navigator.clipboard.writeText(fileUrl);

      alert(t("Evidence link copied successfully!"));
    } catch (err) {
      console.error(err);
      alert(t("Unable to copy link."));
    }
  };

  /* =====================================
     PROVIDER INFORMATION
  ===================================== */

  const getProviderName = (item) =>
    item.user?.name ||
    item.name ||
    t("No Name");

  const getProviderEmail = (item) =>
    item.user?.email ||
    item.email ||
    t("No Email");

  const getProviderSkills = (item) => {
    if (Array.isArray(item.skills)) {
      return item.skills.join(", ");
    }

    return item.skills || t("Unknown");
  };

  /* =====================================
     RENDER
  ===================================== */

  return (
    <div className="admin-page">

      {/* =================================
          BACKGROUND
      ================================= */}

      <div className="admin-background">
        <div className="admin-glow admin-glow-one"></div>
        <div className="admin-glow admin-glow-two"></div>
      </div>

      <div className="admin-layout">

        {/* =================================
            SIDEBAR
        ================================= */}

        <aside className="admin-sidebar">

          <div className="admin-brand">

            <div className="admin-brand-icon">
              🛡️
            </div>

            <div>
              <strong>{t("Admin Panel")}</strong>
              <span>{t("Management System")}</span>
            </div>

          </div>

          <div className="admin-sidebar-divider"></div>

          <nav className="admin-sidebar-nav">

            <button
              type="button"
              className={`admin-nav-item ${
                activeTab === "pending"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab("pending")
              }
            >
              <span className="admin-nav-icon">
                ⏳
              </span>

              <span>{t("Pending Approval")}</span>

              <span className="admin-nav-count">
                {pendingProviders.length}
              </span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${
                activeTab === "approved"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab("approved")
              }
            >
              <span className="admin-nav-icon">
                ✓
              </span>

              <span>{t("Approved Providers")}</span>

              <span className="admin-nav-count">
                {approvedProviders.length}
              </span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${
                activeTab === "reports"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab("reports")
              }
            >
              <span className="admin-nav-icon">
                ⚠
              </span>

              <span>{t("Reports & Violations")}</span>

              <span className="admin-nav-count">
                {reports.length}
              </span>
            </button>

          </nav>

          <div className="admin-sidebar-bottom">

            <Link
              to="/"
              className="admin-home-link"
            >
              <span>←</span>
              {t("Back to Home")}
            </Link>

            <div className="admin-security-card">
              <div className="admin-security-icon">
                🔐
              </div>

              <div>
                <strong>{t("Admin Access")}</strong>
                <span>{t("Protected Area")}</span>
              </div>
            </div>

          </div>

        </aside>

        {/* =================================
            MAIN CONTENT
        ================================= */}

        <main className="admin-main">

          {/* HEADER */}

          <header className="admin-header">

            <div>

              <div className="admin-breadcrumb">
                  {t("Dashboard")} /{" "}
                <span>
                  {activeTab === "pending"
                    ? t("Pending Approval")
                    : activeTab === "approved"
                    ? t("Approved Providers")
                    : t("Reports & Violations")}
                </span>
              </div>

              <h1>
                {activeTab === "pending"
                  ? t("Provider Approvals")
                  : activeTab === "approved"
                  ? t("Approved Providers")
                  : t("Reports & Violations")}
              </h1>

              <p>
                {t("Manage your platform activity from the administration panel.")}
              </p>

            </div>

            <div className="admin-header-actions">

              <button type="button" className="admin-language-toggle" onClick={() => setLang(lang === "en" ? "fa" : "en")}>
                {lang === "en" ? "دری" : "English"}
              </button>

              <button
                type="button"
                className="admin-refresh-button"
                onClick={fetchData}
                disabled={loading}
              >
                <span
                  className={
                    loading
                      ? "admin-refresh-icon spinning"
                      : "admin-refresh-icon"
                  }
                >
                  ↻
                </span>

                {t("Refresh")}
              </button>

              <Link
                to="/"
                className="admin-header-home"
              >
                🏠
                <span>{t("Home")}</span>
              </Link>

            </div>

          </header>

          {/* =================================
              STAT CARDS
          ================================= */}

          <section className="admin-stats">

            <button
              type="button"
              className={`admin-stat-card stat-blue ${
                activeTab === "pending"
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                setActiveTab("pending")
              }
            >
              <div className="admin-stat-icon">
                ⏳
              </div>

              <div className="admin-stat-info">
                <span>{t("Pending Providers")}</span>
                <strong>
                  {pendingProviders.length}
                </strong>
              </div>

              <span className="admin-stat-arrow">
                →
              </span>
            </button>

            <button
              type="button"
              className={`admin-stat-card stat-green ${
                activeTab === "approved"
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                setActiveTab("approved")
              }
            >
              <div className="admin-stat-icon">
                ✓
              </div>

              <div className="admin-stat-info">
                <span>{t("Approved Providers")}</span>
                <strong>
                  {approvedProviders.length}
                </strong>
              </div>

              <span className="admin-stat-arrow">
                →
              </span>
            </button>

            <button
              type="button"
              className={`admin-stat-card stat-red ${
                activeTab === "reports"
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                setActiveTab("reports")
              }
            >
              <div className="admin-stat-icon">
                ⚠
              </div>

              <div className="admin-stat-info">
                <span>{t("Reports")}</span>
                <strong>
                  {reports.length}
                </strong>
              </div>

              <span className="admin-stat-arrow">
                →
              </span>
            </button>

          </section>

          {/* =================================
              CONTENT CARD
          ================================= */}

          <section className="admin-content-card">

            <div className="admin-content-header">

              <div>

                <span className="admin-section-label">
                  MANAGEMENT
                </span>

                <h2>
                  {activeTab === "pending"
                  ? t("Pending Provider Requests")
                    : activeTab === "approved"
                    ? t("Published Providers")
                    : t("Submitted Reports")}
                </h2>

              </div>

              <div className="admin-total-badge">
                {activeTab === "pending"
                  ? `${pendingProviders.length} ${t("Requests")}`
                  : activeTab === "approved"
                  ? `${approvedProviders.length} ${t("Providers")}`
                  : `${reports.length} ${t("Reports")}`}
              </div>

            </div>

            {/* =================================
                LOADING
            ================================= */}

            {loading ? (

              <div className="admin-empty-state">

                <div className="admin-loader"></div>

                <h3>
                  {t("Loading dashboard...")}
                </h3>

                <p>
                  {t("Please wait while we retrieve the latest information.")}
                </p>

              </div>

            ) : (

              <>
                {/* =================================
                    PENDING
                ================================= */}

                {activeTab === "pending" && (
                  <div className="admin-list">

                    {pendingProviders.length === 0 ? (

                      <div className="admin-empty-state">

                        <div className="admin-empty-icon">
                          ✓
                        </div>

                        <h3>
                          {t("No pending requests")}
                        </h3>

                        <p>
                          {t("There are currently no providers waiting for approval.")}
                        </p>

                      </div>

                    ) : (

                      pendingProviders.map((item) => {

                        const itemId =
                          item._id || item.id;

                        return (
                          <article
                            key={itemId}
                            className="provider-admin-card"
                          >

                            <div className="provider-card-main">

                              <div className="provider-avatar">
                                {getProviderName(
                                  item
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div className="provider-card-info">

                                <div className="provider-name-row">

                                  <h3>
                                    {getProviderName(
                                      item
                                    )}
                                  </h3>

                                  <span className="status-badge pending">
                                    {t("Pending")}
                                  </span>

                                </div>

                                <p className="provider-email">
                                  ✉{" "}
                                  {getProviderEmail(
                                    item
                                  )}
                                </p>

                                <div className="provider-meta">

                                  <span>
                                    🛠️{" "}
                                    {getProviderSkills(
                                      item
                                    )}
                                  </span>

                                  <span>
                                    📍{" "}
                                    {item.location ||
                                      "Unknown"}
                                  </span>

                                </div>

                              </div>

                            </div>

                            <div className="provider-actions">

                              {!item.isApproved && (
                                <button
                                  type="button"
                                  className="admin-action approve"
                                  onClick={() =>
                                    handleApprove(
                                      itemId
                                    )
                                  }
                                >
                                  ✓ {t("Approve")}
                                </button>
                              )}

                              <button
                                type="button"
                                className="admin-action delete"
                                onClick={() =>
                                  handleDeleteProvider(
                                    itemId
                                  )
                                }
                              >
                                🗑 {t("Delete")}
                              </button>

                            </div>

                          </article>
                        );
                      })
                    )}

                  </div>
                )}

                {/* =================================
                    APPROVED
                ================================= */}

                {activeTab === "approved" && (
                  <div className="admin-list">

                    {approvedProviders.length === 0 ? (

                      <div className="admin-empty-state">

                        <div className="admin-empty-icon">
                          ✓
                        </div>

                        <h3>
                          {t("No approved providers")}
                        </h3>

                        <p>
                          {t("No providers have been approved yet.")}
                        </p>

                      </div>

                    ) : (

                      approvedProviders.map((item) => {

                        const itemId =
                          item._id || item.id;

                        return (
                          <article
                            key={itemId}
                            className="provider-admin-card approved-card"
                          >

                            <div className="provider-card-main">

                              <div className="provider-avatar approved-avatar">
                                {getProviderName(
                                  item
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div className="provider-card-info">

                                <div className="provider-name-row">

                                  <h3>
                                    {getProviderName(
                                      item
                                    )}
                                  </h3>

                                  <span className="status-badge approved">
                                    ✓ {t("Approved")}
                                  </span>

                                </div>

                                <p className="provider-email">
                                  ✉{" "}
                                  {getProviderEmail(
                                    item
                                  )}
                                </p>

                                <div className="provider-meta">

                                  <span>
                                    🛠️{" "}
                                    {getProviderSkills(
                                      item
                                    )}
                                  </span>

                                  <span>
                                    📍{" "}
                                    {item.location ||
                                      "Unknown"}
                                  </span>

                                </div>

                              </div>

                            </div>

                            <div className="provider-actions">

                              <button
                                type="button"
                                className="admin-action delete"
                                onClick={() =>
                                  handleDeleteProvider(
                                    itemId
                                  )
                                }
                              >
                                🗑 {t("Remove")}
                              </button>

                            </div>

                          </article>
                        );
                      })
                    )}

                  </div>
                )}

                {/* =================================
                    REPORTS
                ================================= */}

                {activeTab === "reports" && (
                  <div className="admin-list reports-list">

                    {reports.length === 0 ? (

                      <div className="admin-empty-state">

                        <div className="admin-empty-icon">
                          ✓
                        </div>

                        <h3>
                          {t("No reports submitted")}
                        </h3>

                        <p>
                          {t("There are currently no complaints or reports.")}
                        </p>

                      </div>

                    ) : (

                      reports.map((rep) => {

                        const evidenceUrl = rep.evidence
                          ? /^https?:\/\//i.test(rep.evidence)
                            ? rep.evidence
                            : `${window.location.origin}${rep.evidence.startsWith("/") ? "" : "/"}${rep.evidence}`
                          : null;
                        const evidenceIsImage =
                          rep.evidenceMimeType?.startsWith("image/") ||
                          (!rep.evidenceMimeType && /\.(jpeg|jpg|png|gif|webp|avif|bmp)(?:[?#]|$)/i.test(rep.evidence || ""));

                        return (
                          <article
                            key={rep._id}
                            className="report-admin-card"
                          >

                            <div className="report-card-header">

                              <div className="report-title">

                                <div className="report-icon">
                                  ⚠
                                </div>

                                <div>
                                  <span>
                                    {t("Report")}
                                  </span>

                                  <h3>
                                    {rep.reason ||
                                      t("No subject")}
                                  </h3>
                                </div>

                              </div>

                              <span
                                className={`status-badge ${
                                  rep.status === "Resolved" ||
                                  rep.status === "Violation confirmed"
                                    ? "resolved"
                                    : "open"
                                }`}
                              >
                                {t(rep.status || "Under review")}
                              </span>

                            </div>

                            <div className="report-grid">

                              <div className="report-detail">

                                <span>
                                  {t("Complainant")}
                                </span>

                                <strong>
                                  {rep.complainantName ||
                                    t("Unknown")}
                                </strong>

                              </div>

                              <div className="report-detail">

                                <span>
                                  {t("Email")}
                                </span>

                                <strong>
                                  {rep.complainantEmail ||
                                    t("Unknown")}
                                </strong>

                              </div>

                              <div className="report-detail">

                                <span>
                                  {t("Reported Provider")}
                                </span>

                                <strong>
                                  {rep.provider?.user
                                    ?.name ||
                                    t("Anonymous")}
                                </strong>

                              </div>

                              <div className="report-detail">

                                <span>
                                  {t("Provider Email")}
                                </span>

                                <strong>
                                  {rep.provider?.user
                                    ?.email ||
                                    t("Unknown")}
                                </strong>

                              </div>

                            </div>

                            <div className="report-description">

                              <span>
                                {t("Description")}
                              </span>

                              <p>
                                {rep.description ||
                                  t("No description provided.")}
                              </p>

                            </div>

                            {/* EVIDENCE */}

                            {rep.evidence && (
                              <div className="report-evidence">

                                <div className="evidence-header">

                                  <div>
                                    <span className="evidence-icon">
                                      📎
                                    </span>

                                    <strong>
                                      {t("Submitted Evidence")}
                                    </strong>
                                  </div>

                                </div>

                                <div className="evidence-content">

                                  {evidenceIsImage ? (

                                    <img
                                      src={evidenceUrl}
                                      alt={t("Report Evidence")}
                                      className="evidence-image"
                                    />

                                  ) : (

                                    <video
                                      src={evidenceUrl}
                                      controls
                                      className="evidence-video"
                                    />
                                  )}

                                  <div className="evidence-actions">

                                    <a
                                      href={evidenceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="evidence-button view"
                                    >
                                      👁 {t("View File")}
                                    </a>

                                    <a
                                      href={evidenceUrl}
                                      download
                                      className="evidence-button download"
                                    >
                                      ↓ {t("Download")}
                                    </a>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCopyEvidence(
                                          evidenceUrl
                                        )
                                      }
                                      className="evidence-button copy"
                                    >
                                      ⧉ {t("Copy Link")}
                                    </button>

                                  </div>

                                </div>

                              </div>
                            )}

                            <div className="report-footer">

                              <div className="report-status">

                                <span>
                                  {t("Status")}
                                </span>

                                <strong>
                                  {t(rep.status === "در حال بررسی" ? "Under review" :
                                    rep.status === "حل شده" ? "Resolved" :
                                    rep.status === "رد شده" ? "Rejected" :
                                    rep.status === "تخلف تایید شد" ? "Violation confirmed" :
                                    rep.status || "Under review")}
                                </strong>

                              </div>

                              <button
                                type="button"
                                className="admin-action delete"
                                onClick={() =>
                                  handleDeleteReport(
                                    rep._id
                                  )
                                }
                              >
                                🗑 {t("Delete Report")}
                              </button>

                            </div>

                          </article>
                        );
                      })
                    )}

                  </div>
                )}

              </>
            )}

          </section>

        </main>

      </div>
    </div>
  );
}
