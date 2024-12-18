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
cron.schedule('0 0 * * *', async () => {
    try {
        await db.query(
            `INSERT INTO notifications (message, type, created_at) VALUES (?, ?, ?)`,
            ['Potrebna provjera pH nivoa u kadama', 'phCheck', new Date()]
        );
    } catch (error) {
        console.error('Error executing pH check cron job:', error);
    }
});

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
        // Add šarža to heater_log table
        const insertLogQuery = `
            INSERT INTO heater_log (sarza_id, kada_id, elGrijac_duration, ventil_duration, last_updated)
            VALUES (?, ?, 0, 0, NOW())
            `;
        await connection.execute(insertLogQuery, [result.insertId, kada_id]);

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

interface ActiveHeaterState {
    sarza_id: number;
    kada_id: number;
    elGrijac: number;
    ventil: number;
    elGrijacStartTime?: number; // Timestamp when elGrijac turned ON
    ventilStartTime?: number;   // Timestamp when ventil turned ON
    elGrijacDuration: number;   // Total duration for elGrijac for this sarza
    ventilDuration: number;     // Total duration for ventil for this sarza
}

const activeHeaters: Map<string, ActiveHeaterState> = new Map(); // Tracks active sarzas and kada combinations

// Function to track heater states and track durations
async function trackHeaterStates() {
    try {
        const currentTime = Date.now();
        const logPromises: Promise<void>[] = [];  // Array to collect all log promises

        // Fetch active sarzas and their kada_ids
        const [activeSarzas] = await db.execute(`
            SELECT s.id AS sarza_id, s.kada_id, c.elGrijac, c.ventil
            FROM sarzas s
            JOIN cards c ON s.kada_id = c.id
            WHERE s.completed = 0
        `) as [any[], any];

        // Track new sarzas or update states
        for (const sarza of activeSarzas) {
            const { sarza_id, kada_id, elGrijac, ventil } = sarza;
            const key = `${sarza_id}-${kada_id}`; // Unique key for sarza_id and kada_id combination

            let heaterState = activeHeaters.get(key);

            // Initialize if the kada_id is not already tracked
            if (!heaterState) {

                heaterState = {
                    sarza_id,
                    kada_id,
                    elGrijac,
                    ventil,
                    elGrijacStartTime: elGrijac === 1 ? currentTime : undefined,
                    ventilStartTime: ventil === 1 ? currentTime : undefined,
                    elGrijacDuration: 0,
                    ventilDuration: 0
                };

                activeHeaters.set(key, heaterState);
                // if (elGrijac === 1) {
                //     console.log(`Starting elGrijac timer for kada_id: ${kada_id}`);
                // }
                // if (ventil === 1) {
                //     console.log(`Starting ventil timer for kada_id: ${kada_id}`);
                // }
            } else if (heaterState.sarza_id !== sarza_id) {

                // Log the duration for the previous sarza before updating
                if (heaterState.elGrijacStartTime) {
                    const elGrijacDuration = Math.floor((currentTime - heaterState.elGrijacStartTime) / 1000);
                    heaterState.elGrijacDuration += elGrijacDuration;
                    logPromises.push(logDuration(heaterState.sarza_id, 'elGrijac_duration', elGrijacDuration));
                }
                if (heaterState.ventilStartTime) {
                    const ventilDuration = Math.floor((currentTime - heaterState.ventilStartTime) / 1000);
                    heaterState.ventilDuration += ventilDuration;
                    logPromises.push(logDuration(heaterState.sarza_id, 'ventil_duration', ventilDuration));
                }

                // Reinitialize the heater state for the new sarza
                heaterState.sarza_id = sarza_id;
                heaterState.elGrijacStartTime = elGrijac === 1 ? currentTime : undefined;
                heaterState.ventilStartTime = ventil === 1 ? currentTime : undefined;

                // if (elGrijac === 1) {
                //     console.log(`Starting elGrijac timer for kada_id: ${kada_id}`);
                // }
                // if (ventil === 1) {
                //     console.log(`Starting ventil timer for kada_id: ${kada_id}`);
                // }
            }

            // Track elGrijac duration
            if (elGrijac === 1 && !heaterState.elGrijacStartTime) {
                heaterState.elGrijacStartTime = currentTime; // Start timer if it was off before
            } else if (elGrijac === 0 && heaterState.elGrijacStartTime) {
                const duration = Math.floor((currentTime - heaterState.elGrijacStartTime) / 1000);
                heaterState.elGrijacDuration += duration;
                logPromises.push(logDuration(sarza_id, 'elGrijac_duration', duration));
                heaterState.elGrijacStartTime = undefined; // Reset timer when it turns off
            }

            // Track ventil duration
            if (ventil === 1 && !heaterState.ventilStartTime) {
                heaterState.ventilStartTime = currentTime; // Start timer if it was off before
            } else if (ventil === 0 && heaterState.ventilStartTime) {
                const duration = Math.floor((currentTime - heaterState.ventilStartTime) / 1000);
                heaterState.ventilDuration += duration;
                logPromises.push(logDuration(sarza_id, 'ventil_duration', duration));
                heaterState.ventilStartTime = undefined; // Reset timer when it turns off
            }
        }

        // Cleanup: remove completed sarzas from activeHeaters
        const [completedSarzas] = await db.execute(`
            SELECT id, kada_id FROM sarzas WHERE completed = 1
        `) as [any[], any];

        // Remove completed sarzas from active heaters
        for (const sarza of completedSarzas) {
            const key = `${sarza.id}-${sarza.kada_id}`;
            if (activeHeaters.has(key)) {
                activeHeaters.delete(key);
            }
        }

        // Wait for all logDuration operations to complete
        await Promise.all(logPromises);  // Executes all the logDuration functions in parallel

    } catch (error) {
        console.error('Error tracking heater states:', (error as Error).message);
    }
}

// Function to log the duration of the heater states
async function logDuration(sarza_id: number, column: string, duration: number) {
    const updateQuery = `
        UPDATE heater_log
        SET ${column} = ${column} + ?, last_updated = NOW()
        WHERE sarza_id = ?
    `;
    await db.execute(updateQuery, [duration, sarza_id]);
}

// Start the tracking process
setInterval(trackHeaterStates, 1000); // Poll every second

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
app.put('/api/sarzas/:id/complete', async (req, res) => {
    const { id } = req.params;  // Get the sarza ID from the route parameter
    try {
        // Update query
        const query = `UPDATE sarzas SET completed = 1, completed_at = NOW() WHERE id = ?`;

        // Execute the query and properly type the result
        const [result]: [ResultSetHeader, FieldPacket[]] = await db.execute(query, [id]);

        // Check the `affectedRows` property
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Sarza not found' });
        }

        // Respond with success
        res.json({ message: 'Sarza completed successfully' });
    } catch (error) {
        console.error('Error updating sarza:', error);
        res.status(500).json({ message: 'Error updating sarza' });
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
