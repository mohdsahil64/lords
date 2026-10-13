const express    = require('express')
const PDFDocument = require('pdfkit')
const jwt         = require('jsonwebtoken')
const path        = require('path')
const Student     = require('../models/Student')
const { protect } = require('../middleware/auth')
const { buildDegreePDF } = require('../utils/degreeGenerator')
const { encryptCertId } = require('../utils/certId')

const router = express.Router()
router.use(protect)

// ── Font paths (used by marksheet) ───────────────────────────────────────────
const FONTS = {
  georgia:    path.join(__dirname, '..', 'fonts', 'Georgia.ttf'),
  timesBold:  path.join(__dirname, '..', 'fonts', 'TimesNewRomanBold.ttf'),
  devanagari: path.join(__dirname, '..', 'fonts', 'NotoSansDevanagari.ttf'),
}

// ── Colour palette ────────────────────────────────────────────────────────────
const C = {
  maroon:  '#6B1414',
  red:     '#CC1111',
  gold:    '#C8A400',
  goldDk:  '#8B6914',
  badgeA:  '#D4AF37',
  badgeB:  '#B8960C',
  black:   '#111111',
  grey:    '#444444',
  cream:   '#FEFCF5',
  border:  '#8B1A1A',
  wmk:     '#8B1A1A',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const yearOf = (s) => s <= 2 ? '2023-24' : s <= 4 ? '2024-25' : '2025-26'

// Draw a cursive-style signature using bezier curves
function drawSignature(doc, x, y, style) {
  doc.save()
  doc.lineWidth(1.3).strokeColor(C.grey)
  if (style === 'registrar') {
    doc.moveTo(x,      y)
       .bezierCurveTo(x + 6,  y - 10, x + 14, y - 16, x + 22, y - 10)
       .bezierCurveTo(x + 28, y - 5,  x + 32, y + 2,  x + 26, y + 8)
       .bezierCurveTo(x + 20, y + 14, x + 10, y + 10, x + 8,  y + 4)
       .stroke()
    doc.moveTo(x + 4, y - 14)
       .bezierCurveTo(x + 8, y - 18, x + 16, y - 20, x + 20, y - 14)
       .stroke()
  } else {
    // Controller of Examinations / President
    doc.moveTo(x,      y + 4)
       .bezierCurveTo(x + 8,  y - 8,  x + 20, y - 14, x + 30, y - 8)
       .bezierCurveTo(x + 40, y - 2,  x + 44, y + 6,  x + 38, y + 10)
       .bezierCurveTo(x + 30, y + 15, x + 18, y + 10, x + 14, y + 4)
       .stroke()
    doc.moveTo(x + 38, y + 10)
       .bezierCurveTo(x + 48, y + 14, x + 56, y + 8,  x + 60, y)
       .stroke()
  }
  doc.restore()
}

// ── GET /api/student/me ───────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const s = await Student.findById(req.studentId).select(
      'name registrationId programme department batchYear admissionDate enrollmentNo rollNo serialNo totalBacklogs clearedBacklogs'
    )
    if (!s) return res.status(404).json({ message: 'Student not found.' })
    res.json(s)
  } catch { res.status(500).json({ message: 'Server error.' }) }
})

// ── GET /api/student/fees ─────────────────────────────────────────────────────
router.get('/fees', async (req, res) => {
  try {
    const s = await Student.findById(req.studentId).select('fees')
    if (!s) return res.status(404).json({ message: 'Student not found.' })
    res.json(s.fees)
  } catch { res.status(500).json({ message: 'Server error.' }) }
})

// ── GET /api/student/fee-receipt/download ────────────────────────────────────
// ── GET /api/student/fee-receipt/:sem/download ───────────────────────────────
// Generates a SINGLE-SEMESTER fee receipt PDF with full payment details
router.get('/fee-receipt/:sem/download', async (req, res) => {
  const sem = parseInt(req.params.sem)
  if (isNaN(sem) || sem < 1 || sem > 6)
    return res.status(400).json({ message: 'Invalid semester.' })

  try {
    const s = await Student.findById(req.studentId)
    if (!s) return res.status(404).json({ message: 'Student not found.' })

    const fee = (s.fees || []).find(f => f.semester === sem)
    if (!fee) return res.status(404).json({ message: 'Fee record not found for this semester.' })

    const yearOf = (x) => x <= 2 ? '2023-24' : x <= 4 ? '2024-25' : '2025-26'
    const generatedAt = new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    })

    const doc = new PDFDocument({ margin: 0, size: 'A4', compress: true })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=Lords_BCA_Sem${sem}_Fee_Receipt.pdf`)
    doc.pipe(res)

    doc.registerFont('Georgia',   FONTS.georgia)
    doc.registerFont('TimesBold', FONTS.timesBold)
    doc.registerFont('Hindi',     FONTS.devanagari)

    const W = 595.28, H = 841.89
    const mg = 40
    const cx = mg + 14, cxR = W - mg - 14, cw = cxR - cx

    // Palette — maroon + black only (no green)
    const INK   = '#1A1A1A'   // body text (black)
    const SUB   = '#555555'   // labels (dark grey)
    const DARK   = '#6B1414'   // dark maroon (lords logo tone)

    // White page background
    doc.rect(0, 0, W, H).fill('#FFFFFF')

    // Border frame
    doc.rect(mg, mg, W - mg * 2, H - mg * 2).lineWidth(2.2).strokeColor(DARK).stroke()
    doc.rect(mg + 5, mg + 5, W - (mg + 5) * 2, H - (mg + 5) * 2).lineWidth(0.8).strokeColor(C.gold).stroke()

    // ── Watermark — CLIPPED inside the inner border, cream tint, nothing outside ──
    const innerX = mg + 6, innerY = mg + 6
    const innerW = W - (mg + 6) * 2, innerH = H - (mg + 6) * 2
    doc.save()
    doc.rect(innerX, innerY, innerW, innerH).clip()   // restrict watermark to inside border
    doc.rect(innerX, innerY, innerW, innerH).fill('#FEFCF7') // light cream fill inside only
    doc.rotate(-28, { origin: [W / 2, H / 2] })
    for (let wy = -200; wy < H + 300; wy += 70) {
      for (let wx = -150; wx < W + 250; wx += 190) {
        doc.fontSize(11).fillColor(DARK).font('Helvetica-Bold').opacity(0.045)
        doc.text('LORDS  UNIVERSITY', wx, wy, { lineBreak: false })
      }
    }
    doc.restore(); doc.opacity(1)

    // ── Header — LORDS + UNIVERSITY + Hindi all same maroon, with gaps ──
    let y = mg + 26
    doc.fontSize(34).fillColor(DARK).font('Georgia')
    doc.text('LORDS', cx, y, { width: cw, align: 'center', lineBreak: false })
    y += 40
    doc.fontSize(18).fillColor(DARK).font('Georgia')
    doc.text('UNIVERSITY', cx, y, { width: cw, align: 'center', lineBreak: false })
    y += 26
    doc.fontSize(13).fillColor(DARK).font('Hindi')   // Hindi now same maroon as above
    doc.text('लॉर्ड्स  विश्वविद्यालय', cx, y, { width: cw, align: 'center', lineBreak: false })
    y += 22
    doc.fontSize(7).fillColor(SUB).font('Helvetica')
    doc.text('Alwar-Bhiwadi Highway, Chikani, Alwar, Rajasthan — 301028', cx, y, { width: cw, align: 'center', lineBreak: false })

    y += 16
    doc.moveTo(cx + 24, y).lineTo(cxR - 24, y).lineWidth(1.2).strokeColor(DARK).stroke()
    y += 10
    doc.fontSize(15).fillColor(INK).font('TimesBold')
    doc.text('FEE PAYMENT RECEIPT', cx, y, { width: cw, align: 'center', lineBreak: false })
    y += 20
    doc.fontSize(8.5).fillColor(SUB).font('Helvetica')
    doc.text(`Semester ${sem}   |   Academic Year ${yearOf(sem)}   |   BCA Programme`, cx, y, { width: cw, align: 'center', lineBreak: false })
    y += 14
    doc.moveTo(cx + 24, y).lineTo(cxR - 24, y).lineWidth(0.6).strokeColor(C.gold).stroke()

    // Receipt No + generated date
    y += 12
    doc.fontSize(8.5).fillColor(INK).font('Helvetica-Bold')
    doc.text(`Receipt No. : ${fee.receiptNo || '-'}`, cx, y, { lineBreak: false })
    doc.font('Helvetica').fillColor(SUB)
    doc.text(`Generated : ${generatedAt}`, cx, y, { width: cw, align: 'right', lineBreak: false })

    // ── Student info box ──
    y += 18
    const iH = 72
    doc.rect(cx, y, cw, iH).fill('#FBF7EE')
    doc.rect(cx, y, cw, iH).lineWidth(0.5).strokeColor(C.gold).stroke()
    const col1 = cx + 14, col2 = cx + cw / 2 + 8
    doc.fontSize(9).fillColor(INK).font('Helvetica')
    doc.text(`Student Name    :  ${s.name}`,           col1, y + 13, { lineBreak: false })
    doc.text(`Enrollment No.  :  ${s.enrollmentNo}`,   col2, y + 13, { lineBreak: false })
    doc.text(`Registration ID :  ${s.registrationId}`, col1, y + 31, { lineBreak: false })
    doc.text(`Roll No.        :  ${s.rollNo}`,         col2, y + 31, { lineBreak: false })
    doc.text(`Programme       :  BCA`,                 col1, y + 49, { lineBreak: false })
    doc.text(`Batch           :  ${s.batchYear} - ${s.batchYear + 3}`, col2, y + 49, { lineBreak: false })

    // ── Payment details ──
    y += iH + 22
    doc.fontSize(10).fillColor(DARK).font('TimesBold')
    doc.text('PAYMENT DETAILS', cx, y, { lineBreak: false })
    y += 16
    doc.moveTo(cx, y).lineTo(cxR, y).lineWidth(0.6).strokeColor(C.gold).stroke()
    y += 2

    const rows = [
      ['Semester',          `Semester ${sem}`],
      ['Academic Year',     yearOf(sem)],
      ['Fee Amount',        `Rs. ${(fee.amount || 0).toLocaleString('en-IN')} /-`],
      ['Due Date',          fee.dueDate || '-'],
      ['Payment Date',      fee.paidDate || '-'],
      ['Payment Mode',      fee.mode || 'Online'],
      ['Receipt Number',    fee.receiptNo || '-'],
      ['Payment Status',    (fee.status || 'Paid') + '  (CLEARED)'],
    ]
    const rowsTop = y
    const rH = 25
    rows.forEach((r, i) => {
      doc.rect(cx, y, cw, rH).fill(i % 2 === 0 ? '#FFFFFF' : '#FBF7EE')
      doc.moveTo(cx, y + rH).lineTo(cxR, y + rH).lineWidth(0.3).strokeColor('#E2DAC6').stroke()
      doc.fontSize(9).fillColor(SUB).font('Helvetica')
      doc.text(r[0], cx + 14, y + 8, { lineBreak: false })
      const isBold = r[0] === 'Fee Amount' || r[0] === 'Payment Status'
      doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fillColor(INK)   // all black, no green
      doc.text(r[1], cx + cw / 2, y + 8, { width: cw / 2 - 14, lineBreak: false })
      y += rH
    })
    doc.rect(cx, rowsTop, cw, rH * rows.length).lineWidth(0.6).strokeColor(C.gold).stroke()

    // ── Amount banner (maroon + black, no green) ──
    y += 20
    doc.rect(cx, y, cw, 40).fill('#F3EEDC')
    doc.rect(cx, y, cw, 40).lineWidth(0.5).strokeColor(C.gold).stroke()
    doc.fontSize(11).fillColor(DARK).font('TimesBold')
    doc.text(`Amount Paid : Rs. ${(fee.amount || 0).toLocaleString('en-IN')} /-`, cx + 14, y + 9, { lineBreak: false })
    doc.fontSize(8.5).fillColor(INK).font('Helvetica-Bold')
    doc.text('Balance Due : Rs. 0   —   Semester fee fully paid', cx + 14, y + 25, { lineBreak: false })

    // ── Verified note — single clean line, black (no green verified line) ──
    y += 60
    doc.fontSize(8.5).fillColor(INK).font('Helvetica-Bold')
    doc.text('This is a Lords University system-generated verified fee receipt — no physical signature required.',
      cx, y, { width: cw, align: 'center', lineBreak: false })

    // ── Signature ──
    const sigY = H - mg - 74
    drawSignature(doc, cx + 14, sigY, 'registrar')
    doc.fontSize(8).fillColor(INK).font('Helvetica')
    doc.text('Accounts Officer', cx + 14, sigY + 22, { lineBreak: false })
    doc.text('Lords University', cx + 14, sigY + 34, { lineBreak: false })

    // Footer
    doc.fontSize(6.5).fillColor('#999999').font('Helvetica')
    doc.text('For fee-related queries: accounts@lordsuniversity.edu.in', cx, H - mg - 20, { width: cw, align: 'center', lineBreak: false })

    doc.end()
  } catch (err) {
    console.error('Fee receipt PDF error:', err)
    if (!res.headersSent) res.status(500).json({ message: 'Failed to generate receipt.' })
  }
})



// ── GET /api/student/marksheets ───────────────────────────────────────────────
router.get('/marksheets', async (req, res) => {
  try {
    const s = await Student.findById(req.studentId).select('marksheets')
    if (!s) return res.status(404).json({ message: 'Student not found.' })
    res.json(s.marksheets)
  } catch { res.status(500).json({ message: 'Server error.' }) }
})

// ── GET /api/student/degree ───────────────────────────────────────────────────
router.get('/degree', async (req, res) => {
  try {
    const s = await Student.findById(req.studentId).select(
      'name registrationId programme department batchYear enrollmentNo rollNo serialNo issuedOn'
    )
    if (!s) return res.status(404).json({ message: 'Student not found.' })
    res.json({
      name:           s.name,
      registrationId: s.registrationId,
      programme:      s.programme,
      department:     s.department,
      batchYear:      s.batchYear,
      enrollmentNo:   s.enrollmentNo,
      rollNo:         s.rollNo,
      serialNo:       s.serialNo,
      issuedOn: new Date(s.issuedOn).toLocaleString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      }),
      issuedDate: new Date(s.issuedOn).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
      }),
    })
  } catch { res.status(500).json({ message: 'Server error.' }) }
})

// ── GET /api/student/degree/download ─────────────────────────────────────────
router.get('/degree/download', async (req, res) => {
  try {
    const s = await Student.findById(req.studentId)
    if (!s) return res.status(404).json({ message: 'Student not found.' })

    // Permanent, SHORT certificate id for the QR URL.
    // Deterministic AES of registrationId -> same id forever, so printed QR
    // codes never stop working. Decoded back by GET /api/verify/cert?id=...
    const certId = encryptCertId(s.registrationId)

    const pdfBuffer = await buildDegreePDF(s, certId)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename=Lords_BCA_Degree_Certificate.pdf')
    res.setHeader('Content-Length', pdfBuffer.length)
    res.end(pdfBuffer)
  } catch (err) {
    console.error('Degree PDF error:', err)
    if (!res.headersSent) res.status(500).json({ message: 'Failed to generate degree PDF.' })
  }
})

// ── GET /api/student/marksheet/:sem/download ──────────────────────────────────
router.get('/marksheet/:sem/download', async (req, res) => {
  const sem = parseInt(req.params.sem)
  if (isNaN(sem) || sem < 1 || sem > 6)
    return res.status(400).json({ message: 'Invalid semester.' })

  try {
    const s = await Student.findById(req.studentId)
    if (!s) return res.status(404).json({ message: 'Student not found.' })
    const ms = s.marksheets.find(m => m.semester === sem)
    if (!ms) return res.status(404).json({ message: 'Marksheet not found.' })

    const doc = new PDFDocument({ margin: 0, size: 'A4', compress: true })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=Lords_BCA_Sem${sem}_Marksheet.pdf`)
    doc.pipe(res)

    // Register fonts
    doc.registerFont('Georgia',   FONTS.georgia)
    doc.registerFont('TimesBold', FONTS.timesBold)
    doc.registerFont('Hindi',     FONTS.devanagari)

    const W = 595.28, H = 841.89
    const mg = 32

    const cx  = mg + 18
    const cxR = W - mg - 8
    const cw  = cxR - cx

    // ── Background ────────────────────────────────────────────────────────────
    doc.rect(0, 0, W, H).fill(C.cream)

    // ── Borders ───────────────────────────────────────────────────────────────
    doc.rect(mg, mg, W - mg * 2, H - mg * 2)
       .lineWidth(3).strokeColor(C.border).stroke()
    doc.rect(mg + 6, mg + 6, W - (mg + 6) * 2, H - (mg + 6) * 2)
       .lineWidth(0.9).strokeColor(C.gold).stroke()

    // ── Left gold badge strip ─────────────────────────────────────────────────
    const bc = 22
    const bh = (H - mg * 2) / bc
    for (let i = 0; i < bc; i++) {
      const by = mg + i * bh
      doc.rect(mg, by, 10, bh - 0.8).fill(i % 2 === 0 ? C.badgeA : C.badgeB)
      if (i % 2 === 0 && bh > 12) {
        doc.fontSize(4.8).fillColor('#6B4E00').font('Helvetica-Bold')
           .text('LU', mg, by + bh / 2 - 3, { width: 10, align: 'center', lineBreak: false })
      }
    }

    // ── Diagonal watermark ─────────────────────────────────────────────────────
    doc.save()
    doc.rotate(-28, { origin: [W / 2, H / 2] })
    for (let wy = -350; wy < H + 500; wy += 58) {
      for (let wx = -250; wx < W + 350; wx += 160) {
        doc.fontSize(11).fillColor(C.wmk).font('Helvetica-Bold')
        doc.opacity(0.072)
        doc.text('LORDS  UNIVERSITY  LORDS', wx, wy, { lineBreak: false })
      }
    }
    doc.restore()
    doc.opacity(1)

    // ── Header ────────────────────────────────────────────────────────────────
    // University name
    doc.fontSize(38).fillColor(C.maroon).font('Georgia')
    doc.text('LORDS', cx, mg + 16, { width: cw, align: 'center', lineBreak: false })
    doc.fontSize(20).fillColor(C.maroon).font('Georgia')
    doc.text('UNIVERSITY', cx, mg + 55, { width: cw, align: 'center', lineBreak: false })

    // Hindi subtitle
    doc.fontSize(14).fillColor(C.red).font('Hindi')
    doc.text('लॉर्ड्स  विश्वविद्यालय', cx, mg + 80, { width: cw, align: 'center', lineBreak: false })

    // Address
    doc.fontSize(7).fillColor('#777777').font('Helvetica')
    doc.text('Alwar-Bhiwadi Highway, Chikani, Alwar, Rajasthan — 301028', cx, mg + 99, { width: cw, align: 'center', lineBreak: false })

    // Top maroon divider
    doc.moveTo(cx + 30, mg + 112).lineTo(cxR - 30, mg + 112)
       .lineWidth(1.5).strokeColor(C.border).stroke()

    // "GRADE SHEET" heading
    doc.fontSize(15).fillColor(C.black).font('TimesBold')
    doc.text('GRADE SHEET', cx, mg + 120, { width: cw, align: 'center', lineBreak: false })

    doc.fontSize(8.5).fillColor(C.grey).font('Helvetica')
    doc.text(
      `Semester ${sem}  |  Academic Year: ${yearOf(sem)}  |  Programme: Bachelor of Computer Applications (BCA)`,
      cx, mg + 138, { width: cw, align: 'center', lineBreak: false }
    )

    // Gold divider
    doc.moveTo(cx + 30, mg + 152).lineTo(cxR - 30, mg + 152)
       .lineWidth(0.8).strokeColor(C.gold).stroke()

    // ── Student info box ──────────────────────────────────────────────────────
    const infoY = mg + 160
    const infoH = 58
    doc.rect(cx, infoY, cw, infoH).fill('#FBF7EE')
    doc.rect(cx, infoY, cw, infoH).lineWidth(0.5).strokeColor(C.gold).stroke()

    const col1 = cx + 10
    const col2 = cx + cw / 2 + 8
    doc.fontSize(8.5).fillColor(C.black).font('Helvetica')
    doc.text(`Student Name     :  ${s.name}`,            col1, infoY + 9,  { lineBreak: false })
    doc.text(`Enrollment No.   :  ${s.enrollmentNo}`,    col2, infoY + 9,  { lineBreak: false })
    doc.text(`Registration ID  :  ${s.registrationId}`,  col1, infoY + 23, { lineBreak: false })
    doc.text(`Roll No.         :  ${s.rollNo}`,          col2, infoY + 23, { lineBreak: false })
    doc.text(`Department       :  ${s.department}`,      col1, infoY + 37, { lineBreak: false })
    doc.text(`Batch Year       :  ${s.batchYear}`,       col2, infoY + 37, { lineBreak: false })

    // ── Marks table ───────────────────────────────────────────────────────────
    const tableY = infoY + infoH + 14
    const rowH   = 24

    // Column x positions
    const cols = {
      sno:      cx,
      subject:  cx + 26,
      max:      cx + 272,
      obtained: cx + 322,
      grade:    cx + 382,
      percent:  cx + 432,
    }

    // Header
    doc.rect(cx, tableY, cw, rowH).fill(C.maroon)
    doc.fontSize(8.5).fillColor('#FFFFFF').font('Helvetica-Bold')
    doc.text('#',         cols.sno     + 4,  tableY + 8, { lineBreak: false })
    doc.text('Subject',   cols.subject + 2,  tableY + 8, { lineBreak: false })
    doc.text('Max',       cols.max     + 2,  tableY + 8, { lineBreak: false })
    doc.text('Obtained',  cols.obtained + 2, tableY + 8, { lineBreak: false })
    doc.text('Grade',     cols.grade   + 2,  tableY + 8, { lineBreak: false })
    doc.text('  %',       cols.percent + 2,  tableY + 8, { lineBreak: false })

    // Rows
    let totalMarks = 0, totalMax = 0
    ms.subjects.forEach((sub, i) => {
      const ry   = tableY + rowH + i * rowH
      const fill = i % 2 === 0 ? '#FBF7EE' : '#FFFFFF'
      doc.rect(cx, ry, cw, rowH).fill(fill)

      // Row border
      doc.moveTo(cx, ry + rowH).lineTo(cxR, ry + rowH)
         .lineWidth(0.3).strokeColor('#DDDDDD').stroke()

      const ty = ry + 8
      doc.fontSize(8.5).fillColor(C.black).font('Helvetica')
      doc.text(String(i + 1),       cols.sno     + 4,  ty, { lineBreak: false })
      doc.text(sub.name,            cols.subject + 2,  ty, { width: 240, lineBreak: false })
      doc.text(String(sub.total),   cols.max     + 2,  ty, { lineBreak: false })
      doc.text(String(sub.marks),   cols.obtained + 2, ty, { lineBreak: false })
      doc.font('Helvetica-Bold')
         .text(sub.grade,           cols.grade   + 2,  ty, { lineBreak: false })
      doc.font('Helvetica')
         .text(`${((sub.marks / sub.total) * 100).toFixed(0)}%`, cols.percent + 2, ty, { lineBreak: false })

      totalMarks += sub.marks
      totalMax   += sub.total
    })

    // Total row
    const totalY = tableY + rowH * (ms.subjects.length + 1)
    doc.rect(cx, totalY, cw, rowH).fill('#F0EAD6')
    doc.moveTo(cx, totalY).lineTo(cxR, totalY).lineWidth(0.8).strokeColor(C.gold).stroke()
    doc.fontSize(8.5).fillColor(C.maroon).font('Helvetica-Bold')
    doc.text('TOTAL',              cols.subject + 2, totalY + 8, { lineBreak: false })
    doc.text(String(totalMax),     cols.max     + 2, totalY + 8, { lineBreak: false })
    doc.text(String(totalMarks),   cols.obtained + 2, totalY + 8, { lineBreak: false })
    doc.text(`${((totalMarks / totalMax) * 100).toFixed(1)}%`, cols.percent + 2, totalY + 8, { lineBreak: false })

    // ── SGPA / CGPA ───────────────────────────────────────────────────────────
    const resultY = totalY + rowH + 14
    doc.rect(cx, resultY, cw, 40).fill('#FBF7EE')
    doc.rect(cx, resultY, cw, 40).lineWidth(0.5).strokeColor(C.gold).stroke()

    doc.fontSize(13).fillColor(C.maroon).font('TimesBold')
    doc.text(`SGPA :  ${ms.sgpa}`, cx + 18, resultY + 6,  { lineBreak: false })
    doc.text(`CGPA :  ${ms.cgpa}`, cx + 160, resultY + 6, { lineBreak: false })

    doc.fontSize(7.5).fillColor(C.grey).font('Helvetica')
    doc.text(
      `Cumulative Grade Point Average up to Semester ${sem}`,
      cx + 18, resultY + 24, { lineBreak: false }
    )

    // Result status
    const passed = ms.subjects.every(s => s.grade !== 'F')
    doc.fontSize(10).fillColor(passed ? '#1A6B1A' : '#CC1111').font('Helvetica-Bold')
    doc.text(passed ? 'RESULT :  PASS' : 'RESULT :  FAIL', cx + 340, resultY + 12, { lineBreak: false })

    // ── Signatures ────────────────────────────────────────────────────────────
    const sigLineY = H - mg - 76
    doc.moveTo(cx + 10, sigLineY).lineTo(cxR - 10, sigLineY)
       .lineWidth(0.5).strokeColor('#CCCCCC').stroke()

    const sigY = sigLineY - 28

    // Registrar (left)
    drawSignature(doc, cx + 18, sigY, 'registrar')
    const issued  = s.issuedOn ? new Date(s.issuedOn) : new Date()
    const dd      = String(issued.getDate()).padStart(2, '0')
    const mm2     = String(issued.getMonth() + 1).padStart(2, '0')
    const yyyy    = issued.getFullYear()
    doc.fontSize(8).fillColor(C.black).font('Helvetica')
    doc.text('Registrar',          cx + 18, sigLineY + 6,  { lineBreak: false })
    doc.text(`Date: ${dd}/${mm2}/${yyyy}`, cx + 18, sigLineY + 16, { lineBreak: false })

    // Controller of Examinations (right)
    const presX = cxR - 120
    drawSignature(doc, presX, sigY, 'president')
    doc.fontSize(8).fillColor(C.black).font('Helvetica')
    doc.text('Controller of Examinations', presX, sigLineY + 6, { lineBreak: false })

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.fontSize(6.5).fillColor('#AAAAAA').font('Helvetica')
    doc.text(
      'This is a digitally generated marksheet. For verification: registrar@lordsuniversity.edu.in',
      cx, H - mg - 18, { width: cw, align: 'center', lineBreak: false }
    )

    doc.end()
  } catch (err) {
    console.error('Marksheet PDF error:', err)
    if (!res.headersSent) res.status(500).json({ message: 'Failed to generate PDF.' })
  }
})

module.exports = router
