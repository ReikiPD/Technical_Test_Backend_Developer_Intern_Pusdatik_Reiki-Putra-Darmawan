const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  // Mengambil token dari header 'Authorization'
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(403).json({
      success: false,
      message: "Access Denied. No token provided."
    });
  }

  // Format header biasanya: "Bearer <token>"
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({
      success: false,
      message: "Access Denied. Invalid token format."
    });
  }

  try {
    // Verifikasi token menggunakan secret key dari .env
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // Menyimpan data hasil verifikasi ke request object agar bisa dipakai di controller
    req.user = verified; 
    
    // Lanjut ke proses berikutnya (controller)
    next(); 
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    });
  }
};

module.exports = authenticateJWT;