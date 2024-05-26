const express = require('express');
const { pool, users } = require('./db');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
    console.log('Express.html Loaded');
});

// Route to get data from the database
app.get('/cars', (req, res) => {
    const sql = 'SELECT * FROM car WHERE deleted_flag = 0';
    pool.query(sql, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send('Server error');
        }
        res.json(results);
    });
});
// Route to get car with id params
app.get('/cars/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM car WHERE id = ? AND deleted_flag = 0';

    pool.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send('Server error');
        }
        if (results.length === 0) {
            return res.status(404).send('Record not found');
        }
        res.json(results[0]); // Return the first (and only) result
    });
});
// Update data from the database
app.post('/cars', (req, res) => {
    const { make, model, year } = req.body;
    const sql = `INSERT INTO car ( make, model, year) VALUES (?,?,?)`;
    pool.query(sql, [make, model, year], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send('Server error');
        }

        res.status(201).json({ make, model, year });
    });
});

app.put('/cars/:id', (req, res) => {
    const { id } = req.params;
    const { make, model, year } = req.body;
    const sql = 'UPDATE car SET make = ?, model = ?, year = ? WHERE id = ?';
    pool.query(sql, [make, model, year, id], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send('Server error');
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('Car not found');
        }
        res.status(200).send('Car updated successfully');
    });
});


app.delete('/cars/:id', (req, res) => {
    const { id } = req.params;

    const deleteSql = 'UPDATE car set deleted_flag = 1 WHERE id = ?';
    pool.query(deleteSql, [id], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send('Server error');
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('Car not found');
        }

        // Check if the table is empty
        const checkSql = 'SELECT COUNT(*) AS count FROM car';
        pool.query(checkSql, (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                return res.status(500).send('Server error');
            }
            if (results[0].count === 0) {
                // Reset auto-increment value if table is empty
                const resetSql = 'ALTER TABLE car AUTO_INCREMENT = 1';
                pool.query(resetSql, (err, results) => {
                    if (err) {
                        console.error('Error executing query:', err);
                        return res.status(500).send('Server error');
                    }
                    res.status(200).send('Car deleted successfully and auto-increment value reset');
                });
            } else {
                res.status(200).send('Car deleted successfully');
            }
        });
    });
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
