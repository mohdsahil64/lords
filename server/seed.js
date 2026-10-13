require('dotenv').config()
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const QRCode = require('qrcode')
const path = require('path')
const fs = require('fs')
const Student = require('./models/Student')

// ── Subjects: Sahil had 25 backlogs across semesters, later cleared via reappear ──
// Sem 1: 4 backlogs (C grade subjects where he initially got F), cleared in reappear
// Sem 2: 5 backlogs cleared in reappear
// Sem 3: 6 backlogs cleared in reappear
// Sem 4: 5 backlogs cleared in reappear
// Sem 5: 3 backlogs cleared in reappear
// Sem 6: 2 backlogs cleared in reappear
// Total: 25 backlogs — all cleared

const SUBJECTS = {
  1: [
    { name: 'Fundamentals of Information Technology', marks: 52, total: 100, grade: 'C',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
    { name: 'Programming Fundamentals Using C',        marks: 48, total: 100, grade: 'C',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
    { name: 'Digital Electronics & Computer Org.',    marks: 45, total: 100, grade: 'C',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
    { name: 'Basic Mathematics',                       marks: 51, total: 100, grade: 'C',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
    { name: 'Business Communication Skills',           marks: 58, total: 100, grade: 'B',  isBacklog: false, reappearCount: 0, clearedInReappear: false },
  ],
  2: [
    { name: 'Data Structures Using C',                 marks: 50, total: 100, grade: 'C',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
    { name: 'Object Oriented Prog. with C++',          marks: 53, total: 100, grade: 'C',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
    { name: 'Discrete Mathematics',                    marks: 46, total: 100, grade: 'C',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
    { name: 'Operating System Concepts',               marks: 55, total: 100, grade: 'B',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
    { name: 'Web Designing (HTML, CSS, JS)',            marks: 60, total: 100, grade: 'B',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
  ],
  3: [
    { name: 'Database Management Systems',             marks: 54, total: 100, grade: 'B',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
    { name: 'Java Programming',                        marks: 49, total: 100, grade: 'C',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
    { name: 'Computer Networks',                       marks: 52, total: 100, grade: 'C',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
    { name: 'Software Engineering',                    marks: 57, total: 100, grade: 'B',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
    { name: 'Python Programming',                      marks: 61, total: 100, grade: 'B',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
    { name: 'Multimedia & Web Technologies',           marks: 56, total: 100, grade: 'B',  isBacklog: false, reappearCount: 0, clearedInReappear: false },
  ],
  4: [
    { name: 'Advanced Java (JSP & Servlets)',           marks: 55, total: 100, grade: 'B',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
    { name: 'Computer Graphics & Animation',           marks: 52, total: 100, grade: 'C',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
    { name: 'Theory of Computation',                   marks: 48, total: 100, grade: 'C',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
    { name: 'Management Information Systems',          marks: 58, total: 100, grade: 'B',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
    { name: 'Android App Development',                 marks: 62, total: 100, grade: 'B',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
  ],
  5: [
    { name: 'Cloud Computing',                         marks: 57, total: 100, grade: 'B',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
    { name: 'Machine Learning Fundamentals',           marks: 53, total: 100, grade: 'C',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
    { name: 'Information Security & Cyber Law',        marks: 55, total: 100, grade: 'B',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
    { name: 'E-Commerce & Web Technologies',           marks: 60, total: 100, grade: 'B',  isBacklog: false, reappearCount: 0, clearedInReappear: false },
    { name: 'Software Project Management',             marks: 58, total: 100, grade: 'B',  isBacklog: false, reappearCount: 0, clearedInReappear: false },
  ],
  6: [
    { name: 'Artificial Intelligence',                 marks: 56, total: 100, grade: 'B',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
    { name: 'Data Analytics & Visualization',          marks: 59, total: 100, grade: 'B',  isBacklog: true,  reappearCount: 1, clearedInReappear: true  },
    { name: 'Full Stack Web Development',              marks: 63, total: 100, grade: 'B',  isBacklog: false, reappearCount: 0, clearedInReappear: false },
    { name: 'Computer Network Security',               marks: 54, total: 100, grade: 'B',  isBacklog: false, reappearCount: 0, clearedInReappear: false },
    { name: 'Major Project',                           marks: 68, total: 100, grade: 'B+', isBacklog: false, reappearCount: 0, clearedInReappear: false },
  ],
}

const MARKSHEETS = [
  { semester: 1, year: '2023-24', sgpa: 5.2, cgpa: 5.2,  totalBacklogs: 4, clearedBacklogs: 4, result: 'PASS (after reappear)' },
  { semester: 2, year: '2023-24', sgpa: 5.6, cgpa: 5.4,  totalBacklogs: 5, clearedBacklogs: 5, result: 'PASS (after reappear)' },
  { semester: 3, year: '2024-25', sgpa: 5.8, cgpa: 5.53, totalBacklogs: 6, clearedBacklogs: 6, result: 'PASS (after reappear)' },
  { semester: 4, year: '2024-25', sgpa: 5.9, cgpa: 5.63, totalBacklogs: 5, clearedBacklogs: 5, result: 'PASS (after reappear)' },
  { semester: 5, year: '2025-26', sgpa: 5.8, cgpa: 5.66, totalBacklogs: 3, clearedBacklogs: 3, result: 'PASS (after reappear)' },
  { semester: 6, year: '2025-26', sgpa: 6.1, cgpa: 5.73, totalBacklogs: 2, clearedBacklogs: 2, result: 'PASS (after reappear)' },
]

// Fee: ₹25,000 per semester × 6 = ₹1,50,000 total — all paid
const FEES = [
  { semester: 1, amount: 25000, dueDate: 'Aug 2023', paidDate: 'Jul 28, 2023',  status: 'Paid', receiptNo: 'LU/FEE/2023/001', mode: 'Online' },
  { semester: 2, amount: 25000, dueDate: 'Jan 2024', paidDate: 'Jan 05, 2024',  status: 'Paid', receiptNo: 'LU/FEE/2024/012', mode: 'Online' },
  { semester: 3, amount: 25000, dueDate: 'Aug 2024', paidDate: 'Aug 02, 2024',  status: 'Paid', receiptNo: 'LU/FEE/2024/048', mode: 'Online' },
  { semester: 4, amount: 25000, dueDate: 'Jan 2025', paidDate: 'Jan 10, 2025',  status: 'Paid', receiptNo: 'LU/FEE/2025/009', mode: 'Online' },
  { semester: 5, amount: 25000, dueDate: 'Aug 2025', paidDate: 'Jul 31, 2025',  status: 'Paid', receiptNo: 'LU/FEE/2025/061', mode: 'Online' },
  { semester: 6, amount: 25000, dueDate: 'Jan 2026', paidDate: 'Jan 08, 2026',  status: 'Paid', receiptNo: 'LU/FEE/2026/004', mode: 'Online' },
]

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('✅ Connected to MongoDB')

  await Student.deleteMany({})

  const marksheets = MARKSHEETS.map(ms => ({
    ...ms,
    subjects: SUBJECTS[ms.semester],
  }))

  const student = new Student({
    registrationId: '4403',
    name: 'Mohd Sahil',
    email: 'mohdsahil@lordsuniversity.edu.in',
    phone: '9813195539',
    password: 'Sahil@2026',
    programme: 'Bachelor of Computer Applications',
    department: 'Lords School of Computer Application & IT',
    batchYear: 2023,
    admissionDate: 'August 2023',
    enrollmentNo: 'LU/BCA/2023/049',
    rollNo: '2312049',
    serialNo: '2026/0450',
    issuedOn: new Date('2026-08-21T17:02:00'),
    marksheets,
    fees: FEES,
    totalBacklogs: 25,
    clearedBacklogs: 25,
  })

  await student.save()
  console.log('✅ Student created: Reg ID 4403 | Password: Sahil@2026')

  const qrToken = jwt.sign(
    { registrationId: '4005', type: 'qr-verify' },
    process.env.QR_SECRET
  )
  await Student.findByIdAndUpdate(student._id, { qrToken })
  console.log('✅ QR token generated')

  const qrDir = path.join(__dirname, 'uploads', 'qr')
  if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true })
  const qrUrl = `http://localhost:5173/verify?token=${qrToken}`
  const qrPath = path.join(qrDir, 'degree-qr.png')
  await QRCode.toFile(qrPath, qrUrl, {
    errorCorrectionLevel: 'H',
    type: 'png',
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' }
  })

  console.log(`✅ QR saved: ${qrPath}`)
  console.log(`\n🔗 QR URL: ${qrUrl}\n`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Reg ID  : 4403')
  console.log('  Password: Sahil@2026')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  await mongoose.disconnect()
  console.log('✅ Seed complete!')
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
