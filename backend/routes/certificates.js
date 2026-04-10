const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const { protect } = require('../middleware/auth');

// @route   GET /api/certificates/verify/:certId
// @desc    Verify and retrieve a certificate by ID (public)
// @access  Public
router.get('/verify/:certId', async (req, res) => {
  try {
    const certId = req.params.certId.trim().toUpperCase();
    const certificate = await Certificate.findOne({ certificateId: certId, isActive: true });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found. Please check the Certificate ID and try again.'
      });
    }

    res.json({ success: true, certificate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/certificates/track-download/:certId
// @desc    Track certificate download
// @access  Public
router.post('/track-download/:certId', async (req, res) => {
  try {
    const certId = req.params.certId.trim().toUpperCase();
    await Certificate.findOneAndUpdate(
      { certificateId: certId },
      { $inc: { downloadCount: 1 } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/certificates/my
// @desc    Get certificates for logged-in user (by email)
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const certificates = await Certificate.find({
      email: req.user.email,
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({ success: true, certificates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
