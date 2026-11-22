import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useLanguage } from "../useLanguage";
import { tr } from "../i18n";
import "./RequestService.css";

const API = "/api";

export default function RequestService() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const t = useCallback((text) => tr(lang, text), [lang]);

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const storedUser = useMemo(() => {
    try {
      const raw =
        localStorage.getItem("userInfo") ||
        localStorage.getItem("user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.user || parsed;
    } catch {
      return null;
    }
  }, []);

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerWhatsapp: "",
    preferredContactMethod: "phone",
    serviceType: "",
    jobTitle: "",
    description: "",
    urgency: "flexible",
    preferredDate: "",
    preferredTime: "",
    proposedLaborFee: "",
    laborFeeCurrency: "PKR",
    city: "",
    area: "",
    address: "",
    notes: "",
    consent: false,
    files: [],
  });

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || !storedUser) {
      navigate("/login", {
        replace: true,
        state: { from: `/request-service/${providerId}` },
      });
      return;
    }

    const loadProvider = async () => {
      try {
        const response = await axios.get(`${API}/providers/${providerId}`);
        const data = response.data;
        const skills = Array.isArray(data.skills) ? data.skills : [];

        setProvider(data);
        setForm((current) => ({
          ...current,
          customerName: storedUser?.name || "",
          customerEmail: storedUser?.email || "",
          serviceType: skills[0] || "General Service",
        }));
      } catch (err) {
        setError(
          t(err.response?.data?.message || "Unable to load the selected provider.")
        );
      } finally {
        setLoading(false);
      }
    };

    loadProvider();
  }, [navigate, providerId, storedUser, t]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
    setSuccess("");
  };

  const handleFiles = (event) => {
    const selected = Array.from(event.target.files || []);

    if (selected.length > 5) {
      setError("You can upload a maximum of 5 images.");
    }

    const oversized = selected.find(
      (file) => file.size > 5 * 1024 * 1024
    );

    if (oversized) {
      setError(t("Each image must be 5 MB or smaller."));
    }

    setForm((current) => ({
      ...current,
      files: selected.slice(0, 5),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.consent) {
      setError(
          t("Please confirm that the information is accurate and that the provider may contact you.")
      );
      return;
    }

    if (!form.customerPhone.trim()) {
      setError(t("Phone number is required so the provider can contact you."));
      return;
    }

    if (!form.description.trim()) {
      setError(t("Please describe the work you need."));
      return;
    }

    const fee = Number(form.proposedLaborFee);
    if (!Number.isFinite(fee) || fee < 0) {
      setError(t("Please enter a valid labor fee."));
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const data = new FormData();
      data.append("providerId", providerId);
      data.append("customerName", form.customerName);
      data.append("customerEmail", form.customerEmail);
      data.append("customerPhone", form.customerPhone);
      data.append("customerWhatsapp", form.customerWhatsapp);
      data.append("preferredContactMethod", form.preferredContactMethod);
      data.append("serviceType", form.serviceType);
      data.append("jobTitle", form.jobTitle);
      data.append("description", form.description);
      data.append("urgency", form.urgency);
      data.append("preferredDate", form.preferredDate);
      data.append("preferredTime", form.preferredTime);
      data.append("proposedLaborFee", String(fee));
      data.append("laborFeeCurrency", form.laborFeeCurrency);
      data.append("city", form.city);
      data.append("area", form.area);
      data.append("address", form.address);
      data.append("notes", form.notes);
      data.append("consent", String(form.consent));

      form.files.forEach((file) => {
        data.append("attachments", file);
      });

      const response = await axios.post(
        `${API}/service-requests`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data?.message ||
          t("Your service request has been submitted successfully.")
      );

      setTimeout(() => navigate("/my-requests"), 900);
    } catch (err) {
      console.error("Service request failed:", {
        status: err.response?.status,
        response: err.response?.data,
        message: err.message,
      });

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          t("Could not submit the service request.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <><Navbar lang={lang} setLang={setLang} /><div className="request-page">
        <div className="request-shell request-loading">
          {t("Loading provider information...")}
        </div>
      </div></>
    );
  }

  if (!provider) {
    return (
      <><Navbar lang={lang} setLang={setLang} /><div className="request-page">
        <div className="request-shell request-error">
          {error || t("Provider not found.")}
        </div>
      </div></>
    );
  }

  const skills = Array.isArray(provider.skills) ? provider.skills : [];

  return (
    <><Navbar lang={lang} setLang={setLang} /><main className="request-page" dir={lang === "fa" ? "rtl" : "ltr"}>
      <div className="request-shell">
        <div className="request-navigation">
          <Link to={`/provider/${providerId}`} className="request-back">
            ← {t("Back to provider")}
          </Link>
          <Link to="/my-requests" className="request-back">
            {t("My Requests")}
          </Link>
        </div>

        <div className="request-header-card">
          <div>
            <span className="request-eyebrow">{t("SERVICE REQUEST")}</span>
            <h1>{t("Request a Service")}</h1>
            <p>
              {t("Send a structured job request to")}{" "}
              <strong>{provider.name || provider.user?.name}</strong>.
            </p>
          </div>
          <div className="request-provider-mini">
            <strong>{provider.name || provider.user?.name}</strong>
            <span>
              {skills.length > 0 ? skills.join(", ") : t("Professional Service")}
            </span>
            <span>📍 {provider.location || t("Location not provided")}</span>
          </div>
        </div>

        {error && <div className="request-alert request-alert-error">{error}</div>}
        {success && (
          <div className="request-alert request-alert-success">{success}</div>
        )}

        <form className="request-form" onSubmit={submit}>
          <section className="request-section">
            <SectionTitle
              number="01"
              title={t("Your Contact Details")}
              description={t("These details are sent privately to the selected provider.")}
            />
            <div className="request-grid">
              <Field
                label={t("Full Name")}
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                required
              />
              <div className="request-field">
                <label>{t("Email")} *</label>
                <input
                  type="email"
                  value={form.customerEmail}
                  readOnly
                  dir="ltr"
                />
                <small className="verified-note">
                  ✓ {t("This is the verified email on your account.")}
                </small>
              </div>
              <Field
                label={t("Phone Number")}
                name="customerPhone"
                value={form.customerPhone}
                onChange={handleChange}
                placeholder="+92 300 1234567"
                required
              />
              <Field
                label={t("WhatsApp Number")}
                name="customerWhatsapp"
                value={form.customerWhatsapp}
                onChange={handleChange}
                placeholder={t("Optional if different")}
              />
              <div className="request-field">
                <label>{t("Preferred Contact Method")}</label>
                <select
                  name="preferredContactMethod"
                  value={form.preferredContactMethod}
                  onChange={handleChange}
                >
                  <option value="phone">{t("Phone Call")}</option>
                  <option value="whatsapp">{t("WhatsApp")}</option>
                  <option value="email">{t("Email")}</option>
                </select>
              </div>
            </div>
          </section>

          <section className="request-section">
            <SectionTitle
              number="02"
              title={t("Job Details")}
              description={t("Give the provider enough information to understand the work.")}
            />
            <div className="request-grid">
              <div className="request-field">
                <label>{t("Service Type")} *</label>
                {skills.length > 0 ? (
                  <select
                    name="serviceType"
                    value={form.serviceType}
                    onChange={handleChange}
                    required
                  >
                    {skills.map((skill) => (
                      <option key={skill} value={skill}>
                        {skill}
                      </option>
                    ))}
                    <option value="Other">{t("Other")}</option>
                  </select>
                ) : (
                  <input
                    name="serviceType"
                    value={form.serviceType}
                    onChange={handleChange}
                    required
                    placeholder={t("e.g. Plumbing")}
                  />
                )}
              </div>

              <Field
                label={t("Job Title")}
                name="jobTitle"
                value={form.jobTitle}
                onChange={handleChange}
                placeholder={t("e.g. Fix leaking bathroom pipe")}
                required
              />

              <div className="request-field request-field-full">
                <label>{t("Describe the Work")} *</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows="6"
                  placeholder={t("Describe the problem, what needs to be repaired or installed, and any useful details...")}
                />
              </div>

              <div className="request-field">
                <label>{t("Urgency")}</label>
                <select
                  name="urgency"
                  value={form.urgency}
                  onChange={handleChange}
                >
                  <option value="emergency">{t("Emergency")}</option>
                  <option value="today">{t("Today")}</option>
                  <option value="this_week">{t("This Week")}</option>
                  <option value="flexible">{t("Flexible")}</option>
                </select>
              </div>

              <Field
                label={t("Preferred Date")}
                name="preferredDate"
                value={form.preferredDate}
                onChange={handleChange}
                type="date"
              />

              <Field
                label={t("Preferred Time")}
                name="preferredTime"
                value={form.preferredTime}
                onChange={handleChange}
                type="time"
              />

              <div className="request-field request-price-field">
                <label>{t("Proposed Labor Fee")} *</label>
                <div className="request-price-input-row">
                  <input
                    type="number"
                    name="proposedLaborFee"
                    value={form.proposedLaborFee}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  placeholder={t("e.g. 5000")}
                    required
                  />
                  <select
                    name="laborFeeCurrency"
                    value={form.laborFeeCurrency}
                    onChange={handleChange}
                  >
                    <option value="PKR">PKR</option>
                    <option value="AFN">AFN</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <small className="field-help">
                  {t("The provider will see this amount before accepting or declining the request.")}
                </small>
              </div>

              <div className="request-field request-field-full">
                <label>{t("Additional Notes")}</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder={t("Parking, access instructions, preferred entrance, etc. (optional)")}
                />
              </div>
            </div>
          </section>

          <section className="request-section">
            <SectionTitle
              number="03"
              title={t("Job Location")}
              description={t("The exact address is private and is available to the selected provider through this request.")}
            />
            <div className="request-grid">
              <Field
                label={t("City")}
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                placeholder={t("e.g. Islamabad")}
              />
              <Field
                label={t("Area / Sector")}
                name="area"
                value={form.area}
                onChange={handleChange}
                placeholder={t("e.g. F-10")}
              />
              <div className="request-field request-field-full">
                <label>{t("Full Address")} *</label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  rows="3"
                  placeholder={t("House / building, street, area and useful directions")}
                />
              </div>
            </div>
          </section>

          <section className="request-section">
            <SectionTitle
              number="04"
              title={t("Photos of the Work")}
              description={t("Optional, but photos can help the provider understand the job before calling you.")}
            />
            <div className="request-upload">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFiles}
              />
              <small>{t("You can attach up to 5 images. Common image formats are supported.")}</small>
              {form.files.length > 0 && (
                <div className="request-files">
                  {form.files.map((file) => (
                    <span key={`${file.name}-${file.size}`}>
                      📷 {file.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          <label className="request-consent">
            <input
              type="checkbox"
              name="consent"
              checked={form.consent}
              onChange={handleChange}
            />
            <span>
              {t("I confirm that the information provided is accurate and I agree that the selected service provider may contact me about this request.")}
            </span>
          </label>

          <div className="request-submit-row">
            <Link to={`/provider/${providerId}`} className="request-cancel">
              {t("Cancel")}
            </Link>
            <button type="submit" disabled={submitting}>
              {submitting ? t("Submitting...") : t("Submit Service Request →")}
            </button>
          </div>
        </form>
      </div>
    </main></>
  );
}

function SectionTitle({ number, title, description }) {
  return (
    <div className="request-section-title">
      <span>{number}</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
}) {
  return (
    <div className="request-field">
      <label>
        {label}
        {required && " *"}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
