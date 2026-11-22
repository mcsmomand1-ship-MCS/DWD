
const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");
const path = require("path");
const fs = require("fs");

const ServiceRequest = require("../models/ServiceRequest");
const ProviderProfile = require("../models/ProviderProfile");
const User = require("../models/User");

const router = express.Router();

/* =====================================================
   RUNTIME CONFIGURATION
===================================================== */

// Detect Netlify before configuring upload storage.
const isNetlify =
  process.env.NETLIFY === "true" ||
  Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

/* =====================================================
   CLOUDINARY CONFIGURATION
===================================================== */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* =====================================================
   FILE UPLOAD
===================================================== */

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/bmp",
  "image/tiff",
  "image/heic",
  "image/heif",
]);

const uploadDir = path.join(
  __dirname,
  "..",
  "uploads",
  "service-requests"
);

// Create a local directory only when running locally.
if (!isNetlify && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Netlify uses memory storage; local development uses disk storage.
const storage = isNetlify
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, callback) => {
        callback(null, uploadDir);
      },
      filename: (_req, file, callback) => {
        const extension = path
          .extname(file.originalname)
          .toLowerCase();

        const safeName = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}${extension}`;

        callback(null, safeName);
      },
    });

const upload = multer({
  storage,
  limits: {
    files: 5,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      return callback(
        new Error("Please upload a valid image file.")
      );
    }

    callback(null, true);
  },
});

/* =====================================================
   HANDLE MULTER ERRORS
===================================================== */

const handleAttachmentsUpload = (req, res, next) => {
  upload.array("attachments", 5)(req, res, (error) => {
    if (!error) {
      return next();
    }

    console.error("ATTACHMENT UPLOAD ERROR:", error.message);

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          message: "You can upload up to 5 images.",
        });
      }

      return res.status(400).json({
        message: error.message || "Image upload failed.",
      });
    }

    if (error.message?.includes("valid image")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(400).json({
      message: "Unable to process the uploaded images.",
    });
  });
};

/* =====================================================
   UPLOAD IMAGE BUFFER TO CLOUDINARY
===================================================== */

const uploadBufferToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "mfb/service-requests",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result || !result.secure_url) {
          return reject(
            new Error(
              "Cloudinary did not return a secure image URL."
            )
          );
        }

        resolve(result);
      }
    );

    Readable.from([buffer]).pipe(stream);
  });

/* =====================================================
   JWT
===================================================== */

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (
    !authHeader ||
    !authHeader.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      message: "Authentication token is required.",
    });
  }

  try {
    const token = authHeader.split(" ")[1];

    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET || "secretkey"
    );

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired authentication token.",
    });
  }
};

/* =====================================================
   CUSTOMER ONLY
===================================================== */

const requireCustomer = (req, res, next) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({
      message:
        "Only customer accounts can create service requests.",
    });
  }

  next();
};

/* =====================================================
   PROVIDER / ADMIN
===================================================== */

const requireProvider = (req, res, next) => {
  if (
    req.user.role !== "provider" &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({
      message:
        "Only providers can manage provider requests.",
    });
  }

  next();
};

/* =====================================================
   NOTIFICATIONS
===================================================== */

const addNotification = async (userId, data) => {
  const user = await User.findById(userId);

  if (!user) {
    return;
  }

  user.notifications = user.notifications || [];

  user.notifications.unshift({
    title: data.title,
    message: data.message,
    type: data.type || "info",
    request: data.request || null,
    read: false,
    createdAt: new Date(),
  });

  // Keep the notification list small and fast.
  user.notifications = user.notifications.slice(0, 50);

  await user.save();
};

/* =====================================================
   CREATE SERVICE REQUEST
   POST /api/service-requests
===================================================== */

router.post(
  "/",
  verifyToken,
  requireCustomer,
  handleAttachmentsUpload,
  async (req, res) => {
    try {
      const {
        providerId,
        customerName,
        customerPhone,
        customerWhatsapp,
        preferredContactMethod,
        serviceType,
        jobTitle,
        description,
        urgency,
        preferredDate,
        preferredTime,
        proposedLaborFee,
        laborFeeCurrency,
        city,
        area,
        address,
        notes,
        consent,
      } = req.body;

      /* CONSENT */

      if (String(consent) !== "true") {
        return res.status(400).json({
          message:
            "Please confirm the request information before submitting.",
        });
      }

      /* REQUIRED FIELDS */

      if (
        !providerId ||
        !customerName ||
        !customerPhone ||
        !serviceType ||
        !jobTitle ||
        !description ||
        !city ||
        !address ||
        proposedLaborFee === undefined ||
        proposedLaborFee === null ||
        proposedLaborFee === "" ||
        Number.isNaN(Number(proposedLaborFee)) ||
        Number(proposedLaborFee) < 0
      ) {
        return res.status(400).json({
          message:
            "Please complete all required service request fields.",
        });
      }

      /* PROVIDER */

      const provider = await ProviderProfile.findOne({
        _id: providerId,
        isApproved: true,
      });

      if (!provider) {
        return res.status(404).json({
          message:
            "The selected service provider is not available.",
        });
      }

      /* REAL CUSTOMER */

      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          message: "Customer account was not found.",
        });
      }

      /* VERIFIED EMAIL */

      if (!user.isVerified) {
        return res.status(403).json({
          message:
            "Please verify your email before submitting a service request.",
        });
      }

      /* SAVE ATTACHMENTS LOCALLY OR TO CLOUDINARY */

      const uploadedFiles = req.files || [];
      let files = [];

      if (uploadedFiles.length > 0) {
        if (isNetlify) {
          // Production: Cloudinary is required on Netlify.
          if (
            !process.env.CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET
          ) {
            console.error(
              "Cloudinary environment variables are missing."
            );

            return res.status(503).json({
              message:
                "Image storage is not configured. Please try again later.",
            });
          }

          const cloudinaryResults = await Promise.all(
            uploadedFiles.map((file) =>
              uploadBufferToCloudinary(file.buffer)
            )
          );

          files = cloudinaryResults.map((result, index) => ({
            path: result.secure_url,
            originalName: uploadedFiles[index].originalname,
            mimeType: uploadedFiles[index].mimetype,
            size: uploadedFiles[index].size,
          }));
        } else {
          // Local development: Multer has saved files to disk.
          files = uploadedFiles.map((file) => ({
            path: `/uploads/service-requests/${file.filename}`,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
          }));
        }
      }

      /*
        IMPORTANT:
        customerEmail comes from the authenticated
        MongoDB User, not from browser input.
      */

      const request = await ServiceRequest.create({
        customer: user._id,
        provider: provider._id,

        customerName: String(customerName).trim(),
        customerEmail: user.email,
        customerPhone: String(customerPhone).trim(),

        customerWhatsapp: String(
          customerWhatsapp || ""
        ).trim(),

        preferredContactMethod:
          preferredContactMethod || "phone",

        serviceType: String(serviceType).trim(),
        jobTitle: String(jobTitle).trim(),
        description: String(description).trim(),

        urgency: urgency || "flexible",

        preferredDate: String(
          preferredDate || ""
        ).trim(),

        preferredTime: String(
          preferredTime || ""
        ).trim(),

        proposedLaborFee: Number(proposedLaborFee),
        laborFeeCurrency: laborFeeCurrency || "PKR",

        agreedLaborFee: null,

        agreedLaborFeeCurrency:
          laborFeeCurrency || "PKR",

        city: String(city).trim(),
        area: String(area || "").trim(),
        address: String(address).trim(),
        notes: String(notes || "").trim(),

        attachments: files,
      });

      /* NOTIFY PROVIDER */

      const providerUserId = provider.user;

      if (providerUserId) {
        await addNotification(providerUserId, {
          title: "New service request",

          message: `You received a new request for "${request.jobTitle}". Proposed labor fee: ${request.proposedLaborFee} ${request.laborFeeCurrency}. Please review the complete request and accept or decline it.`,

          type: "request",
          request: request._id,
        });
      }

      return res.status(201).json({
        message:
          "Your service request has been submitted successfully.",
        requestId: request._id,
      });
    } catch (error) {
      console.error(
        "CREATE SERVICE REQUEST ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Server error while creating the service request.",
      });
    }
  }
);

/* =====================================================
   CUSTOMER REQUESTS
   GET /api/service-requests/mine
===================================================== */

router.get(
  "/mine",
  verifyToken,
  requireCustomer,
  async (req, res) => {
    try {
      const requests = await ServiceRequest.find({
        customer: req.user.id,
      })
        .populate({
          path: "provider",
          populate: {
            path: "user",
            select: "name email",
          },
        })
        .sort({
          createdAt: -1,
        });

      return res.json(requests);
    } catch (error) {
      console.error(
        "GET CUSTOMER REQUESTS ERROR:",
        error
      );

      return res.status(500).json({
        message: "Unable to load your service requests.",
      });
    }
  }
);

/* =====================================================
   PROVIDER REQUESTS
   GET /api/service-requests/provider
===================================================== */

router.get(
  "/provider",
  verifyToken,
  requireProvider,
  async (req, res) => {
    try {
      let filter = {};

      if (req.user.role === "provider") {
        const profile = await ProviderProfile.findOne({
          user: req.user.id,
        });

        if (!profile) {
          return res.status(404).json({
            message: "Provider profile not found.",
          });
        }

        filter.provider = profile._id;
      }

      const requests = await ServiceRequest.find(filter)
        .populate(
          "customer",
          "name email isVerified"
        )
        .populate({
          path: "provider",
          populate: {
            path: "user",
            select: "name email",
          },
        })
        .sort({
          createdAt: -1,
        });

      return res.json(requests);
    } catch (error) {
      console.error(
        "GET PROVIDER REQUESTS ERROR:",
        error
      );

      return res.status(500).json({
        message: "Unable to load service requests.",
      });
    }
  }
);

/* =====================================================
   CUSTOMER NOTIFICATIONS
   GET /api/service-requests/notifications
===================================================== */

router.get(
  "/notifications",
  verifyToken,
  async (req, res) => {
    try {
      const user = await User.findById(
        req.user.id
      ).select("notifications");

      if (!user) {
        return res.status(404).json({
          message: "User account not found.",
        });
      }

      return res.json(
        (user.notifications || [])
          .sort(
            (a, b) =>
              new Date(b.createdAt) -
              new Date(a.createdAt)
          )
          .slice(0, 30)
      );
    } catch (error) {
      console.error(
        "GET NOTIFICATIONS ERROR:",
        error
      );

      return res.status(500).json({
        message: "Unable to load notifications.",
      });
    }
  }
);

/* =====================================================
   MARK NOTIFICATION AS READ
   PATCH /api/service-requests/notifications/:id/read
===================================================== */

router.patch(
  "/notifications/:id/read",
  verifyToken,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          message: "User account not found.",
        });
      }

      const notification = user.notifications?.id(
        req.params.id
      );

      if (!notification) {
        return res.status(404).json({
          message: "Notification not found.",
        });
      }

      notification.read = true;

      await user.save();

      return res.json({
        message: "Notification marked as read.",
      });
    } catch (error) {
      console.error(
        "MARK NOTIFICATION READ ERROR:",
        error
      );

      return res.status(500).json({
        message: "Unable to update the notification.",
      });
    }
  }
);

/* =====================================================
   SINGLE REQUEST
   GET /api/service-requests/:id
===================================================== */

router.get(
  "/:id",
  verifyToken,
  async (req, res) => {
    try {
      const request = await ServiceRequest.findById(
        req.params.id
      )
        .populate(
          "customer",
          "name email isVerified"
        )
        .populate({
          path: "provider",
          populate: {
            path: "user",
            select: "name email",
          },
        });

      if (!request) {
        return res.status(404).json({
          message: "Service request not found.",
        });
      }

      const isCustomer =
        String(request.customer?._id) ===
        String(req.user.id);

      const isProvider =
        request.provider?.user &&
        String(request.provider.user._id) ===
        String(req.user.id);

      const isAdmin = req.user.role === "admin";

      if (!isCustomer && !isProvider && !isAdmin) {
        return res.status(403).json({
          message:
            "You are not allowed to view this request.",
        });
      }

      return res.json(request);
    } catch (error) {
      console.error(
        "GET SERVICE REQUEST ERROR:",
        error
      );

      return res.status(500).json({
        message: "Unable to load the service request.",
      });
    }
  }
);

/* =====================================================
   UPDATE STATUS
   PATCH /api/service-requests/:id/status
===================================================== */

router.patch(
  "/:id/status",
  verifyToken,
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowed = [
        "accepted",
        "declined",
        "in_progress",
        "completed",
        "cancelled",
      ];

      if (!allowed.includes(status)) {
        return res.status(400).json({
          message: "Invalid request status.",
        });
      }

      const request = await ServiceRequest.findById(
        req.params.id
      ).populate("provider");

      if (!request) {
        return res.status(404).json({
          message: "Service request not found.",
        });
      }

      const isCustomer =
        String(request.customer) ===
        String(req.user.id);

      const isProvider =
        request.provider?.user &&
        String(request.provider.user) ===
        String(req.user.id);

      const isAdmin = req.user.role === "admin";

      /* CUSTOMER CANCEL */

      if (status === "cancelled") {
        if (!isCustomer && !isAdmin) {
          return res.status(403).json({
            message:
              "Only the customer can cancel this request.",
          });
        }

        if (
          ![
            "pending",
            "accepted",
            "in_progress",
          ].includes(request.status)
        ) {
          return res.status(400).json({
            message:
              "This request can no longer be cancelled.",
          });
        }

        request.status = "cancelled";
        request.cancelledAt = new Date();
      } else {
        /* PROVIDER STATUS */

        if (!isProvider && !isAdmin) {
          return res.status(403).json({
            message:
              "Only the selected provider can change this request.",
          });
        }

        const transitions = {
          pending: [
            "accepted",
            "declined",
          ],

          accepted: [
            "in_progress",
          ],

          in_progress: [
            "completed",
          ],
        };

        if (
          !transitions[request.status]?.includes(
            status
          )
        ) {
          return res.status(400).json({
            message:
              `Cannot change a ${request.status} request to ${status}.`,
          });
        }

        request.status = status;

        if (
          [
            "accepted",
            "declined",
          ].includes(status)
        ) {
          request.respondedAt = new Date();
        }

        if (status === "accepted") {
          request.acceptedAt = new Date();

          request.agreedLaborFee =
            request.proposedLaborFee;

          request.agreedLaborFeeCurrency =
            request.laborFeeCurrency;
        }

        if (status === "completed") {
          request.completedAt = new Date();
        }
      }

      await request.save();

      /* CUSTOMER NOTIFICATIONS */

      if (status === "accepted") {
        await addNotification(request.customer, {
          title: "Service request accepted",

          message: `Your request "${request.jobTitle}" was accepted. The agreed labor fee is ${request.agreedLaborFee} ${request.agreedLaborFeeCurrency}. The provider is scheduled for ${request.preferredDate || "the requested date"}${request.preferredTime ? ` at ${request.preferredTime}` : ""}.`,

          type: "success",
          request: request._id,
        });
      } else if (status === "declined") {
        await addNotification(request.customer, {
          title: "Service request declined",

          message: `Your request "${request.jobTitle}" was declined by the provider.`,

          type: "warning",
          request: request._id,
        });
      } else if (status === "in_progress") {
        await addNotification(request.customer, {
          title: "Work has started",

          message: `The provider has marked "${request.jobTitle}" as in progress.`,

          type: "info",
          request: request._id,
        });
      } else if (status === "completed") {
        await addNotification(request.customer, {
          title: "Service request completed",

          message: `The provider marked "${request.jobTitle}" as completed.`,

          type: "success",
          request: request._id,
        });
      } else if (
        status === "cancelled" &&
        isCustomer
      ) {
        const providerUserId = request.provider?.user;

        if (providerUserId) {
          await addNotification(providerUserId, {
            title: "Request cancelled",

            message: `The customer cancelled "${request.jobTitle}".`,

            type: "warning",
            request: request._id,
          });
        }
      }

      return res.json({
        message: "Request status updated successfully.",
        request,
      });
    } catch (error) {
      console.error(
        "UPDATE SERVICE REQUEST ERROR:",
        error
      );

      return res.status(500).json({
        message: "Unable to update the request status.",
      });
    }
  }
);

module.exports = router;