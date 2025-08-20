import mysql from "mysql2/promise"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { v4 as uuidv4 } from "uuid"

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "sales_forecasting_db",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  connectionLimit: Number.parseInt(process.env.DB_CONNECTION_LIMIT) || 20,
  acquireTimeout: Number.parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
  timeout: Number.parseInt(process.env.DB_TIMEOUT) || 60000,
}

// Create connection pool
const pool = mysql.createPool(dbConfig)

// Test database connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()
    return { success: true, message: "Database connection successful" }
  } catch (error) {
    console.error("Database connection failed:", error)
    return { success: false, message: error.message }
  }
}

// User authentication functions
export async function createUser(userData) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const { email, password, firstName, lastName, company, role = "analyst", phone, timezone = "UTC" } = userData

    // Check if user already exists
    const [existingUsers] = await connection.execute("SELECT id FROM users WHERE email = ?", [email])

    if (existingUsers.length > 0) {
      throw new Error("User with this email already exists")
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)
    const userId = uuidv4()

    // Insert user
    await connection.execute(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, company, role, phone, timezone, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [userId, email, passwordHash, firstName, lastName, company, role, phone, timezone],
    )

    // Add default permissions based on role
    const permissions = getDefaultPermissions(role)
    for (const permission of permissions) {
      await connection.execute("INSERT INTO user_permissions (user_id, permission) VALUES (?, ?)", [userId, permission])
    }

    // Log audit event
    await logAuditEvent(connection, userId, "user_created", "user", userId, { email, role })

    await connection.commit()

    return { success: true, userId, message: "User created successfully" }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function authenticateUser(email, password) {
  const connection = await pool.getConnection()
  try {
    // Get user with permissions
    const [users] = await connection.execute(
      `SELECT u.*, GROUP_CONCAT(up.permission) as permissions
       FROM users u
       LEFT JOIN user_permissions up ON u.id = up.user_id
       WHERE u.email = ? AND u.is_active = TRUE
       GROUP BY u.id`,
      [email],
    )

    if (users.length === 0) {
      throw new Error("Invalid email or password")
    }

    const user = users[0]

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      throw new Error("Invalid email or password")
    }

    // Update last login
    await connection.execute("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [user.id])

    // Create session token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: `${user.session_timeout}m` },
    )

    // Store session
    const sessionId = uuidv4()
    const expiresAt = new Date(Date.now() + user.session_timeout * 60 * 1000)

    await connection.execute("INSERT INTO user_sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)", [
      sessionId,
      user.id,
      token,
      expiresAt,
    ])

    // Log audit event
    await logAuditEvent(connection, user.id, "user_login", "user", user.id)

    // Format user data
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      company: user.company,
      role: user.role,
      phone: user.phone,
      timezone: user.timezone,
      emailNotifications: user.email_notifications,
      smsNotifications: user.sms_notifications,
      sessionTimeout: user.session_timeout,
      emailVerified: user.email_verified,
      lastLogin: user.last_login,
      permissions: user.permissions ? user.permissions.split(",") : [],
    }

    return { success: true, user: userData, token, sessionId }
  } catch (error) {
    throw error
  } finally {
    connection.release()
  }
}

export async function verifyToken(token) {
  const connection = await pool.getConnection()
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")

    // Check if session exists and is valid
    const [sessions] = await connection.execute(
      `SELECT s.*, u.*, GROUP_CONCAT(up.permission) as permissions
       FROM user_sessions s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN user_permissions up ON u.id = up.user_id
       WHERE s.token = ? AND s.expires_at > NOW() AND u.is_active = TRUE
       GROUP BY s.id`,
      [token],
    )

    if (sessions.length === 0) {
      throw new Error("Invalid or expired session")
    }

    const session = sessions[0]
    const userData = {
      id: session.user_id,
      email: session.email,
      firstName: session.first_name,
      lastName: session.last_name,
      company: session.company,
      role: session.role,
      phone: session.phone,
      timezone: session.timezone,
      emailNotifications: session.email_notifications,
      smsNotifications: session.sms_notifications,
      sessionTimeout: session.session_timeout,
      emailVerified: session.email_verified,
      lastLogin: session.last_login,
      permissions: session.permissions ? session.permissions.split(",") : [],
    }

    return { success: true, user: userData }
  } catch (error) {
    throw new Error("Invalid or expired token")
  } finally {
    connection.release()
  }
}

export async function logoutUser(token) {
  const connection = await pool.getConnection()
  try {
    // Get session info for audit log
    const [sessions] = await connection.execute("SELECT user_id FROM user_sessions WHERE token = ?", [token])

    if (sessions.length > 0) {
      const userId = sessions[0].user_id

      // Delete session
      await connection.execute("DELETE FROM user_sessions WHERE token = ?", [token])

      // Log audit event
      await logAuditEvent(connection, userId, "user_logout", "user", userId)
    }

    return { success: true, message: "Logged out successfully" }
  } catch (error) {
    throw error
  } finally {
    connection.release()
  }
}

export async function updateUserProfile(userId, profileData) {
  const connection = await pool.getConnection()
  try {
    const { firstName, lastName, email, company, phone, timezone } = profileData

    await connection.execute(
      `UPDATE users 
       SET first_name = ?, last_name = ?, email = ?, company = ?, phone = ?, timezone = ?
       WHERE id = ?`,
      [firstName, lastName, email, company, phone, timezone, userId],
    )

    // Log audit event
    await logAuditEvent(connection, userId, "profile_updated", "user", userId, profileData)

    return { success: true, message: "Profile updated successfully" }
  } catch (error) {
    throw error
  } finally {
    connection.release()
  }
}

export async function changeUserPassword(userId, currentPassword, newPassword) {
  const connection = await pool.getConnection()
  try {
    // Get current password hash
    const [users] = await connection.execute("SELECT password_hash FROM users WHERE id = ?", [userId])

    if (users.length === 0) {
      throw new Error("User not found")
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password_hash)
    if (!isValidPassword) {
      throw new Error("Current password is incorrect")
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12)

    // Update password
    await connection.execute("UPDATE users SET password_hash = ? WHERE id = ?", [newPasswordHash, userId])

    // Log audit event
    await logAuditEvent(connection, userId, "password_changed", "user", userId)

    return { success: true, message: "Password changed successfully" }
  } catch (error) {
    throw error
  } finally {
    connection.release()
  }
}

// Dataset management functions
export async function saveDataset(userId, datasetInfo) {
  const connection = await pool.getConnection()
  try {
    const datasetId = uuidv4()
    const { name, originalFilename, filePath, fileSize, mimeType, recordCount, columnCount, metadata } = datasetInfo

    await connection.execute(
      `INSERT INTO datasets (id, user_id, name, original_filename, file_path, file_size, mime_type, record_count, column_count, metadata, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        datasetId,
        userId,
        name,
        originalFilename,
        filePath,
        fileSize,
        mimeType,
        recordCount,
        columnCount,
        JSON.stringify(metadata),
      ],
    )

    // Log audit event
    await logAuditEvent(connection, userId, "dataset_created", "dataset", datasetId, { name, fileSize })

    return { success: true, datasetId, message: "Dataset saved successfully" }
  } catch (error) {
    throw error
  } finally {
    connection.release()
  }
}

export async function getUserDatasets(userId) {
  const connection = await pool.getConnection()
  try {
    const [datasets] = await connection.execute(
      `SELECT id, name, original_filename, file_size, record_count, column_count, status, created_at, updated_at, last_accessed
       FROM datasets 
       WHERE user_id = ? AND status != 'archived'
       ORDER BY created_at DESC`,
      [userId],
    )

    return { success: true, datasets }
  } catch (error) {
    throw error
  } finally {
    connection.release()
  }
}

// ML Model management functions
export async function saveModel(userId, modelInfo) {
  const connection = await pool.getConnection()
  try {
    const modelId = uuidv4()
    const {
      datasetId,
      name,
      modelType,
      filePath,
      fileSize,
      accuracy,
      mse,
      mae,
      r2Score,
      hyperparameters,
      trainingMetrics,
    } = modelInfo

    await connection.execute(
      `INSERT INTO ml_models (id, user_id, dataset_id, name, model_type, file_path, file_size, accuracy, mse, mae, r2_score, hyperparameters, training_metrics, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'deployed')`,
      [
        modelId,
        userId,
        datasetId,
        name,
        modelType,
        filePath,
        fileSize,
        accuracy,
        mse,
        mae,
        r2Score,
        JSON.stringify(hyperparameters),
        JSON.stringify(trainingMetrics),
      ],
    )

    // Log audit event
    await logAuditEvent(connection, userId, "model_created", "model", modelId, { name, modelType, accuracy })

    return { success: true, modelId, message: "Model saved successfully" }
  } catch (error) {
    throw error
  } finally {
    connection.release()
  }
}

export async function getUserModels(userId) {
  const connection = await pool.getConnection()
  try {
    const [models] = await connection.execute(
      `SELECT m.*, d.name as dataset_name
       FROM ml_models m
       LEFT JOIN datasets d ON m.dataset_id = d.id
       WHERE m.user_id = ? AND m.status != 'archived'
       ORDER BY m.created_at DESC`,
      [userId],
    )

    return { success: true, models }
  } catch (error) {
    throw error
  } finally {
    connection.release()
  }
}

// Report management functions
export async function saveReport(userId, reportInfo) {
  const connection = await pool.getConnection()
  try {
    const reportId = uuidv4()
    const { modelId, name, reportType, filePath, fileSize, format, parameters } = reportInfo

    await connection.execute(
      `INSERT INTO reports (id, user_id, model_id, name, report_type, file_path, file_size, format, parameters, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
      [reportId, userId, modelId, name, reportType, filePath, fileSize, format, JSON.stringify(parameters)],
    )

    // Log audit event
    await logAuditEvent(connection, userId, "report_generated", "report", reportId, { name, reportType, format })

    return { success: true, reportId, message: "Report saved successfully" }
  } catch (error) {
    throw error
  } finally {
    connection.release()
  }
}

export async function getUserReports(userId) {
  const connection = await pool.getConnection()
  try {
    const [reports] = await connection.execute(
      `SELECT r.*, m.name as model_name
       FROM reports r
       LEFT JOIN ml_models m ON r.model_id = m.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [userId],
    )

    return { success: true, reports }
  } catch (error) {
    throw error
  } finally {
    connection.release()
  }
}

// Storage management functions
export async function getStorageUsage(userId) {
  const connection = await pool.getConnection()
  try {
    const [results] = await connection.execute(
      `SELECT 
         COALESCE(SUM(CASE WHEN 'datasets' THEN file_size ELSE 0 END), 0) as datasets_size,
         COALESCE(SUM(CASE WHEN 'models' THEN file_size ELSE 0 END), 0) as models_size,
         COALESCE(SUM(CASE WHEN 'reports' THEN file_size ELSE 0 END), 0) as reports_size,
         COUNT(CASE WHEN 'datasets' THEN 1 END) as datasets_count,
         COUNT(CASE WHEN 'models' THEN 1 END) as models_count,
         COUNT(CASE WHEN 'reports' THEN 1 END) as reports_count
       FROM (
         SELECT file_size, 'datasets' as type FROM datasets WHERE user_id = ? AND status = 'active'
         UNION ALL
         SELECT file_size, 'models' as type FROM ml_models WHERE user_id = ? AND status = 'deployed'
         UNION ALL
         SELECT file_size, 'reports' as type FROM reports WHERE user_id = ?
       ) as combined`,
      [userId, userId, userId],
    )

    const usage = results[0]
    const totalUsed = (usage.datasets_size || 0) + (usage.models_size || 0) + (usage.reports_size || 0)

    return {
      success: true,
      usage: {
        totalUsed,
        datasetsSize: usage.datasets_size || 0,
        modelsSize: usage.models_size || 0,
        reportsSize: usage.reports_size || 0,
        datasetsCount: usage.datasets_count || 0,
        modelsCount: usage.models_count || 0,
        reportsCount: usage.reports_count || 0,
      },
    }
  } catch (error) {
    throw error
  } finally {
    connection.release()
  }
}

// System settings functions
export async function getSystemSettings() {
  const connection = await pool.getConnection()
  try {
    const [settings] = await connection.execute("SELECT setting_key, setting_value FROM system_settings")

    const settingsObj = {}
    settings.forEach((setting) => {
      try {
        settingsObj[setting.setting_key] = JSON.parse(setting.setting_value)
      } catch {
        settingsObj[setting.setting_key] = setting.setting_value
      }
    })

    return { success: true, settings: settingsObj }
  } catch (error) {
    throw error
  } finally {
    connection.release()
  }
}

export async function updateSystemSetting(settingKey, settingValue, updatedBy) {
  const connection = await pool.getConnection()
  try {
    await connection.execute(
      `INSERT INTO system_settings (setting_key, setting_value, updated_by)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
      [settingKey, JSON.stringify(settingValue), updatedBy],
    )

    // Log audit event
    await logAuditEvent(connection, updatedBy, "setting_updated", "setting", settingKey, { settingKey, settingValue })

    return { success: true, message: "Setting updated successfully" }
  } catch (error) {
    throw error
  } finally {
    connection.release()
  }
}

// Notification functions
export async function createNotification(userId, title, message, type = "info") {
  const connection = await pool.getConnection()
  try {
    const notificationId = uuidv4()

    await connection.execute("INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)", [
      notificationId,
      userId,
      title,
      message,
      type,
    ])

    return { success: true, notificationId }
  } catch (error) {
    throw error
  } finally {
    connection.release()
  }
}

export async function getUserNotifications(userId, limit = 50) {
  const connection = await pool.getConnection()
  try {
    const [notifications] = await connection.execute(
      `SELECT id, title, message, type, is_read, created_at
       FROM notifications 
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit],
    )

    return { success: true, notifications }
  } catch (error) {
    throw error
  } finally {
    connection.release()
  }
}

// Audit logging function
async function logAuditEvent(connection, userId, action, resourceType, resourceId, details = {}) {
  try {
    await connection.execute(
      "INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)",
      [userId, action, resourceType, resourceId, JSON.stringify(details)],
    )
  } catch (error) {
    console.error("Failed to log audit event:", error)
  }
}

// Helper functions
function getDefaultPermissions(role) {
  const permissions = {
    analyst: ["read"],
    manager: ["read", "write"],
    director: ["read", "write"],
    executive: ["read", "write"],
    admin: ["read", "write", "admin", "system"],
  }
  return permissions[role] || ["read"]
}

// Cleanup expired sessions
export async function cleanupExpiredSessions() {
  const connection = await pool.getConnection()
  try {
    await connection.execute("DELETE FROM user_sessions WHERE expires_at < NOW()")
    return { success: true, message: "Expired sessions cleaned up" }
  } catch (error) {
    throw error
  } finally {
    connection.release()
  }
}

// Database health check
export async function getDatabaseHealth() {
  const connection = await pool.getConnection()
  try {
    const [status] = await connection.execute('SHOW STATUS LIKE "Threads_connected"')
    const [variables] = await connection.execute('SHOW VARIABLES LIKE "max_connections"')

    const activeConnections = Number.parseInt(status[0].Value)
    const maxConnections = Number.parseInt(variables[0].Value)

    // Get database size
    const [sizeResult] = await connection.execute(
      `
      SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS db_size_mb
      FROM information_schema.tables
      WHERE table_schema = ?
    `,
      [dbConfig.database],
    )

    return {
      success: true,
      health: {
        activeConnections,
        maxConnections,
        connectionUsage: (activeConnections / maxConnections) * 100,
        databaseSize: sizeResult[0].db_size_mb || 0,
        status: "healthy",
      },
    }
  } catch (error) {
    return {
      success: false,
      health: {
        status: "unhealthy",
        error: error.message,
      },
    }
  } finally {
    connection.release()
  }
}

export default pool
