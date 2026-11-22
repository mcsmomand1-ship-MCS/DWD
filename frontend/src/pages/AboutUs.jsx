import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useLanguage } from "../useLanguage";

export default function AboutUs() {
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

      {/* بدنه صفحه درباره ما */}
      <div style={{ maxWidth: "850px", margin: "40px auto", padding: "35px", backgroundColor: "#ffffff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", boxSizing: "border-box" }}>
        
        <h2 style={{ color: "#0f172a", marginBottom: "15px", fontSize: "26px" }}>
          {isRtl ? "ℹ️ دربارهٔ بازار خدمات محلی" : "ℹ️ About Local Services Marketplace"}
        </h2>
        
        <p style={{ color: "#64748b", lineHeight: "1.8", marginBottom: "25px", fontSize: "16px" }}>
          {isRtl 
            ? "بازار خدمات محلی (Local Services Marketplace) یک سامانهٔ جامع وب است که برای پیوند سریع و مطمئن مشتریان با متخصصان و ارائه‌دهندگان خدمات فنی محلی، مانند برق‌کار، نلدوان، نجار، نقاش و تعمیرکار، ساخته شده است."
            : "The Local Services Marketplace is a comprehensive web platform designed to seamlessly connect users with local technical service providers (such as electricians, plumbers, carpenters, painters, and repair technicians)."}
        </p>

        <h3 style={{ color: "#1e293b", fontSize: "20px", marginTop: "30px", marginBottom: "12px" }}>
          {isRtl ? "🎯 هدف پروژه" : "🎯 Project Goals"}
        </h3>
        <p style={{ color: "#64748b", lineHeight: "1.8", marginBottom: "20px" }}>
          {isRtl 
            ? "هدف این سامانه ایجاد راه ارتباطی روشن، کوتاه‌ساختن زمان پیدا کردن متخصصان قابل اعتماد، فراهم‌کردن ابزار مدیریت خدمات برای ارائه‌دهندگان و نظارت کامل برای مدیران است."
            : "The main goal of this system is to establish a transparent communication bridge, reduce search time for finding trusted professionals, and provide service management capabilities for providers and full supervision for administrators."}
        </p>

        <h3 style={{ color: "#1e293b", fontSize: "20px", marginTop: "30px", marginBottom: "12px" }}>
          {isRtl ? "⭐ ویژگی‌های مهم سامانه" : "⭐ Key System Features"}
        </h3>
        <ul style={{ color: "#64748b", lineHeight: "1.8", paddingRight: isRtl ? "20px" : "0", paddingLeft: isRtl ? "0" : "20px" }}>
          <li>{isRtl ? "ثبت‌نام و احراز هویت کاربران و متخصصان" : "User & Provider Registration and Authentication"}</li>
          <li>{isRtl ? "جستجوی پیشرفته خدمات و فیلتر بر اساس دسته‌بندی‌ها" : "Advanced Service Search & Category Filtering"}</li>
          <li>{isRtl ? "پنل ویژهٔ ارائه‌دهندگان برای مدیریت خدمات" : "Dedicated Provider Panel to Manage Services"}</li>
          <li>{isRtl ? "پنل مدیریت جامع (Admin Dashboard) برای نظارت بر کل پلتفرم" : "Comprehensive Admin Dashboard to Oversee the Platform"}</li>
          <li>{isRtl ? "پشتیبانی از دو زبان دری و انگلیسی" : "Full Dual-Language Support (Persian & English)"}</li>
        </ul>

      </div>
    </div>
  );
}
