const express = require('express')
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')
const Student = require('../models/Student')

const router = express.Router()

// Rate limiter: 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many login attempts. Please wait 15 minutes and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  const { identifier, password } = req.body

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Registration ID and password are required.' })
  }

  try {
    // Find by registration ID, email, or phone
    const student = await Student.findOne({
      $or: [
        { registrationId: identifier },
        { email: identifier },
        { phone: identifier }
      ]
    })

    if (!student) {
      return res.status(401).json({ message: 'Your account has been deactivated. Please contact your Institute Administrator for further assistance' })
    }

    // Check if locked
    if (student.isLocked()) {
      const remaining = Math.ceil((student.lockUntil - Date.now()) / 60000)
      return res.status(429).json({ message: `Account locked. Try again in ${remaining} minute(s).` })
    }

    const isMatch = await student.comparePassword(password)
    if (!isMatch) {
      // Increment failed attempts
      student.loginAttempts += 1
      if (student.loginAttempts >= 5) {
        student.lockUntil = new Date(Date.now() + 15 * 60 * 1000)
        student.loginAttempts = 0
      }
      await student.save()
      return res.status(401).json({ message: 'Your account has been deactivated. Please contact your Institute Administrator for further assistance' })
    }

    // Reset on success
    student.loginAttempts = 0
    student.lockUntil = null
    await student.save()

    const token = jwt.sign(
      { id: student._id, registrationId: student.registrationId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    res.json({
      token,
      user: {
        id: student._id,
        name: student.name,
        registrationId: student.registrationId,
        programme: student.programme,
        department: student.department,
        batchYear: student.batchYear
      }
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
})

module.exports = router
