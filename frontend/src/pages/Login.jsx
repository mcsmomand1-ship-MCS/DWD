import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useLanguage } from "../useLanguage";
import { tr } from "../i18n";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const t = (text) => tr(lang, text);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot Password states
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [step, setStep] = useState(1);

  const [forgotEmail, setForgotEmail] = useState("");

  const [resetData, setResetData] = useState({
    code: "",
    newPassword: "",
  });

  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  // ================================
  // LOGIN INPUT CHANGE
  // ================================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ================================
  // LOGIN
  // ================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post(
        "/api/auth/login",
        formData
      );

      if (res.status === 200) {
        if (res.data?.token) {
          localStorage.setItem("token", res.data.token);
        }

        let userData = res.data.user || res.data;

        // Existing admin logic
        if (
          formData.email.trim().toLowerCase() ===
          "dwdstudent@gmail.com"
        ) {
          userData.role = "admin";
          userData.isAdmin = true;
        }

        localStorage.setItem(
          "user",
          JSON.stringify(userData)
        );

        localStorage.setItem(
          "userInfo",
          JSON.stringify({
            user: userData,
            role: userData.role,
            isAdmin: userData.isAdmin,
            email: userData.email,
            name: userData.name,
          })
        );

        navigate("/");
        window.location.reload();
      }
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          "Incorrect email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // REQUEST RESET CODE
  // ================================

  const handleRequestCode = async (e) => {
    e.preventDefault();

    setForgotMessage("");
    setForgotSuccess("");

    try {
      const res = await axios.post(
        "/api/auth/forgot-password-request",
        {
          email: forgotEmail,
        }
      );

      setForgotSuccess(res.data.message);
      setStep(2);
    } catch (err) {
      setForgotMessage(
        err.response?.data?.message ||
          "خطا در ارسال کد."
      );
    }
  };

  // ================================
  // VERIFY RESET CODE
  // ================================

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();

    setForgotMessage("");
    setForgotSuccess("");

    try {
      const res = await axios.post(
        "/api/auth/reset-password-verify",
        {
          email: forgotEmail,
          code: resetData.code,
          newPassword: resetData.newPassword,
        }
      );

      setForgotSuccess(res.data.message);

      setTimeout(() => {
        setIsForgotMode(false);
        setStep(1);
        setForgotEmail("");

        setResetData({
          code: "",
          newPassword: "",
        });

        setForgotSuccess("");
      }, 3000);
    } catch (err) {
      setForgotMessage(
        err.response?.data?.message ||
          "کد تأیید اشتباه است."
      );
    }
  };

  // ================================
  // BACK TO LOGIN
  // ================================

  const handleBackToLogin = () => {
    setIsForgotMode(false);
    setStep(1);

    setForgotEmail("");

    setResetData({
      code: "",
      newPassword: "",
    });

    setForgotMessage("");
    setForgotSuccess("");
  };

  return (
    <><Navbar lang={lang} setLang={setLang} /><div className="login-page" dir={lang === "fa" ? "rtl" : "ltr"}>

      {/* ================================
          BACKGROUND
      ================================= */}

      <div className="login-background">
        <div className="login-glow login-glow-one"></div>
        <div className="login-glow login-glow-two"></div>
      </div>

      {/* ================================
          MAIN CONTAINER
      ================================= */}

      <div className="login-container">

        {/* ================================
            LEFT INFORMATION SIDE
        ================================= */}

        <div className="login-info">

          <div className="login-brand">
            <div className="login-brand-icon">
              🔐
            </div>

            <span>{t("Your Platform")}</span>
          </div>

          <div className="login-info-content">

            <div className="login-badge">
              {t("Welcome Back")}
            </div>

            <h1>
              {t("Login to")}
              <span>{t("Your Account")}</span>
            </h1>

            <p>
              {t("Access your account and continue managing your services, profile, and activities from one secure place.")}
            </p>

            <div className="login-features">

              <div className="login-feature">
                <div>✓</div>
                <span>{t("Secure account access")}</span>
              </div>

              <div className="login-feature">
                <div>✓</div>
                <span>{t("Manage your profile easily")}</span>
              </div>

              <div className="login-feature">
                <div>✓</div>
                <span>{t("Fast and simple experience")}</span>
              </div>

            </div>
          </div>

          <div></div>
        </div>

        {/* ================================
            RIGHT LOGIN CARD
        ================================= */}

        <div className="login-card">

          {!isForgotMode ? (

            <>
              {/* LOGIN HEADER */}

              <div className="login-card-header">

                <div className="login-icon">
                  🔐
                </div>

                <h2>
                  {t("Login to Account")}
                </h2>

                <p>
                  {t("Enter your credentials to continue")}
                </p>

              </div>

              {/* LOGIN MESSAGE */}

              {message && (
                <div className="login-message error">
                  {message}
                </div>
              )}

              {/* LOGIN FORM */}

              <form
                onSubmit={handleSubmit}
                className="login-form"
              >

                {/* EMAIL */}

                <div className="login-field">

                  <label htmlFor="login-email">
                    {t("Email")}
                  </label>

                  <div className="login-input-wrapper">

                    <span>✉</span>

                    <input
                      id="login-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t("Enter your email")}
                      autoComplete="email"
                      required
                    />

                  </div>

                </div>

                {/* PASSWORD */}

                <div className="login-field">

                  <label htmlFor="login-password">
                    {t("Password")}
                  </label>

                  <div className="login-input-wrapper">

                    <span>🔒</span>

                    <input
                      id="login-password"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={t("Enter your password")}
                      autoComplete="current-password"
                      required
                    />

                  </div>

                </div>

                {/* OPTIONS */}

                <div className="login-options">

                  <label className="remember-me">
                    <input
                      type="checkbox"
                    />
                    <span>
                      {t("Remember me")}
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(true);
                      setForgotMessage("");
                      setForgotSuccess("");
                    }}
                    style={{
                      border: "none",
                      background: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    {t("Forgot Password?")}
                  </button>

                </div>

                {/* SUBMIT */}

                <button
                  type="submit"
                  className="login-submit"
                  disabled={loading}
                >

                  {loading ? (
                    <>
                      <span className="login-spinner"></span>
                      {t("Logging in...")}
                    </>
                  ) : (
                    <>
                      <span>→</span>
                      {t("Login")}
                    </>
                  )}

                </button>

              </form>

              {/* DIVIDER */}

              <div className="login-divider">
                <span>{t("OR")}</span>
              </div>

              {/* REGISTER */}

              <div className="login-register">

                <p>
                  {t("Don't have an account?")}
                </p>

                <Link to="/register">
                  {t("Register here")}
                </Link>

              </div>

              {/* BACK HOME */}

              <Link
                to="/"
                className="login-back-home"
              >
                ← {t("Back to Home")}
              </Link>

            </>

          ) : (

            /* =================================
               FORGOT PASSWORD
            ================================= */

            <>

              <div className="login-card-header">

                <div className="login-icon">
                  🔑
                </div>

                <h2>
                  {t("Reset Password")}
                </h2>

                <p>
                  {t("Recover access to your account")}
                </p>

              </div>

              {/* ERROR */}

              {forgotMessage && (
                <div className="login-message error">
                  {forgotMessage}
                </div>
              )}

              {/* SUCCESS */}

              {forgotSuccess && (
                <div className="login-message success">
                  {forgotSuccess}
                </div>
              )}

              {/* STEP 1 */}

              {step === 1 ? (

                <form
                  onSubmit={handleRequestCode}
                  className="login-form"
                >

                  <div className="login-field">

                    <label htmlFor="forgot-email">
                      {t("Enter Your Email")}
                    </label>

                    <div className="login-input-wrapper">

                      <span>✉</span>

                      <input
                        id="forgot-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) =>
                          setForgotEmail(
                            e.target.value
                          )
                        }
                        placeholder={t("Enter your email")}
                        autoComplete="email"
                        required
                      />

                    </div>

                  </div>

                  <button
                    type="submit"
                    className="login-submit"
                  >
                    <span>→</span>
                    {t("Send Verification Code")}
                  </button>

                </form>

              ) : (

                /* STEP 2 */

                <form
                  onSubmit={handleVerifyAndReset}
                  className="login-form"
                >

                  <div className="login-field">

                    <label htmlFor="verification-code">
                      {t("Verification Code")}
                    </label>

                    <div className="login-input-wrapper">

                      <span>🔢</span>

                      <input
                        id="verification-code"
                        type="text"
                        value={resetData.code}
                        onChange={(e) =>
                          setResetData({
                            ...resetData,
                            code: e.target.value,
                          })
                        }
                        placeholder={t("Enter verification code")}
                        required
                      />

                    </div>

                  </div>

                  <div className="login-field">

                    <label htmlFor="new-password">
                      {t("New Password")}
                    </label>

                    <div className="login-input-wrapper">

                      <span>🔒</span>

                      <input
                        id="new-password"
                        type="password"
                        value={resetData.newPassword}
                        onChange={(e) =>
                          setResetData({
                            ...resetData,
                            newPassword:
                              e.target.value,
                          })
                        }
                        placeholder={t("Enter new password")}
                        autoComplete="new-password"
                        required
                      />

                    </div>

                  </div>

                  <button
                    type="submit"
                    className="login-submit"
                  >
                    <span>✓</span>
                    {t("Verify & Update Password")}
                  </button>

                </form>
              )}

              {/* BACK TO LOGIN */}

              <div className="login-register">

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  style={{
                    marginTop: "24px",
                    border: "none",
                    background: "none",
                    color: "#4564db",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "800",
                  }}
                >
                  ← {t("Back to Login")}
                </button>

              </div>

            </>
          )}

        </div>

      </div>
    </div></>
  );
}
