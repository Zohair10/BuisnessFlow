import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY environment variable is not set')
  return Buffer.from(key, 'base64')
}

export function encrypt(text: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const tag = cipher.getAuthTag()

  const payload = {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted,
  }

  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

export function decrypt(encryptedText: string): string {
  const key = getKey()

  const payload = JSON.parse(
    Buffer.from(encryptedText, 'base64').toString('utf8')
  )

  const iv = Buffer.from(payload.iv, 'base64')
  const tag = Buffer.from(payload.tag, 'base64')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(payload.data, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
