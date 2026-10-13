/**
 * Permanent, short certificate id for the public QR verification URL.
 *
 * We encrypt a student's registrationId into a short base64 string that goes
 * into the QR link:  <VERIFY_URL>?id=<certId>
 *
 * IMPORTANT — the output is DETERMINISTIC and PERMANENT:
 *   The same registrationId always produces the exact same id, so QR codes
 *   printed on already-issued degrees keep decoding forever. To achieve this we
 *   derive a FIXED IV from the secret instead of using a random IV. The usual
 *   security tradeoff of a fixed IV (identical plaintexts produce identical
 *   ciphertext) is acceptable here: the "plaintext" is just a public
 *   registration id, not a secret, and stability is the whole point.
 */

const crypto = require('crypto')

const SECRET = process.env.CERT_ID_SECRET || 'Lords@CertId#2026$Permanent!Verify'

// 16-byte key + 16-byte IV, both derived from the secret so they never change.
const KEY = crypto.createHash('md5').update(SECRET + '::key').digest()          // 16 bytes
const IV  = crypto.createHash('md5').update(SECRET + '::iv').digest()           // 16 bytes
const ALGO = 'aes-128-cbc'

/**
 * Encrypt a registrationId into a short permanent base64 id.
 * @param {string|number} registrationId
 * @returns {string} base64 id (e.g. "A4040ek97+QlKoD2+bGBgw==")
 */
function encryptCertId(registrationId) {
  const cipher = crypto.createCipheriv(ALGO, KEY, IV)
  const enc = Buffer.concat([
    cipher.update(String(registrationId), 'utf8'),
    cipher.final(),
  ])
  return enc.toString('base64')
}

/**
 * Decrypt a cert id back into the registrationId.
 * @param {string} idString base64 id from the QR URL (already URL-decoded)
 * @returns {string|null} registrationId, or null if the id is invalid
 */
function decryptCertId(idString) {
  try {
    if (!idString) return null
    const decipher = crypto.createDecipheriv(ALGO, KEY, IV)
    const dec = Buffer.concat([
      decipher.update(Buffer.from(idString, 'base64')),
      decipher.final(),
    ])
    return dec.toString('utf8')
  } catch {
    return null
  }
}

module.exports = { encryptCertId, decryptCertId }
