import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useLanguage } from "../useLanguage";
import { tr } from "../i18n";
import "./ProviderDashboard.css";
import "./ServiceRequests.css";

const API = "/api";

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const t = useCallback((text) => tr(lang, text), [lang]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    skills: "",
    phone: "",
    whatsapp: "",
    location: "",
    description: "",
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestActionLoading, setRequestActionLoading] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get(`${API}/providers/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data) {
          setFormData({
            name: response.data.name || "",
            email: response.data.email || "",
            skills: Array.isArray(response.data.skills)
              ? response.data.skills.join(", ")
              : response.data.skills || "",
            phone: response.data.phone || "",
            whatsapp: response.data.whatsapp || "",
            location: response.data.location || "",
            description: response.data.description || "",
          });
        }
      } catch (error) {
        console.error("Error loading provider profile:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        setMessage(t(error.response?.data?.message || "Unable to load your profile information."));
        setIsError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, t]);

  const fetchRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(`${API}/service-requests/provider`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(response.data || []);
    } catch (error) {
      console.error("Error loading service requests:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setRequestsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!loading) fetchRequests();
  }, [loading, fetchRequests]);

  const updateRequestStatus = async (requestId, status) => {
    try {
      setRequestActionLoading(`${requestId}-${status}`);
      const token = localStorage.getItem("token");

      await axios.patch(
        `${API}/service-requests/${requestId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchRequests();
      setMessage(
        status === "accepted"
          ? t("Request accepted. The customer has been notified.")
          : status === "declined"
          ? t("Request declined. The customer has been notified.")
          : t("Request status updated successfully.")
      );
      setIsError(false);
    } catch (error) {
      setMessage(
          error.response?.data?.message || t("Unable to update the request.")
      );
      setIsError(true);
    } finally {
      setRequestActionLoading("");
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    if (message) {
      setMessage("");
      setIsError(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.put(
        `${API}/providers/profile`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setMessage(t("Changes saved successfully."));
      }
    } catch (error) {
      console.error("Error saving provider information:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      setMessage(
        error.response?.data?.message || t("Error saving changes.")
      );
      setIsError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  const getInitial = () =>
    formData.name ? formData.name.trim().charAt(0).toUpperCase() : "P";

  if (loading) {
    return (
      <>
      <Navbar lang={lang} setLang={setLang} />
      <main className="provider-dashboard-page">
        <div className="provider-loading-card">
          <div className="provider-loading-spinner" />
          <h2>{t("Loading dashboard...")}</h2>
          <p>{t("Please wait while we retrieve the latest information.")}</p>
        </div>
      </main>
      </>
    );
  }

  const pendingCount = requests.filter(
    (item) => item.status === "pending"
  ).length;

  return (
    <>
    <Navbar lang={lang} setLang={setLang} />
    <main className="provider-dashboard-page">
      <div className="provider-dashboard-shell">
        <header className="provider-dashboard-header">
          <div className="provider-header-brand">
            <div className="provider-avatar">{getInitial()}</div>
            <div className="provider-header-text">
              <span className="provider-header-label">{t("SERVICE PROVIDER")}</span>
              <h1>{t("My Dashboard")}</h1>
              <p>{lang === "fa" ? "پروفایل حرفه‌ای و درخواست‌های مشتریان را مدیریت کنید." : "Manage your professional profile and customer requests."}</p>
            </div>
          </div>
          <div className="provider-header-actions">
            <button
              type="button"
              className="provider-home-button"
              onClick={() => navigate("/")}
            >
              <span aria-hidden="true">⌂</span>
              <span>{lang === "fa" ? "بازگشت به خانه" : "Back to Home"}</span>
            </button>
            <button
              type="button"
              className="provider-logout-button"
              onClick={handleLogout}
            >
              <span className="provider-logout-icon" aria-hidden="true">↪</span>
              <span>{t("Logout")}</span>
            </button>
          </div>
        </header>

        <section className="provider-welcome-card">
          <div className="provider-welcome-content">
            <span className="provider-eyebrow">{t("PROFESSIONAL PROFILE")}</span>
            <h2>{t("Welcome")}{formData.name ? `، ${formData.name}` : ""}</h2>
            <p>
              {t("Keep your information updated so customers can easily find and contact you.")}
            </p>
          </div>
          <div className="provider-status-badge">
            <span className="provider-status-dot" />
            {t("Profile Active")}
          </div>
        </section>

        {message && (
          <div
            className={`provider-message ${
              isError ? "provider-message-error" : "provider-message-success"
            }`}
          >
            <span className="provider-message-icon">{isError ? "!" : "✓"}</span>
            <span>{message}</span>
          </div>
        )}

        <form className="provider-profile-form" onSubmit={handleSubmit}>
          <section className="provider-form-section">
            <div className="provider-section-heading">
              <div className="provider-section-icon">👤</div>
              <div>
                <h3>{t("Account Information")}</h3>
                <p>{t("Your basic account details")}</p>
              </div>
            </div>
            <div className="provider-form-grid">
              <ProviderField
                id="provider-name"
                label={t("Full Name")}
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t("Enter your full name")}
                autoComplete="name"
              />
              <ProviderField
                id="provider-email"
                label={t("Email Address")}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                dir="ltr"
              />
            </div>
          </section>

          <section className="provider-form-section">
            <div className="provider-section-heading">
              <div className="provider-section-icon">🛠</div>
              <div>
                <h3>{t("Professional Information")}</h3>
                <p>{t("Tell customers about your services")}</p>
              </div>
            </div>
            <div className="provider-form-grid">
              <div className="provider-field provider-field-full">
                <label htmlFor="provider-skills">{t("Skills")}</label>
                <input
                  id="provider-skills"
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder={lang === "fa" ? "برق‌کار، نلدوان، نجار" : "Electrician, Plumber, Carpenter"}
                  dir={lang === "fa" ? "rtl" : "ltr"}
                />
                <span className="provider-field-help">
                  {t("Separate multiple skills with commas.")}
                </span>
              </div>
              <ProviderField
                id="provider-phone"
                label={t("Phone Number")}
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+92 300 1234567"
                autoComplete="tel"
                dir="ltr"
              />
              <ProviderField
                id="provider-whatsapp"
                label={lang === "fa" ? "شمارهٔ واتساپ" : "WhatsApp Number"}
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="+92 300 1234567"
                autoComplete="tel"
                dir="ltr"
              />
              <ProviderField
                id="provider-location"
                label={t("Location")}
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder={t("City, Area or Service Location")}
                full
              />
              <div className="provider-field provider-field-full">
                <label htmlFor="provider-description">{t("Background Description")}</label>
                <textarea
                  id="provider-description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="6"
                  placeholder={t("Tell customers about your experience, services and professional background...")}
                />
                <span className="provider-field-help">
                  {t("A clear description helps customers understand your experience and services.")}
                </span>
              </div>
            </div>
          </section>

          <div className="provider-form-footer">
            <div className="provider-footer-info">
              🔒 <span>{t("Your profile information is securely saved.")}</span>
            </div>
            <button
              type="submit"
              className="provider-save-button"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="provider-button-spinner" /> {t("Saving...")}
                </>
              ) : (
                <>
                  <span>✓</span> {t("Save Changes")}
                </>
              )}
            </button>
          </div>
        </form>

        <section className="service-requests-panel">
          <div className="service-requests-panel-header">
            <div>
              <span className="provider-eyebrow">{t("CUSTOMER REQUESTS")}</span>
              <h2>{t("Service Requests")}</h2>
              <p>{t("Review and manage complete work requests sent to you by customers.")}</p>
            </div>
            <div className="request-count-badge">{pendingCount} {t("New")}</div>
          </div>

          {requestsLoading ? (
            <div className="request-dashboard-empty">{t("Loading service requests...")}</div>
          ) : requests.length === 0 ? (
            <div className="request-dashboard-empty">{t("No customer requests yet.")}</div>
          ) : (
            <div className="provider-request-list">
              {requests.map((request) => (
                <ProviderRequestCard
                  key={request._id}
                  request={request}
                  lang={lang}
                  onStatusChange={updateRequestStatus}
                  actionLoading={requestActionLoading}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
    </>
  );
}

function ProviderField({
  id,
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  dir,
  full = false,
}) {
  return (
    <div className={`provider-field${full ? " provider-field-full" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        dir={dir}
      />
    </div>
  );
}

function ProviderRequestCard({ request, onStatusChange, actionLoading, lang }) {
  const t = (text) => tr(lang, text);
  const customer = request.customer || {};
  const status = request.status;
  const busy = actionLoading !== "";
  const action = (nextStatus) => onStatusChange(request._id, nextStatus);

  const fee = request.agreedLaborFee ?? request.proposedLaborFee;
  const currency =
    request.agreedLaborFee != null
      ? request.agreedLaborFeeCurrency
      : request.laborFeeCurrency;

  return (
    <article className="provider-request-card">
      <div className="provider-request-card-top">
        <div>
          <span className="provider-request-id">
            REQUEST #{String(request._id).slice(-6).toUpperCase()}
          </span>
          <h3>{request.jobTitle}</h3>
          <p>
            {request.serviceType} · {new Date(request.createdAt).toLocaleString()}
          </p>
        </div>
        <span className={`request-status status-${status}`}>
          {formatStatus(status, lang)}
        </span>
      </div>

      <div className="provider-request-customer">
        <RequestInfo lang={lang} label={t("Customer")} value={request.customerName || customer.name || "Customer"} />
        <RequestInfo
          lang={lang}
          label={t("Email")}
          value={request.customerEmail || customer.email || ""}
          verified={customer.isVerified}
        />
        <RequestInfo lang={lang} label={t("Phone Number")} value={request.customerPhone} dir="ltr" />
        <RequestInfo lang={lang} label={t("WhatsApp")} value={request.customerWhatsapp || t("Not provided")} dir="ltr" />
        <RequestInfo
          lang={lang}
          label={t("Location")}
          value={`${request.city || ""}${request.area ? `, ${request.area}` : ""}`}
        />
        <RequestInfo lang={lang} label={t("Full Address")} value={request.address} />
        <RequestInfo lang={lang} label={t("Contact Preference")} value={formatStatus(request.preferredContactMethod, lang)} />
        <RequestInfo lang={lang} label={t("Urgency")} value={formatStatus(request.urgency, lang)} />
        <RequestInfo lang={lang} label={t("Preferred Date")} value={request.preferredDate || t("Flexible")} />
        <RequestInfo lang={lang} label={t("Preferred Time")} value={request.preferredTime || t("Flexible")} />
        <RequestInfo
          lang={lang}
          label={t(request.agreedLaborFee != null ? "Agreed Labor Fee" : "Proposed Labor Fee")}
          value={fee != null ? `${Number(fee).toLocaleString()} ${currency || ""}` : t("Not provided")}
          highlight
        />
      </div>

      <div className="provider-request-description">
        <strong>{t("Description")}</strong>
        <p>{request.description}</p>
        {request.notes && (
          <>
            <strong>{t("Additional Notes")}</strong>
            <p>{request.notes}</p>
          </>
        )}
      </div>

      {request.attachments?.length > 0 && (
        <div className="provider-request-attachments">
          {request.attachments.map((file) => (
            <a
              key={file.path}
              href={/^https?:\/\//i.test(file.path) ? file.path : `${window.location.origin}${file.path.startsWith("/") ? "" : "/"}${file.path}`}
              target="_blank"
              rel="noreferrer"
            >
              📷 {file.originalName || t("View photo")}
            </a>
          ))}
        </div>
      )}

      <div className="provider-request-actions">
        {status === "pending" && (
          <>
            <button
              type="button"
              className="request-accept"
              disabled={busy}
              onClick={() => action("accepted")}
            >
              {actionLoading === `${request._id}-accepted`
                ? "..."
                : t("Accept Request")}
            </button>
            <button
              type="button"
              className="request-decline"
              disabled={busy}
              onClick={() => action("declined")}
            >
              {actionLoading === `${request._id}-declined` ? "..." : t("Decline")}
            </button>
          </>
        )}

        {status === "accepted" && (
          <button
            type="button"
            className="request-progress"
            disabled={busy}
            onClick={() => action("in_progress")}
          >
            {actionLoading === `${request._id}-in_progress`
              ? "..."
              : t("Mark In Progress")}
          </button>
        )}

        {status === "in_progress" && (
          <button
            type="button"
            className="request-complete"
            disabled={busy}
            onClick={() => action("completed")}
          >
            {actionLoading === `${request._id}-completed`
              ? "..."
              : t("Mark Completed")}
          </button>
        )}

        {status === "completed" && (
          <span className="request-complete-label">✓ {t("Job completed")}</span>
        )}
        {status === "declined" && (
          <span className="request-declined-label">{t("Request declined")}</span>
        )}
        {status === "cancelled" && (
          <span className="request-declined-label">{t("Cancelled by customer")}</span>
        )}
      </div>
    </article>
  );
}

function RequestInfo({ label, value, verified, dir, highlight, lang }) {
  return (
    <div className={highlight ? "provider-request-info-highlight" : ""}>
      <strong>{label}</strong>
      <span dir={dir}>{value || tr(lang, "Not provided")}</span>
      {verified && <small className="verified-customer">✓ {tr(lang, "Verified email")}</small>}
    </div>
  );
}

function formatStatus(value, lang) {
  const raw = String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  const dariStatus = { Pending: "در انتظار", Accepted: "پذیرفته‌شده", Declined: "ردشده", "In Progress": "در حال انجام", Completed: "تکمیل‌شده", Cancelled: "لغوشده", Phone: "تلفن", Email: "ایمیل", WhatsApp: "واتساپ", "Not provided": "ثبت نشده" };
  return lang === "fa" ? (dariStatus[raw] || raw) : raw;
}
