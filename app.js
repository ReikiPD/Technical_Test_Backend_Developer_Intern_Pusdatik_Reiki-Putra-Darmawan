const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const morgan = require('morgan');
const pool = require('./config/db');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();

app.use(morgan('dev'));
app.use(express.json());

pool.query('SELECT NOW()')
  .then(res => console.log('DB Connected:', res.rows[0]))
  .catch(err => console.error(err));

// 1. Konfigurasi Swagger Option
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Attendance API - Pusdatik Intern Test',
      version: '1.0.0',
      description: 'Dokumentasi REST API untuk sistem manajemen presensi.',
    },
    servers: [
      {
        url: 'http://localhost:3000', 
        description: 'Local server'
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  // Pastikan path ini menunjuk ke direktori routes tempat kamu menaruh anotasi @swagger
  apis: ['./routes/*.js'], 
};

// 2. Inisialisasi Swagger JSDoc
const swaggerSpecs = swaggerJsdoc(swaggerOptions);

// 3. PASANG ROUTE UI SWAGGER DI SINI (Harus di atas attendanceRoutes)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// 4. PASANG ROUTER APLIKASI
app.use('/', attendanceRoutes);

app.get('/', (req, res) => {
  res.send('API Running...');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});