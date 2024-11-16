import React, { useEffect, useState } from 'react';

interface LogEntry {
    id: number;
    timestamp: string;
    message: string;
    level: 'info' | 'warning' | 'error';
    cardId: number;
}

const LogsPage: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState<'all' | 'info' | 'warning' | 'error'>('all');
    const [selectedCardId, setSelectedCardId] = useState<number | 'all'>('all');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const logsPerPage = 10;

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            setError(null);

            try {
                const queryParams = new URLSearchParams();
                if (selectedCardId !== 'all') queryParams.append('cardId', selectedCardId.toString());
                if (selectedDate) queryParams.append('date', selectedDate);
                if (filterLevel !== 'all') queryParams.append('level', filterLevel);
                queryParams.append('page', currentPage.toString());
                queryParams.append('limit', logsPerPage.toString());

                const response = await fetch(`/api/logs?${queryParams.toString()}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch logs');
                }

                const data = await response.json();
                setLogs(data);

                const totalLogs = parseInt(response.headers.get('X-Total-Count') || '0', 10);
                setTotalPages(Math.ceil(totalLogs / logsPerPage));
            } catch (error) {
                setError('Error fetching logs. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [selectedCardId, selectedDate, filterLevel, currentPage]);

    // Filter logs locally
    const filteredLogs = logs.filter(log =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.timestamp.includes(searchTerm)
    );

    // Pagination logic
    const handlePageChange = (page: number) => setCurrentPage(page);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="logs-page">
            <h1>Logs</h1>
            <div className="controls">
                <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value as 'all' | 'info' | 'warning' | 'error')}>
                    <option value="all">Level</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                </select>

                <select value={selectedCardId} onChange={(e) => setSelectedCardId(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}>
                    <option value="all">All Cards</option>
                    {Array.from({ length: 10 }, (_, index) => (
                        <option key={index + 1} value={index + 1}>
                            Card {index + 1}
                        </option>
                    ))}
                </select>

                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
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
                {filteredLogs.map(log => (
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
                        aria-label={`Page ${index + 1}`}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LogsPage;
