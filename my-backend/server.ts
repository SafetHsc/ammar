import express from 'express';
import mysql, {ResultSetHeader, RowDataPacket} from 'mysql2/promise';
import cors from 'cors';
import {ReadlineParser, SerialPort} from 'serialport'; // Import serialport

const app = express();
const port = 5174; // CHANGE IF NEEDED

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
    .catch((err) => console.error('Database connection failed:', (err as Error).message));

// Function to insert log data into the logs table
async function insertLog(
    cardId: number,
    level: 'info' | 'warning' | 'error',
    message: string,
    logDate: string,
    elGrijacState: number,
    ventilState: number,
    stateChangedTimestamp: string | null,
    stateReturnedTimestamp: string | null,
    durationSeconds: number | null,
    warningMessage: string | null,
    errorMessage: string | null
) {
    const query = `
        INSERT INTO logs (
            card_id, level, message, log_date, elGrijac_state, ventil_state, 
            state_changed_timestamp, state_returned_timestamp, duration_seconds, 
            warning_message, error_message
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        await db.query(query, [
            cardId,
            level,
            message,
            logDate,
            elGrijacState,
            ventilState,
            stateChangedTimestamp,
            stateReturnedTimestamp,
            durationSeconds,
            warningMessage,
            errorMessage
        ]);
        console.log('Log inserted successfully');
    } catch (error) {
        console.error('Error inserting log:', error);
    }
}

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

        // Log the state change
        const now = new Date();
        const logDate = now.toISOString().split('T')[0];  // Format as YYYY-MM-DD

        let stateChangedTimestamp = null;
        let stateReturnedTimestamp = null;
        let durationSeconds = null;

        // Track state change and calculate duration
        if (newElGrijacState === 1 || newVentilState === 1) {
            stateChangedTimestamp = now.toISOString();
        } else if (newElGrijacState === 0 || newVentilState === 0) {
            stateReturnedTimestamp = now.toISOString();
            if (stateChangedTimestamp) {
                const diff = (new Date(stateReturnedTimestamp).getTime() - new Date(stateChangedTimestamp).getTime()) / 1000; // in seconds
                durationSeconds = diff;
            }
        }

        // Prepare log message
        const message = `State change detected for elGrijac and ventil on card ${cardId}`;

        let warningMessage = null;
        let errorMessage = null;

        // Check for any warnings or errors
        if (parseFloat(currentTemperature) < 0) {
            warningMessage = 'Temperature below 0°C';
        }

        // Insert log entry into the database
        await insertLog(
            cardId,
            'info',  // or 'warning' based on the situation
            message,
            logDate,
            newElGrijacState,
            newVentilState,
            stateChangedTimestamp,
            stateReturnedTimestamp,
            durationSeconds,
            warningMessage,
            errorMessage
        );

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
        console.error('Error executing query:', (error as Error).message);
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
        console.error('Error executing query:', (error as Error).message);
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
        console.error('Error executing query:', (error as Error).message);
        res.status(500).json({ success: false, message: 'Database update failed' });
    }
});

// Endpoint to fetch user data (credentials able to log in)
app.get('/api/users', async (_req, res) => {
    const query = 'SELECT id, username, password FROM users';

    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (error) {
        console.error('Error executing query:', (error as Error).message);
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
        console.error('Error executing query:', (error as Error).message);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
});

app.get('/api/logs', async (req, res) => {
    const { cardId, date, level, page = 1, limit = 10 } = req.query;

    let whereClauses: string[] = [];
    let queryParams: any[] = [];

    if (cardId && cardId !== 'all') {
        whereClauses.push('card_id = ?');
        queryParams.push(cardId);
    }

    if (date) {
        whereClauses.push('DATE(timestamp) = ?');
        queryParams.push(date);
    }

    if (level && level !== 'all') {
        whereClauses.push('level = ?');
        queryParams.push(level);
    }

    const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
    const offset = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

    const query = `
        SELECT * FROM logs
                          ${whereSQL}
        ORDER BY timestamp DESC
            LIMIT ? OFFSET ?
    `;

    console.log('Executing query:', query);
    console.log('With parameters:', [...queryParams, parseInt(limit as string, 10), offset]);

    try {
        const [logs] = await db.query(query, [...queryParams, parseInt(limit as string, 10), offset]);
        res.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error); // Log the full error
        res.status(500).json({ error: 'Failed to fetch logs', details: (error as Error).message });
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
