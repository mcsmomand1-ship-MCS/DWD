import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [step, setStep] = useState(1);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const [loading, setLoading] = useState(false);

  // ==================================================
  // SEND RESET CODE
  // ==================================================

  const handleSendCode = async (e) => {
    e.preventDefault();

    setMessage("");
    setIsError(false);

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      setIsError(true);
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "/api/auth/forgot-password-request",
        {
          email: email.trim().toLowerCase(),
        }
      );

      setMessage(
        res.data?.message ||
          "A password reset code has been sent to your email."
      );

      setIsError(false);
      setStep(2);
    } catch (error) {
      console.error(
        "Forgot password error:",
        error.response?.data || error.message
      );

      setMessage(
        error.response?.data?.message ||
          "Failed to send reset code. Please check your email."
      );

      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // VERIFY CODE + RESET PASSWORD
  // ==================================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setMessage("");
    setIsError(false);

    if (!code.trim()) {
      setMessage("Please enter the verification code.");
      setIsError(true);
      return;
    }

    if (code.trim().length !== 5) {
      setMessage("Please enter the 5-digit verification code.");
      setIsError(true);
      return;
    }

    if (!newPassword) {
      setMessage("Please enter your new password.");
      setIsError(true);
      return;
    }

    if (newPassword.length < 8) {
      setMessage(
        "New password must be at least 8 characters long."
      );
      setIsError(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setIsError(true);
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "/api/auth/reset-password-verify",
        {
          email: email.trim().toLowerCase(),
          code: code.trim(),
          newPassword: newPassword,
        }
      );

      setMessage(
        res.data?.message ||
          "Password changed successfully."
      );

      setIsError(false);

      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    } catch (error) {
      console.error(
        "Reset password error:",
        error.response?.data || error.message
      );

      setMessage(
        error.response?.data?.message ||
          "Failed to reset password. Please check your code."
      );

      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // RETURN
  // ==================================================

  return (
    <div
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
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.08)",
          border: "1px solid #e2e8f0",
          direction: "ltr",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "25px",
          }}
        >
          <div
            style={{
              fontSize: "42px",
              marginBottom: "10px",
            }}
          >
            🔐
          </div>

          <h2
            style={{
              margin: "0 0 10px",
              color: "#0f172a",
            }}
          >
            Forgot Password
          </h2>

          <p
            style={{
              margin: 0,
              color: "#64748b",
              lineHeight: 1.6,
              fontSize: "14px",
            }}
          >
            {step === 1
              ? "Enter your email address and we will send you a password reset code."
              : "Enter the code sent to your email and create a new password."}
          </p>
        </div>

        {message && (
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "18px",
              textAlign: "center",
              backgroundColor: isError
                ? "#fef2f2"
                : "#f0fdf4",
              color: isError
                ? "#dc2626"
                : "#15803d",
              border: `1px solid ${
                isError
                  ? "#fecaca"
                  : "#bbf7d0"
              }`,
              fontSize: "14px",
            }}
          >
            {message}
          </div>
        )}

        {step === 1 ? (
          <form
            onSubmit={handleSendCode}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "bold",
                  color: "#334155",
                  fontSize: "14px",
                }}
              >
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your email"
                required
                disabled={loading}
                autoComplete="email"
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: "7px",
                  border:
                    "1px solid #cbd5e1",
                  boxSizing: "border-box",
                  direction: "ltr",
                  backgroundColor: loading
                    ? "#f1f5f9"
                    : "#fff",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px",
                backgroundColor: loading
                  ? "#94a3b8"
                  : "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "7px",
                fontWeight: "bold",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
                fontSize: "15px",
              }}
            >
              {loading
                ? "Sending..."
                : "Send Reset Code"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleResetPassword}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "bold",
                  color: "#334155",
                  fontSize: "14px",
                }}
              >
                Email
              </label>

              <input
                type="email"
                value={email}
                disabled
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: "7px",
                  border:
                    "1px solid #cbd5e1",
                  boxSizing: "border-box",
                  direction: "ltr",
                  backgroundColor: "#f1f5f9",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "bold",
                  color: "#334155",
                  fontSize: "14px",
                }}
              >
                Verification Code
              </label>

              <input
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(
                    e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 5)
                  )
                }
                placeholder="Enter 5-digit code"
                maxLength={5}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "7px",
                  border:
                    "1px solid #cbd5e1",
                  boxSizing: "border-box",
                  textAlign: "center",
                  letterSpacing: "5px",
                  fontSize: "20px",
                  backgroundColor: loading
                    ? "#f1f5f9"
                    : "#fff",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "bold",
                  color: "#334155",
                  fontSize: "14px",
                }}
              >
                New Password
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                placeholder="Enter new password"
                minLength={8}
                required
                disabled={loading}
                autoComplete="new-password"
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: "7px",
                  border:
                    "1px solid #cbd5e1",
                  boxSizing: "border-box",
                  direction: "ltr",
                  backgroundColor: loading
                    ? "#f1f5f9"
                    : "#fff",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "bold",
                  color: "#334155",
                  fontSize: "14px",
                }}
              >
                Confirm New Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Confirm new password"
                minLength={8}
                required
                disabled={loading}
                autoComplete="new-password"
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: "7px",
                  border:
                    "1px solid #cbd5e1",
                  boxSizing: "border-box",
                  direction: "ltr",
                  backgroundColor: loading
                    ? "#f1f5f9"
                    : "#fff",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 5}
              style={{
                padding: "12px",
                backgroundColor:
                  loading || code.length !== 5
                    ? "#94a3b8"
                    : "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "7px",
                fontWeight: "bold",
                cursor:
                  loading || code.length !== 5
                    ? "not-allowed"
                    : "pointer",
                fontSize: "15px",
              }}
            >
              {loading
                ? "Resetting Password..."
                : "Reset Password"}
            </button>
          </form>
        )}

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
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}