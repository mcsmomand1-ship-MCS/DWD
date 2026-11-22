const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

require("dotenv").config();
require("node:dns").setServers(["1.1.1.1", "8.8.8.8"]);

const app =
  express();

/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(
  cors()
);

app.use(
  express.json()
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

/* =====================================================
   UPLOADS
===================================================== */

app.use(
  "/uploads",
  express.static(
    path.join(
      __dirname,
      "uploads"
    )
  )
);

/* =====================================================
   EXISTING ROUTES
   DO NOT REMOVE
===================================================== */

app.use(
  "/api/auth",
  require("./routes/authRoutes")
);

app.use(
  "/api/providers",
  require("./routes/providerRoutes")
);

app.use(
  "/api/admin",
  require("./routes/adminRoutes")
);

/* =====================================================
   NEW SERVICE REQUEST ROUTES
===================================================== */

app.use(
  "/api/service-requests",
  require("./routes/serviceRequestRoutes")
);

app.use(
  "/api/jev",
  require("./routes/jevRoutes")
);

/* =====================================================
   TEST
===================================================== */

app.get(
  "/",
  (_req, res) => {
    res.send(
      "API Backend is running successfully..."
    );
  }
);

/* =====================================================
   MONGODB
   KEEP YOUR EXISTING DATABASE
===================================================== */

const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(
      "Connected to MongoDB Atlas Successfully!"
    );
  })
  .catch((error) => {
    console.error(
      "Database connection error:",
      error.message
    );
  });

/* =====================================================
   SERVER
===================================================== */

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  () => {
    console.log(
      "Backend server is running on http://localhost:" +
        PORT
    );
  }
);

module.exports = app;
