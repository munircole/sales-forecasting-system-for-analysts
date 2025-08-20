import mysql from "mysql2/promise"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runMigration() {
  let connection

  try {
    console.log("🚀 Starting database migration...")

    const dbConfig = {
      host: process.env.DB_HOST || "localhost",
      port: Number.parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "password",
    }

    console.log(`📡 Connecting to MySQL at ${dbConfig.host}:${dbConfig.port}...`)

    // Connect to MySQL server (without database)
    connection = await mysql.createConnection(dbConfig)

    console.log("✅ Connected to MySQL server")

    // Create database first - use query() instead of execute() for DDL statements
    console.log("📄 Creating database...")
    await connection.query("CREATE DATABASE IF NOT EXISTS sales_forecasting_db")
    await connection.query("USE sales_forecasting_db")

    console.log("📄 Creating tables...")

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        company VARCHAR(255),
        role ENUM('analyst', 'manager', 'director', 'executive', 'admin') DEFAULT 'analyst',
        phone VARCHAR(20),
        timezone VARCHAR(50) DEFAULT 'UTC',
        email_verified BOOLEAN DEFAULT TRUE,
        email_notifications BOOLEAN DEFAULT TRUE,
        sms_notifications BOOLEAN DEFAULT FALSE,
        session_timeout INT DEFAULT 30,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL
      )
    `)

    // Create user_permissions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        permission ENUM('read', 'write', 'admin', 'system') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_permission (user_id, permission)
      )
    `)

    // Create user_sessions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create datasets table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS datasets (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100),
        record_count INT DEFAULT 0,
        column_count INT DEFAULT 0,
        metadata JSON,
        status ENUM('active', 'processing', 'archived', 'error') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_accessed TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create ml_models table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ml_models (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        dataset_id VARCHAR(36),
        name VARCHAR(255) NOT NULL,
        model_type ENUM('linear_regression', 'decision_tree', 'random_forest', 'lstm', 'cnn_1d', 'dense_nn') NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        accuracy DECIMAL(5,4),
        mse DECIMAL(10,6),
        mae DECIMAL(10,6),
        r2_score DECIMAL(5,4),
        hyperparameters JSON,
        training_metrics JSON,
        status ENUM('training', 'deployed', 'archived', 'error') DEFAULT 'training',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE SET NULL
      )
    `)

    // Create reports table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        model_id VARCHAR(36),
        name VARCHAR(255) NOT NULL,
        report_type ENUM('forecast', 'analysis', 'comparison', 'performance') NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        format ENUM('pdf', 'excel', 'csv', 'json') DEFAULT 'pdf',
        parameters JSON,
        status ENUM('generating', 'completed', 'failed') DEFAULT 'generating',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (model_id) REFERENCES ml_models(id) ON DELETE SET NULL
      )
    `)

    // Create notifications table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create system_settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value JSON NOT NULL,
        updated_by VARCHAR(36),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `)

    // Create audit_logs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50) NOT NULL,
        resource_id VARCHAR(36),
        details JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `)

    console.log("👤 Creating default admin user...")

    // Insert admin user - use execute() for parameterized queries
    await connection.execute(
      `INSERT INTO users (
        id, email, password_hash, first_name, last_name, 
        company, role, email_verified, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE email = email`,
      [
        "admin-001",
        "admin@salesforecast.com",
        "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS", // admin123
        "System",
        "Administrator",
        "Sales Forecasting Inc.",
        "admin",
        true,
      ],
    )

    // Insert admin permissions
    const permissions = ["read", "write", "admin", "system"]
    for (const permission of permissions) {
      await connection.execute(
        `INSERT INTO user_permissions (user_id, permission) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE permission = permission`,
        ["admin-001", permission],
      )
    }

    // Insert default system settings
    const settings = [
      ["max_file_size", '"104857600"'],
      ["allowed_file_types", '["csv", "xlsx", "json"]'],
      ["default_session_timeout", '"30"'],
      ["backup_retention_days", '"30"'],
      ["audit_log_retention_days", '"90"'],
      ["email_notifications_enabled", "true"],
      ["sms_notifications_enabled", "false"],
      ["maintenance_mode", "false"],
    ]

    for (const [key, value] of settings) {
      await connection.execute(
        `INSERT INTO system_settings (setting_key, setting_value, updated_by) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE setting_value = setting_value`,
        [key, value, "admin-001"],
      )
    }

    // Verify tables were created
    const [tables] = await connection.query("SHOW TABLES")

    console.log(`📊 Created ${tables.length} tables:`)
    tables.forEach((table) => {
      console.log(`   ✓ ${Object.values(table)[0]}`)
    })

    console.log("\n👤 Default admin user created:")
    console.log("   📧 Email: admin@salesforecast.com")
    console.log("   🔑 Password: admin123")
    console.log("\n🎯 Migration completed successfully!")
  } catch (error) {
    console.error("❌ Migration failed:", error.message)

    if (error.code === "ECONNREFUSED") {
      console.error("💡 Make sure MySQL server is running")
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("💡 Check your database credentials in .env.local")
    } else if (error.code === "ENOENT") {
      console.error("💡 Make sure init_database.sql file exists in scripts folder")
    }

    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

runMigration()
