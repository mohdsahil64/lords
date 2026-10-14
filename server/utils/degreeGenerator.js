/**
 * Degree Certificate PDF Generator — Lords University
 * A to Z match with physical degree reference photo.
 */

const PDFDocument = require('pdfkit')
const QRCode      = require('qrcode')
const path        = require('path')

const FONTS = {
  georgia:    path.join(__dirname, '..', 'fonts', 'Georgia.ttf'),
  timesBold:  path.join(__dirname, '..', 'fonts', 'TimesNewRomanBold.ttf'),
  devanagari: path.join(__dirname, '..', 'fonts', 'NotoSansDevanagari.ttf'),
}

// Signature images (added to server/assets)
const SIGN = {
  registrar: path.join(__dirname, '..', 'assets', 'registrar.jpeg'),
  president: path.join(__dirname, '..', 'assets', 'president.jpeg'),
}

// Hindi university name as an image (reliable Devanagari rendering).
// Source: server/assets/lords-hindi.png — "लॉर्ड्स विश्वविद्यालय"
const HINDI_LOGO = path.join(__dirname, '..', 'assets', 'lords-hindi.png')
const HINDI_LOGO_RATIO = 882 / 136   // image pixel width / height

const darkRed = '#3F0606'
const gold    = '#C8A400'
const goldDk  = '#8B6914'
const black   = '#111111'
const cream   = '#FFFFFF'
const white   = '#FFFFFF'

// ── Realistic barcode — stretched to a target width, thin height, deep black ──
// targetW: exact overall width the barcode must span (bars + gaps + guards)
// bH:      bar height (smaller = thinner-looking barcode)
function drawBarcode(doc, x, y, targetW, bH = 18) {
  // Many thin bars packed close together (real-barcode look).
  const pattern = [
    2,1,1,3,1,2,1,1,2,3,1,1,1,2,2,1,3,1,1,2,1,1,3,2,1,1,2,1,1,2,3,1,1,1,2,2,1,2,1,1,
    1,2,1,1,3,1,2,1,1,2,3,1,1,2,1,1,2,3,1,1,1,2,2,1,3,1,1,2,1,1,2,1,3,1,1,2,1,1,2,1,
  ]
  // Thin bars, tiny gaps so lines sit very close with no visible spacing.
  // Fixed (unscaled) widths so bars always stay thin; the pattern simply
  // repeats to fill the full target width -> lots of dense, thin lines.
  const narrow = 1.0, wide = 2.0, gap = 0.5
  const deep   = '#000000'
  const right  = x + (targetW || 120)
  const barW   = w => (w === 1 ? narrow : w === 2 ? narrow * 1.8 : wide)

  // Left guard
  doc.rect(x, y, 1.0, bH).fill(deep)
  let bx = x + 2
  let i = 0
  while (bx < right - 2) {
    const w  = pattern[i % pattern.length]
    const bw = barW(w)
    if (i % 2 === 0) doc.rect(bx, y, Math.min(bw, right - 2 - bx), bH).fill(deep)
    bx += bw + gap
    i++
  }
  // End guard bar (deep black)
  doc.rect(right - 1.0, y, 1.0, bH).fill(deep)
  return right   // right edge x
}

// ── Cursive signature ─────────────────────────────────────────────────────────
function drawSignature(doc, x, y, style) {
  doc.save()
  doc.lineWidth(1.3).strokeColor('#444444')
  if (style === 'registrar') {
    doc.moveTo(x,     y)
       .bezierCurveTo(x+6,  y-10, x+14, y-16, x+22, y-10)
       .bezierCurveTo(x+28, y-5,  x+32, y+2,  x+26, y+8)
       .bezierCurveTo(x+20, y+14, x+10, y+10, x+8,  y+4)
       .stroke()
    doc.moveTo(x+4, y-14)
       .bezierCurveTo(x+8, y-18, x+16, y-20, x+20, y-14)
       .stroke()
  } else {
    doc.moveTo(x,     y+4)
       .bezierCurveTo(x+10, y-10, x+24, y-16, x+36, y-8)
       .bezierCurveTo(x+46, y-2,  x+50, y+8,  x+42, y+12)
       .bezierCurveTo(x+32, y+18, x+18, y+12, x+14, y+4)
       .stroke()
    doc.moveTo(x+42, y+12)
       .bezierCurveTo(x+54, y+16, x+64, y+8,  x+68, y-2)
       .stroke()
  }
  doc.restore()
}

/**
 * @param {object} student
 * @param {string} qrToken
 * @returns {Promise<Buffer>}
 */
async function buildDegreePDF(student, qrToken) {
  // Public verification URL encoded in the QR. The token is permanent (never
  // expires once generated), so this link keeps working forever.
  // Format: https://<domain>/V2/#/public-certificate?id=<token>
  const verifyBase = process.env.VERIFY_URL || 'https://mydomain.com/V2/#/public-certificate'
  const qrUrl      = `${verifyBase}?id=${encodeURIComponent(qrToken)}`
  const qrBuf   = await QRCode.toBuffer(qrUrl, {
    errorCorrectionLevel: 'H',
    type: 'png', width: 200, margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' },
  })

  return new Promise((resolve, reject) => {
    const chunks = []
    const doc = new PDFDocument({ size: 'A4', margin: 0, compress: true })
    doc.on('data',  c => chunks.push(c))
    doc.on('end',   () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.registerFont('Georgia',   FONTS.georgia)
    doc.registerFont('TimesBold', FONTS.timesBold)
    doc.registerFont('Hindi',     FONTS.devanagari)

    const W = 595.28, H = 841.89

    // Page layout
    const outerM = 20
    const certX  = outerM, certY = outerM
    const certW  = W - outerM * 2
    const certH  = H - outerM * 2

    const stripX = certX + 9   // sits on inner border
    const stripW = 10

    const cx  = stripX + stripW + 10   // content left
    const cxR = certX + certW - 22     // content right (22px from right border)
    const cw  = cxR - cx

    // ── 1. White page background ──────────────────────────────────────────────
    doc.rect(0, 0, W, H).fill(white)

    // ── 2. Cream cert background ──────────────────────────────────────────────
    doc.rect(certX, certY, certW, certH).fill(cream)

    // ── 3. Three-line gray border ─────────────────────────────────────────────
    // Outer solid
    doc.rect(certX, certY, certW, certH)
       .lineWidth(2).strokeColor('#999999').stroke()
    // Middle dashed
    doc.save()
    doc.lineWidth(0.9).strokeColor('#BBBBBB')
    doc.rect(certX+4, certY+4, certW-8, certH-8)
       .dash(5, { space: 4 }).stroke()
    doc.restore()
    // Inner solid
    doc.rect(certX+9, certY+9, certW-18, certH-18)
       .lineWidth(1.4).strokeColor('#AAAAAA').stroke()

    // ── 4. Left strip — 16 boxes vertically centered, on inner border ─────────
    const boxH        = 18
    const totalStripH = 16 * boxH + 15 * 1
    const stripStartY = certY + (certH - totalStripH) / 2 + 12  // nudged down so it starts around "This is to certify that"

    for (let i = 0; i < 16; i++) {
      const by    = stripStartY + i * (boxH + 1)
      const isMar = i % 2 === 0
      // Box fill — dark maroon (same as rest of the certificate) / grey
      doc.rect(stripX, by, stripW, boxH).fill(isMar ? darkRed : '#BBBBBB')
      // "LU" rotated 90° (vertical), centered in the box
      const bcx = stripX + stripW / 2
      const bcy = by + boxH / 2
      doc.save()
      doc.rotate(-90, { origin: [bcx, bcy] })
      doc.fontSize(6.5).fillColor('#FFFFFF').font('Helvetica-Bold')
      doc.text('LU', bcx - boxH / 2, bcy - 3, { width: boxH, align: 'center', lineBreak: false })
      doc.restore()
    }

    // ── 5. Watermark is drawn later (after the body Y positions are known) so it
    //       can sit between the "has been conferred" and "under the regulations"
    //       lines, matching the reference. See section 8b below.

    // ── 6. TOP AREA ───────────────────────────────────────────────────────────
    const topY = certY + 14

    // Top info lines — label + value BOTH in the same plain font & size, drawn on
    // one shared baseline so nothing looks higher/lower than the rest.
    const TOP_FS   = 12          // a touch bigger so it matches the numbers' weight
    const TOP_FONT = 'Helvetica' // plain (non-serif) for the whole line
    const TOP_LH   = 18          // line spacing between the two left rows
    const drawLabelValue = (label, value, xx, yy) => {
      doc.font(TOP_FONT).fontSize(TOP_FS).fillColor(black)
      doc.text(label, xx, yy, { lineBreak: false })
      const lw = doc.widthOfString(label)
      doc.text(String(value), xx + lw, yy, { lineBreak: false })
    }

    // Left column (Serial, Roll, QR) hugs the left border — sits closer to the
    // inner border/strip instead of starting at the centered content margin.
    const leftX = stripX + stripW + 2   // just past the left strip, near the border
    const leftY = topY + 8              // a little lower so there's a gap from the top border
    const textX = leftX - 6             // Serial/Roll nudged a touch more left (QR stays at leftX)

    // Serial No. & Roll No. — single consistent plain font
    drawLabelValue('Serial No. : ', student.serialNo, textX, leftY)
    drawLabelValue('Roll No.   : ', student.rollNo,   textX, leftY + TOP_LH)

    // QR code below serial/roll
    const qrSize = 64
    doc.image(qrBuf, leftX, leftY + 36, { width: qrSize, height: qrSize })

    // Enrollment No. — top right. Label serif + number plain, right-aligned.
    const enrollLabel = 'Enrollment No. : '
    const enrollValue = String(student.enrollmentNo)
    doc.font(TOP_FONT).fontSize(TOP_FS).fillColor(black)
    const enrollLabelW = doc.widthOfString(enrollLabel)
    const enrollValueW = doc.widthOfString(enrollValue)
    const enrollX = cxR - (enrollLabelW + enrollValueW)   // right edge stays at cxR
    const rightY  = topY + 8                               // moved down to match the left column
    doc.text(enrollLabel, enrollX, rightY, { lineBreak: false })
    doc.text(enrollValue, enrollX + enrollLabelW, rightY, { lineBreak: false })

    // Barcode — below enrollment. Left edge aligns with the "ent" of
    // "Enrollment" and runs to the right border (cxR). Deep black bars.
    doc.font(TOP_FONT).fontSize(TOP_FS)
    const enrollPrefixW = doc.widthOfString('Enrollm')        // up to where "ent" begins
    const bcX  = enrollX + enrollPrefixW                      // left edge aligns with "ent"
    const bcY  = rightY + 22                                  // same gap below the (lowered) enrollment line
    const bcH  = 20                                           // bar height
    const bcTargetW = cxR - bcX                               // stretch to the right border
    drawBarcode(doc, bcX, bcY, bcTargetW, bcH)

    // ── 7. LORDS heading — right after top area ───────────────────────────────
    // Title position kept fixed (independent of the barcode height) so changing
    // the barcode's thickness doesn't shift the whole certificate.
    const titleY = topY + 42   // same spot as before (was bcY + 28 - 2 at bcH=28)

    doc.fontSize(58).fillColor(darkRed).font('Georgia')
    doc.text('LORDS', cx, titleY, { width: cw, align: 'center', lineBreak: false })
    // Measure LORDS width so the Hindi line can match its left-right span
    const lordsW = doc.widthOfString('LORDS')

    const uniY = titleY + 62
    doc.fontSize(28).fillColor(darkRed).font('Georgia')
    // Stretch "UNIVERSITY" with letter spacing so it spans edge-to-edge of "LORDS"
    const uniHeadBaseW  = doc.widthOfString('UNIVERSITY')
    const uniHeadSpacing = (lordsW - uniHeadBaseW) / 'UNIVERSITY'.length
    doc.text('UNIVERSITY', cx, uniY, {
      width: cw, align: 'center', characterSpacing: Math.max(0, uniHeadSpacing),
      lineBreak: false,
    })

    // Gap between UNIVERSITY and Hindi — medium gap to match reference
    const hindiY = uniY + 42
    // Hindi: लॉर्ड्स विश्वविद्यालय — rendered from an image for correct Devanagari
    // shaping (PDFKit's text engine breaks the द्य / र्ड्स / श्व conjuncts).
    // Width is scaled to span the same left-right extent as "LORDS" (with a slight
    // overhang); height follows the image's aspect ratio so it never stretches.
    const HINDI_OVERHANG = 1.40          // >1 = spills past both sides of "LORDS" (ल left of L, य right of S)
    const hindiLogoW = lordsW * HINDI_OVERHANG
    const hindiLogoH = hindiLogoW / HINDI_LOGO_RATIO
    const hindiH     = hindiLogoH        // used by the layout below
    // The source image carries a little extra blank padding on its left, which
    // pushes ल inside "L". Nudge the image left so ल clears the "L" edge too.
    const HINDI_LOGO_XSHIFT = -8
    const hindiLogoX = cx + (cw - hindiLogoW) / 2 + HINDI_LOGO_XSHIFT
    try {
      doc.image(HINDI_LOGO, hindiLogoX, hindiY, { width: hindiLogoW, height: hindiLogoH })
    } catch (e) { /* image missing — skip */ }

    // ── 8. CERTIFICATE BODY ───────────────────────────────────────────────────
    // Uniform line gap between every line (like reference). Body text slightly
    // larger and wider so it sits closer to the borders, not shrunk in the middle.
    const BODY = 18        // body text size (bigger than before -> wider lines)
    const LG   = 52        // SAME gap between consecutive lines everywhere

    let y = hindiY + hindiH + 45  // gap between Hindi and body start (a bit more)

    const gradYear = student.batchYear
      ? (parseInt(student.batchYear) + 3)
      : new Date().getFullYear()
    const programmeName = student.programme || 'Bachelor of Computer Applications'

    // Reference layout (small -> big):
    //  normal lines  : "This is to certify that", "has been conferred..."  (thin, black)
    //  highlight      : name + programme  (dark maroon, bold)
    //  paragraph      : 3 lines, biggest, span almost border-to-border (black, bold)

    const para = [
      'on successful completion of the requirements prescribed',
      'under the regulations for the award of this degree in the',
      `University Examinations held in the year ${gradYear}.`,
    ]
    // Simple serif font for the plain body lines + paragraph (declared early so
    // the border-to-border size is measured with the same font that draws it).
    const BODY_FONT = 'Times-Roman'
    // Full dark ink for the body text (as before — not faded)
    const bodyInk  = '#1A1A1A'
    // Size the paragraph from its LONGEST line so it reaches near the borders
    doc.font(BODY_FONT).fontSize(10)
    const longest = Math.max(...para.map(t => doc.widthOfString(t)))
    // Paragraph spans almost border-to-border (left & right) — size unchanged
    const paraSize = Math.min(21, (cw / longest) * 10 * 0.99)

    // Plain body lines use BODY_FONT (declared above) — different style from the
    // rest, same size/color. Name + programme keep their own font/size.
    const normal = () => doc.fontSize(paraSize).fillColor(bodyInk).font(BODY_FONT)
    const highlight = () => doc.fontSize(23).fillColor(darkRed).font('Helvetica')

    // Pre-compute each line's Y so the watermark can be placed relative to them.
    const LG2 = 43   // tighter gap from "has been conferred" down to the year line
    const yCertify  = y
    const yName     = yCertify + (LG - 12)
    const yConfer   = yName + LG                 // "has been conferred the Degree of"
    const yProg     = yConfer + LG2
    const yPara0    = yProg + LG2                 // "on successful ..."
    const yPara1    = yPara0 + LG2                // "under the regulations ..."
    const yPara2    = yPara1 + LG2                // "... year 2026."

    // ── 8b. Watermark — large serif LORDS / UNIVERSITY, light red, sitting
    //        between "has been conferred" and "under the regulations". Drawn
    //        BEFORE the body text so the sentences stay readable on top.
    doc.save()
    doc.opacity(0.25)                            // a touch stronger so it shows/prints
    doc.fillColor('#E53935').font('Georgia')     // bright-ish red (not maroon) so it "pops"
    const wmMid = (yConfer + yPara1) / 2         // vertical center of the target band

    // Target width = span of the "has been conferred the Degree of" line
    // (from "has" to "of"). Scale the watermark so "LORDS" matches that width.
    doc.font(BODY_FONT).fontSize(paraSize)
    const wmTargetW = doc.widthOfString('has been conferred the Degree of')
    // Find the LORDS font size whose rendered width == wmTargetW.
    doc.font('Georgia').fontSize(100)
    const lordsWAt100 = doc.widthOfString('LORDS')
    const wmLordsFS = 100 * (wmTargetW / lordsWAt100)
    const wmUniFS   = wmLordsFS * 0.54           // keep same LORDS:UNIVERSITY ratio (~52/96)

    doc.fontSize(wmLordsFS)
    const wmLordsH = doc.currentLineHeight()
    doc.fontSize(wmUniFS)
    const wmUniH   = doc.currentLineHeight()
    const wmTotalH = wmLordsH + wmUniH
    const wmTop    = wmMid - wmTotalH / 2
    doc.fontSize(wmLordsFS)
    doc.text('LORDS',      cx, wmTop, { width: cw, align: 'center', lineBreak: false })
    // Stretch UNIVERSITY to the same width as LORDS (= target line width)
    doc.fontSize(wmUniFS)
    const wmUniBaseW  = doc.widthOfString('UNIVERSITY')
    const wmUniSpacing = Math.max(0, (wmTargetW - wmUniBaseW) / 'UNIVERSITY'.length)
    doc.text('UNIVERSITY', cx, wmTop + wmLordsH, {
      width: cw, align: 'center', characterSpacing: wmUniSpacing, lineBreak: false,
    })
    doc.restore()
    doc.opacity(1)

    // Body text (on top of the watermark). Same gaps as before.
    normal()
    doc.text('This is to certify that', cx, yCertify, { width: cw, align: 'center', lineBreak: false })

    highlight()
    doc.text(student.name, cx, yName, { width: cw, align: 'center', lineBreak: false })

    normal()
    doc.text('has been conferred the Degree of', cx, yConfer - 9, { width: cw, align: 'center', lineBreak: false })

    highlight()
    doc.text(programmeName, cx, yProg - 8, { width: cw, align: 'center', lineBreak: false })

    // Paragraph — biggest, border-to-border (same simple serif font).
    // Each line is stretched toward the left/right borders by widening the gaps
    // between its words (wordSpacing) so the words spread edge-to-edge.
    doc.fontSize(paraSize).fillColor(bodyInk).font(BODY_FONT)
    const drawSpreadLine = (text, yy, cap = 2) => {
      const words   = text.trim().split(/\s+/)
      const gaps    = Math.max(1, words.length - 1)
      const baseW   = doc.widthOfString(text)              // natural width (normal spaces)
      const extra   = Math.max(0, cw - baseW)              // room left up to the borders
      const wordGap = Math.min(extra / gaps, cap)          // just a little spread (small, capped)
      doc.text(text, cx, yy, { width: cw, align: 'center', lineBreak: false, wordSpacing: wordGap })
    }
    drawSpreadLine(para[0], yPara0)
    drawSpreadLine(para[1], yPara1 + 2, 1.5)   // "under the regulations ..." — tighter gap, nudged down 2pt
    drawSpreadLine(para[2], yPara2)
    y = yPara2

    // ── 9. LORDS UNIVERSITY branding — mostly dark maroon, faint gold edge ─
    const brandY = certY + certH - 165   // nudged up a bit
    const goldEdge = '#A67C1A'           // darker gold so yellow shows less

    // "LORDS" — maroon fill + very thin dark-gold stroke (maroon dominant)
    doc.fontSize(24).font('Georgia')
    doc.fillColor(darkRed).strokeColor(goldEdge).lineWidth(0.25)
    doc.text('LORDS', cx, brandY, { width: cw, align: 'center', lineBreak: false, fill: true, stroke: true })
    const brandLordsW = doc.widthOfString('LORDS')

    // "UNIVERSITY" — same treatment, fit to the width of "LORDS"
    doc.font('Georgia').fontSize(10)
    const uniBaseW = doc.widthOfString('UNIVERSITY')
    const uniSpacing = (brandLordsW - uniBaseW) / 'UNIVERSITY'.length  // spread letters to match width
    doc.fillColor(darkRed).strokeColor(goldEdge).lineWidth(0.2)
    doc.text('UNIVERSITY', cx, brandY + 27, {
      width: cw, align: 'center', characterSpacing: Math.max(0, uniSpacing),
      lineBreak: false, fill: true, stroke: true,
    })
    doc.lineWidth(1)   // reset

    // ── 10. SIGNATURES ──────────────────────────────────────────────────────
    // Keep labels a bit higher so the Date line never touches the bottom border.
    const labelY   = certY + certH - 54    // label row (higher than before)
    const sigImgH  = 34                     // signature image height
    const sigImgY  = labelY - sigImgH - 2   // image just above the label

    // Registrar group (signature + Registrar + Date) sits LOWER than President
    const regLabelY = labelY + 2           // pushed down just slightly
    const regX = cx - 6
    const regSigH = sigImgH + 8
    try {
      doc.image(SIGN.registrar, regX - 10, regLabelY - regSigH - 2, { height: regSigH })
    } catch (e) { /* image missing — skip */ }
    doc.fontSize(14).fillColor(black).font('Georgia')
    doc.text('Registrar', regX, regLabelY, { lineBreak: false })
    const dateY = regLabelY + 18
    doc.text('Date: ...../...../.........', regX, dateY, { lineBreak: false })

    // Gold box with roll number — SHINY gradient, same height as the black box,
    // roll number printed in WHITE.
    const boxH2    = 26                      // same height as black box
    const goldBoxX = cx + cw / 2 - 115
    const goldBoxW = 116
    const goldBoxY = dateY - 6
    // Flat metallic orange-gold (like the reference), roll number in a faded gold
    doc.rect(goldBoxX, goldBoxY, goldBoxW, boxH2).fill('#E0A41C')
    doc.fontSize(12).fillColor('#C98A10').font('Helvetica-Bold')
    doc.text(String(student.rollNo || ''), goldBoxX, goldBoxY + boxH2 / 2 - 6, { width: goldBoxW, align: 'center', lineBreak: false })

    // Black security box — towards President, same height, same bottom level
    doc.rect(cx + cw / 2 + 95, goldBoxY, 52, boxH2).fill('#111111')

    // President (right) — signature a bit bigger than the registrar's.
    // Moved down so the "President" label sits level with the black security box.
    const presSigH = sigImgH + 8
    const presX = cxR - 100
    const presLabelY = goldBoxY - 6      // a touch above the black/gold box row
    try {
      doc.image(SIGN.president, presX, presLabelY - presSigH - 2, { height: presSigH })
    } catch (e) { /* image missing — skip */ }
    doc.fontSize(14).fillColor(black).font('Georgia')
    doc.text('President', cxR - 58, presLabelY, { lineBreak: false })

    // ── 11. Simple bottom border (no gold/black strip) ────────────────────────

    doc.end()
  })
}

module.exports = { buildDegreePDF }
