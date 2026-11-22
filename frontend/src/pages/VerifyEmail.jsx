
import React, { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useLanguage } from "../useLanguage";
import { tr } from "../i18n";

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const t = (text) => tr(lang, text);

  const emailFromState = location.state?.email || "";

  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();

    setMessage("");
    setIsError(false);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();

    if (!normalizedEmail || !normalizedCode) {
      setMessage(t("Please enter your email and verification code."));
      setIsError(true);
      return;
    }

    if (!/^\d{6}$/.test(normalizedCode)) {
      setMessage(t("Please enter the 6-digit verification code."));
      setIsError(true);
      return;
    }

    setLoading(true);

    try {
      // Use the same domain as the deployed frontend.
      const res = await axios.post("/api/auth/verify-email", {
        email: normalizedEmail,
        code: normalizedCode,
      });

      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
      }

      if (res.data?.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));

        localStorage.setItem(
          "userInfo",
          JSON.stringify({
            user: res.data.user,
            role: res.data.user.role,
            isAdmin: res.data.user.role === "admin",
            email: res.data.user.email,
            name: res.data.user.name,
          })
        );
      }

      setMessage(res.data?.message || t("Email verified successfully."));
      setIsError(false);

      setTimeout(() => {
        if (res.data?.user?.role === "provider") {
          navigate("/provider-dashboard");
        } else {
          navigate("/");
        }

        window.location.reload();
      }, 1200);
    } catch (err) {
      console.error(
        "Email verification error:",
        err.response?.data || err.message
      );

      setMessage(
        err.response?.data?.message ||
          (err.response
            ? t("Verification failed. Please check your code.")
            : t("Cannot connect to the server. Please try again."))
      );

      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setMessage("");
    setIsError(false);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setMessage(t("Please enter your email address first."));
      setIsError(true);
      return;
    }

    setResending(true);

    try {
      const res = await axios.post("/api/auth/resend-verification", {
        email: normalizedEmail,
      });

      setMessage(
        res.data?.message || t("A new verification code has been sent.")
      );
      setIsError(false);
    } catch (err) {
      console.error(
        "Resend verification error:",
        err.response?.data || err.message
      );

      setMessage(
        err.response?.data?.message ||
          (err.response
            ? t("Could not send a new verification code.")
            : t("Cannot connect to the server. Please try again."))
      );

      setIsError(true);
    } finally {
      setResending(false);
    }
  };

  return (
    <><Navbar lang={lang} setLang={setLang} /><div
      dir={lang === "fa" ? "rtl" : "ltr"}
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f8fafc",
        padding: "20px",
        fontFamily: "Tahoma, Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          background: "#fff",
          borderRadius: "14px",
          padding: "30px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          border: "1px solid #e2e8f0",
          direction: lang === "fa" ? "rtl" : "ltr",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "25px" }}>
          <div style={{ fontSize: "42px", marginBottom: "10px" }}>✉️</div>

          <h2 style={{ margin: "0 0 10px", color: "#0f172a" }}>
            {t("Verify Your Email")}
          </h2>

          <p
            style={{
              margin: 0,
              color: "#64748b",
              lineHeight: 1.6,
              fontSize: "14px",
            }}
          >
            {t("We sent a verification code to your email address.")}
          </p>
        </div>

        {message && (
          <div
            role="alert"
            style={{
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "18px",
              textAlign: "center",
              backgroundColor: isError ? "#fef2f2" : "#f0fdf4",
              color: isError ? "#dc2626" : "#15803d",
              border: `1px solid ${isError ? "#fecaca" : "#bbf7d0"}`,
              fontSize: "14px",
            }}
          >
            {message}
          </div>
        )}

        <form
          onSubmit={handleVerify}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          <div>
            <label
              htmlFor="verification-email"
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "bold",
                color: "#334155",
                fontSize: "14px",
              }}
            >
              {t("Email")}
            </label>

            <input
              id="verification-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("Enter your email")}
              required
              disabled={loading || resending}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: "7px",
                border: "1px solid #cbd5e1",
                boxSizing: "border-box",
                direction: "ltr",
                backgroundColor: loading || resending ? "#f1f5f9" : "#fff",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="verification-code"
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "bold",
                color: "#334155",
                fontSize: "14px",
              }}
            >
              {t("Verification Code")}
            </label>

            <input
              id="verification-code"
              type="text"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder={t("Enter verification code")}
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "7px",
                border: "1px solid #cbd5e1",
                boxSizing: "border-box",
                textAlign: "center",
                letterSpacing: "5px",
                fontSize: "20px",
                backgroundColor: loading ? "#f1f5f9" : "#fff",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || resending || code.length !== 6}
            style={{
              padding: "12px",
              backgroundColor:
                loading || resending || code.length !== 6
                  ? "#94a3b8"
                  : "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "7px",
              fontWeight: "bold",
              cursor:
                loading || resending || code.length !== 6
                  ? "not-allowed"
                  : "pointer",
              fontSize: "15px",
            }}
          >
            {loading ? t("Verifying...") : t("Verify Email")}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending || loading}
          style={{
            width: "100%",
            marginTop: "12px",
            padding: "11px",
            background: "#fff",
            color: "#2563eb",
            border: "1px solid #2563eb",
            borderRadius: "7px",
            fontWeight: "bold",
            cursor: resending || loading ? "not-allowed" : "pointer",
          }}
        >
          {resending ? t("Sending...") : t("Resend Verification Code")}
        </button>

        <div
          style={{
            textAlign: "center",
            marginTop: "20px",
            fontSize: "14px",
          }}
        >
          <Link
            to="/login"
            style={{
              color: "#2563eb",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            ← {t("Back to Login")}
          </Link>
        </div>
      </div>
    </div></>
  );
}
