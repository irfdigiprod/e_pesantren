-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    building VARCHAR(255),
    floor VARCHAR(50),
    capacity INT,
    description TEXT,
    status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create room_supervisors table
CREATE TABLE IF NOT EXISTS room_supervisors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    teacher_id INT NOT NULL,
    role ENUM('lead', 'assistant') DEFAULT 'assistant',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    UNIQUE KEY unique_supervisor (room_id, teacher_id)
);

-- Add room_id column to students table
ALTER TABLE students ADD COLUMN room_id INT;
ALTER TABLE students ADD CONSTRAINT fk_students_room FOREIGN KEY (room_id) REFERENCES rooms(id);
