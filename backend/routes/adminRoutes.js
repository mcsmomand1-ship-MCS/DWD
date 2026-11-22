const express = require('express');
const router = express.Router();
const ProviderProfile = require('../models/ProviderProfile');
const Report = require('../models/Report');

const legacyReportStatuses = {
  'در حال بررسی': 'Under review',
  'حل شده': 'Resolved',
  'رد شده': 'Rejected',
  'تخلف تایید شد': 'Violation confirmed',
};
const validReportStatuses = new Set([
  'Under review',
  'Resolved',
  'Rejected',
  'Violation confirmed',
]);

// دریافت تمام پروپوزال‌ها/پروفایل‌های منتظر تایید
router.get('/pending', async (req, res) => {
  try {
    const pendingProviders = await ProviderProfile.find().populate('user', 'name email');
    res.json(pendingProviders);
  } catch (err) {
    res.status(500).json({ message: 'خطای سرور: ' + err.message });
  }
});

// تایید کردن ارائه‌دهنده خدمت توسط ادمین
router.put('/approve/:id', async (req, res) => {
  try {
    const profile = await ProviderProfile.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    res.json({ message: 'پروفایل با موفقیت تایید شد.', profile });
  } catch (err) {
    res.status(500).json({ message: 'خطای سرور: ' + err.message });
  }
});

// حذف ارائه‌دهنده خدمت توسط ادمین
router.delete('/providers/:id', async (req, res) => {
  try {
    const profile = await ProviderProfile.findByIdAndDelete(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'پروفایل مورد نظر پیدا نشد.' });
    }
    res.json({ message: 'پروفایل با موفقیت حذف شد.' });
  } catch (err) {
    res.status(500).json({ message: 'خطای سرور: ' + err.message });
  }
});

// دریافت تمام گزارش‌ها و شکایت‌های ثبت شده برای ادمین
router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find().populate({
      path: 'provider',
      populate: { path: 'user', select: 'name email' }
    }).sort({ createdAt: -1 });
    res.json(reports.map((report) => {
      const result = report.toObject();
      result.status = legacyReportStatuses[result.status] || result.status || 'Under review';
      return result;
    }));
  } catch (err) {
    res.status(500).json({ message: 'خطای سرور: ' + err.message });
  }
});

// تغییر وضعیت شکایت و کسر خودکار امتیاز در صورت تایید تخلف
router.put('/reports/:id', async (req, res) => {
  try {
    const requestedStatus = req.body.status;
    const status = legacyReportStatuses[requestedStatus] || requestedStatus;
    if (!validReportStatuses.has(status)) {
      return res.status(400).json({ message: 'Invalid report status.' });
    }

    const report = await Report.findById(req.params.id).populate('provider');
    
    if (!report) {
      return res.status(404).json({ message: 'شکایت یافت نشد.' });
    }

    report.status = status;
    await report.save();

    // اگر ادمین وضعیت را روی حل شده یا تایید تخلف بگذارد، امتیاز متخصص کم می‌شود (پیشنهاد هوشمند شما)
    if ((status === 'Resolved' || status === 'Violation confirmed') && report.provider) {
      const provider = await ProviderProfile.findById(report.provider._id || report.provider);
      if (provider) {
        provider.rating = Math.max(1, Number((provider.rating - 0.5).toFixed(1)));
        await provider.save();
      }
    }

    res.json({ message: 'وضعیت شکایت به‌روز شد و امتیاز ارائه‌دهنده بازنگری گردید.', report });
  } catch (err) {
    res.status(500).json({ message: 'خطای سرور: ' + err.message });
  }
});

// حذف شکایت توسط ادمین
router.delete('/reports/:id', async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'شکایت با موفقیت حذف شد.' });
  } catch (err) {
    res.status(500).json({ message: 'خطای سرور: ' + err.message });
  }
});

module.exports = router;