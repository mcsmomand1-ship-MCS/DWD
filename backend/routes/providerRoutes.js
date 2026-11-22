const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");
const jwt = require("jsonwebtoken");

const ProviderProfile =
  require("../models/ProviderProfile");

const User =
  require("../models/User");

const Report =
  require("../models/Report");


/* =========================================================
   UPLOAD CONFIGURATION
   ========================================================= */

const isNetlify =
  process.env.NETLIFY === "true" ||
  Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadDir = path.join(__dirname, "..", "uploads", "reports");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (!isNetlify && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


/* =========================================================
   ALLOWED EVIDENCE TYPES
   ========================================================= */

const allowedEvidenceTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/bmp",
  "image/tiff",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);


/* =========================================================
   MULTER STORAGE
   ========================================================= */

const storage = isNetlify
  ? multer.memoryStorage()
  : multer.diskStorage({

    destination: (
      req,
      file,
      cb
    ) => {
      cb(
        null,
        uploadDir
      );
    },

    filename: (
      req,
      file,
      cb
    ) => {

      const extension =
        path
          .extname(
            file.originalname
          )
          .toLowerCase();

      const uniqueName =
        `${Date.now()}-${crypto
          .randomBytes(8)
          .toString("hex")}${extension}`;

      cb(
        null,
        uniqueName
      );
    },

  });


/* =========================================================
   MULTER FILTER
   ========================================================= */

const fileFilter = (
  req,
  file,
  cb
) => {

  if (
    !allowedEvidenceTypes.has(
      file.mimetype
    )
  ) {
    return cb(
      new Error(
        "Invalid evidence file type."
      )
    );
  }

  cb(
    null,
    true
  );
};


/* =========================================================
   MULTER
   Maximum evidence size: 10 MB
   ========================================================= */

const upload =
  multer({

    storage,

    fileFilter,

    limits: {
      fileSize:
        10 * 1024 * 1024,

      files: 1,

      fields: 10,

      parts: 12,
    },

  });


/* =========================================================
   AUTH MIDDLEWARE
   ========================================================= */

const verifyTokenMiddleware = (
  req,
  res,
  next
) => {

  const authHeader =
    req.headers.authorization;

  if (
    !authHeader ||
    !authHeader.startsWith(
      "Bearer "
    )
  ) {
    return res.status(401).json({
      message:
        "توکن احراز هویت یافت نشد.",
    });
  }

  const token =
    authHeader.split(" ")[1];

  try {

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET ||
          "secretkey"
      );

    req.user =
      decoded;

    next();

  } catch (err) {

    console.error(
      "JWT verification error:",
      err.message
    );

    return res.status(403).json({
      message:
        "توکن نامعتبر است یا منقضی شده.",
    });
  }
};


/* =========================================================
   HELPER
   ========================================================= */

const removeUploadedFile = (
  file
) => {

  if (
    !file ||
    !file.path
  ) {
    return;
  }

  try {

    if (
      fs.existsSync(
        file.path
      )
    ) {
      fs.unlinkSync(
        file.path
      );
    }

  } catch (error) {

    console.error(
      "Could not remove uploaded file:",
      error
    );
  }
};


/* =========================================================
   1. GET ALL APPROVED PROVIDERS
   GET /api/providers
   ========================================================= */

router.get(
  "/",
  async (req, res) => {
    try {
      console.log(
        "GET /providers: starting database query"
      );

      console.log(
        "MongoDB connection state:",
        ProviderProfile.db.readyState
      );

      const providers =
        await ProviderProfile.find({
          isApproved: true,
        })
          .populate(
            "user",
            "name email"
          )
          .sort({
            createdAt: -1,
          });

      console.log(
        "GET /providers: query successful, count:",
        providers.length
      );

      return res.status(200).json(
        providers
      );
    } catch (err) {
      console.error(
        "GET /providers error:",
        err
      );

      return res.status(500).json({
        message:
          "خطا در دریافت لیست ارائه‌دهندگان خدمات.",

        debug:
          process.env.NODE_ENV === "production"
            ? {
                name: err.name,
                message: err.message,
                code: err.code || null,
                readyState:
                  ProviderProfile.db.readyState,
              }
            : undefined,
      });
    }
  }
);

/* =========================================================
   2. GET LOGGED-IN PROVIDER PROFILE
   GET /api/providers/profile
   ========================================================= */

router.get(
  "/profile",
  verifyTokenMiddleware,
  async (req, res) => {

    try {

      const profile =
        await ProviderProfile.findOne({
          user: req.user.id,
        }).populate(
          "user",
          "name email"
        );


      /* ===================================================
         PROFILE DOES NOT EXIST
      =================================================== */

      if (!profile) {

        const userDoc =
          await User.findById(
            req.user.id
          );

        return res.status(200).json({
          name:
            userDoc?.name || "",

          email:
            userDoc?.email || "",

          skills: [],

          phone: "",

          whatsapp: "",

          location: "",

          description: "",

          rating: 0,

          reviewCount: 0,

          reviews: [],
        });
      }


      /* ===================================================
         PROFILE EXISTS
      =================================================== */

      return res.status(200).json({

        _id:
          profile._id,

        name:
          profile.user?.name ||
          "",

        email:
          profile.user?.email ||
          "",

        skills:
          Array.isArray(
            profile.skills
          )
            ? profile.skills
            : [],

        phone:
          profile.phone ||
          "",

        whatsapp:
          profile.whatsapp ||
          "",

        location:
          profile.location ||
          "",

        description:
          profile.description ||
          "",

        rating:
          Number.isFinite(
            Number(
              profile.rating
            )
          )
            ? Number(
                profile.rating
              )
            : 0,

        reviewCount:
          Number.isFinite(
            Number(
              profile.reviewCount
            )
          )
            ? Number(
                profile.reviewCount
              )
            : 0,

        reviews:
          Array.isArray(
            profile.reviews
          )
            ? profile.reviews
            : [],
      });

    } catch (err) {

      console.error(
        "GET /providers/profile error:",
        err
      );

      return res.status(500).json({
        message:
          "خطا در دریافت اطلاعات پروفایل.",
      });
    }
  }
);


/* =========================================================
   3. GET ONE PROVIDER BY ID
   GET /api/providers/:id
   ========================================================= */

router.get(
  "/:id",
  async (req, res) => {

    try {

      if (
        !req.params.id
      ) {
        return res.status(400).json({
          message:
            "شناسه ارائه‌دهنده الزامی است.",
        });
      }


      const provider =
        await ProviderProfile.findById(
          req.params.id
        ).populate(
          "user",
          "name email"
        );


      if (!provider) {

        return res.status(404).json({
          message:
            "متخصص مورد نظر یافت نشد.",
        });
      }


      const reviews =
        Array.isArray(
          provider.reviews
        )
          ? provider.reviews
          : [];


      const reviewCount =
        Number.isFinite(
          Number(
            provider.reviewCount
          )
        )
          ? Number(
              provider.reviewCount
            )
          : reviews.length;


      const rating =
        Number.isFinite(
          Number(
            provider.rating
          )
        ) &&
        Number(
          provider.rating
        ) >= 1 &&
        Number(
          provider.rating
        ) <= 5
          ? Number(
              provider.rating
            )
          : 0;


      return res.status(200).json({

        _id:
          provider._id,

        name:
          provider.user?.name ||
          "",

        email:
          provider.user?.email ||
          "",

        skills:
          Array.isArray(
            provider.skills
          )
            ? provider.skills
            : [],

        phone:
          provider.phone ||
          "",

        whatsapp:
          provider.whatsapp ||
          "",

        location:
          provider.location ||
          "",

        description:
          provider.description ||
          "",

        rating,

        reviewCount,

        reviews,

        isApproved:
          provider.isApproved === true,

        user:
          provider.user,
      });

    } catch (err) {

      console.error(
        "GET /providers/:id error:",
        err
      );

      return res.status(500).json({
        message:
          "خطا در دریافت اطلاعات متخصص.",
      });
    }
  }
);


/* =========================================================
   4. POST REVIEW
   POST /api/providers/review
   ========================================================= */

router.post(
  "/review",
  async (req, res) => {

    try {

      const {
        providerId,
        rating,
        comment,
        userName,
      } = req.body;


      /* ===================================================
         BASIC VALIDATION
      =================================================== */

      if (
        !providerId ||
        !userName ||
        !comment ||
        rating === undefined ||
        rating === null
      ) {

        return res.status(400).json({
          message:
            "نام، امتیاز، نظر و شناسه متخصص الزامی است.",
        });
      }


      const cleanName =
        String(
          userName
        ).trim();

      const cleanComment =
        String(
          comment
        ).trim();

      const numericRating =
        Number(rating);


      if (
        !cleanName
      ) {
        return res.status(400).json({
          message:
            "نام کاربر نمی‌تواند خالی باشد.",
        });
      }


      if (
        cleanName.length > 100
      ) {
        return res.status(400).json({
          message:
            "نام کاربر بیش از حد طولانی است.",
        });
      }


      if (
        !cleanComment
      ) {
        return res.status(400).json({
          message:
            "متن Review الزامی است.",
        });
      }


      if (
        cleanComment.length > 1000
      ) {
        return res.status(400).json({
          message:
            "متن Review نمی‌تواند بیشتر از 1000 کاراکتر باشد.",
        });
      }


      if (
        !Number.isInteger(
          numericRating
        ) ||
        numericRating < 1 ||
        numericRating > 5
      ) {

        return res.status(400).json({
          message:
            "امتیاز باید عددی بین 1 تا 5 باشد.",
        });
      }


      /* ===================================================
         FIND PROVIDER
      =================================================== */

      const provider =
        await ProviderProfile.findById(
          providerId
        );


      if (!provider) {

        return res.status(404).json({
          message:
            "ارائه‌دهنده یافت نشد.",
        });
      }


      /* ===================================================
         REVIEWS
      =================================================== */

      if (
        !Array.isArray(
          provider.reviews
        )
      ) {
        provider.reviews = [];
      }


      provider.reviews.push({

        user:
          cleanName,

        rating:
          numericRating,

        comment:
          cleanComment,

        createdAt:
          new Date(),
      });


      /* ===================================================
         RECALCULATE RATING
      =================================================== */

      const totalReviews =
        provider.reviews.length;


      const sumRatings =
        provider.reviews.reduce(
          (
            total,
            item
          ) => {

            const itemRating =
              Number(
                item.rating
              );

            return (
              total +
              (
                Number.isFinite(
                  itemRating
                )
                  ? itemRating
                  : 0
              )
            );
          },
          0
        );


      const newRating =
        totalReviews > 0
          ? Number(
              (
                sumRatings /
                totalReviews
              ).toFixed(1)
            )
          : 0;


      provider.rating =
        newRating;

      provider.reviewCount =
        totalReviews;


      await provider.save();


      return res.status(200).json({

        message:
          "نظر با موفقیت ثبت شد.",

        provider: {
          _id:
            provider._id,

          rating:
            provider.rating,

          reviewCount:
            provider.reviewCount,

          reviews:
            provider.reviews,
        },
      });

    } catch (error) {

      console.error(
        "POST /providers/review error:",
        error
      );

      return res.status(500).json({
        message:
          "خطای سرور در ثبت نظر.",
      });
    }
  }
);


/* =========================================================
   5. POST REPORT
   POST /api/providers/report
   ========================================================= */

router.post(
  "/report",
  upload.single(
    "evidenceFile"
  ),
  async (req, res) => {

    try {

      const {
        providerId,
        complainantName,
        complainantEmail,
        reason,
        description,
      } = req.body;


      /* ===================================================
         REQUIRED FIELDS
      =================================================== */

      if (
        !providerId ||
        !complainantName ||
        !complainantEmail ||
        !reason ||
        !description
      ) {

        removeUploadedFile(
          req.file
        );

        return res.status(400).json({
          message:
            "تمام فیلدهای الزامی را پر کنید.",
        });
      }


      /* ===================================================
         CLEAN INPUT
      =================================================== */

      const cleanName =
        String(
          complainantName
        ).trim();

      const cleanEmail =
        String(
          complainantEmail
        )
          .trim()
          .toLowerCase();

      const cleanReason =
        String(
          reason
        ).trim();

      const cleanDescription =
        String(
          description
        ).trim();


      if (
        !cleanName ||
        !cleanEmail ||
        !cleanReason ||
        !cleanDescription
      ) {

        removeUploadedFile(
          req.file
        );

        return res.status(400).json({
          message:
            "فیلدهای گزارش نمی‌توانند خالی باشند.",
        });
      }


      if (
        cleanName.length > 150
      ) {

        removeUploadedFile(
          req.file
        );

        return res.status(400).json({
          message:
            "نام شاکی بیش از حد طولانی است.",
        });
      }


      if (
        cleanEmail.length > 150
      ) {

        removeUploadedFile(
          req.file
        );

        return res.status(400).json({
          message:
            "ایمیل بیش از حد طولانی است.",
        });
      }


      if (
        cleanDescription.length >
        3000
      ) {

        removeUploadedFile(
          req.file
        );

        return res.status(400).json({
          message:
            "توضیحات گزارش نمی‌تواند بیشتر از 3000 کاراکتر باشد.",
        });
      }


      /* ===================================================
         SIMPLE EMAIL VALIDATION
      =================================================== */

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


      if (
        !emailRegex.test(
          cleanEmail
        )
      ) {

        removeUploadedFile(
          req.file
        );

        return res.status(400).json({
          message:
            "فرمت ایمیل معتبر نیست.",
        });
      }


      /* ===================================================
         CHECK PROVIDER
      =================================================== */

      const provider =
        await ProviderProfile.findById(
          providerId
        );


      if (!provider) {

        removeUploadedFile(
          req.file
        );

        return res.status(404).json({
          message:
            "ارائه‌دهنده مورد نظر یافت نشد.",
        });
      }


      /* ===================================================
         EVIDENCE
      =================================================== */

      let evidencePath = "";
      if (req.file) {
        if (isNetlify) {
          if (
            !process.env.CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET
          ) {
            return res.status(503).json({
              message: "Evidence storage is not configured. Please try again later.",
            });
          }

          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "mfb/reports", resource_type: "auto" },
              (error, uploaded) => error ? reject(error) : resolve(uploaded)
            );
            Readable.from([req.file.buffer]).pipe(stream);
          });
          evidencePath = result.secure_url;
        } else {
          evidencePath = `/uploads/reports/${req.file.filename}`;
        }
      }


      /* ===================================================
         CREATE REPORT
      =================================================== */

      const report =
        new Report({

          provider:
            provider._id,

          complainantName:
            cleanName,

          complainantEmail:
            cleanEmail,

          reason:
            cleanReason,

          description:
            cleanDescription,

          evidence:
            evidencePath,

          evidenceOriginalName:
            req.file
              ? req.file.originalname
              : "",

          evidenceMimeType:
            req.file
              ? req.file.mimetype
              : "",

          evidenceSize:
            req.file
              ? req.file.size
              : 0,

          status:
            "Under review",

          penaltyApplied:
            false,
        });


      await report.save();


      return res.status(201).json({

        message:
          "گزارش تخلف با موفقیت ثبت شد.",

        reportId:
          report._id,

        status:
          report.status,
      });

    } catch (err) {

      /* ===================================================
         MULTER ERRORS
      =================================================== */

      if (
        err instanceof multer.MulterError
      ) {

        removeUploadedFile(
          req.file
        );

        if (
          err.code ===
          "LIMIT_FILE_SIZE"
        ) {
          return res.status(400).json({
            message:
              "حجم فایل نمی‌تواند بیشتر از 10MB باشد.",
          });
        }

        return res.status(400).json({
          message:
            "خطا در آپلود فایل.",
        });
      }


      /* ===================================================
         FILE TYPE ERROR
      =================================================== */

      if (
        err.message ===
        "Invalid evidence file type."
      ) {

        removeUploadedFile(
          req.file
        );

        return res.status(400).json({
          message:
            "فرمت فایل مجاز نیست. فقط JPG، PNG، WEBP، GIF، MP4، WEBM و MOV مجاز هستند.",
        });
      }


      console.error(
        "POST /providers/report error:",
        err
      );


      removeUploadedFile(
        req.file
      );


      return res.status(500).json({
        message:
          "خطای سرور در ثبت شکایت.",
      });
    }
  }
);


/* =========================================================
   6. UPDATE / CREATE PROVIDER PROFILE
   PUT /api/providers/profile
   ========================================================= */

router.put(
  "/profile",
  verifyTokenMiddleware,
  async (req, res) => {

    try {

      const {
        name,
        email,
        skills,
        phone,
        whatsapp,
        location,
        description,
      } = req.body;


      /* ===================================================
         EMAIL
      =================================================== */

      if (!email) {

        return res.status(400).json({
          message:
            "ایمیل الزامی است.",
        });
      }


      const normalizedEmail =
        String(
          email
        )
          .trim()
          .toLowerCase();


      if (!normalizedEmail) {

        return res.status(400).json({
          message:
            "ایمیل معتبر وارد کنید.",
        });
      }


      /* ===================================================
         USER
      =================================================== */

      const user =
        await User.findById(
          req.user.id
        );


      if (!user) {

        return res.status(404).json({
          message:
            "کاربر حساب پیدا نشد.",
        });
      }


      /* ===================================================
         UPDATE USER
      =================================================== */

      if (
        name !== undefined
      ) {

        const cleanName =
          String(
            name
          ).trim();

        user.name =
          cleanName;
      }


      if (
        user.email !==
        normalizedEmail
      ) {

        user.email =
          normalizedEmail;
      }


      await user.save();


      /* ===================================================
         SKILLS
      =================================================== */

      let skillsArray = [];


      if (
        Array.isArray(
          skills
        )
      ) {

        skillsArray =
          skills
            .map(
              (skill) =>
                String(
                  skill
                ).trim()
            )
            .filter(
              Boolean
            );

      } else if (
        typeof skills ===
        "string"
      ) {

        skillsArray =
          skills
            .split(",")
            .map(
              (skill) =>
                skill.trim()
            )
            .filter(
              Boolean
            );
      }


      /* ===================================================
         PROVIDER PROFILE
      =================================================== */

      let providerProfile =
        await ProviderProfile.findOne({
          user: user._id,
        });


      /* ===================================================
         CREATE
      =================================================== */

      if (
        !providerProfile
      ) {

        providerProfile =
          new ProviderProfile({

            user:
              user._id,

            skills:
              skillsArray,

            phone:
              phone || "",

            whatsapp:
              whatsapp || "",

            location:
              location || "",

            description:
              description || "",

            isApproved:
              true,

            rating:
              0,

            reviewCount:
              0,

            reviews:
              [],
          });

      } else {

        /* ===============================================
           UPDATE
        =============================================== */

        providerProfile.skills =
          skillsArray;

        providerProfile.phone =
          phone || "";

        providerProfile.whatsapp =
          whatsapp || "";

        providerProfile.location =
          location || "";

        providerProfile.description =
          description || "";
      }


      await providerProfile.save();


      console.log(
        "Provider profile saved:",
        providerProfile._id
      );


      return res.status(200).json({

        message:
          "اطلاعات پروفایل با موفقیت در دیتابیس ثبت شد.",

        data:
          providerProfile,
      });

    } catch (err) {

      console.error(
        "PUT /providers/profile error:",
        err
      );

      return res.status(500).json({
        message:
          "خطا در سرور: " +
          err.message,
      });
    }
  }
);


/* =========================================================
   MULTER ERROR HANDLER
   ========================================================= */

router.use(
  (
    err,
    req,
    res,
    next
  ) => {

    if (
      err instanceof multer.MulterError
    ) {

      removeUploadedFile(
        req.file
      );

      if (
        err.code ===
        "LIMIT_FILE_SIZE"
      ) {

        return res.status(400).json({
          message:
            "حجم فایل نمی‌تواند بیشتر از 10MB باشد.",
        });
      }

      return res.status(400).json({
        message:
          "خطا در پردازش فایل آپلود شده.",
      });
    }


    if (
      err &&
      err.message ===
        "Invalid evidence file type."
    ) {

      removeUploadedFile(
        req.file
      );

      return res.status(400).json({
        message:
          "فرمت فایل مجاز نیست.",
      });
    }


    next(err);
  }
);


/* =========================================================
   EXPORT
   ========================================================= */

module.exports =
  router;