-- Mengosongkan tabel sebelum seeding agar tidak terjadi duplikasi saat dieksekusi berulang kali
TRUNCATE TABLE attendances RESTART IDENTITY CASCADE;

-- Insert data dummy presensi (minimal 10 data)
INSERT INTO attendances (employee_name, attendance_date, status, check_in, check_out) VALUES
('Budi Santoso', CURRENT_DATE, 'Present', '08:00:00', '17:00:00'),
('Siti Aminah', CURRENT_DATE, 'Present', '07:45:00', '16:50:00'),
('Andi Wijaya', CURRENT_DATE, 'Sick', NULL, NULL),
('Dewi Lestari', CURRENT_DATE - INTERVAL '1 day', 'Present', '08:15:00', '17:10:00'),
('Reiki', CURRENT_DATE, 'Leave', NULL, NULL),
('Caca', CURRENT_DATE, 'Present', '08:10:00', '17:05:00'),
('Ahmad Fauzi', CURRENT_DATE - INTERVAL '2 days', 'Absent', NULL, NULL),
('Ratna Sari', CURRENT_DATE, 'Present', '07:55:00', '17:00:00'),
('Rizky Pratama', CURRENT_DATE - INTERVAL '1 day', 'Sick', NULL, NULL),
('Diana Fitri', CURRENT_DATE - INTERVAL '3 days', 'Present', '07:50:00', '16:55:00'),
('Bambang Pamungkas', CURRENT_DATE, 'Absent', NULL, NULL),
('Reiki', CURRENT_DATE - INTERVAL '1 day', 'Present', '08:00:00', '17:15:00'),
('Caca', CURRENT_DATE - INTERVAL '1 day', 'Present', '07:55:00', '17:00:00'),
('Arif Rahman', CURRENT_DATE - INTERVAL '2 days', 'Leave', NULL, NULL),
('Nurul Huda', CURRENT_DATE, 'Present', '08:05:00', '17:20:00');