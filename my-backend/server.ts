import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';

const app = express();
const port = 5174; // Set your backend port

// Middleware
app.use(cors());
app.use(express.json());

// MySQL database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ammar',
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', (err as Error).message);
        return;
    }
    console.log('Connected to the database.');
});

// Endpoint to fetch temperature data for cards
app.get('/api/cards', async (req, res) => {
    const query = 'SELECT id, topTemperature, currentTemperature, bottomTemperature FROM kade';

    try {
        const [results] = await db.promise().query(query);
        res.json(results);
    } catch (error) {
        console.error('Error executing query:', (error as Error).message);
        res.status(500).json({ error: 'Database query failed' });
    }
});

// Endpoint to fetch user data (for login)
app.get('/api/users', async (req, res) => {
    const query = 'SELECT id, username, password FROM users';

    try {
        const [results] = await db.promise().query(query);
        res.json(results);
    } catch (error) {
        console.error('Error executing query:', (error as Error).message);
        res.status(500).json({ error: 'Database query failed' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
