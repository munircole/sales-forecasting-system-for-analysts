const mysql = require("mysql2/promise")

async function testConnection() {
  let connection

  try {
    console.log("🧪 Testing database connection...")

    // Load environment variables
    require("dotenv").config({ path: ".env.local" })

    const dbConfig = {
      host: process.env.DB_HOST || "localhost",
      port: Number.parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "password",
      database: process.env.DB_NAME || "sales_forecasting_db",
    }

    console.log(`📡 Connecting to ${dbConfig.database} at ${dbConfig.host}:${dbConfig.port}...`)

    connection = await mysql.createConnection(dbConfig)

    console.log("✅ Database connection successful")

    // Test basic queries
    const [tables] = await connection.execute("SHOW TABLES")
    console.log(`📊 Found ${tables.length} tables:`)
    tables.forEach((table) => {
      console.log(`  - ${Object.values(table)[0]}`)
    })

    // Test user count
    const [users] = await connection.execute("SELECT COUNT(*) as count FROM users")
    console.log(`👥 Users in database: ${users[0].count}`)

    console.log("🎉 Database test completed successfully!")
  } catch (error) {
    console.error("❌ Database test failed:", error.message)

    if (error.code === "ECONNREFUSED") {
      console.error("💡 Make sure MySQL server is running")
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("💡 Check your database credentials in .env.local")
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.error("💡 Database does not exist. Run: npm run db:init")
    }

    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

testConnection()
