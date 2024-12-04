import React, { useEffect, useState } from 'react';

interface LogEntry {
    id: number;
    timestamp: string;
    message: string;
    level: 'info' | 'warning' | 'error';
    cardId: number; // Added card ID to identify logs per card
}

const LogsPage: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState<'all' | 'info' | 'warning' | 'error'>('all');
    const [selectedCardId, setSelectedCardId] = useState<number | 'all'>('all');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const logsPerPage = 10;

    useEffect(() => {
        // Fetch logs from your API here, including card and date filters
        const fetchLogs = async () => {
            try {
                const queryParams = new URLSearchParams();
                if (selectedCardId !== 'all') queryParams.append('cardId', selectedCardId.toString());
                if (selectedDate) queryParams.append('date', selectedDate);

                const response = await fetch(`/api/logs?${queryParams.toString()}`);
                const data = await response.json();
                setLogs(data);
            } catch (error) {
                console.error("Failed to fetch logs:", error);
            }
        };
        fetchLogs();
    }, [selectedCardId, selectedDate]);

    // Filter and search logs
    const filteredLogs = logs
        .filter(log =>
            (filterLevel === 'all' || log.level === filterLevel) &&
            (selectedCardId === 'all' || log.cardId === selectedCardId) &&
            (log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.timestamp.includes(searchTerm))
        );

    // Paginate logs
    const indexOfLastLog = currentPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);

    const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterLevel(e.target.value as 'all' | 'info' | 'warning' | 'error');
        setCurrentPage(1);
    };

    const handleCardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCardId(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10));
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(e.target.value);
    };

    const handlePageChange = (page: number) => setCurrentPage(page);

    return (
        <div className="logs-page">
            <h1>Logs</h1>
            <div className="controls">
                <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
                <select value={filterLevel} onChange={handleFilterChange}>
                    <option value="all">Leveli</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                </select>

                <select value={selectedCardId} onChange={handleCardChange}>
                    <option value="all">Sve Kade</option>
                    {Array.from({ length: 10 }, (_, index) => (
                        <option key={index + 1} value={index + 1}>
                            Kada {index + 1}
                        </option>
                    ))}
                </select>

                <input type="date" value={selectedDate} onChange={handleDateChange} />
            </div>
            <table className="logs-table">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Timestamp</th>
                    <th>Message</th>
                    <th>Level</th>
                    <th>Card ID</th>
                </tr>
                </thead>
                <tbody>
                {currentLogs.map(log => (
                    <tr key={log.id}>
                        <td>{log.id}</td>
                        <td>{log.timestamp}</td>
                        <td>{log.message}</td>
                        <td className={`level-${log.level}`}>{log.level}</td>
                        <td>{log.cardId}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            <div className="pagination">
                {Array.from({ length: totalPages }, (_, index) => (
                    <button
                        key={index + 1}
                        className={currentPage === index + 1 ? 'active' : ''}
                        onClick={() => handlePageChange(index + 1)}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LogsPage;
