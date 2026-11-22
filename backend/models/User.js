const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,

   },

   role: {
     type: String,
     enum: ["customer", "provider", "admin"],
     default: "customer",
   },

   // ================================
   // EMAIL VERIFICATION
   // ================================

   isVerified: {
     type: Boolean,
     default: false,
   },

   verificationCode: {
     type: String,
     default: undefined,
   },

   verificationCodeExpires: {
     type: Date,
     default: undefined,
   },

   // ================================
   // PASSWORD RESET
   // ================================

   resetPasswordCode: {
     type: String,
     default: undefined,
   },

    resetPasswordExpires: {
      type: Date,
      default: undefined,
    },

    // ================================
    // IN-APP NOTIFICATIONS
    // ================================
    notifications: {
      type: [
        {
          title: { type: String, required: true },
          message: { type: String, required: true },
          type: {
            type: String,
            enum: ["request", "success", "warning", "info"],
            default: "info",
          },
          request: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ServiceRequest",
            default: null,
          },
          read: {
            type: Boolean,
            default: false,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);