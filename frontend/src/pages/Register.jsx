import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useLanguage } from "../useLanguage";
import { tr } from "../i18n";

export default function Register() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const t = (text) => tr(lang, text);

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      password: "",
      role: "provider",
      skills: "",
      phone: "",
      whatsapp: "",
      location: "",
      description: "",
    });

  const [message, setMessage] =
    useState("");

  const [isError, setIsError] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  // ==================================================
  // CHANGE
  // ==================================================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ==================================================
  // REGISTER
  // ==================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setIsError(false);

    const payload = {
      ...formData,

      skills:
        formData.role === "provider" &&
        formData.skills
          ? formData.skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
    };

   

    try {
      const res = await axios.post(
        "/api/auth/register",
        payload
      );

      if (res.status === 200 || res.status === 201) {
        setMessage(
          res.data?.message ||
            "Registration successful. Please verify your email."
        );

        setIsError(false);

        setTimeout(() => {
          navigate("/verify-email", {
            state: {
              email: res.data?.email || formData.email,
            },
          });
        }, 1000);
      }
    } catch (err) {
      console.error("Registration failed:", {
        status: err.response?.status,
        response: err.response?.data,
        message: err.message,
        url: err.config?.url,
        method: err.config?.method,
      });

      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.response
          ? `Registration failed (HTTP ${err.response.status}).`
          : "Cannot connect to the server. Please try again.");

      setMessage(serverMsg);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <><Navbar lang={lang} setLang={setLang} /><div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 20px",
        minHeight: "80vh",
        direction: lang === "fa" ? "rtl" : "ltr",
        textAlign: lang === "fa" ? "right" : "left",
        fontFamily: "Tahoma",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          padding: "25px",
          borderRadius: "10px",
          boxShadow:
            "0 4px 12px rgba(0,0,0,0.1)",
          backgroundColor: "#fff",
          border:
            "1px solid #e2e8f0",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          {formData.role === "provider"
            ? t("Service Provider Registration")
            : t("Customer Registration")}
        </h2>

        {message && (
          <div
            style={{
              padding: "10px",
              borderRadius: "5px",
              marginBottom: "15px",
              textAlign: "center",
              backgroundColor: isError
                ? "#fef2f2"
                : "#dcfce7",
              color: isError
                ? "#dc2626"
                : "#15803d",
            }}
          >
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {/* ROLE */}

          <div>
            <label
              style={{
                fontWeight: "bold",
                color: "#334155",
              }}
            >
              {lang === "fa" ? "نقش کاربر:" : "User Role:"}
            </label>

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "4px",
                borderRadius: "6px",
                border:
                  "1px solid #cbd5e1",
                boxSizing: "border-box",
                backgroundColor: "#f8fafc",
                fontWeight: "bold",
              }}
            >
              <option value="provider">
                {t("Service Provider (Expert)")}
              </option>

              <option value="customer">
                {t("Customer")}
              </option>
            </select>
          </div>

          {/* NAME */}

          <div>
            <label>
              {t("Full Name")}:
            </label>

            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "4px",
                borderRadius: "4px",
                border:
                  "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* EMAIL */}

          <div>
            <label>
              {t("Email")}:
            </label>

            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "4px",
                borderRadius: "4px",
                border:
                  "1px solid #ccc",
                direction: "ltr",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* PASSWORD */}

          <div>
            <label>
              {t("Password")}:
            </label>

            <input
              type="password"
              name="password"
              required
              minLength={8}
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "4px",
                borderRadius: "4px",
                border:
                  "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />

            <small
              style={{
                display: "block",
                marginTop: "5px",
                color: "#64748b",
              }}
            >
              {t("Password must be at least 8 characters.")}
            </small>
          </div>

          {/* PROVIDER FIELDS */}

          {formData.role ===
            "provider" && (
            <>
              <div>
                <label>
                  {lang === "fa" ? "حرفه‌ها (با ویرگول جدا کنید):" : "Skills (separate with commas):"}
                </label>

                <input
                  type="text"
                  name="skills"
                  placeholder={lang === "fa" ? "برق‌کار، نلدوان" : "Electrician, Plumber"}
                  value={
                    formData.skills
                  }
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "4px",
                    borderRadius: "4px",
                    border:
                      "1px solid #ccc",
                    boxSizing:
                      "border-box",
                  }}
                />
              </div>

              <div>
                <label>
                  {t("Phone Number")}:
                </label>

                <input
                  type="text"
                  name="phone"
                  value={
                    formData.phone
                  }
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "4px",
                    borderRadius: "4px",
                    border:
                      "1px solid #ccc",
                    direction: "ltr",
                    boxSizing:
                      "border-box",
                  }}
                />
              </div>

              <div>
                <label>
                  {t("WhatsApp Number")}:
                </label>

                <input
                  type="text"
                  name="whatsapp"
                  value={
                    formData.whatsapp
                  }
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "4px",
                    borderRadius: "4px",
                    border:
                      "1px solid #ccc",
                    direction: "ltr",
                    boxSizing:
                      "border-box",
                  }}
                />
              </div>

              <div>
                <label>
                  {t("Location")}:
                </label>

                <input
                  type="text"
                  name="location"
                  value={
                    formData.location
                  }
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "4px",
                    borderRadius: "4px",
                    border:
                      "1px solid #ccc",
                    boxSizing:
                      "border-box",
                  }}
                />
              </div>

              <div>
                <label>
                  {t("Background Description")}:
                </label>

                <textarea
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={handleChange}
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "4px",
                    borderRadius: "4px",
                    border:
                      "1px solid #ccc",
                    resize: "vertical",
                    boxSizing:
                      "border-box",
                    fontFamily:
                      "Tahoma",
                  }}
                />
              </div>
            </>
          )}

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px",
              backgroundColor: loading
                ? "#94a3b8"
                : "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              fontWeight: "bold",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              marginTop: "10px",
            }}
          >
            {loading
              ? t("Sending Verification Code...")
              : formData.role ===
                "provider"
              ? t("Register & Verify Email")
              : t("Register & Verify Email")}
          </button>
        </form>

        <div
          style={{
            marginTop: "15px",
            textAlign: "center",
            fontSize: "14px",
          }}
        >
          {t("Already registered?")}{" "}
          <Link
            to="/login"
            style={{
              color: "#2563eb",
            }}
          >
            {t("Login here")}
          </Link>
        </div>
      </div>
    </div></>
  );
}
