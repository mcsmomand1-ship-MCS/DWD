import React from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import "./ServiceCard.css";
import { useLanguage } from "../useLanguage";
import { tr } from "../i18n";

export default function ServiceCard({
  provider,
}) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = (text) => tr(lang, text);

  const providerId =
    provider?._id ||
    provider?.id;

  const checkAuth = (event) => {
    const rawUser =
      localStorage.getItem("userInfo") ||
      localStorage.getItem("user");

    const token =
      localStorage.getItem("token");

    if (!rawUser || !token) {
      event.preventDefault();
      event.stopPropagation();
      navigate("/login");
      return true;
    }

    return false;
  };

  const rating =
    Number(provider?.rating) || 0;

  const reviewCount =
    provider?.reviewCount ||
    provider?.reviews?.length ||
    0;

  const name =
    provider?.user?.name ||
    provider?.name ||
    "Service Provider";

  const email =
    provider?.user?.email ||
    provider?.email ||
    "";

  const skills =
    Array.isArray(provider?.skills)
      ? provider.skills.join(", ")
      : provider?.skills ||
        t("General Services");

  const skillText =
    skills.toLowerCase();

  let serviceImage =
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80";

  if (
    skillText.includes("electric")
  ) {
    serviceImage =
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80";
  } else if (
    skillText.includes("plumb")
  ) {
    serviceImage =
      "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=900&q=80";
  } else if (
    skillText.includes("carpent")
  ) {
    serviceImage =
      "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=900&q=80";
  } else if (
    skillText.includes("paint")
  ) {
    serviceImage =
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=900&q=80";
  }

  const roundedRating =
    Math.min(
      Math.max(
        Math.round(rating),
        0
      ),
      5
    );

  const phone =
    provider?.phone || "";

  const whatsapp =
    provider?.whatsapp || "";

  const location =
    provider?.location ||
      t("Unknown");

  const description =
    provider?.description || "";

  const whatsappNumber =
    whatsapp.replace(
      /[^0-9]/g,
      ""
    );

  return (
    <article className="service-card">

      {/* IMAGE */}
      <div className="card-image-wrapper">

        <img
          src={serviceImage}
          alt={`${name} - ${skills}`}
          className="card-image"
          loading="lazy"
        />

        <div className="image-overlay" />

        {/* FAVORITE */}
        <button
          type="button"
          className="favorite-button"
          aria-label={t("Favorite")}
          onClick={(event) => {
            if (checkAuth(event)) {
              return;
            }

            event.stopPropagation();
          }}
        >
          ♡
        </button>

        {/* RATING */}
        <div className="rating-badge">
          <span className="rating-star">
            ★
          </span>

          <strong>
            {reviewCount > 0
              ? rating.toFixed(1)
              : t("New")}
          </strong>

          {reviewCount > 0 && (
            <small>
              ({reviewCount} {t("reviews")})
            </small>
          )}
        </div>

        <div className="service-type-badge">
          {t("Professional Service")}
        </div>

      </div>

      {/* BODY */}
      <div className="card-body">

        {/* PROVIDER TITLE */}
        <div className="provider-title-row">

          <div className="provider-avatar-card">
            {name
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="provider-title">
            <h3>{name}</h3>

            <div className="stars-row">
              <span
                className="stars"
                aria-label={`Rating ${rating} out of 5`}
              >
                {"★".repeat(
                  roundedRating
                )}

                <span className="empty-stars">
                  {"★".repeat(
                    5 - roundedRating
                  )}
                </span>
              </span>

              <span className="rating-text">
                {reviewCount > 0
                  ? `${rating.toFixed(
                      1
                    )} (${reviewCount})`
                  : t("No reviews")}
              </span>
            </div>
          </div>
        </div>

        <div className="card-divider" />

        {/* INFORMATION */}
        <div className="card-info">

          {email && (
            <div className="info-row">
              <span className="info-icon">
                ✉
              </span>

              <span className="info-content">
                <strong>{t("Email")}</strong>

                <span className="ltr-value">
                  {email}
                </span>
              </span>
            </div>
          )}

          <div className="info-row">
            <span className="info-icon">
              🛠
            </span>

            <span className="info-content">
              <strong>{t("Skills")}</strong>
              <span>{skills}</span>
            </span>
          </div>

          <div className="info-row">
            <span className="info-icon location-icon">
              ●
            </span>

            <span className="info-content">
              <strong>{t("Location")}</strong>
              <span>{location}</span>
            </span>
          </div>

          {phone && (
            <div className="info-row">
              <span className="info-icon phone-icon">
                ☎
              </span>

              <span className="info-content">
                <strong>{t("Phone")}</strong>

                <span className="ltr-value">
                  {phone}
                </span>
              </span>
            </div>
          )}

          {whatsapp && (
            <div className="info-row">
              <span className="info-icon whatsapp-icon">
                ◉
              </span>

              <span className="info-content">
                <strong>{t("WhatsApp")}</strong>

                <span className="ltr-value">
                  {whatsapp}
                </span>
              </span>
            </div>
          )}

        </div>

        {/* DESCRIPTION */}
        {description && (
          <div className="description-box">
            <div className="description-title">
              <span>
                {t("About the provider")}
              </span>
            </div>

            <p>
              {description}
            </p>
          </div>
        )}

        {/* CONTACT */}
        <div className="card-actions">

          {phone ? (
            <a
              href={`tel:${phone}`}
              className="call-button"
              onClick={(event) => {
                if (
                  checkAuth(event)
                ) {
                  return;
                }

                event.stopPropagation();
              }}
            >
              <span className="action-icon">
                ☎
              </span>

              <span>
                {t("Call")}
              </span>
            </a>
          ) : (
            <span />
          )}

          {whatsapp ? (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="whatsapp-button"
              onClick={(event) => {
                if (
                  checkAuth(event)
                ) {
                  return;
                }

                event.stopPropagation();
              }}
            >
              <span className="action-icon">
                ◉
              </span>

              <span>
                {t("WhatsApp")}
              </span>
            </a>
          ) : (
            <span />
          )}

        </div>

        {/* NEW REQUEST SERVICE BUTTON */}
        <Link
          to={`/request-service/${providerId}`}
          className="details-button"
          style={{
            marginTop: "8px",
            background:
              "linear-gradient(135deg, #2563eb, #4f46e5)",
          }}
          onClick={checkAuth}
        >
          <span>
            🔵 {t("Request Service")}
          </span>

          <span>
            →
          </span>
        </Link>

        {/* PROVIDER DETAILS */}
        <Link
          to={`/provider/${providerId}`}
          className="details-button"
          onClick={checkAuth}
        >
          <span className="details-button-text">
            {t("View Full Details")}
          </span>

          <span className="details-arrow">
            →
          </span>
        </Link>

      </div>
    </article>
  );
}
