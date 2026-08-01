DROP TABLE IF EXISTS attendances CASCADE;

-- Membuat tabel attendances
CREATE TABLE IF NOT EXISTS attendances (
    id SERIAL PRIMARY KEY,
    employee_name VARCHAR(100) NOT NULL,
    attendance_date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status VARCHAR(20) NOT NULL,
    notes TEXT, -- Kolom notes ditambahkan di sini (bisa dikosongkan/NULL)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL -- Implementasi fitur Soft Delete
);

-- Implementasi Business Rules (Mandatory Requirements)

-- 1. Validasi Status (Hanya menerima nilai tertentu)
ALTER TABLE attendances 
ADD CONSTRAINT check_status 
CHECK (status IN ('Present', 'Sick', 'Leave', 'Absent'));

-- 2. Validasi Waktu (Check-out tidak boleh lebih awal dari Check-in)
ALTER TABLE attendances 
ADD CONSTRAINT check_waktu_logis 
CHECK (check_out IS NULL OR check_out >= check_in);

-- 3. Validasi Konsistensi Status dan Waktu
-- Jika Present, check_in WAJIB ada. Jika selain Present, waktu WAJIB kosong.
ALTER TABLE attendances
ADD CONSTRAINT check_waktu_sesuai_status
CHECK (
    (status = 'Present' AND check_in IS NOT NULL) OR 
    (status IN ('Sick', 'Leave', 'Absent') AND check_in IS NULL AND check_out IS NULL)
);

-- 4. Validasi 1 Karyawan 1 Presensi per hari (Unique Constraint)
-- Menggunakan Partial Index agar data yang di-soft delete tidak ikut dihitung
CREATE UNIQUE INDEX unique_active_attendance 
ON attendances (employee_name, attendance_date) 
WHERE deleted_at IS NULL;