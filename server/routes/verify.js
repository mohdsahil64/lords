const express = require('express')
const jwt = require('jsonwebtoken')
const path = require('path')
const fs = require('fs')
const Student = require('../models/Student')
const { decryptCertId } = require('../utils/certId')

const router = express.Router()

// Shared helper: build the public response shape for a student.
function publicShape(student, photoUrl) {
  return {
    name: student.name,
    registrationId: student.registrationId,
    programme: student.programme,
    department: student.department,
    batchYear: student.batchYear,
    issuedOn: student.issuedOn,
    photoUrl,
  }
}

// Resolve a student's photo file path (photoPath or uploads/photos/<regId>.jpg).
function findPhotoPath(student) {
  if (student.photoPath) {
    const p = path.join(__dirname, '..', student.photoPath)
    if (fs.existsSync(p)) return p
  }
  const fallback = path.join(__dirname, '..', 'uploads', 'photos', `${student.registrationId}.jpg`)
  if (fs.existsSync(fallback)) return fallback
  return null
}

// ── GET /api/verify/cert?id=... ──────────────────────────────────────────────
// PUBLIC — new permanent short-id route. Decrypts the id to a registrationId.
router.get('/cert', async (req, res) => {
  const { id } = req.query
  if (!id) return res.status(400).json({ message: 'Certificate id is required.' })

  const registrationId = decryptCertId(id)
  if (!registrationId) {
    return res.status(401).json({ message: 'Invalid certificate id. This certificate could not be verified.' })
  }

  try {
    const student = await Student.findOne({ registrationId })
    if (!student) return res.status(404).json({ message: 'Certificate not found.' })

    const photoUrl = findPhotoPath(student)
      ? `/api/verify/cert-photo?id=${encodeURIComponent(id)}`
      : null

    res.json(publicShape(student, photoUrl))
  } catch (err) {
    console.error('Cert verify error:', err)
    res.status(500).json({ message: 'Verification failed. Please try again.' })
  }
})

// ── GET /api/verify/cert-photo?id=... ────────────────────────────────────────
// Serves the student photo for a valid certificate id.
router.get('/cert-photo', async (req, res) => {
  const { id } = req.query
  if (!id) return res.status(401).json({ message: 'Certificate id required.' })

  const registrationId = decryptCertId(id)
  if (!registrationId) return res.status(403).json({ message: 'Access denied.' })

  try {
    const student = await Student.findOne({ registrationId })
    if (!student) return res.status(404).json({ message: 'Student not found.' })

    const photoPath = findPhotoPath(student)
    if (!photoPath) return res.status(404).json({ message: 'Photo not found.' })

    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'no-store')
    res.sendFile(photoPath)
  } catch {
    res.status(401).json({ message: 'Invalid certificate id.' })
  }
})

// GET /api/verify/qr?token=...
// PUBLIC route — shows limited info + student photo, NO real degree/marksheet content
router.get('/qr', async (req, res) => {
  const { token } = req.query

  if (!token) {
    return res.status(400).json({ message: 'QR token is required.' })
  }

  try {
    let decoded
    try {
      decoded = jwt.verify(token, process.env.QR_SECRET)
    } catch {
      return res.status(401).json({ message: 'Invalid or expired QR code. This certificate could not be verified.' })
    }

    if (decoded.type !== 'qr-verify') {
      return res.status(401).json({ message: 'Invalid QR token type.' })
    }

    const student = await Student.findOne({ registrationId: decoded.registrationId })
    if (!student) {
      return res.status(404).json({ message: 'Certificate not found.' })
    }

    // No revocation check needed — token is permanent and signed with QR_SECRET

    // Check if student photo exists on server
    // Use student.photoPath if set, otherwise fallback to registrationId-based path
    let photoUrl = null
    if (student.photoPath && fs.existsSync(path.join(__dirname, '..', student.photoPath))) {
      photoUrl = `/api/verify/photo/${student.registrationId}?token=${token}`
    } else {
      // fallback: try uploads/photos/<registrationId>.jpg
      const fallbackPath = path.join(__dirname, '..', 'uploads', 'photos', `${student.registrationId}.jpg`)
      if (fs.existsSync(fallbackPath)) {
        photoUrl = `/api/verify/photo/${student.registrationId}?token=${token}`
      }
    }

    res.json({
      name: student.name,
      registrationId: student.registrationId,
      programme: student.programme,
      department: student.department,
      batchYear: student.batchYear,
      issuedOn: student.issuedOn,
      photoUrl,
    })
  } catch (err) {
    console.error('QR verify error:', err)
    res.status(500).json({ message: 'Verification failed. Please try again.' })
  }
})

// GET /api/verify/photo/:regId?token=...
// Serves student photo ONLY when a valid QR token is provided
// This keeps the photo protected — not guessable by direct URL
router.get('/photo/:regId', async (req, res) => {
  const { token } = req.query
  const { regId } = req.params

  if (!token) return res.status(401).json({ message: 'Token required.' })

  try {
    const decoded = jwt.verify(token, process.env.QR_SECRET)
    if (decoded.type !== 'qr-verify' || decoded.registrationId !== regId) {
      return res.status(403).json({ message: 'Access denied.' })
    }

    const student = await Student.findOne({ registrationId: regId })
    if (!student) return res.status(404).json({ message: 'Student not found.' })

    // Use student.photoPath first, fallback to registrationId-based path
    let photoPath = null
    if (student.photoPath) {
      const p = path.join(__dirname, '..', student.photoPath)
      if (fs.existsSync(p)) photoPath = p
    }
    if (!photoPath) {
      const p = path.join(__dirname, '..', 'uploads', 'photos', `${regId}.jpg`)
      if (fs.existsSync(p)) photoPath = p
    }
    if (!photoPath) return res.status(404).json({ message: 'Photo not found.' })

    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'no-store')
    res.sendFile(photoPath)
  } catch {
    res.status(401).json({ message: 'Invalid token.' })
  }
})

module.exports = router
