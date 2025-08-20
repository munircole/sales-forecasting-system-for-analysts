CREATE DATABASE IF NOT EXISTS sales_forecasting_db;
USE sales_forecasting_db;

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
);

CREATE TABLE IF NOT EXISTS user_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    permission ENUM('read', 'write', 'admin', 'system') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_permission (user_id, permission)
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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
);

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
);

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
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value JSON NOT NULL,
    updated_by VARCHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

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
);

INSERT INTO users (
    id, 
    email, 
    password_hash, 
    first_name, 
    last_name, 
    company, 
    role, 
    email_verified,
    created_at
) VALUES (
    'admin-001',
    'admin@salesforecast.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS',
    'System',
    'Administrator',
    'Sales Forecasting Inc.',
    'admin',
    TRUE,
    NOW()
) ON DUPLICATE KEY UPDATE email = email;

INSERT INTO user_permissions (user_id, permission) VALUES 
('admin-001', 'read'),
('admin-001', 'write'),
('admin-001', 'admin'),
('admin-001', 'system')
ON DUPLICATE KEY UPDATE permission = permission;

INSERT INTO system_settings (setting_key, setting_value, updated_by) VALUES
('max_file_size', '"104857600"', 'admin-001'),
('allowed_file_types', '["csv", "xlsx", "json"]', 'admin-001'),
('default_session_timeout', '"30"', 'admin-001'),
('backup_retention_days', '"30"', 'admin-001'),
('audit_log_retention_days', '"90"', 'admin-001'),
('email_notifications_enabled', 'true', 'admin-001'),
('sms_notifications_enabled', 'false', 'admin-001'),
('maintenance_mode', 'false', 'admin-001')
ON DUPLICATE KEY UPDATE setting_value = setting_value;
