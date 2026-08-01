const jwt = require("jsonwebtoken");

const login = (req, res) => {
  const { username, password } = req.body;

  // Mengambil kredensial yang valid dari file .env
  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;

  // Memeriksa apakah file .env sudah dikonfigurasi dengan benar (Opsional tapi direkomendasikan)
  if (!validUsername || !validPassword) {
    console.error("ADMIN_USERNAME atau ADMIN_PASSWORD belum diset di .env");
    return res.status(500).json({
      success: false,
      message: "Internal server configuration error",
    });
  }

  // Mencocokkan input user dengan data dari .env
  if (username === validUsername && password === validPassword) {
    // Membuat payload data yang akan disimpan di dalam token
    const payload = {
      user: username,
      role: "admin",
    };

    // Generate token dengan masa berlaku 30 menit
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "30m",
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
    });
  }

  // Jika kredensial salah
  return res.status(401).json({
    success: false,
    message: "Invalid username or password",
  });
};

module.exports = { login };
