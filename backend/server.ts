import express from 'express';
import dotenv from 'dotenv';
import mysql, {ResultSetHeader, RowDataPacket, FieldPacket} from 'mysql2/promise';
import cors from 'cors';
import {ReadlineParser, SerialPort} from 'serialport';
import cron from 'node-cron';

dotenv.config();

const app = express();
const port = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL database connection pool
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
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

// Endpoint to fetch temperature data for all cards
app.get('/api/cards', async (_req, res) => {
    const query = 'SELECT id, cardName, topTemperature, currentTemperature, bottomTemperature, elGrijac, ventil FROM cards';

    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (error) {
        console.error('Error executing query - kade get: ', (error as Error).message);
        res.status(500).json({ error: 'Database query failed' });
    }
});

// Endpoint to fetch temperature data for a specific kada by ID
app.get('/api/cards/:id', async (req, res) => {
    const { id } = req.params; // Get the card ID from the request parameters
    const query = 'SELECT id, cardName, topTemperature, currentTemperature, bottomTemperature, elGrijac, ventil FROM cards WHERE id = ?';

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

// Endpoint to set temperature data for a specific kada by ID
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
        const [notifications] : [RowDataPacket[], any] = await db.query(
            'SELECT * FROM notifications WHERE done = false'
        );

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
    const { username, phValues } = req.body; // phValues sent from frontend

    // Define a type for valid notification types
    type NotificationType = 'nivo' | 'phCheck' | 'odrzavanje' | 'praznjenje' | 'koncentracija';

    try {
        // Fetch the notification type
        const [notificationRows]: [RowDataPacket[], any] = await db.query(
            'SELECT type FROM notifications WHERE id = ?',
            [id]
        );

        if (notificationRows.length === 0) {
            return res.status(404).json({ error: 'Notification not found.' });
        }

        const notificationType = notificationRows[0].type as NotificationType;

        // If the notification is for phCheck, insert pH values
        if (notificationType === 'phCheck' && Array.isArray(phValues) && phValues.length === 10) {
            const query = `
                INSERT INTO kada_ph
                (markedBy, kada_1, kada_2, kada_3, kada_4, kada_5, kada_6, kada_7, kada_8, kada_9, kada_10)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [username, ...phValues];
            await db.query(query, values);
        } else if (notificationType === 'phCheck') {
            // Handle invalid pH values
            return res.status(400).json({ error: 'You must submit exactly 10 pH values.' });
        }

        // Mark the notification as done
        const updateQuery = `
            UPDATE notifications 
            SET done = true, markedBy = ?, doneAt = NOW() 
            WHERE id = ?
        `;
        const [result]: any = await db.query(updateQuery, [username, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Failed to mark notification as done.' });
        }

        // Schedule the next notification based on the type
        const notificationDetails = {
            nivo: { intervalDays: 1, message: 'Potrebna provjera nivoa u kadama' },
            phCheck: { intervalDays: 2, message: 'Potrebna provjera pH nivoa u kadama' },
            odrzavanje: { intervalDays: 30, message: 'Potrebno mjesečno održavanje kada' },
            praznjenje: { intervalDays: 30, message: 'Potrebno mjesečno pražnjenje kada' },
            koncentracija: { intervalDays: 42, message: 'Potrebna provjera koncentracija u kadama' },
        };

        const { intervalDays, message } = notificationDetails[notificationType];

        await scheduleNotification(notificationType, intervalDays, message);

        res.json({ success: true, message: 'Notification marked as done and next scheduled.' });
    } catch (error) {
        console.error('Error marking notification as done:', error);
        res.status(500).json({ error: 'Failed to mark notification as done.' });
    }
});

app.post('/api/notifications/:id/phCheck', async (req, res) => {
    const { id } = req.params;
    const { username, phValues } = req.body;

    try {
        const query = `
            INSERT INTO kada_ph (kada_1, kada_2, kada_3, kada_4, kada_5, kada_6, kada_7, kada_8, kada_9, kada_10, user)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        await db.query(query, [
            ...phValues, username
        ]);

        const updateQuery = `
            UPDATE notifications
            SET done = true, markedBy = ?, doneAt = NOW()
            WHERE id = ? AND type = 'phCheck'`;

        const [result]: any = await db.query(updateQuery, [username, id]);

        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Notification marked as done with pH values.' });
        } else {
            res.status(404).json({ error: 'Notification not found or cannot be marked as done.' });
        }
    } catch (error) {
        console.error('Error processing pH values:', error);
        res.status(500).json({ error: 'Failed to submit pH values' });
    }
});

async function scheduleNotificationsOnStartup() {
    const notificationDetails = {
        nivo: { intervalDays: 1, message: 'Potrebna provjera nivoa u kadama' },
        phCheck: { intervalDays: 2, message: 'Potrebna provjera pH nivoa u kadama' },
        odrzavanje: { intervalDays: 30, message: 'Potrebno mjesečno održavanje kada' },
        praznjenje: { intervalDays: 30, message: 'Potrebno mjesečno pražnjenje kada' },
        koncentracija: { intervalDays: 42, message: 'Potrebna provjera koncentracija u kadama' },
    };

    for (const [type, { intervalDays, message }] of Object.entries(notificationDetails)) {
        await scheduleNotification(type, intervalDays, message);
    }
}

async function scheduleNotification(type: string, intervalDays: number, message: string) {
    try {
        // Check if a pending notification of this type already exists
        const [pendingRows]: [RowDataPacket[], any] = await db.query(
            'SELECT COUNT(*) AS pendingCount FROM notifications WHERE type = ? AND done = false',
            [type]
        );

        if (pendingRows[0].pendingCount > 0) {
            console.log(`Notification of type "${type}" already pending, skipping scheduling.`);
            return; // Skip scheduling if a pending notification exists
        }

        // Get the most recently completed notification for this type
        const [completedRows]: [RowDataPacket[], any] = await db.query(
            'SELECT doneAt FROM notifications WHERE type = ? ORDER BY doneAt DESC LIMIT 1',
            [type]
        );

        let nextNotificationTime: Date;

        if (completedRows.length > 0) {
            const lastDoneAt = new Date(completedRows[0].doneAt);
            nextNotificationTime = new Date(lastDoneAt);
            nextNotificationTime.setDate(nextNotificationTime.getDate() + intervalDays);
        } else {
            // No previous completion, schedule from today
            nextNotificationTime = new Date();
        }

        // Set to 12:00:00
        nextNotificationTime.setHours(12, 0, 0, 0);

        const now = new Date();

        // If the next scheduled time has already passed, schedule immediately
        if (nextNotificationTime <= now) {
            console.log(`Notification of type "${type}" missed its scheduled time (${nextNotificationTime.toLocaleString()}).`);

            // Directly trigger the notification
            await triggerNotification(type, message);
            return;
        } else {
            console.log(`Notification of type "${type}" is scheduled for ${nextNotificationTime.toLocaleString()}`);
        }

        // Schedule notification via cron
        const minute = nextNotificationTime.getMinutes();
        const hour = nextNotificationTime.getHours();
        const day = nextNotificationTime.getDate();
        const month = nextNotificationTime.getMonth() + 1;
        const weekday = '*';

        const cronTime = `${minute} ${hour} ${day} ${month} ${weekday}`;

        cron.schedule(cronTime, async () => {
            console.log(`Cron job triggered for ${type} notification at: ${new Date().toLocaleString()}`);
            try {
                // Double-check for pending notifications
                const [pendingCheck]: [RowDataPacket[], any] = await db.query(
                    'SELECT COUNT(*) AS pendingCount FROM notifications WHERE type = ? AND done = false',
                    [type]
                );

                if (pendingCheck[0].pendingCount > 0) {
                    console.log(`Notification of type "${type}" already pending, skipping creation.`);
                    return;
                }

                // Insert the new notification
                const [result]: [ResultSetHeader, FieldPacket[]] = await db.query(
                    'INSERT INTO notifications (message, type, created_at, doneAt, done) VALUES (?, ?, ?, ?, ?)',
                    [message, type, new Date(), null, false]
                );

                if (result.affectedRows > 0) {
                    console.log(`Notification of type "${type}" successfully created.`);
                } else {
                    console.error(`Failed to insert notification of type "${type}".`);
                }
            } catch (error) {
                console.error(`Error creating ${type} notification:`, error);
            }
        });
    } catch (error) {
        console.error(`Error scheduling ${type} notification:`, error);
    }
}

async function triggerNotification(type: string, message: string) {
    try {

        const [result]: [ResultSetHeader, FieldPacket[]] = await db.query(
            'INSERT INTO notifications (message, type, created_at, doneAt, done) VALUES (?, ?, ?, ?, ?)',
            [message, type, new Date(), null, false]
        );

        if (result.affectedRows > 0) {
            console.log(`Notification of type "${type}" successfully inserted immediately.`);
        } else {
            console.error(`Failed to insert notification of type "${type}".`);
        }
    } catch (error) {
        console.error(`Error triggering ${type} notification:`, error);
    }
}

scheduleNotificationsOnStartup();

app.get('/api/nalogs/incomplete', async (_req, res) => {
    try {
        let query = 'SELECT * FROM nalogs WHERE completed = 0 ';

        const [results] = await db.execute(query);
        res.json(results);
    } catch (error) {
        console.error('Error fetching nalogs:', error);
        res.status(500).json({ message: 'Error fetching nalogs' });
    }
});

// @ts-ignore
app.get('/api/nalogs/:nalogId/alats', async (req, res) => {
    const { nalogId } = req.params;

    try {
        // Fetch the broj_komada_alat column for the specified nalog
        const [rows]: any = await db.execute('SELECT broj_komada_alat FROM nalogs WHERE broj_naloga = ?', [nalogId]);

        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Nalog not found' });
        }

        const brojKomadaAlat = rows[0]?.broj_komada_alat;

        // Parse the JSON and extract only 'alat' values
        let alatNames: string[] = [];
        try {
            const parsedData = JSON.parse(brojKomadaAlat);
            if (!Array.isArray(parsedData)) {
                throw new Error('Invalid JSON format');
            }

            // Map through the JSON array and extract 'alat'
            alatNames = parsedData.map((item: any) => item.alat).filter(Boolean);
        } catch (parseError) {
            return res.status(400).json({ message: 'Invalid JSON in broj_komada_alat' });
        }

        res.json(alatNames); // Send the extracted 'alat' names as response
    } catch (error) {
        console.error('Error fetching alats:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/nalogs', async (req, res) => {
    const { broj_naloga, firma, broj_komada_alat, total_broj_komada, opis, completed } = req.body;

    try {
        // Insert into the nalogs table, including both broj_komada_alat and remaining_broj_komada_alat
        const query = `
            INSERT INTO nalogs (broj_naloga, firma, broj_komada_alat, total_broj_komada, opis, completed, created_at, remaining_broj_komada_alat)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
        `;

        // Execute the query, stringifying the broj_komada_alat array for storage
        const result = await db.execute(query, [
            broj_naloga,
            firma,
            JSON.stringify(broj_komada_alat), // Storing in broj_komada_alat
            total_broj_komada,
            opis,
            completed ? 1 : 0,
            JSON.stringify(broj_komada_alat) // Storing the same value in remaining_broj_komada_alat
        ]);

        // Access the insertId from the query result
        const insertId = (result[0] as ResultSetHeader).insertId;

        // Send the response with the insertId
        res.status(201).json({ message: 'Nalog created successfully', id: insertId });
    } catch (error) {
        // Handle any errors
        console.error('Error creating nalog:', error);
        res.status(500).json({ message: 'Error creating nalog' });
    }
});

type BrojKomadaAlat = { broj_komada: string; alat: string };
type SkartItem = { skart: string; alat: string; linkedSarza?: number };
type QueryResultWithInsertId = { insertId: number; affectedRows: number };
type Nalog = { remaining_broj_komada_alat: string };

// @ts-ignore
app.post('/api/sarzas', async (req, res) => {
    const { nalog_id, broj_komada_alat, kada_id }: {
        nalog_id: string;
        broj_komada_alat: BrojKomadaAlat[];
        kada_id: number;
    } = req.body;

    // Validate kada_id
    if (kada_id === null || kada_id === undefined) {
        return res.status(400).json({ message: 'Morate odabrati kadu' });
    }

    // Validate and filter broj_komada_alat
    const validBrojKomadaAlat = broj_komada_alat.filter(item => item.broj_komada && item.alat && !isNaN(parseInt(item.broj_komada, 10)));
    if (validBrojKomadaAlat.length !== broj_komada_alat.length) {
        return res.status(400).json({ message: 'Invalid or incomplete data in broj_komada_alat' });
    }

    const total_br_kmd = validBrojKomadaAlat.reduce((acc, item) => acc + parseInt(item.broj_komada, 10), 0);

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Fetch nalog data
        const [nalogRows] = await connection.query(
            'SELECT remaining_broj_komada_alat FROM nalogs WHERE broj_naloga = ?',
            [nalog_id]
        ) as [Nalog[], any];

        if (!nalogRows.length) {
            return res.status(404).json({ message: `Nalog with ID ${nalog_id} not found` });
        }

        const nalog = nalogRows[0];
        let remaining;
        try {
            remaining = JSON.parse(nalog.remaining_broj_komada_alat) as Array<{ alat: string; broj_komada: string }>;
        } catch (error) {
            return res.status(400).json({
                message: 'Invalid JSON format in remaining_broj_komada_alat',
                error: (error as Error).message
            });
        }

        // Process validBrojKomadaAlat and update remaining counts
        for (const { broj_komada, alat } of validBrojKomadaAlat) {
            const alatIndex = remaining.findIndex(item => item.alat === alat);
            if (alatIndex >= 0) {
                const remainingCount = parseInt(remaining[alatIndex].broj_komada, 10);
                if (parseInt(broj_komada, 10) > remainingCount) {
                    return res.status(400).json({
                        message: `Broj Komada za "${alat}" Prekoračuje Limit Ukupnih Preostalih Dijelova`,
                        remainingCount
                    });
                }
                remaining[alatIndex].broj_komada = (remainingCount - parseInt(broj_komada, 10)).toString();
            } else {
                return res.status(404).json({
                    message: `Alat "${alat}" Ne Postoji`
                });
            }
        }

        // Insert sarza into the database
        const query = `
            INSERT INTO sarzas (nalog_id, broj_komada_alat, total_br_kmd, skart, kada_id, created_at, completed)
            VALUES (?, ?, ?, NULL, ?, NOW(), 0)
        `;
        const [result] = await connection.execute(query, [
            nalog_id,
            JSON.stringify(validBrojKomadaAlat),
            total_br_kmd,
            kada_id,
        ]) as [QueryResultWithInsertId, any];

        // Update nalog remaining counts
        await connection.query(
            'UPDATE nalogs SET remaining_broj_komada_alat = ? WHERE broj_naloga = ?',
            [
                JSON.stringify(
                    remaining.map(item => ({ alat: item.alat, broj_komada: item.broj_komada }))
                ),
                nalog_id,
            ]
        );

        await connection.commit();
        res.json({ message: 'Šarza Uspješno Kreirana: ', id: result.insertId });
    } catch (error) {
        await connection.rollback();
        console.error('Error during transaction:', error);
        res.status(500).json({ message: 'Error processing request', error: (error as Error).message });
    } finally {
        connection.release();
    }
});

// Global heater timers - grijaci_dnevno
interface HeaterState {
    kada_id: number;
    heater_type: 'elGrijac' | 'ventil';
    state: number; // 1 for ON, 0 for OFF
    stateChangeStartTime?: number; // Timestamp when the heater turned ON
}

const activeHeaterStates: Map<string, HeaterState> = new Map();

async function trackGlobalHeaterStates() {
    try {
        const currentTime = Date.now(); // Current timestamp in milliseconds

        // Fetch all cards (kadas) and their current heater states
        const [cards] = await db.execute(`
            SELECT id AS kada_id, elGrijac, ventil
            FROM cards
        `) as [any[], any];

        const logPromises: Promise<void>[] = []; // Array to hold promises for database updates

        for (const card of cards) {
            const { kada_id, elGrijac, ventil } = card;

            // Track elGrijac state
            logPromises.push(
                handleHeaterStateChange(kada_id, 'elGrijac', elGrijac, currentTime)
            );

            // Track ventil state
            logPromises.push(
                handleHeaterStateChange(kada_id, 'ventil', ventil, currentTime)
            );
        }

        // Wait for all logging operations to complete
        await Promise.all(logPromises);

    } catch (error) {
        console.error('Error tracking global heater states:', (error as Error).message);
    }
}

async function handleHeaterStateChange(
    kada_id: number,
    heater_type: 'elGrijac' | 'ventil',
    current_state: number,
    currentTime: number
) {
    const key = `${kada_id}-${heater_type}`; // Unique key for kada_id and heater_type
    let heaterState = activeHeaterStates.get(key);

    if (!heaterState) {
        // If no tracking exists, initialize tracking
        heaterState = {
            kada_id,
            heater_type,
            state: current_state,
            stateChangeStartTime: current_state === 1 ? currentTime : undefined,
        };
        activeHeaterStates.set(key, heaterState);

        if (current_state === 1) {
            await logStateChange(kada_id, heater_type, currentTime, null); // Log ON state
        }
    } else {
        // Handle state change
        if (heaterState.state !== current_state) {
            if (current_state === 1) {
                // Heater turned ON
                heaterState.stateChangeStartTime = currentTime;
                await logStateChange(kada_id, heater_type, currentTime, null);
            } else if (current_state === 0 && heaterState.stateChangeStartTime) {
                // Heater turned OFF, calculate duration
                const duration = Math.floor((currentTime - heaterState.stateChangeStartTime) / 1000);

                await logStateChange(
                    kada_id,
                    heater_type,
                    heaterState.stateChangeStartTime,
                    currentTime,
                    duration
                );

                heaterState.stateChangeStartTime = undefined; // Reset the start time
            }

            // Update the current state
            heaterState.state = current_state;
        }
    }
}

// Function to log state changes into the grijaci_dnevno table
async function logStateChange(
    kada_id: number,
    heater_type: 'elGrijac' | 'ventil',
    state_change_on: number,
    state_change_off: number | null,
    duration: number | null = null
) {
    if (state_change_off !== null) {
        // Update the existing row with state_change_off and duration
        const updateQuery = `
            UPDATE grijaci_dnevno
            SET state_change_off = FROM_UNIXTIME(?), duration_seconds = ?
            WHERE kada_id = ? AND heater_type = ? AND state_change_off IS NULL
        `;
        await db.execute(updateQuery, [state_change_off / 1000, duration, kada_id, heater_type]);
    } else {
        // Insert a new row for state_change_on
        const insertQuery = `
            INSERT INTO grijaci_dnevno (kada_id, heater_type, state_change_on)
            VALUES (?, ?, FROM_UNIXTIME(?))
        `;
        await db.execute(insertQuery, [kada_id, heater_type, state_change_on / 1000]);
    }
}

setInterval(trackGlobalHeaterStates, 1000);

app.get('/api/grijaci_dnevno', async (_req, res) => {
    try {
        // Query to fetch all records without any date filtering
        const query = `
            SELECT * FROM grijaci_dnevno`;

        // Execute query
        const [results] = await db.execute(query);
        res.json(results);
    } catch (error) {
        console.error('Error fetching heater state changes:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.post('/api/skarts', async (req, res) => {
    const { skart }: { skart: SkartItem[] } = req.body;

    // Filter and validate incoming skart data
    const validSkart = skart.filter((item) => item.skart && item.alat && !isNaN(parseInt(item.skart, 10)));
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        for (const { skart: skartCount, alat, linkedSarza } of validSkart) {

            // Fetch data from sarzas and nalogs
            const [linkedSarzaRows] = (await connection.query(
                `SELECT s.broj_komada_alat, s.skart, n.id AS linked_nalog, n.remaining_broj_komada_alat
                 FROM sarzas s
                 JOIN nalogs n ON s.nalog_id = n.broj_naloga
                 WHERE s.id = ?`,
                [linkedSarza]
            )) as RowDataPacket[][];

            if (linkedSarzaRows.length === 0) {
                throw new Error(`Linked Sarza ID ${linkedSarza} not found`);
            }

            const sarzaData = linkedSarzaRows[0];
            const currentSkart = sarzaData.skart ? JSON.parse(sarzaData.skart) : [];
            const currentRemainingAlat = sarzaData.remaining_broj_komada_alat
                ? JSON.parse(sarzaData.remaining_broj_komada_alat)
                : [];

            // Update skart in sarzas (ensure all values are strings in JSON)
            currentSkart.push({ skart: skartCount.toString(), alat });
            await connection.query('UPDATE sarzas SET skart = ? WHERE id = ?', [
                JSON.stringify(currentSkart),
                linkedSarza,
            ]);

            // Update remaining_broj_komada_alat in nalogs
            const alatIndex = currentRemainingAlat.findIndex((item: any) => item.alat === alat);
            if (alatIndex !== -1) {
                // Add skart to the existing number (ensuring numbers are strings)
                currentRemainingAlat[alatIndex].broj_komada = (
                    parseInt(currentRemainingAlat[alatIndex].broj_komada, 10) +
                    parseInt(skartCount, 10)
                ).toString();
            } else {
                // Add new alat with skart as a positive number (as string)
                currentRemainingAlat.push({ alat, broj_komada: skartCount.toString() });
            }

            await connection.query('UPDATE nalogs SET remaining_broj_komada_alat = ? WHERE id = ?', [
                JSON.stringify(currentRemainingAlat),
                sarzaData.linked_nalog,
            ]);
            const totalSkart = currentSkart.reduce(
                (sum: number, item: { skart: string }) => sum + parseInt(item.skart, 10),
                0
            );

            // Update total_skart
            await connection.query('UPDATE sarzas SET total_skart = ? WHERE id = ?', [
                totalSkart,
                linkedSarza,
            ]);
        }

        await connection.commit();
        res.json({ message: 'Škart Uspješno Unešen!' });
    } catch (error) {
        console.error('Error during skart processing:', error); // Log error
        await connection.rollback();
        res.status(500).json({ message: 'Pogreška u unosu!', error: (error as Error).message });
    } finally {
        connection.release();
    }
});

// GET /api/sarzas
app.get('/api/sarzas', async (_req, res) => {
    try {
        const [results] = await db.execute('SELECT * FROM sarzas');
        res.json(results);
    } catch (error) {
        console.error('Error fetching sarzas:', error);
        res.status(500).json({ message: 'Error fetching sarzas' });
    }
});

// @ts-ignore
app.get('/api/sarzas/linked/:nalogId', async (req, res) => {
    const { nalogId } = req.params;

    try {
        // Perform the query using async/await
        const [results] = await db.query('SELECT * FROM sarzas WHERE nalog_id = ? AND completed = 0 AND skart IS NULL', [nalogId]);

        res.json(results);
    } catch (error) {
        console.error('Error fetching linked Sarzas:', error);
        return res.status(500).send('Error fetching linked Sarzas');
    }
});

// @ts-ignore
app.get('/api/nalogs/:id/sarzas', async (req, res) => {
    const { id } = req.params;

    try {
        const query = `
            SELECT id FROM sarzas WHERE nalog_id = ?
        `;

        // Execute the query to fetch incomplete sarzas for the given nalog_id
        const [rows] = await db.execute<RowDataPacket[]>(query, [id]);

        // If no sarzas are found, return an empty array
        if (rows.length === 0) {
            return res.json([]);
        }

        // Map the rows to extract the IDs
        const sarzas = rows.map((row) => row.id);

        // Send the result back as JSON
        res.json(sarzas);
    } catch (error) {
        console.error('Error fetching sarzas:', error);
        res.status(500).json({ message: 'Error fetching sarzas' });
    }
});

app.get('/api/nalogs', async (_req, res) => {
    try {
        const query = `SELECT * from nalogs`;

        const [results] = await db.execute(query);
        res.json(results);
    } catch (error) {
        console.error('Error fetching nalogs:', error);
        res.status(500).json({ message: 'Error fetching nalogs' });
    }
});

app.get('/api/nalogs/view', async (_req, res) => {
    try {
        const query = `
            SELECT
                nalogs.id,
                nalogs.broj_naloga,
                nalogs.firma,
                nalogs.broj_komada_alat,
                nalogs.total_broj_komada,
                nalogs.remaining_broj_komada_alat,
                nalogs.opis,
                nalogs.completed,
                nalogs.created_at,
                nalogs.completed_at,
                GROUP_CONCAT(sarzas.id) AS sarze
            FROM nalogs
                     LEFT JOIN sarzas ON nalogs.broj_naloga = sarzas.nalog_id
            GROUP BY nalogs.id
        `;

        const [results] = await db.execute(query);
        res.json(results);
    } catch (error) {
        console.error('Error fetching nalogs:', error);
        res.status(500).json({ message: 'Error fetching nalogs' });
    }
});

app.get('/api/sarzas/view', async (_req, res) => {
    try {
        const query = `
            SELECT 
                id, 
                nalog_id, 
                broj_komada_alat, 
                total_br_kmd, 
                skart, 
                total_skart, 
                kada_id, 
                completed, 
                created_at, 
                completed_at 
            FROM sarzas
        `;

        // Execute the query
        const [rows] = await db.execute(query);

        // Send the rows as JSON response
        res.json(rows);
    } catch (error) {
        console.error('Error fetching all sarzas:', error);
        res.status(500).json({ message: 'Error fetching all sarzas' });
    }
});

// @ts-ignore
app.put('/api/sarzas/:id/remove', async (req, res) => {
    const { id } = req.params;

    try {
        const query = `
            UPDATE sarzas 
            SET removed_at = NOW() 
            WHERE id = ?
        `;
        const [result]: [ResultSetHeader, FieldPacket[]] = await db.execute(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Sarza not found' });
        }

        res.json({ message: 'Sarza removal timestamp updated successfully' });
    } catch (error) {
        console.error('Error updating removal timestamp:', error);
        res.status(500).json({ message: 'Error updating sarza removal timestamp' });
    }
});

// @ts-ignore
app.put('/api/sarzas/:id/complete', async (req, res) => {
    const { id } = req.params;  // Get the sarza ID from the route parameter
    try {
        // Step 1: Update the sarza completion status and set the completed_at time
        const updateSarzaQuery = `
            UPDATE sarzas 
            SET completed = 1, completed_at = NOW() 
            WHERE id = ?
        `;
        const [updateResult]: [ResultSetHeader, FieldPacket[]] = await db.execute(updateSarzaQuery, [id]);

        // Step 2: If no rows were affected, return an error
        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ message: 'Sarza not found' });
        }

        // Step 3: Fetch the created_at and completed_at for the sarza
        const fetchSarzaQuery = `
            SELECT created_at, completed_at, kada_id 
            FROM sarzas 
            WHERE id = ?
        `;
        const [sarzaData]: [RowDataPacket[], FieldPacket[]] = await db.execute(fetchSarzaQuery, [id]);

        if (!sarzaData || sarzaData.length === 0) {
            return res.status(404).json({ message: 'Sarza data not found' });
        }

        const { created_at, completed_at, kada_id } = sarzaData[0];

        // Check if completed_at is null and handle accordingly
        const completedAtDate = completed_at ? new Date(completed_at) : new Date(); // Use current date if completed_at is null

        // Step 4: Calculate elGrijac and ventil durations based on grijaci_dnevno data
        const fetchHeaterLogsQuery = `
            SELECT heater_type, state_change_on, state_change_off 
            FROM grijaci_dnevno
            WHERE kada_id = ?
            AND (
                (state_change_on BETWEEN ? AND ?)
                OR (state_change_off BETWEEN ? AND ?)
                OR (state_change_on < ? AND (state_change_off IS NULL OR state_change_off > ?))
            )
        `;
        const [heaterLogs]: [RowDataPacket[], FieldPacket[]] = await db.execute(fetchHeaterLogsQuery, [
            kada_id,
            created_at,
            completed_at,
            created_at,
            completed_at,
            created_at,
            completed_at,
        ]);

        // Step 5: Calculate the durations for each heater type (elGrijac, ventil)
        let elGrijac_duration = 0;
        let ventil_duration = 0;

        // Correctly iterate through the heaterLogs array
        heaterLogs.forEach((log: RowDataPacket) => {
            const { heater_type, state_change_on, state_change_off } = log;
            const removalTime = sarzaData[0].removed_at ? new Date(sarzaData[0].removed_at) : completedAtDate;
            let start_time = new Date(state_change_on);
            let end_time = state_change_off ? new Date(state_change_off) : removalTime;

            if (start_time < new Date(created_at)) start_time = new Date(created_at);
            if (end_time > removalTime) end_time = removalTime;

            const duration = (end_time.getTime() - start_time.getTime()) / 1000; // duration in seconds

            if (heater_type === 'elGrijac') {
                elGrijac_duration += Math.max(0, duration);
            } else if (heater_type === 'ventil') {
                ventil_duration += Math.max(0, duration);
            }
        });

        // Step 6: Insert the calculated durations into the heater_log table
        const insertLogQuery = `
            INSERT INTO heater_log (sarza_id, kada_id, elGrijac_duration, ventil_duration, last_updated)
            VALUES (?, ?, ?, ?, NOW())
        `;
        await db.execute(insertLogQuery, [id, kada_id, elGrijac_duration, ventil_duration]);

        // Step 7: Respond with success
        res.json({ message: 'Sarza completed successfully' });
    } catch (error) {
        console.error('Error completing sarza:', error);
        res.status(500).json({ message: 'Error completing sarza' });
    }
});

// @ts-ignore
app.put('/api/nalogs/:id/complete', async (req, res) => {
    const { id } = req.params;  // Get the nalog ID from the route parameter
    try {
        // Update query to mark the nalog as completed
        const query = `UPDATE nalogs SET completed = 1, completed_at = NOW() WHERE id = ?`;

        // Execute the query and properly type the result
        const [result]: [ResultSetHeader, FieldPacket[]] = await db.execute(query, [id]);

        // Check the `affectedRows` property to see if the update was successful
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Nalog not found' });
        }

        // Respond with success
        res.json({ message: 'Nalog completed successfully' });
    } catch (error) {
        console.error('Error updating nalog:', error);
        res.status(500).json({ message: 'Error updating nalog' });
    }
});

// @ts-ignore
app.get('/api/sarzas/incomplete/:nalogId', async (req, res) => {
    const { nalogId } = req.params;

    try {
        // Query to fetch incomplete sarzas for the given nalog_id
        const [rows] = await db.query<RowDataPacket[]>(
            `SELECT sarzas.id, sarzas.completed, sarzas.nalog_id, sarzas.broj_komada_alat, sarzas.skart
            FROM sarzas
            WHERE sarzas.nalog_id = ? AND sarzas.completed = 0`, [nalogId]
        );

        // If no sarzas found, send a 404 response
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No incomplete sarzas found for the selected nalog' });
        }

        // Return the incomplete sarzas
        res.json(rows);
    } catch (error) {
        console.error('Error fetching incomplete sarzas:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
