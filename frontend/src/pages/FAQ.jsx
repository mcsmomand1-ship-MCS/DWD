import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useLanguage } from "../useLanguage";

export default function FAQ() {
  const { lang, setLang } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("userInfo") || localStorage.getItem("user");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        const userData = parsed.user || parsed;
        setCurrentUser(userData);
        if (userData.role === "admin" || userData.isAdmin) {
          setIsAdmin(true);
        }
      }
    } catch (e) {
      console.error("Error reading user info", e);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setCurrentUser(null);
    setIsAdmin(false);
    window.location.href = "/login";
  };

  const isRtl = lang === "fa";

  const faqs = [
    {
      qFa: "چگونه به‌عنوان ارائه‌دهندهٔ خدمات ثبت‌نام کنم؟",
      qEn: "How can I register as a service provider?",
      aFa: "ثبت‌نام و مدیریت حساب ارائه‌دهندهٔ خدمات دو مرحله دارد: ۱. ثبت‌نام نخستین: در صفحهٔ ثبت‌نام نقش ارائه‌دهندهٔ خدمات را انتخاب کنید، جزئیات حرفه‌ای را وارد نمایید و به پنل خود دسترسی بگیرید. ۲. به‌روزرسانی پس از ورود: از پنل ارائه‌دهنده می‌توانید اطلاعات و حرفه‌های خود را ویرایش یا تکمیل کنید.",
      aEn: `In the Local Services Marketplace system, the registration and management process for service providers (experts) is designed with a flexible, dual-approach workflow to ensure an optimal user experience:

Initial Registration (Pre-Login): New users can create an account prior to entering the platform by navigating to the registration page and setting their user role to either "Service Provider" or "Customer". In this flow, providers can immediately input their professional details—such as skills, phone number, WhatsApp, and location—allowing them to access their dedicated dashboard right away.

Post-Login Management (Via Dashboard): Furthermore, if a user wishes to update, edit, or complete their service provider profile after logging into the system, the internal Provider Dashboard enables seamless management and modification of their credentials. This dual approach significantly enhances system flexibility and user convenience.`
    },
    {
      qFa: "چگونه با ارائه‌دهندگان خدمات تماس بگیرم؟",
      qEn: "How do I contact service providers?",
      aFa: "در صفحهٔ خانه و کارت هر ارائه‌دهنده، دکمه‌های تماس تلفنی، گفت‌وگو در واتساپ و دیدن جزئیات بیشتر در دسترس است.",
      aEn: "On the home page and in each provider's card, there are direct buttons for phone calls, chatting on WhatsApp, and viewing full details."
    },
    {
      qFa: "آیا استفاده از این پلتفرم رایگان است؟",
      qEn: "Is using this platform free?",
      aFa: "بله، جستجوی متخصصان و دیدن خدمات برای همهٔ کاربران رایگان است.",
      aEn: "Yes, searching for providers and viewing services is completely free for all users."
    },
    {
      qFa: "مدیران سیستم چه دسترسی‌هایی دارند؟",
      qEn: "What access do system administrators have?",
      aFa: "مدیران از پنل مدیریت می‌توانند کاربران، خدمات و اطلاعات سامانه را بررسی و اداره کنند.",
      aEn: "Administrators have access to the Admin Dashboard, through which they can oversee and manage users, services, and overall system data."
    }
  ];

  return (
    <div style={{ direction: isRtl ? "rtl" : "ltr", textAlign: isRtl ? "right" : "left", fontFamily: "Tahoma, sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh", width: "100%", margin: 0, padding: 0 }}>
      
      {/* نوبار مشترک سایت */}
      <Navbar 
        lang={lang} 
        setLang={setLang} 
        currentUser={currentUser} 
        isAdmin={isAdmin} 
        handleLogout={handleLogout} 
      />

      {/* بدنه صفحه سوالات متداول */}
      <div style={{ maxWidth: "850px", margin: "40px auto", padding: "35px", backgroundColor: "#ffffff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", boxSizing: "border-box" }}>
        
        <h2 style={{ color: "#0f172a", marginBottom: "10px", fontSize: "26px" }}>
          {isRtl ? "❓ سوالات متداول (FAQ)" : "❓ Frequently Asked Questions"}
        </h2>
        
        <p style={{ color: "#64748b", lineHeight: "1.6", marginBottom: "30px", fontSize: "15px" }}>
          {isRtl 
            ? "در اینجا پاسخ به پرسش‌های رایج کاربران در خصوص نحوه استفاده از بازارچه خدمات محلی آورده شده است:" 
            : "Here are answers to common user questions regarding how to use the local services marketplace:"}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {faqs.map((item, index) => (
            <div key={index} style={{ padding: "20px", borderRadius: "12px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "17px" }}>
                {isRtl ? item.qFa : item.qEn}
              </h4>
              <p style={{ margin: 0, color: "#64748b", lineHeight: "1.6", fontSize: "14px", whiteSpace: "pre-line" }}>
                {isRtl ? item.aFa : item.aEn}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
