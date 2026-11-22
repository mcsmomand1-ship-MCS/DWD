const express = require("express");

const router = express.Router();

router.post("/analyze", async (req, res) => {
  try {
    const {
      state,
      questions,
      provider,
      session_id,
      user,
    } = req.body;

    if (state === undefined || questions === undefined) {
      return res.status(400).json({
        message: "state and questions are required",
      });
    }

    if (!process.env.JEV_API_KEY) {
      console.error("JEV_API_KEY is missing.");

      return res.status(500).json({
        message: "JEV_API_KEY is not configured.",
      });
    }

    const requestBody = {
      model: "typesafe/jev-1.13",
      state,
      questions,
    };

    if (provider !== undefined) {
      requestBody.provider = provider;
    }

    if (session_id !== undefined) {
      requestBody.session_id = session_id;
    }

    if (user !== undefined) {
      requestBody.user = user;
    }

    const response = await fetch(
      "https://api.defapi.org/api/v1/decisions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.JEV_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Jev API error:", data);

      return res.status(response.status).json(data);
    }

    return res.json(data);
  } catch (error) {
    console.error("Jev route error:", error);

    return res.status(500).json({
      message: "Failed to communicate with Jev API.",
      error: error.message,
    });
  }
});

module.exports = router;