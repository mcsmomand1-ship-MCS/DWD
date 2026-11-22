import React, {
  useState,
  useEffect,
} from "react";

import {
  useParams,
  Link,
} from "react-router-dom";

import axios from "axios";
import Navbar from "../components/Navbar";
import "./ProviderDetails.css";
import { useLanguage } from "../useLanguage";
import { tr } from "../i18n";

export default function ProviderDetails() {
  const { lang, setLang } = useLanguage();
  const t = (text) => tr(lang, text);
  const { id } = useParams();

  const [provider, setProvider] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  /* REVIEW */
  const [feedback, setFeedback] =
    useState({
      name: "",
      comment: "",
      rating: "5",
    });

  /* REPORT */
  const [reportForm, setReportForm] =
    useState({
      complainantName: "",
      complainantEmail: "",
      reason:
        "Inappropriate behavior",
      description: "",
      evidenceFile: null,
    });

  /* =========================================
     FETCH PROVIDER DETAILS
  ========================================== */
  const fetchProviderDetails =
    async () => {
      try {
        const response =
          await axios.get(
            `/api/providers/${id}`
          );

        setProvider(
          response.data
        );
      } catch (error) {
        console.error(
          "Error fetching information:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchProviderDetails();
  }, [id]);

  /* =========================================
     REVIEW SUBMIT
  ========================================== */
  const handleFeedbackSubmit =
    async (event) => {
      event.preventDefault();

      try {
        const response =
          await axios.post(
            "/api/providers/review",
            {
              providerId: id,
              rating: Number(
                feedback.rating
              ),
              comment:
                feedback.comment,
              userName:
                feedback.name,
            }
          );

        if (
          response.status === 200
        ) {
          alert(t("Your review has been successfully submitted!"));

          setFeedback({
            name: "",
            comment: "",
            rating: "5",
          });

          fetchProviderDetails();
        }
      } catch (error) {
        console.error(
          "Error submitting review:",
          error
        );

        alert(t("Error submitting review, please try again."));
      }
    };

  /* =========================================
     REPORT SUBMIT
  ========================================== */
  const handleReportSubmit =
    async (event) => {
      event.preventDefault();

      const formData =
        new FormData();

      formData.append(
        "providerId",
        id
      );

      formData.append(
        "complainantName",
        reportForm.complainantName
      );

      formData.append(
        "complainantEmail",
        reportForm.complainantEmail
      );

      formData.append(
        "reason",
        reportForm.reason
      );

      formData.append(
        "description",
        reportForm.description
      );

      if (
        reportForm.evidenceFile
      ) {
        formData.append(
          "evidenceFile",
          reportForm.evidenceFile
        );
      }

      try {
        const response =
          await axios.post(
            "/api/providers/report",
            formData,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );

        if (
          response.status === 201
        ) {
          alert(t("Violation report with evidence successfully sent to the admin panel for review."));

          setReportForm({
            complainantName: "",
            complainantEmail: "",
            reason:
              "Inappropriate behavior",
            description: "",
            evidenceFile: null,
          });
        }
      } catch (error) {
        console.error(
          "Error submitting complaint:",
          error
        );

        alert(t("Error submitting complaint, please check all fields."));
      }
    };

  /* =========================================
     LOADING STATE
  ========================================== */
  if (loading) {
    return (
      <><Navbar lang={lang} setLang={setLang} /><div className="provider-page">
        <div className="provider-container loading-state">
          {t("Loading information...")}
        </div>
      </div></>
    );
  }

  /* =========================================
     PROVIDER NOT FOUND
  ========================================== */
  if (!provider) {
    return (
      <><Navbar lang={lang} setLang={setLang} /><div className="provider-page">
        <div className="provider-container loading-state">
          {t("Provider not found.")}
        </div>
      </div></>
    );
  }

  /* =========================================
     PROVIDER DATA
  ========================================== */
  const reviews =
    Array.isArray(provider.reviews)
      ? provider.reviews
      : [];

  const providerId =
    provider._id || id;

  /*
   * IMPORTANT:
   * Do not use `provider.rating || 5`
   * because a provider with no reviews
   * should not automatically receive a
   * fake 5-star rating.
   */
  const hasReviews =
    reviews.length > 0 ||
    Number(provider.reviewCount) > 0;

  const reviewCount =
    Number.isFinite(
      Number(provider.reviewCount)
    )
      ? Number(provider.reviewCount)
      : reviews.length;

  const ratingValue =
    Number.isFinite(
      Number(provider.rating)
    ) && Number(provider.rating) > 0
      ? Number(provider.rating)
      : 0;

  const formattedRating =
    ratingValue > 0
      ? ratingValue.toFixed(1).replace(
          ".0",
          ""
        )
      : null;

  return (
    <><Navbar lang={lang} setLang={setLang} /><div className="provider-page" dir={lang === "fa" ? "rtl" : "ltr"}>

      <div className="provider-container">

        {/* =========================================
            BACK
        ========================================== */}
        <div className="provider-back-row">
        <Link
          to="/"
          className="back-link"
        >
          {lang === "fa" ? "⌂ بازگشت به خانه" : "⌂ Back to Home"}
        </Link>
        </div>

        {/* =========================================
            PROVIDER CARD
        ========================================== */}
        <div className="provider-card">

          <div className="provider-header">

            {/* PROVIDER TITLE */}
            <div>
              <h1 className="provider-title">
                {provider.user?.name ||
                  provider.name}
              </h1>

              <div className="provider-subtitle">
                {t("Professional Service Provider")}
              </div>
            </div>

            {/* =====================================
                PROVIDER RATING

                This element intentionally stays in
                normal document flow.

                No fixed / absolute positioning.
                This prevents the rating from becoming
                a full-width floating bar when the
                viewport or browser zoom changes.
            ====================================== */}
            <div
              className="rating-badge provider-rating-badge"
              style={{
                position: "static",
                display: "inline-flex",
                width: "fit-content",
                maxWidth: "100%",
                minWidth: "0",
                flex: "0 0 auto",
                boxSizing: "border-box",
                whiteSpace: "nowrap",
                alignSelf: "center",
                overflow: "hidden",
              }}
            >
              {hasReviews ? (
                <>
                  <span>
                    ⭐ {formattedRating}
                  </span>

                  <span>
                    (
                    {reviewCount}{" "}
                    {reviewCount === 1
                      ? t("review")
                      : t("reviews")}
                    )
                  </span>
                </>
              ) : (
                <>
                  <span>
                    ⭐
                  </span>

                  <span>
                    {t("No reviews yet")}
                  </span>
                </>
              )}
            </div>

          </div>

          {/* =========================================
              INFORMATION
          ========================================== */}
          <div className="provider-info-grid">

            <div className="info-item">
              <span className="info-label">
                {t("Email")}
              </span>

              <span className="info-value">
                {provider.user?.email ||
                  provider.email ||
                  t("Not provided")}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">
                {t("Phone Number")}
              </span>

              <span className="info-value">
                {provider.phone ||
                  t("Not provided")}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">
                {t("WhatsApp")}
              </span>

              <span className="info-value">
                {provider.whatsapp ||
                  t("Not provided")}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">
                {t("Location")}
              </span>

              <span className="info-value">
                {provider.location ||
                    t("Unknown")}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">
                {t("Skills")}
              </span>

              <span className="info-value">
                {Array.isArray(
                  provider.skills
                )
                  ? provider.skills.join(
                      ", "
                    )
                  : provider.skills ||
                    t("Not provided")}
              </span>
            </div>

          </div>

          {/* =========================================
              DESCRIPTION
          ========================================== */}
          <div className="description-card">

            <h3 className="description-title">
              {t("Background & Full Description")}
            </h3>

            <p className="description-text">
              {provider.description ||
                t("No description provided.")}
            </p>

          </div>

          {/* =========================================
              CONTACT
          ========================================== */}
          <div className="contact-actions">

            {provider.phone && (
              <a
                href={`tel:${provider.phone}`}
                className="contact-button phone-button"
              >
                {t("Direct Phone Call")}
              </a>
            )}

            {provider.whatsapp && (
              <a
                href={`https://wa.me/${provider.whatsapp.replace(
                  /[^0-9]/g,
                  ""
                )}`}
                target="_blank"
                rel="noreferrer"
                className="contact-button whatsapp-button"
              >
                ◉ {t("Chat on WhatsApp")}
              </a>
            )}

          </div>

          {/* =========================================
              NEW SERVICE REQUEST
          ========================================== */}
          <Link
            to={`/request-service/${providerId}`}
            className="primary-button"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
              textDecoration:
                "none",
              marginTop: "14px",
              background:
                "linear-gradient(135deg, #2563eb, #4f46e5)",
            }}
          >
            🔵 {t("Request Service")}
          </Link>

        </div>

        {/* =========================================
            DIVIDER
        ========================================== */}
        <hr className="section-divider" />

        {/* =========================================
            REVIEWS + LEAVE REVIEW
        ========================================== */}
        <div className="feedback-layout">

          {/* =====================================
              USER REVIEWS
          ====================================== */}
          <section className="section-card">

            <div className="section-heading">

              <h3>
                {t("User Reviews")}
              </h3>

              <span>
                {reviews.length}{" "}
                {reviews.length === 1 ? t("review") : t("reviews")}
              </span>

            </div>

            {reviews.length > 0 ? (
              <div className="review-list">

                {reviews.map(
                  (review, index) => (
                    <div
                      key={
                        review._id ||
                        index
                      }
                      className="review-item"
                    >

                      <div className="review-top">

                        <span className="review-user">
                          {review.user ||
                            review.userName ||
                            t("Guest User")}
                        </span>

                        <span className="review-rating">
                          ⭐{" "}
                          {review.rating}
                        </span>

                      </div>

                      <p className="review-comment">
                        {review.comment}
                      </p>

                    </div>
                  )
                )}

              </div>
            ) : (
              <div className="empty-reviews">

                {t("No reviews have been submitted for this specialist yet.")}

                <br />

                {t("Be the first to leave a review!")}

              </div>
            )}

          </section>

          {/* =====================================
              REVIEW FORM
          ====================================== */}
          <section className="section-card">

            <div className="section-heading">

              <h3>
                {t("Leave a Review & Rating")}
              </h3>

            </div>

            <form
              onSubmit={
                handleFeedbackSubmit
              }
              className="form-stack"
            >

              {/* NAME */}
              <div className="form-group">

                <label>
                  {t("Your Name")}
                </label>

                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder={t("Enter your name")}
                  value={
                    feedback.name
                  }
                  onChange={(event) =>
                    setFeedback({
                      ...feedback,
                      name:
                        event.target.value,
                    })
                  }
                />

              </div>

              {/* RATING */}
              <div className="form-group">

                <label>
                  {t("Rating")}
                </label>

                <select
                  className="form-select"
                  value={
                    feedback.rating
                  }
                  onChange={(event) =>
                    setFeedback({
                      ...feedback,
                      rating:
                        event.target.value,
                    })
                  }
                >

                  <option value="5">
                    ⭐⭐⭐⭐⭐ ({t("Excellent")})
                  </option>

                  <option value="4">
                    ⭐⭐⭐⭐ ({t("Good")})
                  </option>

                  <option value="3">
                    ⭐⭐⭐ ({t("Average")})
                  </option>

                  <option value="2">
                    ⭐⭐ ({t("Poor")})
                  </option>

                  <option value="1">
                    ⭐ ({t("Very Poor")})
                  </option>

                </select>

              </div>

              {/* COMMENT */}
              <div className="form-group">

                <label>
                  {t("Comment")}
                </label>

                <textarea
                  required
                  rows="4"
                  className="form-textarea"
                  placeholder={t("Tell us about your experience...")}
                  value={
                    feedback.comment
                  }
                  onChange={(event) =>
                    setFeedback({
                      ...feedback,
                      comment:
                        event.target.value,
                    })
                  }
                />

              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                className="primary-button"
              >
                {t("Submit Review")}
              </button>

            </form>

          </section>

        </div>

        {/* =========================================
            REPORT
        ========================================== */}
        <section className="report-card">

          {/* REPORT HEADER */}
          <div className="report-header">

            <div className="report-icon">
              ⚠
            </div>

            <div>

              <h3 className="report-title">
                {t("Report Violation & File a Complaint")}
              </h3>

              <p className="report-description">
                {t("For legal reference and a more thorough review by the admin, please provide accurate details and upload visual or video evidence when available.")}
              </p>

            </div>

          </div>

          {/* REPORT FORM */}
          <form
            onSubmit={
              handleReportSubmit
            }
            className="form-stack"
          >

            <div className="report-grid">

              {/* =================================
                  COMPLAINANT NAME
              ================================== */}
              <div className="form-group">

                <label>
                  {t("Your Full Name (Complainant)")}
                </label>

                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder={t("e.g., John Doe")}
                  value={
                    reportForm.complainantName
                  }
                  onChange={(event) =>
                    setReportForm({
                      ...reportForm,
                      complainantName:
                        event.target.value,
                    })
                  }
                />

              </div>

              {/* =================================
                  COMPLAINANT EMAIL
              ================================== */}
              <div className="form-group">

                <label>
                  {t("Your Email (Complainant)")}
                </label>

                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="example@gmail.com"
                  value={
                    reportForm.complainantEmail
                  }
                  onChange={(event) =>
                    setReportForm({
                      ...reportForm,
                      complainantEmail:
                        event.target.value,
                    })
                  }
                />

              </div>

              {/* =================================
                  REASON
              ================================== */}
              <div className="form-group">

                <label>
                  {t("Reason for Violation")}
                </label>

                <select
                  className="form-select"
                  value={
                    reportForm.reason
                  }
                  onChange={(event) =>
                    setReportForm({
                      ...reportForm,
                      reason:
                        event.target.value,
                    })
                  }
                >

                  <option value="Inappropriate behavior">
                    {t("Inappropriate behavior towards customer")}
                  </option>

                  <option value="Late arrival">
                    {t("Late arrival and unreliability")}
                  </option>

                  <option value="Poor work quality">
                    {t("Poor work quality or failure to complete tasks")}
                  </option>

                  <option value="Financial fraud">
                    {t("Financial fraud or requesting extra charges")}
                  </option>

                  <option value="Other violations">
                    {t("Other issues")}
                  </option>

                </select>

              </div>

              {/* =================================
                  UPLOAD EVIDENCE
              ================================== */}
              <div className="form-group">

                <label>
                  {t("Upload Evidence")}
                </label>

                <input
                  type="file"
                  className="file-upload"
                  accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov,image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                  onChange={(event) =>
                    setReportForm({
                      ...reportForm,
                      evidenceFile:
                        event.target.files?.[0] ||
                        null,
                    })
                  }
                />

                <small className="file-help">
                  {t("Allowed formats:")} JPG, PNG, WEBP, GIF, MP4, WEBM or MOV (10 MB)
                </small>

              </div>

              {/* =================================
                  DESCRIPTION
              ================================== */}
              <div className="form-group report-full">

                <label>
                  {t("Additional Complaint Description")}
                </label>

                <textarea
                  required
                  rows="5"
                  className="form-textarea"
                  placeholder={t("Describe the incident and violation details...")}
                  value={
                    reportForm.description
                  }
                  onChange={(event) =>
                    setReportForm({
                      ...reportForm,
                      description:
                        event.target.value,
                    })
                  }
                />

              </div>

              {/* =================================
                  SUBMIT REPORT
              ================================== */}
              <div className="report-full">

                <button
                  type="submit"
                  className="report-button"
                >
                  {t("Submit Violation Report with Evidence to Admin")}
                  to Admin
                </button>

              </div>

            </div>

          </form>

        </section>

      </div>

    </div></>
  );
}
