import React, { useState } from 'react';
import { Link } from "react-router-dom";

interface HeaterLog {
    id: number;
    kada_id: number;
    heater_type: string;
    state_change_on: string; // ISO date string
    state_change_off: string; // ISO date string
    duration_seconds: number;
    created_at: string; // ISO date string
    cardName?: string;
}

const ViewHeaterLogs: React.FC = () => {
    const [filteredLogs, setFilteredLogs] = useState<HeaterLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [kadaId, setKadaId] = useState<string>('');
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');
    const [heaterType, setHeaterType] = useState<string>('');
    const [totalHours, setTotalHours] = useState<string>('0.00');

    const getCardName = async (kadaId: number): Promise<string> => {
        try {
            const response = await fetch(`/api/cards/${kadaId}`);
            if (response.ok) {
                const data = await response.json();
                return data.cardName || 'N/A';
            } else {
                throw new Error('Card name not found');
            }
        } catch (err) {
            console.error(err);
            return 'N/A';
        }
    };

    const applyFilter = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/grijaci_dnevno');
            if (!response.ok) throw new Error('Failed to fetch logs');
            const data: HeaterLog[] = await response.json();

            // Apply filters and fetch card names on the fly
            const filteredLogs = await Promise.all(
                data
                    .filter((log) => {
                        // Filter by kadaId
                        if (kadaId.trim() && !log.kada_id.toString().includes(kadaId.trim())) return false;

                        // Filter by heater type
                        if (heaterType.trim() && !log.heater_type.toLowerCase().includes(heaterType.toLowerCase())) return false;

                        // Filter by date range
                        const today = new Date();
                        const fromDateObj = new Date(fromDate || '2024-12-07');
                        const toDateObj = new Date(toDate || today);

                        fromDateObj.setHours(0, 0, 0, 0);
                        toDateObj.setHours(23, 59, 59, 999);

                        const logCreationDate = new Date(log.created_at);
                        return logCreationDate >= fromDateObj && logCreationDate <= toDateObj;
                    })
                    .map(async (log) => {
                        const cardName = await getCardName(log.kada_id);
                        return { ...log, cardName };
                    })
            );

            setFilteredLogs(filteredLogs);

            // Calculate total hours for filtered logs
            const totalSeconds = filteredLogs.reduce((sum, log) => sum + log.duration_seconds, 0);
            setTotalHours((totalSeconds / 3600).toFixed(2));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: string): string => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const convertSecondsToHours = (seconds: number): string => {
        return (seconds / 3600).toFixed(2);
    };

    return (
        <div className="view-nalogs">
            <h2 className="sarza-h2">Pregled Logova Grijača</h2>
            <div className="sarza-nazad" style={{ marginBottom: '20px' }}>
                <Link to="/nalozi-sarze">Nazad</Link>
            </div>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    placeholder="Kada ID"
                    value={kadaId}
                    onChange={(e) => setKadaId(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', width: '150px' }}
                />
                <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', width: '150px' }}
                />
                <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', width: '150px' }}
                />
                <select
                    value={heaterType}
                    onChange={(e) => setHeaterType(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', width: '150px' }}
                >
                    <option value="">Odaberi Grijač</option>
                    <option value="elGrijac">El. Grijač</option>
                    <option value="ventil">Ventil</option>
                </select>
                <button
                    onClick={applyFilter}
                    style={{
                        padding: '10px 15px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: '#007BFF',
                        color: '#fff',
                        cursor: 'pointer',
                    }}
                >
                    Primijeni Filter
                </button>
                <input
                    type="text"
                    value={`Ukupno sati: ${totalHours}`}
                    readOnly
                    style={{
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        width: '150px',
                        backgroundColor: '#f9f9f9',
                        cursor: 'not-allowed',
                    }}
                />
            </div>
            {loading && <p>Učitavanje podataka...</p>}
            {error && <p>Error: {error}</p>}
            {!loading && filteredLogs.length > 0 ? (
                <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <table className="nalogs-table" style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr>
                            <th>Datum</th>
                            <th>Kada ID</th>
                            <th>Naziv Kade</th>
                            <th>Tip Grijača</th>
                            <th>Ukupno Vrijeme (sekunde)</th>
                            <th>Ukupno Vrijeme (sati)</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredLogs.map((log) => (
                            <tr key={log.id}>
                                <td>{formatDate(log.created_at)}</td>
                                <td>{log.kada_id}</td>
                                <td>{log.cardName}</td>
                                <td>{log.heater_type}</td>
                                <td>{log.duration_seconds}</td>
                                <td>{convertSecondsToHours(log.duration_seconds)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                !loading && <p>Nema podataka za prikaz.</p>
            )}
        </div>
    );
};

export default ViewHeaterLogs;
