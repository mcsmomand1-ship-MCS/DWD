const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderProfile', required: true },
  complainantName: { type: String, required: true }, // اضافه شدن نام و نام خانوادگی شاکی
  complainantEmail: { type: String, required: true },
  reason: { type: String, required: true },
  description: { type: String, required: true },
  evidence: { type: String }, // URL یا مسیر فایل آپلود شده
  evidenceOriginalName: { type: String, default: '' },
  evidenceMimeType: { type: String, default: '' },
  evidenceSize: { type: Number, default: 0 },
  status: { type: String, enum: ['Under review', 'Resolved', 'Rejected', 'Violation confirmed', 'در حال بررسی', 'حل شده', 'رد شده', 'تخلف تایید شد'], default: 'Under review' }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);