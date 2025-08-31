# Sales Forecasting System - Complete Setup Guide

## 📋 Prerequisites

Before starting, make sure you have:
- **Node.js 18+** installed
- **MySQL 8.0+** server running
- **Git** (optional, for version control)

## 🚀 Step-by-Step Setup

### 1. Create New Project

\`\`\`bash
# Create new Next.js project
npx create-next-app@latest sales-forecasting-system
cd sales-forecasting-system

# Or clone if you have the repository
git clone <your-repo-url>
cd sales-forecasting-system
\`\`\`

### 2. Install Dependencies

\`\`\`bash
# Install all required packages
npm install next@14.0.0 react@^18 react-dom@^18 mysql2@^3.6.5 bcryptjs@^2.4.3 jsonwebtoken@^9.0.2 uuid@^9.0.1 @radix-ui/react-alert-dialog@^1.0.5 @radix-ui/react-avatar@^1.0.4 @radix-ui/react-dialog@^1.0.5 @radix-ui/react-dropdown-menu@^2.0.6 @radix-ui/react-label@^2.0.2 @radix-ui/react-popover@^1.0.7 @radix-ui/react-progress@^1.0.3 @radix-ui/react-select@^2.0.0 @radix-ui/react-switch@^1.0.3 @radix-ui/react-tabs@^1.0.4 @radix-ui/react-toast@^1.1.5 class-variance-authority@^0.7.0 clsx@^2.0.0 lucide-react@^0.294.0 tailwind-merge@^2.0.0 tailwindcss-animate@^1.0.7 recharts@^2.8.0

# Install dev dependencies
npm install -D typescript@^5 @types/node@^20 @types/react@^18 @types/react-dom@^18 @types/bcryptjs@^2.4.6 @types/jsonwebtoken@^9.0.5 @types/uuid@^9.0.7 autoprefixer@^10.0.1 eslint@^8 eslint-config-next@14.0.0 postcss@^8 tailwindcss@^3.4.17
\`\`\`

### 3. Setup MySQL Database

#### Option A: Local MySQL Installation

1. **Install MySQL** (if not already installed):
   - **Windows**: Download from [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)
   - **macOS**: `brew install mysql`
   - **Ubuntu**: `sudo apt install mysql-server`

2. **Start MySQL service**:
   \`\`\`bash
   # macOS
   brew services start mysql
   
   # Ubuntu
   sudo systemctl start mysql
   
   # Windows - use MySQL Workbench or Services
   \`\`\`

3. **Create database user** (optional but recommended):
   \`\`\`sql
   mysql -u root -p
   CREATE USER 'salesforecast'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON sales_forecasting_db.* TO 'salesforecast'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   \`\`\`

#### Option B: Docker MySQL (Recommended for Development)

\`\`\`bash
# Run MySQL in Docker
docker run --name mysql-salesforecast \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=sales_forecasting_db \
  -e MYSQL_USER=salesforecast \
  -e MYSQL_PASSWORD=password123 \
  -p 3306:3306 \
  -d mysql:8.0

# Verify it's running
docker ps
\`\`\`

### 4. Configure Environment Variables

1. **Copy the example environment file**:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

2. **Edit `.env` file** with your database credentials:
   \`\`\`env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=salesforecast
   DB_PASSWORD=password123
   DB_NAME=sales_forecasting_db
   DB_SSL=false
   
   # Authentication (CHANGE THIS!)
   JWT_SECRET=your-super-secret-jwt-key-make-it-very-long-and-random-123456789
   
   # Storage
   STORAGE_PATH=./storage
   ENCRYPTION_KEY=your-32-byte-hex-encryption-key-here-change-this
   
   # Application
   NODE_ENV=development
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   \`\`\`

### 5. Initialize Database

\`\`\`bash
# Run database migration
npm run db:init
\`\`\`

You should see output like:
\`\`\`
🔌 Connecting to MySQL server...
📖 Reading SQL migration file...
🚀 Executing database migration...
✅ Database migration completed successfully!
📊 Database 'sales_forecasting_db' has been created with all required tables.

📋 Created 9 tables:
   ✓ users
   ✓ user_permissions
   ✓ user_sessions
   ✓ datasets
   ✓ ml_models
   ✓ reports
   ✓ notifications
   ✓ system_settings
   ✓ audit_logs

🎯 Demo admin user created:
   Email: admin@salesforecast.com
   Password: admin123
\`\`\`

### 6. Test Database Connection

\`\`\`bash
# Test the database connection
npm run db:test
\`\`\`

Expected output:
\`\`\`
🔌 Testing database connection...
✅ Database connection successful!
✅ Database 'sales_forecasting_db' exists
✅ Found 9 tables in database
✅ Admin user found: admin@salesforecast.com
\`\`\`

### 7. Setup shadcn/ui (if using)

\`\`\`bash
# Initialize shadcn/ui
npx shadcn@latest init

# Install required components
npx shadcn@latest add button card input label select dialog dropdown-menu tabs progress switch toast avatar alert-dialog popover
\`\`\`

### 8. Create Required Directories

\`\`\`bash
# Create storage directories
mkdir -p storage/datasets
mkdir -p storage/models
mkdir -p storage/reports
mkdir -p storage/backups

# Set permissions (Linux/macOS)
chmod 755 storage
chmod 755 storage/*
\`\`\`

### 9. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000` and you should see the application running!

## 🧪 Testing the Setup

### 1. Test Admin Login
- **Email**: `admin@salesforecast.com`
- **Password**: `admin123`

### 2. Test Database Operations
\`\`\`bash
# Run cleanup (optional)
npm run db:cleanup

# Check database health
curl http://localhost:3000/api/database/health
\`\`\`

### 3. Test API Endpoints
\`\`\`bash
# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@salesforecast.com","password":"admin123"}'

# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'
\`\`\`

## 🔧 Troubleshooting

### Database Connection Issues

1. **"Access denied" error**:
   \`\`\`bash
   # Check MySQL is running
   sudo systemctl status mysql  # Linux
   brew services list | grep mysql  # macOS
   
   # Reset MySQL root password if needed
   sudo mysql_secure_installation
   \`\`\`

2. **"Database does not exist" error**:
   \`\`\`bash
   # Manually create database
   mysql -u root -p
   CREATE DATABASE sales_forecasting_db;
   EXIT;
   
   # Then run migration again
   npm run db:init
   \`\`\`

3. **Connection timeout**:
   - Check if MySQL is running on the correct port (3306)
   - Verify firewall settings
   - Check `DB_HOST` and `DB_PORT` in `.env`

### Application Issues

1. **Module not found errors**:
   \`\`\`bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   \`\`\`

2. **JWT errors**:
   - Make sure `JWT_SECRET` is set in `.env`
   - Use a long, random string (32+ characters)

3. **File permission errors**:
   \`\`\`bash
   # Fix storage permissions
   chmod -R 755 storage/
   \`\`\`

## 📊 Database Schema Overview

The system creates these main tables:

- **`users`** - User accounts and profiles
- **`user_permissions`** - Role-based permissions
- **`user_sessions`** - Active user sessions
- **`datasets`** - Uploaded data files
- **`ml_models`** - Trained machine learning models
- **`reports`** - Generated reports and exports
- **`notifications`** - User notifications
- **`system_settings`** - Application configuration
- **`audit_logs`** - Security and activity logs

## 🎯 Next Steps

1. **Customize the UI** - Modify components in `/components`
2. **Add ML Models** - Implement your forecasting algorithms
3. **Configure Email** - Set up SMTP for notifications
4. **Deploy** - Use Vercel, AWS, or your preferred platform
5. **Security** - Change default passwords and secrets
6. **Backup** - Set up automated database backups

## 🔒 Security Checklist

- [ ] Change default admin password
- [ ] Update `JWT_SECRET` with a secure random string
- [ ] Set strong database passwords
- [ ] Enable SSL in production (`DB_SSL=true`)
- [ ] Configure proper file permissions
- [ ] Set up regular database backups
- [ ] Enable audit logging
- [ ] Use HTTPS in production

Your Sales Forecasting System is now ready to use! 🚀
