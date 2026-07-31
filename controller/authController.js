const jwt = require('jsonwebtoken');

const login = (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'pusdatik123') {
    
    // Membuat payload data yang akan disimpan di dalam token
    const payload = {
      user: username,
      role: 'admin'
    };

    // Generate token dengan masa berlaku 1 hari
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30m' });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: token
    });
  }

  // Jika kredensial salah
  return res.status(401).json({
    success: false,
    message: "Invalid username or password"
  });
};

module.exports = { login };