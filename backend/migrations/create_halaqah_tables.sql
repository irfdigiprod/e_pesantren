-- Create halaqah_groups table
CREATE TABLE IF NOT EXISTS halaqah_groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    schedule VARCHAR(255),
    location VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create halaqah_members table
CREATE TABLE IF NOT EXISTS halaqah_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    halaqah_id INT NOT NULL,
    student_id INT NOT NULL,
    joined_at DATE,
    status ENUM('active', 'inactive', 'graduated') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (halaqah_id) REFERENCES halaqah_groups(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    UNIQUE KEY unique_member (halaqah_id, student_id)
);

-- Create halaqah_mentors table
CREATE TABLE IF NOT EXISTS halaqah_mentors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    halaqah_id INT NOT NULL,
    teacher_id INT NOT NULL,
    role ENUM('lead', 'assistant') DEFAULT 'assistant',
    assigned_at DATE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (halaqah_id) REFERENCES halaqah_groups(id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    UNIQUE KEY unique_mentor (halaqah_id, teacher_id)
);

-- Create student_parents table
CREATE TABLE IF NOT EXISTS student_parents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    parent_id INT NOT NULL,
    relationship ENUM('father', 'mother', 'guardian', 'other') DEFAULT 'guardian',
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (parent_id) REFERENCES parents(id),
    UNIQUE KEY unique_relation (student_id, parent_id)
);
