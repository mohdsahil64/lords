const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const subjectSchema = new mongoose.Schema({
  name: String,
  marks: Number,
  total: { type: Number, default: 100 },
  grade: String,
  isBacklog: { type: Boolean, default: false },
  reappearCount: { type: Number, default: 0 },
  clearedInReappear: { type: Boolean, default: false }
}, { _id: false })

const marksheetSchema = new mongoose.Schema({
  semester: { type: Number, required: true },
  year: String,
  subjects: [subjectSchema],
  sgpa: Number,
  cgpa: Number,
  totalBacklogs: { type: Number, default: 0 },
  clearedBacklogs: { type: Number, default: 0 },
  result: { type: String, default: 'PASS' }, // PASS / FAIL / PASS (after reappear)
  pdfPath: { type: String, default: null }
}, { _id: false })

const feeSchema = new mongoose.Schema({
  semester: { type: Number, required: true },
  amount: { type: Number, required: true },
  dueDate: { type: String },
  paidDate: { type: String },
  status: { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Pending' },
  receiptNo: { type: String },
  mode: { type: String, default: 'Online' }
}, { _id: false })

const studentSchema = new mongoose.Schema({
  registrationId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  photoPath: { type: String, default: null },

  programme: { type: String, default: 'Bachelor of Computer Applications' },
  department: { type: String, default: 'Lords School of Computer Application & IT' },
  batchYear: { type: Number, default: 2023 },
  admissionDate: { type: String, default: 'August 2023' },
  enrollmentNo: { type: String, default: 'LU/BCA/2023/049' },
  rollNo: { type: String, default: '2312049' },
  serialNo: { type: String, default: '2026/0468' },
  issuedOn: { type: Date, default: new Date('2026-08-21T17:02:00') },
  degreePhotoPath: { type: String, default: null },

  marksheets: [marksheetSchema],
  fees: [feeSchema],

  totalBacklogs: { type: Number, default: 0 },
  clearedBacklogs: { type: Number, default: 0 },

  qrToken: { type: String, default: null },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
}, { timestamps: true })

// Hash password before save
studentSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

// Compare password
studentSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Check if account is locked
studentSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now()
}

module.exports = mongoose.model('Student', studentSchema)
