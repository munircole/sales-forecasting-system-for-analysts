import fs from "fs/promises"
import path from "path"
import crypto from "crypto"
import { v4 as uuidv4 } from "uuid"

const STORAGE_PATH = process.env.STORAGE_PATH || "./storage"
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex")

// Ensure storage directories exist
async function ensureStorageDirectories() {
  const directories = ["datasets", "models", "reports", "temp"]

  for (const dir of directories) {
    const dirPath = path.join(STORAGE_PATH, dir)
    try {
      await fs.access(dirPath)
    } catch {
      await fs.mkdir(dirPath, { recursive: true })
    }
  }
}

// Initialize storage
ensureStorageDirectories()

// Encrypt file content
function encryptData(data) {
  const algorithm = "aes-256-gcm"
  const key = Buffer.from(ENCRYPTION_KEY, "hex")
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(algorithm, key)

  let encrypted = cipher.update(data, "utf8", "hex")
  encrypted += cipher.final("hex")

  const authTag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  }
}

// Decrypt file content
function decryptData(encryptedData, iv, authTag) {
  const algorithm = "aes-256-gcm"
  const key = Buffer.from(ENCRYPTION_KEY, "hex")
  const decipher = crypto.createDecipher(algorithm, key)

  decipher.setAuthTag(Buffer.from(authTag, "hex"))

  let decrypted = decipher.update(encryptedData, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

// Save file with encryption
export async function saveFile(fileBuffer, fileName, category = "temp") {
  try {
    const fileId = uuidv4()
    const fileExtension = path.extname(fileName)
    const encryptedFileName = `${fileId}${fileExtension}.enc`
    const filePath = path.join(STORAGE_PATH, category, encryptedFileName)

    // Encrypt file content
    const { encrypted, iv, authTag } = encryptData(fileBuffer.toString("base64"))

    // Create metadata
    const metadata = {
      originalName: fileName,
      fileId,
      iv,
      authTag,
      size: fileBuffer.length,
      mimeType: getMimeType(fileExtension),
      created: new Date().toISOString(),
    }

    // Save encrypted file
    await fs.writeFile(filePath, encrypted)

    // Save metadata
    const metadataPath = path.join(STORAGE_PATH, category, `${fileId}.meta`)
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    return {
      success: true,
      fileId,
      filePath: path.join(category, encryptedFileName),
      metadata,
    }
  } catch (error) {
    throw new Error(`Failed to save file: ${error.message}`)
  }
}

// Read file with decryption
export async function readFile(fileId, category = "temp") {
  try {
    const metadataPath = path.join(STORAGE_PATH, category, `${fileId}.meta`)
    const metadataContent = await fs.readFile(metadataPath, "utf8")
    const metadata = JSON.parse(metadataContent)

    const fileExtension = path.extname(metadata.originalName)
    const encryptedFileName = `${fileId}${fileExtension}.enc`
    const filePath = path.join(STORAGE_PATH, category, encryptedFileName)

    const encryptedContent = await fs.readFile(filePath, "utf8")
    const decryptedContent = decryptData(encryptedContent, metadata.iv, metadata.authTag)

    return {
      success: true,
      content: Buffer.from(decryptedContent, "base64"),
      metadata,
    }
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`)
  }
}

// Delete file and metadata
export async function deleteFile(fileId, category = "temp") {
  try {
    const metadataPath = path.join(STORAGE_PATH, category, `${fileId}.meta`)
    const metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"))

    const fileExtension = path.extname(metadata.originalName)
    const encryptedFileName = `${fileId}${fileExtension}.enc`
    const filePath = path.join(STORAGE_PATH, category, encryptedFileName)

    // Delete both file and metadata
    await Promise.all([fs.unlink(filePath), fs.unlink(metadataPath)])

    return { success: true, message: "File deleted successfully" }
  } catch (error) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

// Get storage usage for a category
export async function getStorageUsage(category) {
  try {
    const categoryPath = path.join(STORAGE_PATH, category)
    const files = await fs.readdir(categoryPath)

    let totalSize = 0
    let fileCount = 0

    for (const file of files) {
      if (file.endsWith(".meta")) {
        fileCount++
        const metadataPath = path.join(categoryPath, file)
        const metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"))
        totalSize += metadata.size
      }
    }

    return {
      success: true,
      usage: {
        totalSize,
        fileCount,
        category,
      },
    }
  } catch (error) {
    throw new Error(`Failed to get storage usage: ${error.message}`)
  }
}

// Clean up temporary files older than specified hours
export async function cleanupTempFiles(hoursOld = 24) {
  try {
    const tempPath = path.join(STORAGE_PATH, "temp")
    const files = await fs.readdir(tempPath)
    const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000)

    let deletedCount = 0

    for (const file of files) {
      if (file.endsWith(".meta")) {
        const metadataPath = path.join(tempPath, file)
        const metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"))
        const createdTime = new Date(metadata.created)

        if (createdTime < cutoffTime) {
          await deleteFile(metadata.fileId, "temp")
          deletedCount++
        }
      }
    }

    return {
      success: true,
      message: `Cleaned up ${deletedCount} temporary files`,
      deletedCount,
    }
  } catch (error) {
    throw new Error(`Failed to cleanup temp files: ${error.message}`)
  }
}

// Helper function to get MIME type
function getMimeType(extension) {
  const mimeTypes = {
    ".csv": "text/csv",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".json": "application/json",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
  }

  return mimeTypes[extension.toLowerCase()] || "application/octet-stream"
}

// Backup storage data
export async function backupStorage(backupPath) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const backupDir = path.join(backupPath, `backup-${timestamp}`)

    await fs.mkdir(backupDir, { recursive: true })

    // Copy all storage directories
    const categories = ["datasets", "models", "reports"]

    for (const category of categories) {
      const sourcePath = path.join(STORAGE_PATH, category)
      const destPath = path.join(backupDir, category)

      try {
        await fs.cp(sourcePath, destPath, { recursive: true })
      } catch (error) {
        console.warn(`Warning: Could not backup ${category}:`, error.message)
      }
    }

    return {
      success: true,
      backupPath: backupDir,
      message: "Storage backup completed successfully",
    }
  } catch (error) {
    throw new Error(`Failed to backup storage: ${error.message}`)
  }
}

export { STORAGE_PATH, ENCRYPTION_KEY }
