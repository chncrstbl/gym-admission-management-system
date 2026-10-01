CREATE TABLE IF NOT EXISTS attendance (
    id INT NOT NULL AUTO_INCREMENT,
    member_id INT NOT NULL,
    check_in_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    check_out_time DATETIME NULL,
    terminal VARCHAR(100) NULL,
    method VARCHAR(50) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Approved',
    PRIMARY KEY (id),
    INDEX idx_attendance_member_time (member_id, check_in_time),
    CONSTRAINT fk_attendance_member FOREIGN KEY (member_id) REFERENCES members (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS member_measurements (
    id INT NOT NULL AUTO_INCREMENT,
    member_id INT NOT NULL,
    measured_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    weight_kg DECIMAL(6, 2) NULL,
    body_fat_percent DECIMAL(5, 2) NULL,
    muscle_mass_kg DECIMAL(6, 2) NULL,
    notes TEXT NULL,
    PRIMARY KEY (id),
    INDEX idx_member_measurements_member_date (member_id, measured_at),
    CONSTRAINT fk_member_measurements_member FOREIGN KEY (member_id) REFERENCES members (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS member_goals (
    id INT NOT NULL AUTO_INCREMENT,
    member_id INT NOT NULL,
    metric VARCHAR(32) NOT NULL,
    target_value DECIMAL(8, 2) NOT NULL,
    unit VARCHAR(16) NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_member_goal_metric (member_id, metric),
    CONSTRAINT fk_member_goals_member FOREIGN KEY (member_id) REFERENCES members (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS member_settings (
    member_id INT NOT NULL,
    email_receipts TINYINT(1) NOT NULL DEFAULT 1,
    sms_alerts TINYINT(1) NOT NULL DEFAULT 1,
    promotions TINYINT(1) NOT NULL DEFAULT 0,
    attendance_logs TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (member_id),
    CONSTRAINT fk_member_settings_member FOREIGN KEY (member_id) REFERENCES members (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS announcements (
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB;