const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// Multer config for Excel upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/excel');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `batch_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only Excel (.xlsx, .xls) or CSV files are allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Apply auth to all admin routes
router.use(protect, adminOnly);

// @route   POST /api/admin/upload-excel
// @desc    Upload Excel and bulk import certificates
// @access  Admin
router.post('/upload-excel', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Auto-detect the real header row by scanning for "Certificate ID" column
    // This handles files with title/subtitle banners before the actual data headers
    const KNOWN_HEADER_KEYWORDS = ['certificate id', 'certificateid', 'certificate_id', 'cert_id', 'student name'];
    const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    let headerRowIndex = 0; // default: first row
    for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
      const rowValues = rawRows[i].map(v => v.toString().toLowerCase().trim());
      const isHeaderRow = rowValues.some(v => KNOWN_HEADER_KEYWORDS.includes(v));
      if (isHeaderRow) { headerRowIndex = i; break; }
    }

    // Re-parse using the detected header row
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '', range: headerRowIndex });

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Excel file is empty or header row not found' });
    }

    const batchId = `BATCH_${Date.now()}`;
    const results = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row number (1-indexed + header)

      try {
        // Flexible column name mapping
        const certId = (row['Certificate ID'] || row['CertificateID'] || row['certificate_id'] || row['cert_id'] || '').toString().trim().toUpperCase();
        const studentName = (row['Student Name'] || row['StudentName'] || row['student_name'] || row['Name'] || '').toString().trim();
        const domain = (row['Internship Domain'] || row['Domain'] || row['internship_domain'] || row['domain'] || '').toString().trim();
        const startDateRaw = row['Start Date'] || row['StartDate'] || row['start_date'] || row['From'];
        const endDateRaw = row['End Date'] || row['EndDate'] || row['end_date'] || row['To'];
        const email = (row['Email'] || row['email'] || '').toString().trim().toLowerCase();
        const college = (row['College'] || row['Institution'] || row['college'] || '').toString().trim();
        const grade = row['Grade'] || row['Performance'] || 'Good';

        // Validation
        if (!certId) { results.errors.push(`Row ${rowNum}: Certificate ID is missing`); results.failed++; continue; }
        if (!studentName) { results.errors.push(`Row ${rowNum}: Student Name is missing`); results.failed++; continue; }
        if (!domain) { results.errors.push(`Row ${rowNum}: Internship Domain is missing`); results.failed++; continue; }
        if (!startDateRaw) { results.errors.push(`Row ${rowNum}: Start Date is missing`); results.failed++; continue; }
        if (!endDateRaw) { results.errors.push(`Row ${rowNum}: End Date is missing`); results.failed++; continue; }

        // Parse dates (handles Excel serial numbers and string dates)
        const parseDate = (d) => {
          if (typeof d === 'number') return new Date(Math.round((d - 25569) * 86400 * 1000));
          return new Date(d);
        };
        const startDate = parseDate(startDateRaw);
        const endDate = parseDate(endDateRaw);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          results.errors.push(`Row ${rowNum}: Invalid date format`);
          results.failed++;
          continue;
        }

        if (endDate <= startDate) {
          results.errors.push(`Row ${rowNum}: End date must be after start date`);
          results.failed++;
          continue;
        }

        const validGrades = ['Excellent', 'Very Good', 'Good', 'Satisfactory'];
        const normalizedGrade = validGrades.includes(grade) ? grade : 'Good';

        // Upsert certificate
        await Certificate.findOneAndUpdate(
          { certificateId: certId },
          {
            certificateId: certId,
            studentName,
            internshipDomain: domain,
            startDate,
            endDate,
            email,
            college,
            grade: normalizedGrade,
            uploadedBy: req.user._id,
            uploadBatch: batchId
          },
          { upsert: true, new: true, runValidators: true }
        );
        results.success++;
      } catch (rowErr) {
        results.errors.push(`Row ${rowNum}: ${rowErr.message}`);
        results.failed++;
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Import complete. ${results.success} records added/updated, ${results.failed} failed.`,
      results
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/admin/certificates
// @desc    Get all certificates with pagination & search
// @access  Admin
router.get('/certificates', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const query = search
      ? {
          $or: [
            { certificateId: { $regex: search, $options: 'i' } },
            { studentName: { $regex: search, $options: 'i' } },
            { internshipDomain: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const [certificates, total] = await Promise.all([
      Certificate.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('uploadedBy', 'name email'),
      Certificate.countDocuments(query)
    ]);

    res.json({
      success: true,
      certificates,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/admin/certificates/:id
// @desc    Delete a certificate
// @access  Admin
router.delete('/certificates/:id', async (req, res) => {
  try {
    const cert = await Certificate.findByIdAndDelete(req.params.id);
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });
    res.json({ success: true, message: 'Certificate deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/admin/stats
// @desc    Get dashboard stats
// @access  Admin
router.get('/stats', async (req, res) => {
  try {
    const [totalCerts, totalUsers, recentUploads, topDomains] = await Promise.all([
      Certificate.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Certificate.find().sort({ createdAt: -1 }).limit(5).select('certificateId studentName internshipDomain createdAt'),
      Certificate.aggregate([
        { $group: { _id: '$internshipDomain', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({ success: true, stats: { totalCerts, totalUsers, recentUploads, topDomains } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select('-password');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PATCH /api/admin/users/:id/toggle
// @desc    Activate/Deactivate a user
// @access  Admin
router.patch('/users/:id/toggle', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/admin/template
// @desc    Download Excel template
// @access  Admin
router.get('/template', (req, res) => {
  const templateData = [
    {
      'Certificate ID': 'CERT001',
      'Student Name': 'John Doe',
      'Internship Domain': 'Web Development',
      'Start Date': '2024-01-01',
      'End Date': '2024-03-31',
      'Email': 'john@example.com',
      'College': 'Example University',
      'Grade': 'Excellent'
    }
  ];

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(templateData);
  ws['!cols'] = [20, 25, 25, 15, 15, 30, 30, 15].map(w => ({ wch: w }));
  xlsx.utils.book_append_sheet(wb, ws, 'Certificates');

  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename=certificate_template.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

module.exports = router;