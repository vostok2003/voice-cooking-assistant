require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

connectDB();
const app = express();
app.use(cors());
app.use(express.json());

// Healthcheck
app.get('/', (req, res) => res.send('Voice Cooking Assistant API running'));


app.use('/api/auth', require('./routes/auth'));
app.use('/api/recipes', require('./routes/recipes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
