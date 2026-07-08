
-- ==========================================
-- PORTFOLIO DATABASE SCHEMA
-- ==========================================

CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150),
    title VARCHAR(150),
    subtitle TEXT,
    bio TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    location VARCHAR(255),
    github TEXT,
    linkedin TEXT,
    instagram TEXT,
    years_exp INTEGER DEFAULT 0,
    projects_count INTEGER DEFAULT 0,
    tech_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE resumes (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255),
    file_path TEXT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    level INTEGER DEFAULT 70,
    category VARCHAR(50),
    icon VARCHAR(50)
);

CREATE TABLE education (
    id SERIAL PRIMARY KEY,
    degree VARCHAR(255),
    institution VARCHAR(255),
    year VARCHAR(50),
    gpa VARCHAR(50),
    location VARCHAR(255),
    description TEXT
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    long_description TEXT,
    github TEXT,
    demo TEXT,
    image TEXT,
    category VARCHAR(100),
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_tags (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    tag VARCHAR(100)
);

CREATE TABLE faqs (
    id SERIAL PRIMARY KEY,
    question TEXT,
    answer TEXT
);

CREATE TABLE contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150),
    email VARCHAR(255),
    subject VARCHAR(255),
    message TEXT,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

