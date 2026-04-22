ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS profile_picture LONGBLOB NULL,
    ADD COLUMN IF NOT EXISTS profile_picture_content_type VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS profile_picture_file_name VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS profile_picture_updated_at DATETIME(6) NULL;

