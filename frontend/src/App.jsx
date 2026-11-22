import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";

import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderDetails from "./pages/ProviderDetails";

import RequestService from "./pages/RequestService";
import MyRequests from "./pages/MyRequests";

import AdminDashboard from "./pages/AdminDashboard";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import FAQ from "./pages/FAQ";
import { LanguageProvider } from "./LanguageContext";

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
      <Routes>

        {/* HOME */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* AUTH */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}

/>

<Route
  path="/verify-email"
  element={<VerifyEmail />}
/>

{/* PROVIDER */}
<Route
  path="/provider-dashboard"
  element={<ProviderDashboard />}
/>

<Route
  path="/provider/:id"
  element={<ProviderDetails />}
/>

{/* NEW SERVICE REQUEST SYSTEM */}
<Route
  path="/request-service/:providerId"
  element={<RequestService />}
/>

<Route
  path="/my-requests"
  element={<MyRequests />}
/>

{/* ADMIN */}
<Route
  path="/admin"
  element={<AdminDashboard />}
/>

{/* OTHER PAGES */}
<Route
  path="/contact"
  element={<ContactUs />}
/>

<Route
  path="/about"
  element={<AboutUs />}
/>

<Route
  path="/faq"

           element={<FAQ />}
         />

         {/* FALLBACK */}
         <Route
           path="*"
           element={
             <Navigate
               to="/"
               replace
             />
           }
         />

        </Routes>
      </BrowserRouter>
    </LanguageProvider>
    );
}
