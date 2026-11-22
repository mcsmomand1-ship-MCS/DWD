const express = require("express");

const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const User = require("../models/User");
const ProviderProfile = require("../models/ProviderProfile");

// ======================================================
// ENVIRONMENT CHECK
// ======================================================

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn(
    "⚠️ EMAIL_USER or EMAIL_PASS is missing from .env"
  );
}

if (!process.env.JWT_SECRET) {
  console.warn(
    "⚠️ JWT_SECRET is missing from .env"
  );
}

// ======================================================
// EMAIL TRANSPORTER
// ======================================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ======================================================
// HELPER: CREATE JWT
// ======================================================

const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
};

// ======================================================
// HELPER: CREATE VERIFICATION CODE
// ======================================================

const generateVerificationCode = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// ======================================================
// HELPER: CREATE RESET CODE
// ======================================================

const generateResetCode = () => {
  return crypto.randomInt(10000, 100000).toString();
};

// ======================================================
// HELPER: SEND VERIFICATION EMAIL
// ======================================================

const sendVerificationEmail = async (user, code) => {
  const mailOptions = {
    from: `"Service Platform" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Verify Your Email Address",

    text: `
Hello ${user.name || "User"},

Thank you for registering.

Your email verification code is:

${code}

This code will expire in 10 minutes.

If you did not create this account, you can safely ignore this email.

Service Platform
    `.trim(),
  };

  await transporter.sendMail(mailOptions);
};

// ======================================================
// 1. REGISTER
// ======================================================

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      skills,
      phone,
      whatsapp,
      location,
      description,
    } = req.body;

    // --------------------------------------------------
    // BASIC VALIDATION
    // --------------------------------------------------

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const targetRole = role || "provider";

    // --------------------------------------------------
    // PASSWORD VALIDATION
    // --------------------------------------------------

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
    }

    // --------------------------------------------------
    // EMAIL FORMAT VALIDATION
    // --------------------------------------------------

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    // --------------------------------------------------
    // VALIDATE ROLE
    // --------------------------------------------------

    if (!["customer", "provider"].includes(targetRole)) {
      return res.status(400).json({
        message: "Invalid registration role.",
      });
    }

    // --------------------------------------------------
    // CHECK EXISTING USER
    // --------------------------------------------------

    let user = await User.findOne({
      email: normalizedEmail,
    });

    // ==================================================
    // EXISTING USER
    // ==================================================

    if (user) {
      // ------------------------------------------------
      // EXISTING UNVERIFIED USER
      // ------------------------------------------------

      if (!user.isVerified) {
        const verificationCode =
          generateVerificationCode();

        user.verificationCode =
          verificationCode;

        user.verificationCodeExpires =
          new Date(Date.now() + 10 * 60 * 1000);

        // Update name if supplied
        if (name) {
          user.name = name;
        }

        // ----------------------------------------------
        // If upgrading customer -> provider
        // ----------------------------------------------

        if (
          user.role === "customer" &&
          targetRole === "provider"
        ) {
          user.role = "provider";

          if (password) {
            const salt = await bcrypt.genSalt(10);

            user.password =
              await bcrypt.hash(
                password,
                salt
              );
          }
        }

        await user.save();

        // ----------------------------------------------
        // Provider profile
        // ----------------------------------------------

        if (user.role === "provider") {
          let formattedSkills = [];

          if (Array.isArray(skills)) {
            formattedSkills = skills;
          } else if (
            typeof skills === "string" &&
            skills.trim() !== ""
          ) {
            formattedSkills = skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          }

          let providerProfile =
            await ProviderProfile.findOne({
              user: user._id,
            });

          if (!providerProfile) {
            providerProfile =
              new ProviderProfile({
                user: user._id,
                skills: formattedSkills,
                phone,
                whatsapp,
                location,
                description,
              });
          } else {
            providerProfile.skills =
              formattedSkills;

            if (phone) {
              providerProfile.phone = phone;
            }

            if (whatsapp) {
              providerProfile.whatsapp =
                whatsapp;
            }

            if (location) {
              providerProfile.location =
                location;
            }

            if (description) {
              providerProfile.description =
                description;
            }
          }

          await providerProfile.save();
        }

        // ----------------------------------------------
        // Send verification email
        // ----------------------------------------------

        try {
          await sendVerificationEmail(
            user,
            verificationCode
          );
        } catch (mailError) {
          console.error(
            "Verification email error:",
            mailError.message
          );

          return res.status(500).json({
            message:
              "The account was created, but the verification email could not be sent. Please try again.",
          });
        }

        return res.status(200).json({
          message:
            "This email is registered but not verified. A new verification code has been sent to your email.",

          requiresVerification: true,

          email: user.email,
        });
      }

      // ------------------------------------------------
      // EXISTING VERIFIED CUSTOMER -> PROVIDER
      // ------------------------------------------------

      if (
        user.role === "customer" &&
        targetRole === "provider"
      ) {
        user.role = "provider";

        if (name) {
          user.name = name;
        }

        if (password) {
          const salt =
            await bcrypt.genSalt(10);

          user.password =
            await bcrypt.hash(
              password,
              salt
            );
        }

        await user.save();

        // ----------------------------------------------
        // Provider profile
        // ----------------------------------------------

        let formattedSkills = [];

        if (Array.isArray(skills)) {
          formattedSkills = skills;
        } else if (
          typeof skills === "string" &&
          skills.trim() !== ""
        ) {
          formattedSkills = skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }

        let providerProfile =
          await ProviderProfile.findOne({
            user: user._id,
          });

        if (!providerProfile) {
          providerProfile =
            new ProviderProfile({
              user: user._id,
              skills: formattedSkills,
              phone,
              whatsapp,
              location,
              description,
            });
        } else {
          providerProfile.skills =
            formattedSkills;

          if (phone) {
            providerProfile.phone = phone;
          }

          if (whatsapp) {
            providerProfile.whatsapp =
              whatsapp;
          }

          if (location) {
            providerProfile.location =
              location;
          }

          if (description) {
            providerProfile.description =
              description;
          }
        }

        await providerProfile.save();

        // ----------------------------------------------
        // User is already verified
        // ----------------------------------------------

        const token = createToken(user);

        return res.status(200).json({
          message:
            "Your account has been successfully upgraded to a service provider.",

          token,

          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
          },
        });
      }

      // ------------------------------------------------
      // ANY OTHER EXISTING USER
      // ------------------------------------------------

      return res.status(400).json({
        message: "This email is already registered.",
      });
    }

    // ==================================================
    // NEW USER
    // ==================================================

    const salt = await bcrypt.genSalt(10);

    const hashedPassword =
      await bcrypt.hash(
        password,
        salt
      );

    const verificationCode =
      generateVerificationCode();

    user = new User({
      name: name.trim(),

      email: normalizedEmail,

      password: hashedPassword,

      role: targetRole,

      isVerified: false,

      verificationCode,

      verificationCodeExpires:
        new Date(
          Date.now() + 10 * 60 * 1000
        ),
    });

    await user.save();

    // ==================================================
    // CREATE PROVIDER PROFILE
    // ==================================================

    if (user.role === "provider") {
      let formattedSkills = [];

      if (Array.isArray(skills)) {
        formattedSkills = skills;
      } else if (
        typeof skills === "string" &&
        skills.trim() !== ""
      ) {
        formattedSkills = skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const providerProfile =
        new ProviderProfile({
          user: user._id,
          skills: formattedSkills,
          phone,
          whatsapp,
          location,
          description,
        });

      await providerProfile.save();
    }

    // ==================================================
    // SEND VERIFICATION EMAIL
    // ==================================================

    try {
      await sendVerificationEmail(
        user,
        verificationCode
      );
    } catch (mailError) {
      console.error(
        "Verification email error:",
        mailError.message
      );

      await ProviderProfile.deleteOne({
        user: user._id,
      });

      await User.deleteOne({
        _id: user._id,
      });

      return res.status(500).json({
        message:
          "Registration failed because the verification email could not be sent. Please check the email configuration and try again.",
      });
    }

    // ==================================================
    // DO NOT CREATE JWT BEFORE VERIFICATION
    // ==================================================

    return res.status(201).json({
      message:
        "Registration successful. Please check your email and enter the verification code.",

      requiresVerification: true,

      email: user.email,
    });
  } catch (err) {
    console.error(
      "REGISTER ERROR:",
      err
    );

    if (err.code === 11000) {
      return res.status(400).json({
        message:
          "This email is already registered.",
      });
    }

    return res.status(500).json({
      message:
        "Server error: " + err.message,
    });
  }
});

// ======================================================
// 2. VERIFY EMAIL
// ======================================================

router.post(
  "/verify-email",
  async (req, res) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({
          message:
            "Email and verification code are required.",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const normalizedCode =
        String(code).trim();

      const user =
        await User.findOne({
          email: normalizedEmail,
        });

      if (!user) {
        return res.status(400).json({
          message:
            "Invalid verification request.",
        });
      }

      // ------------------------------------------------
      // ALREADY VERIFIED
      // ------------------------------------------------

      if (user.isVerified) {
        const token =
          createToken(user);

        return res.status(200).json({
          message:
            "Your email is already verified.",

          token,

          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: true,
          },
        });
      }

      // ------------------------------------------------
      // CHECK CODE
      // ------------------------------------------------

      if (
        user.verificationCode !==
        normalizedCode
      ) {
        return res.status(400).json({
          message:
            "Invalid verification code.",
        });
      }

      // ------------------------------------------------
      // CHECK EXPIRATION
      // ------------------------------------------------

      if (
        !user.verificationCodeExpires ||
        user.verificationCodeExpires.getTime() <
          Date.now()
      ) {
        return res.status(400).json({
          message:
            "Verification code has expired. Please request a new code.",
        });
      }

      // ==================================================
      // VERIFY USER
      // ==================================================

      user.isVerified = true;

      user.verificationCode =
        undefined;

      user.verificationCodeExpires =
        undefined;

      await user.save();

      // ==================================================
      // CREATE JWT ONLY AFTER VERIFICATION
      // ==================================================

      const token =
        createToken(user);

      return res.status(200).json({
        message:
          "Email verified successfully. Your account is now active.",

        token,

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: true,
        },
      });
    } catch (err) {
      console.error(
        "VERIFY EMAIL ERROR:",
        err
      );

      return res.status(500).json({
        message:
          "Server error: " + err.message,
      });
    }
  }
);

// ======================================================
// 3. RESEND EMAIL VERIFICATION CODE
// ======================================================

router.post(
  "/resend-verification",
  async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          message: "Email is required.",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const user =
        await User.findOne({
          email: normalizedEmail,
        });

      if (!user) {
        return res.status(404).json({
          message:
            "No account was found with this email.",
        });
      }

      if (user.isVerified) {
        return res.status(400).json({
          message:
            "This email is already verified.",
        });
      }

      const verificationCode =
        generateVerificationCode();

      user.verificationCode =
        verificationCode;

      user.verificationCodeExpires =
        new Date(
          Date.now() + 10 * 60 * 1000
        );

      await user.save();

      try {
        await sendVerificationEmail(
          user,
          verificationCode
        );
      } catch (mailError) {
        console.error(
          "RESEND EMAIL ERROR:",
          mailError.message
        );

        return res.status(500).json({
          message:
            "The verification email could not be sent. Please try again later.",
        });
      }

      return res.status(200).json({
        message:
          "A new verification code has been sent to your email.",
      });
    } catch (err) {
      console.error(
        "RESEND VERIFICATION ERROR:",
        err
      );

      return res.status(500).json({
        message:
          "Server error: " + err.message,
      });
    }
  }
);

// ======================================================
// 4. LOGIN
// ======================================================

router.post(
  "/login",
  async (req, res) => {
    try {
      const { email, password } =
        req.body;

      if (!email || !password) {
        return res.status(400).json({
          message:
            "Email and password are required.",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const user =
        await User.findOne({
          email: normalizedEmail,
        });

      // ==================================================
      // LOGIN DIAGNOSTIC
      // ==================================================

      console.log(
        "========================================"
      );

      console.log(
        "LOGIN DEBUG:",
        {
          email: normalizedEmail,

          userFound: !!user,

          isVerified:
            user?.isVerified,

          role:
            user?.role,

          hasPasswordHash:
            !!user?.password,

          passwordHashLength:
            user?.password?.length,
        }
      );

      // IMPORTANT:
      // Never print the actual password
      // or the password hash.

      console.log(
        "========================================"
      );

      // ==================================================
      // USER NOT FOUND
      // ==================================================

      if (!user) {
        console.log(
          "LOGIN RESULT: USER NOT FOUND"
        );

        return res.status(400).json({
          message:
            "Incorrect email or password.",
        });
      }

      // ==================================================
      // EMAIL VERIFICATION CHECK
      // ==================================================

      if (!user.isVerified) {
        console.log(
          "LOGIN RESULT: EMAIL NOT VERIFIED"
        );

        return res.status(403).json({
          message:
            "Please verify your email before logging in.",

          requiresVerification: true,

          email: user.email,
        });
      }

      // ==================================================
      // PASSWORD CHECK
      // ==================================================

      const isMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      console.log(
        "PASSWORD MATCH:",
        isMatch
      );

      // ==================================================
      // WRONG PASSWORD
      // ==================================================

      if (!isMatch) {
        console.log(
          "LOGIN RESULT: PASSWORD DOES NOT MATCH"
        );

        return res.status(400).json({
          message:
            "Incorrect email or password.",
        });
      }

      // ==================================================
      // LOGIN SUCCESS
      // ==================================================

      console.log(
        "LOGIN RESULT: SUCCESS"
      );

      const token =
        createToken(user);

      return res.status(200).json({
        message:
          "Login successful.",

        token,

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified:
            user.isVerified,
        },
      });
    } catch (err) {
      console.error(
        "LOGIN ERROR:",
        err
      );

      return res.status(500).json({
        message:
          "Server error: " + err.message,
      });
    }
  }
);

// ======================================================
// 5. FORGOT PASSWORD - REQUEST CODE
// ======================================================

router.post(
  "/forgot-password-request",
  async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          message:
            "Please enter your email.",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const user =
        await User.findOne({
          email: normalizedEmail,
        });

      if (!user) {
        return res.status(404).json({
          message:
            "No user was found with this email.",
        });
      }

      // ==================================================
      // RESET CODE
      // ==================================================

      const resetCode =
        generateResetCode();

      user.resetPasswordCode =
        resetCode;

      user.resetPasswordExpires =
        new Date(
          Date.now() + 10 * 60 * 1000
        );

      await user.save();

      const mailOptions = {
        from: `"Service Platform" <${process.env.EMAIL_USER}>`,

        to: user.email,

        subject:
          "Password Reset Verification Code",

        text: `
Hello ${user.name || "User"},

Your verification code for resetting your password is:

${resetCode}

This code will expire in 10 minutes.

If you did not request a password reset, please ignore this email.

Service Platform
        `.trim(),
      };

      try {
        await transporter.sendMail(
          mailOptions
        );
      } catch (mailErr) {
        console.error(
          "Password reset email error:",
          mailErr.message
        );

        return res.status(500).json({
          message:
            "The password reset email could not be sent. Please try again later.",
        });
      }

      return res.status(200).json({
        message:
          "A password reset verification code has been sent to your email.",
      });
    } catch (err) {
      console.error(
        "FORGOT PASSWORD ERROR:",
        err
      );

      return res.status(500).json({
        message:
          "Server error: " + err.message,
      });
    }
  }
);

// ======================================================
// 6. RESET PASSWORD
// ======================================================

router.post(
  "/reset-password-verify",
  async (req, res) => {
    try {
      const {
        email,
        code,
        newPassword,
      } = req.body;

      if (
        !email ||
        !code ||
        !newPassword
      ) {
        return res.status(400).json({
          message:
            "All fields are required.",
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          message:
            "New password must be at least 8 characters long.",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const normalizedCode =
        String(code).trim();

      const user =
        await User.findOne({
          email: normalizedEmail,
        });

      if (!user) {
        return res.status(400).json({
          message:
            "Invalid password reset request.",
        });
      }

      if (
        user.resetPasswordCode !==
        normalizedCode
      ) {
        return res.status(400).json({
          message:
            "Invalid or expired verification code.",
        });
      }

      if (
        !user.resetPasswordExpires ||
        user.resetPasswordExpires.getTime() <
          Date.now()
      ) {
        return res.status(400).json({
          message:
            "Invalid or expired verification code.",
        });
      }

      // ==================================================
      // UPDATE PASSWORD
      // ==================================================

      const salt =
        await bcrypt.genSalt(10);

      user.password =
        await bcrypt.hash(
          newPassword,
          salt
        );

      user.resetPasswordCode =
        undefined;

      user.resetPasswordExpires =
        undefined;

      await user.save();

      return res.status(200).json({
        message:
          "Password changed successfully. You can now log in.",
      });
    } catch (err) {
      console.error(
        "RESET PASSWORD ERROR:",
        err
      );

      return res.status(500).json({
        message:
          "Server error: " + err.message,
      });
    }
  }
);

// ======================================================
// EXPORT
// ======================================================

module.exports = router;