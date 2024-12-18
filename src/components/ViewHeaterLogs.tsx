import React, { useState, useEffect } from 'react';
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
    const [logs, setLogs] = useState<HeaterLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<HeaterLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [kadaId, setKadaId] = useState<string>('');
    const [fromDate, setFromDate] = useState<string>(''); // From date filter
    const [toDate, setToDate] = useState<string>(''); // To date filter
    const [heaterType, setHeaterType] = useState<string>(''); // Heater type filter

    const itemsPerPage = 10;

    // Fetch logs on mount
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/grijaci_dnevno'); // API endpoint
                if (!response.ok) throw new Error('Failed to fetch logs');
                const data: HeaterLog[] = await response.json();

                // Fetch cardName for each log and update
                const updatedLogs = await Promise.all(
                    data.map(async (log) => {
                        const cardName = await getCardName(log.kada_id); // Fetch cardName by kada_id
                        return { ...log, cardName }; // Attach cardName to each log
                    })
                );

                setLogs(updatedLogs); // Use updatedLogs to set state
                setFilteredLogs(updatedLogs); // Use updatedLogs to set filtered state
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Real-time filtering
    useEffect(() => {
        let filtered = logs;

        if (kadaId.trim()) {
            filtered = filtered.filter((log) =>
                log.kada_id.toString().includes(kadaId.trim())
            );
        }

        if (heaterType.trim()) {
            filtered = filtered.filter((log) => log.heater_type.toLowerCase().includes(heaterType.toLowerCase()));
        }

        // Set fromDate and toDate to today if not set
        const today = new Date();  // Current date and time
        const fromDateObj = new Date(fromDate || '2024-12-07'); // Default to today's date if empty
        const toDateObj = new Date(toDate || today); // Default to current date/time if empty

        // Ensure full timestamp comparisons (fromDate at 00:00:00 and toDate at 23:59:59)
        fromDateObj.setHours(0, 0, 0, 0); // Set fromDate to the start of the day
        toDateObj.setHours(23, 59, 59, 999); // Set toDate to the end of the day

        // Filter logs by created_at date
        filtered = filtered.filter((log) => {
            const logCreationDate = new Date(log.created_at); // Full ISO date with time
            return (
                logCreationDate >= fromDateObj && logCreationDate <= toDateObj
            );
        });

        setFilteredLogs(filtered);
        setCurrentPage(1); // Reset pagination after filtering
    }, [kadaId, fromDate, toDate, heaterType, logs]);

    const getCardName = async (kadaId: number): Promise<string> => {
        try {
            const response = await fetch(`/api/cards/${kadaId}`);
            if (response.ok) {
                const data = await response.json();
                return data.cardName || 'N/A'; // Return cardName or 'N/A' if not found
            } else {
                throw new Error('Card name not found');
            }
        } catch (err) {
            console.error(err);
            return 'N/A'; // Default if there is an error fetching cardName
        }
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = filteredLogs.length > 0 ? Math.ceil(filteredLogs.length / itemsPerPage) : 1; // Avoid 0 pages if no data

    const handlePreviousPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    // Helper function to format date
    const formatDate = (date: string): string => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Helper function to rename heater types
    const formatHeaterType = (type: string): string => {
        if (type === 'elGrijac') {
            return 'el. grijač';
        }
        return type; // No change for 'ventil'
    };

    // Convert seconds to hours (with two decimal places)
    const convertSecondsToHours = (seconds: number): string => {
        const hours = (seconds / 3600).toFixed(2);
        return `${hours} h`;
    };

    return (
        <div className="view-nalogs">
            <h2 className="sarza-h2">Pregled Logova Grijača</h2>
            <div className="sarza-nazad" style={{ marginBottom: '20px' }}>
                <Link to="/nalozi-sarze">Nazad</Link>
            </div>
            {/* Filter Controls */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    placeholder="Kada ID"
                    value={kadaId}
                    onChange={(e) => setKadaId(e.target.value)}
                    style={{
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        width: '150px',
                    }}
                />
                <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    style={{
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        width: '150px',
                    }}
                />
                <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    style={{
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        width: '150px',
                    }}
                />

                {/* Heater Type Dropdown */}
                <select
                    value={heaterType}
                    onChange={(e) => setHeaterType(e.target.value)}
                    style={{
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        width: '150px',
                    }}
                >
                    <option value="">Odaberi Grijač</option>
                    <option value="elGrijac">El. Grijač</option>
                    <option value="ventil">Ventil</option>
                </select>
            </div>

            {/* Loading/Error States */}
            {loading && <p>Učitavanje podataka...</p>}
            {error && <p>Error: {error}</p>}

            {/* Results Table */}
            {!loading && filteredLogs.length > 0 ? (
                <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <table
                        className="nalogs-table"
                        style={{
                            width: '100%',
                            textAlign: 'center',
                            borderCollapse: 'collapse',
                        }}
                    >
                        <thead>
                        <tr>
                            <th>Datum</th>
                            <th>Kada ID</th>
                            <th>Naziv Kade</th>
                            <th>Tip Grijača</th>
                            <th>Ukupno Vrijeme (sekunde)</th>
                            <th>Ukupno Vrijeme (sati)</th> {/* New column for hours */}
                        </tr>
                        </thead>
                        <tbody>
                        {currentLogs.map((log) => (
                            <tr key={log.id}>
                                <td>{formatDate(log.created_at)}</td>
                                <td>{log.kada_id}</td>
                                <td>{log.cardName}</td>
                                <td>{formatHeaterType(log.heater_type)}</td>
                                <td>
                                    {log.duration_seconds === 0 ?
                                        `Upaljen od: - ${new Date(log.created_at).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            hour12: false
                                        })}`
                                        : log.duration_seconds}
                                </td>
                                <td>{convertSecondsToHours(log.duration_seconds)}</td>
                                {/* Display hours */}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                !loading && <p>Nema podataka za prikaz.</p>
            )}

            {/* Pagination Controls */}
            <div
                style={{
                    marginTop: '20px',
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    style={{marginRight: '10px', padding: '5px 10px', cursor: 'pointer'}}
                >
                    Prethodna
                </button>
                <span>
                    Stranica {currentPage} od {totalPages}
                </span>
                <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    style={{marginLeft: '10px', padding: '5px 10px', cursor: 'pointer'}}
                >
                    Sljedeća
                </button>
            </div>
        </div>
    );
};

export default ViewHeaterLogs;
