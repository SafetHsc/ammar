import express from 'express';
import mysql, {ResultSetHeader, RowDataPacket, FieldPacket} from 'mysql2/promise';
import cors from 'cors';
import {ReadlineParser, SerialPort} from 'serialport';
import cron from 'node-cron';

const app = express();
const port = 5174;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL database connection pool
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ammar',
});

// Check database connection
db.getConnection()
    .then(() => console.log('Connected to the database.'))
    .catch((err) => {
        console.error('Database connection failed:', err.message);
        process.exit(1); // Exit if connection fails
    });

// Global variable to store the latest data
let latestArduinoData = 'No data received yet';

// Initialize serial port connection
const serialPort = new SerialPort({ path: 'COM3', baudRate: 9600 });
const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

// Log when the serial port is opened
serialPort.on('open', () => {
    console.log('Serial port opened successfully.');
});

// Handle serial port errors
serialPort.on('error', (err) => {
    console.error('Serial Port Error:', err.message);
    // process.exit(1);
});


// Parse Arduino data and update the database
async function parseAndSaveData(data: string) {
    if (data.startsWith('!') && data.endsWith('!')) {
        data = data.slice(1, -1); // Remove leading and trailing `!`
    }

    const cards = data.split('*').filter(card => card.trim() !== '');
    const queries = cards.map(async (card) => {
        const [id, currentTemperature, elGrijac, ventil] = card.split(',');

        // Validate data before proceeding
        if (!id || !currentTemperature || elGrijac === undefined || ventil === undefined) {
            console.error(`Invalid card data: ${card}`);
            return;
        }

        const cardId = parseInt(id, 10);
        const newElGrijacState = parseInt(elGrijac, 10);
        const newVentilState = parseInt(ventil, 10);

        // Proceed with your database update or other operations
        const query = `
            UPDATE cards
            SET currentTemperature = ?, elGrijac = ?, ventil = ?
            WHERE id = ?`;

        try {
            const [result]: [ResultSetHeader, any] = await db.query<ResultSetHeader>(query, [
                parseFloat(currentTemperature),
                newElGrijacState,
                newVentilState,
                cardId,
            ]);

            if (result.affectedRows > 0) {
                console.log(`Card ${cardId} updated successfully.`);
            } else {
                console.error(`Card ${cardId} not found in database.`);
            }
        } catch (error) {
            console.error(`Error updating card ${cardId}:`, (error as Error).message);
        }
    });

    // Wait for all queries to finish
    await Promise.all(queries);
}

async function sendDataToArduino() {
    const query = 'SELECT id, topTemperature, bottomTemperature FROM cards';

    try {
        const [results]: [RowDataPacket[], any] = await db.query(query);

        // Format data as a string for Arduino
        const dataToSend = results
            .map((row: any) => `*${row.id},${row.topTemperature},${row.bottomTemperature}`)
            .join(''); // Combine all cards without extra separator

        // Add `!` at the start and `*!` at the end
        const formattedData = `!${dataToSend}*!`;

        // Write data to the serial port
        serialPort.write(formattedData, (err) => {
            if (err) {
                console.error('Error writing to Arduino:', err.message);
            } else {
                console.log('Data sent to Arduino:', formattedData);
            }
        });
    } catch (error) {
        console.error('Error fetching data from database:', (error as Error).message);
    }
}

// Read data from Arduino
parser.on('data', async (data) => {
    latestArduinoData = data.trim(); // Update the global variable with the latest data
    console.log('Data received from Arduino:', latestArduinoData);

    // Parse and save the data
    await parseAndSaveData(latestArduinoData);
    // Send data to Arduino
    await sendDataToArduino();
});

// Endpoint: Fetch the latest Arduino data
app.get('/api/arduino-data', (_req, res) => {
    res.json({
        success: true,
        data: latestArduinoData,
    });
});

// Endpoint to fetch temperature data for cards
app.get('/api/cards', async (_req, res) => {
    const query = 'SELECT id, topTemperature, currentTemperature, bottomTemperature, elGrijac, ventil FROM cards';

    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (error) {
        console.error('Error executing query - kade get: ', (error as Error).message);
        res.status(500).json({ error: 'Database query failed' });
    }
});

// Endpoint to fetch temperature data for a specific card by ID
app.get('/api/cards/:id', async (req, res) => {
    const { id } = req.params; // Get the card ID from the request parameters
    const query = 'SELECT id, topTemperature, currentTemperature, bottomTemperature, elGrijac, ventil FROM cards WHERE id = ?';

    try {
        const [results]: [RowDataPacket[], any] = await db.query(query, [id]);

        if (results.length > 0) {
            res.json(results[0]); // Return the first (and ideally only) result
        } else {
            res.status(404).json({ message: 'Card not found' });
        }
    } catch (error) {
        console.error('Error executing query - kada id get: ', (error as Error).message);
        res.status(500).json({ error: 'Database query failed' });
    }
});

// Endpoint to set temperature data for a specific card by ID
app.post('/api/cards/:id', async (req, res) => {
    const { id } = req.params;
    const { topTemperature, currentTemperature, bottomTemperature, elGrijac, ventil } = req.body; // Include setTemperature in request body

    const query = 'UPDATE cards SET topTemperature = ?, currentTemperature = ?, bottomTemperature = ?, elGrijac = ?, ventil = ? WHERE id = ?';

    try {
        const [result] = await db.query<ResultSetHeader>(query, [topTemperature, currentTemperature, bottomTemperature, elGrijac, ventil, id]);

        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Temperatures updated successfully.' });
        } else {
            res.status(404).json({ success: false, message: 'Card not found.' });
        }
    } catch (error) {
        console.error('Error executing query - kade id post: ', (error as Error).message);
        res.status(500).json({ success: false, message: 'Database update failed' });
    }
});

// @ts-ignore
app.post('/api/users', async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    // Insert user into the database
    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';

    try {
        const [result] = await db.query<ResultSetHeader>(query, [username, password]);

        // If the user is created successfully, return the new user's ID
        res.status(201).json({ success: true, message: 'User created successfully', userId: result.insertId });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ success: false, message: 'Failed to create user' });
    }
});

// @ts-ignore

app.post('/api/del-users', async (req, res) => {
    const { username } = req.body;

    // Validate input
    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    try {
        // Check if the username corresponds to a user with id = 1
        const [rows]: [any[], FieldPacket[]] = await db.query('SELECT id FROM users WHERE username = ?', [username]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const userId = rows[0].id;

        if (userId === 1) {
            return res.status(403).json({ success: false, message: 'Cannot delete the admin user' });
        }

        // Delete user from the database
        const [result]: [ResultSetHeader, FieldPacket[]] = await db.query('DELETE FROM users WHERE username = ?', [username]);

        if (result.affectedRows > 0) {
            return res.status(200).json({ success: true, message: 'User deleted successfully' });
        } else {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
});

// Endpoint to fetch user data (credentials able to log in)
app.get('/api/users', async (_req, res) => {
    const query = 'SELECT id, username, password FROM users';

    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (error) {
        console.error('Error executing query - users get: ', (error as Error).message);
        res.status(500).json({ error: 'Database query failed' });
    }
});

// Endpoint for user login attempt (check if account exists in database)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT id, username, password FROM users WHERE username = ? AND password = ?';

    try {
        const [results]: [RowDataPacket[], any] = await db.query(query, [username, password]);

        // Check if any user matches
        if (results.length > 0) {
            const user = results[0];
            const isAdmin = user.id === 1;
            res.json({ success: true, id: user.id, role: isAdmin ? 1 : 2 });
        } else {
            res.status(401).json({ success: false, message: 'Prijava neuspješna. Unesite ispravne podatke.' });
        }
    } catch (error) {
        console.error('Error executing query - login: ', (error as Error).message);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
});

app.get('/api/notifications', async (_req, res) => {
    try {
        // Fetch unread notifications from the database
        const [notifications] = await db.query('SELECT * FROM notifications WHERE done = false');

        // Check if notifications is an array
        if (!Array.isArray(notifications)) {
            throw new Error('Unexpected database response format');
        }

        // Calculate the number of unread notifications
        const unreadCount = notifications.length;

        // Send the notifications and unread count as a response
        res.json({ notifications, unreadCount });
    } catch (error) {
        // Log and send an error response
        console.error('Error fetching notifications:', (error as Error).message);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});


// @ts-ignore
app.post('/api/notifications/:id/done', async (req, res) => {
    const { id } = req.params;
    const { username } = req.body;

    try {
        const query = `
            UPDATE notifications
            SET done = true, markedBy = ?, doneAt = NOW()
            WHERE id = ?`;

        const [result]: any = await db.query(query, [username, id]);

        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Notification marked as done.' });
        } else {
            res.status(404).json({ error: 'Notification not found.' });
        }
    } catch (error) {
        console.error('Error marking notification as done:', error);
        res.status(500).json({ error: 'Failed to mark notification as done.' });
    }
});

app.post('/api/notifications/:id/dismiss', async (req, res) => {
    const { id } = req.params;
    const { username } = req.body;

    try {
        const query = `
            UPDATE notifications
            SET done = true, markedBy = ?, doneAt = NOW()
            WHERE id = ?`;

        const [result]: any = await db.query(query, [username, id]);

        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Notification dismissed.' });
        } else {
            res.status(404).json({ error: 'Notification not found or cannot be dismissed.' });
        }
    } catch (error) {
        console.error('Error dismissing notification:', error);
        res.status(500).json({ error: 'Failed to dismiss notification.' });
    }
});

async function scheduleNextNotification() {
    try {
        // Query the database for the latest 'doneAt' timestamp for 'monthly' notifications
        const [rows]: [RowDataPacket[], any] = await db.query('SELECT doneAt FROM notifications WHERE type = ? ORDER BY doneAt DESC LIMIT 1', ['monthly']);

        if (rows.length > 0) {
            // Extract doneAt timestamp from the result
            const lastDoneAt = rows[0].doneAt;
            const nextNotificationTime = new Date(lastDoneAt);
            nextNotificationTime.setDate(nextNotificationTime.getDate() + 30); // Add 30 days to the last done time

            // Calculate the cron schedule string (e.g., at midnight of the next notification date)
            const cronTime = `${nextNotificationTime.getMinutes()} ${nextNotificationTime.getHours()} ${nextNotificationTime.getDate()} ${nextNotificationTime.getMonth() + 1} *`;

            // Schedule the cron job dynamically based on the calculated next time
            cron.schedule(cronTime, async () => {
                try {
                    await db.query(
                        `INSERT INTO notifications (message, type, created_at) VALUES (?, ?, ?)`,
                        ['Mjesečno održavanje kada', 'monthly', new Date()]
                    );
                    console.log('Monthly maintenance notification created.');
                } catch (error) {
                    console.error('Error executing monthly cleaning cron job:', error);
                }
            });
        } else {
            console.log('No previous monthly notifications found.');
            await db.query(
                `INSERT INTO notifications (message, type, created_at) VALUES (?, ?, ?)`,
                ['Mjesečno održavanje kada', 'monthly', new Date()]
            );
        }
    } catch (error) {
        console.error('Error fetching last done timestamp:', error);
    }

}
scheduleNextNotification();

// @ts-ignore
cron.schedule('* * * * *', async () => {
    try {
        await db.query(
            `INSERT INTO notifications (message, type, created_at) VALUES (?, ?, ?)`,
            ['Potrebna provjera pH nivoa u kadama', 'phCheck', new Date()]
        );
    } catch (error) {
        console.error('Error executing pH check cron job:', error);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
