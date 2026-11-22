const mongoose = require("mongoose");
const attachmentSchema =
   new mongoose.Schema(
     {
       path: {
         type: String,
         required: true,
      },
      originalName: {
        type: String,
        required: true,
      },
      mimeType: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        required: true,
      },
    },
    {
      _id: false,
    }
);
const serviceRequestSchema =
new mongoose.Schema(
    {
      /* CUSTOMER */
      customer: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      /* SELECTED PROVIDER */
      provider: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "ProviderProfile",
    required: true,
    index: true,
  },
  /* CUSTOMER SNAPSHOT */
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  customerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true,
  },
  customerWhatsapp: {
    type: String,
    default: "",
    trim: true,
  },
  preferredContactMethod: {
    type: String,
    enum: [
      "phone",
      "whatsapp",
      "email",
    ],
    default: "phone",
  },
  /* JOB */
  serviceType: {
    type: String,
    required: true,
    trim: true,
  },
  jobTitle: {
   type: String,
   required: true,
   trim: true,
        maxlength: 160,
      },
     description: {
       type: String,
       required: true,
       trim: true,
       maxlength: 5000,
     },
     urgency: {
       type: String,
       enum: [
         "emergency",
         "today",
         "this_week",
         "flexible",
       ],
       default: "flexible",
     },
     preferredDate: {
       type: String,
       default: "",
     },
     preferredTime: {
       type: String,
       default: "",
     },
     /* PRICE / LABOR FEE */
     proposedLaborFee: {
       type: Number,
       default: null,
       min: 0,
     },

     laborFeeCurrency: {
       type: String,
       enum: ["PKR", "AFN", "USD"],
       default: "PKR",
     },

     agreedLaborFee: {
       type: Number,
       default: null,
       min: 0,
     },

     agreedLaborFeeCurrency: {
       type: String,
       enum: ["PKR", "AFN", "USD"],
       default: "PKR",
     },

     /* LOCATION */
     city: {
       type: String,
       required: true,
       trim: true,
     },
     area: {
       type: String,
       default: "",
       trim: true,
     },
     address: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  /* EXTRA */
  notes: {
    type: String,
    default: "",
    trim: true,
    maxlength: 2000,
  },
  /* PHOTOS */
  attachments: {
    type: [
      attachmentSchema,
    ],
    default: [],
  },
  /* STATUS */
  status: {
    type: String,
    enum: [
      "pending",
      "accepted",
      "declined",
      "in_progress",
      "completed",
      "cancelled",
    ],
    default: "pending",
    index: true,
  },
  respondedAt: {
    type: Date,
    default: null,
  },
  acceptedAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  cancelledAt: {
            type: Date,
            default: null,
          },
        },
        {
          timestamps: true,
        }
      );
    serviceRequestSchema.index({
      provider: 1,
      status: 1,
      createdAt: -1,
    });
    serviceRequestSchema.index({
      customer: 1,
      createdAt: -1,
    });
    module.exports =
      mongoose.model(
        "ServiceRequest",
        serviceRequestSchema
      );

