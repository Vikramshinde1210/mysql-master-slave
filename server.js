const express = require('express');
const { masterPool, replicaPool } = require('./db');

const app = express();
app.use(express.json());

// write to master
app.post('/write', async (req, res) => {
  try {
    const { name } = req.body;
    await masterPool.query('INSERT INTO users (name) VALUES (?)', [name]);
    res.send({ message: 'User added successfully' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// read from replica
app.get('/read', async (req, res) => {
  try {
    const [rows] = await replicaPool.query('SELECT * FROM users');
    res.send(rows);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
