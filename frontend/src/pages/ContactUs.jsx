import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useLanguage } from "../useLanguage";

export default function ContactUs() {
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

      {/* بدنه صفحه تماس با ما */}
      <div style={{ maxWidth: "800px", margin: "40px auto", padding: "30px", backgroundColor: "#ffffff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", boxSizing: "border-box" }}>
        
        <h2 style={{ color: "#0f172a", marginBottom: "15px", fontSize: "24px" }}>
          {isRtl ? "📞 تماس با ما و پشتیبانی" : "📞 Contact Us & Support"}
        </h2>
        
        <p style={{ color: "#64748b", lineHeight: "1.6", marginBottom: "30px" }}>
          {isRtl 
            ? "اگر دربارهٔ استفاده از بازار خدمات محلی پرسشی دارید یا می‌خواهید با گروه پشتیبانی در تماس شوید، از راه‌های زیر با ما ارتباط بگیرید:"
            : "If you have any questions about the local services marketplace or need support, you can reach out to us through the following channels:"}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
          
          {/* کارت ایمیل */}
          <div style={{ padding: "20px", borderRadius: "12px", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#1e293b" }}>{isRtl ? "📧 ایمیل پشتیبانی" : "📧 Support Email"}</h4>
            <a href="mailto:support@localservices.com" style={{ color: "#2563eb", textDecoration: "none", fontWeight: "bold", wordBreak: "break-all" }}>
              support@localservices.com
            </a>
          </div>

          {/* کارت شماره تماس */}
          <div style={{ padding: "20px", borderRadius: "12px", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#1e293b" }}>{isRtl ? "📱 شمارهٔ تماس" : "📱 Phone Number"}</h4>
            <a href="tel:+93700000000" style={{ color: "#0284c7", textDecoration: "none", fontWeight: "bold" }}>
              +93 700 000 000
            </a>
          </div>

          {/* کارت واتساپ */}
          <div style={{ padding: "20px", borderRadius: "12px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#166534" }}>{isRtl ? "💚 واتساپ" : "💚 WhatsApp"}</h4>
            <a 
              href="https://wa.me/93700000000" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: "#16a34a", textDecoration: "none", fontWeight: "bold" }}
            >
              {isRtl ? "گفت‌وگو در واتساپ" : "Chat on WhatsApp"}
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
