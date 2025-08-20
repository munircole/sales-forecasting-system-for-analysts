import mysql from "mysql2/promise"
import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })

async function cleanup() {
  let connection

  try {
    console.log("🧹 Starting database cleanup...")

    const dbConfig = {
      host: process.env.DB_HOST || "localhost",
      port: Number.parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "sales_forecasting_db",
    }

    connection = await mysql.createConnection(dbConfig)

    console.log("✅ Connected to database")

    // Clean up expired sessions
    const [expiredSessions] = await connection.execute("DELETE FROM user_sessions WHERE expires_at < NOW()")
    console.log(`🗑️ Removed ${expiredSessions.affectedRows} expired sessions`)

    // Clean up old audit logs (older than retention period)
    const retentionDays = process.env.AUDIT_LOG_RETENTION_DAYS || 90
    const [oldLogs] = await connection.execute(
      "DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
      [retentionDays],
    )
    console.log(`🗑️ Removed ${oldLogs.affectedRows} old audit logs`)

    // Clean up failed model training records older than 7 days
    const [failedModels] = await connection.execute(
      "DELETE FROM ml_models WHERE status = 'failed' AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)",
    )
    console.log(`🗑️ Removed ${failedModels.affectedRows} failed model records`)

    // Clean up unread notifications older than 30 days
    const [oldNotifications] = await connection.execute(
      "DELETE FROM notifications WHERE is_read = FALSE AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)",
    )
    console.log(`🗑️ Removed ${oldNotifications.affectedRows} old notifications`)

    console.log("🎯 Database cleanup completed successfully!")
  } catch (error) {
    console.error("❌ Cleanup failed:", error.message)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

cleanup()
