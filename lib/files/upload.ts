import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

let s3Client: S3Client | null = null

function getS3Client(): S3Client | null {
  if (s3Client) return s3Client
  if (!process.env.AWS_ACCESS_KEY_ID) return null
  s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' })
  return s3Client
}

function getBucket(): string {
  return process.env.S3_BUCKET_NAME || 'buisnessflow-uploads'
}

export async function uploadFile(
  file: File | Buffer,
  workspaceId: string,
  fileName: string
): Promise<{ objectKey: string; fileSize: number }> {
  const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file
  const objectKey = `workspaces/${workspaceId}/uploads/${Date.now()}-${fileName}`

  const client = getS3Client()
  if (!client) {
    throw new Error('S3 storage is not configured. Set AWS_ACCESS_KEY_ID and related env vars.')
  }

  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: objectKey,
      Body: buffer,
      ContentType: file instanceof File ? file.type : 'application/octet-stream',
    })
  )

  return {
    objectKey,
    fileSize: buffer.length,
  }
}

export async function deleteFile(objectKey: string): Promise<void> {
  if (!s3Client) return

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: objectKey,
    })
  )
}

export function getMaxFileSize(plan: string): number {
  switch (plan) {
    case 'PRO':
      return 100 * 1024 * 1024 // 100 MB
    case 'ENTERPRISE':
      return 500 * 1024 * 1024 // 500 MB
    default:
      return 25 * 1024 * 1024 // 25 MB
  }
}

export function validateFileType(fileName: string): { valid: boolean; type?: 'csv' | 'excel' } {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'csv') return { valid: true, type: 'csv' }
  if (ext === 'xlsx' || ext === 'xls') return { valid: true, type: 'excel' }
  return { valid: false }
}
