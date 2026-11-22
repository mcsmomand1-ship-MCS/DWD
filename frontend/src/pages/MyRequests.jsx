import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useLanguage } from "../useLanguage";
import { tr } from "../i18n";
import "./MyRequests.css";

const API = "/api";

export default function MyRequests() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const t = useCallback((text) => tr(lang, text), [lang]);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(`${API}/service-requests/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(response.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      setError(
        err.response?.data?.message ||
          t("Unable to load your service requests.")
      );
    } finally {
      setLoading(false);
    }
  }, [navigate, t]);

  const loadNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `${API}/service-requests/notifications`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(response.data || []);
    } catch (err) {
      console.error("Unable to load notifications:", err);
    }
  }, []);

  useEffect(() => {
    loadRequests();
    loadNotifications();
  }, [loadRequests, loadNotifications]);

  const markNotificationRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API}/service-requests/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((current) =>
        current.map((item) =>
          item._id === id ? { ...item, read: true } : item
        )
      );
    } catch (err) {
      console.error("Unable to mark notification as read:", err);
    }
  };

  const cancelRequest = async (id) => {
    const confirmed = window.confirm(t("Cancel this service request?"));
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API}/service-requests/${id}/status`,
        { status: "cancelled" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadRequests();
      await loadNotifications();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          t("Unable to cancel the request.")
      );
    }
  };

  const unreadNotifications = notifications.filter((item) => !item.read);

  return (
    <>
    <Navbar lang={lang} setLang={setLang} />
    <main className="my-requests-page">
      <div className="my-requests-shell">
        <div className="my-requests-top">
          <div>
            <span className="my-requests-eyebrow">{t("CUSTOMER AREA")}</span>
            <h1>{t("My Service Requests")}</h1>
            <p>{t("Track requests you have sent to service providers.")}</p>
          </div>
          <Link to="/" className="my-requests-home">
            ← {t("Find another provider")}
          </Link>
        </div>

        {unreadNotifications.length > 0 && (
          <section className="request-notification-panel">
            <div className="request-notification-header">
              <div>
                <span className="my-requests-eyebrow">{t("NOTIFICATIONS")}</span>
                <h2>{t("Updates about your requests")}</h2>
              </div>
              <span className="notification-count">
                {unreadNotifications.length} {t("New")}
              </span>
            </div>

            <div className="request-notification-list">
              {unreadNotifications.slice(0, 5).map((notification) => (
                <div className="request-notification" key={notification._id}>
                  <div className="notification-icon">✓</div>
                  <div className="notification-content">
                    <strong>{notification.title}</strong>
                    <p>{notification.message}</p>
                    <small>
                      {new Date(notification.createdAt).toLocaleString()}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="notification-read-button"
                    onClick={() => markNotificationRead(notification._id)}
                  >
                    {t("Mark read")}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {error && <div className="my-request-alert">{error}</div>}

        {loading ? (
          <div className="my-request-empty">{t("Loading your requests...")}</div>
        ) : requests.length === 0 ? (
          <div className="my-request-empty">
            <div>📋</div>
            <h2>{t("No requests yet")}</h2>
            <p>{t("Choose a provider and submit your first service request.")}</p>
            <Link to="/">{t("Find a Provider")}</Link>
          </div>
        ) : (
          <div className="my-request-list">
            {requests.map((request) => (
              <RequestCard
                key={request._id}
                request={request}
                onCancel={cancelRequest}
                lang={lang}
              />
            ))}
          </div>
        )}
      </div>
    </main>
    </>
  );
}

function RequestCard({ request, onCancel, lang }) {
  const t = (text) => tr(lang, text);
  const provider =
    request.provider?.user?.name ||
    request.provider?.name ||
    t("Service Provider");

  const canCancel = ["pending", "accepted", "in_progress"].includes(
    request.status
  );

  const displayFee = request.agreedLaborFee ?? request.proposedLaborFee;
  const displayCurrency =
    request.agreedLaborFee != null
      ? request.agreedLaborFeeCurrency
      : request.laborFeeCurrency;

  return (
    <article className="my-request-card">
      <div className="my-request-card-head">
        <div>
          <span className="request-id">
            {t("Request")} #{String(request._id).slice(-6).toUpperCase()}
          </span>
          <h2>{request.jobTitle}</h2>
          <p>
            {provider} · {request.serviceType}
          </p>
        </div>
        <Status status={request.status} lang={lang} />
      </div>

      <div className="my-request-grid">
        <Info lang={lang} label={t("Urgency")} value={format(request.urgency, lang)} />
        <Info lang={lang} label={t("Preferred Date")} value={request.preferredDate || t("Flexible")} />
        <Info lang={lang} label={t("Preferred Time")} value={request.preferredTime || t("Flexible")} />
        <Info lang={lang} label={t("Contact Method")} value={format(request.preferredContactMethod, lang)} />
        <Info
          lang={lang}
          label={t(request.agreedLaborFee != null ? "Agreed Labor Fee" : "Proposed Labor Fee")}
          value={
            displayFee != null
              ? `${Number(displayFee).toLocaleString()} ${displayCurrency || ""}`
              : t("Not provided")
          }
          highlight
        />
        <Info
          lang={lang}
          label={t("Location")}
          value={`${request.city || ""}${request.area ? `, ${request.area}` : ""}`}
        />
        <Info lang={lang} label={t("Submitted")} value={new Date(request.createdAt).toLocaleString()} />
        <Info lang={lang} label={t("Customer Phone")} value={request.customerPhone || t("Not provided")} />
      </div>

      <div className="my-request-detail-block">
        <strong>{t("Full Address")}</strong>
        <p>{request.address || t("Not provided")}</p>
      </div>

      <div className="my-request-detail-block">
        <strong>{t("Description")}</strong>
        <p>{request.description}</p>
      </div>

      {request.notes && (
        <div className="my-request-detail-block">
          <strong>{t("Additional Notes")}</strong>
          <p>{request.notes}</p>
        </div>
      )}

      {request.attachments?.length > 0 && (
        <div className="my-request-photos">
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

      {canCancel && (
        <button
          type="button"
          className="my-request-cancel"
          onClick={() => onCancel(request._id)}
        >
          {t("Cancel Request")}
        </button>
      )}
    </article>
  );
}

function Info({ label, value, highlight = false }) {
  return (
    <div className={highlight ? "request-info-highlight" : ""}>
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  );
}

function Status({ status, lang }) {
  return (
    <span className={`request-status status-${status}`}>
      {format(status, lang)}
    </span>
  );
}

function format(value, lang) {
  const raw = String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
  return tr(lang, raw);
}
