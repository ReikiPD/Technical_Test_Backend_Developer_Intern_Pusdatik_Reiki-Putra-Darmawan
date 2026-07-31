-- Membuat tabel attendances
CREATE TABLE IF NOT EXISTS attendances (
    id SERIAL PRIMARY KEY,
    employee_name VARCHAR(100) NOT NULL,
    attendance_date DATE NOT NULL,
    check_in TIME NOT NULL,
    check_out TIME,
    status VARCHAR(20) NOT NULL,
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

-- 3. Validasi 1 Karyawan 1 Presensi per hari (Unique Constraint)
-- Menggunakan Partial Index agar data yang di-soft delete tidak ikut dihitung
CREATE UNIQUE INDEX unique_active_attendance 
ON attendances (employee_name, attendance_date) 
WHERE deleted_at IS NULL;