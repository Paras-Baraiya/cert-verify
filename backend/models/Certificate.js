const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: [true, 'Certificate ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  studentName: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
    maxlength: [150, 'Name cannot exceed 150 characters']
  },
  internshipDomain: {
    type: String,
    required: [true, 'Internship domain is required'],
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  college: {
    type: String,
    trim: true
  },
  grade: {
    type: String,
    enum: ['Excellent', 'Very Good', 'Good', 'Satisfactory'],
    default: 'Good'
  },
  issuedBy: {
    type: String,
    default: 'HR Department'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadBatch: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual: internship duration in weeks
CertificateSchema.virtual('durationWeeks').get(function() {
  const diff = this.endDate - this.startDate;
  return Math.ceil(diff / (1000 * 60 * 60 * 24 * 7));
});

// Virtual: formatted date range
CertificateSchema.virtual('dateRange').get(function() {
  const opts = { year: 'numeric', month: 'long', day: 'numeric' };
  return `${this.startDate.toLocaleDateString('en-IN', opts)} to ${this.endDate.toLocaleDateString('en-IN', opts)}`;
});

CertificateSchema.set('toJSON', { virtuals: true });
CertificateSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Certificate', CertificateSchema);
