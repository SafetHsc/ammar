import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";

interface Sarza {
    id: number;
    nalog_id: number;
    broj_komada_alat: string;
    total_br_kmd: number;
    skart: string;
    total_skart: number;
    kada_id: number;
    completed: number;
    created_at: string;
    completed_at: string | null;
}

const ViewSarza: React.FC = () => {
    const [sarzas, setSarzas] = useState<Sarza[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [nalogSearch, setNalogSearch] = useState<string>('');
    const [sarzaIdSearch, setSarzaIdSearch] = useState<string>(''); // New state
    const [completedFilter, setCompletedFilter] = useState<string>('all');

    const itemsPerPage = 10;

    useEffect(() => {
        const fetchSarzas = async () => {
            try {
                const response = await fetch('/api/sarzas'); // Your backend endpoint for all sarzas
                if (!response.ok) throw new Error('Failed to fetch sarzas');
                const data: Sarza[] = await response.json();
                setSarzas(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSarzas();
    }, []);

    if (loading) return <p>Učitavanje šarži...</p>;
    if (error) return <p>Error: {error}</p>;

    // Filter logic
    const filteredSarzas = sarzas.filter((sarza) => {
        const matchesNalog = sarza.nalog_id
            .toString()
            .includes(nalogSearch.trim());
        const matchesSarzaId = sarza.id
            .toString()
            .includes(sarzaIdSearch.trim()); // New filter condition
        const matchesCompleted =
            completedFilter === 'all' ||
            sarza.completed.toString() === completedFilter;

        return matchesNalog && matchesSarzaId && matchesCompleted;
    });

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSarzas = filteredSarzas.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredSarzas.length / itemsPerPage);

    const handlePreviousPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    // Function to format date to 24-hour format
    const formatDateTo24Hour = (date: string) => {
        return new Date(date).toLocaleString('en-GB', {
            hour12: false,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    return (
        <div className="view-nalogs">
            <h2 className="sarza-h2">Pregled Šarži</h2>
            <div className="sarza-nazad" style={{ marginBottom: '20px' }}>
                <Link to="/nalozi-sarze">Nazad</Link>
            </div>

            {/* Search and Filter Controls */}
            <div style={{marginBottom: '20px', display: 'flex', gap: '2px'}}>
                <input
                    type="text"
                    placeholder="Pretraži ID"
                    value={sarzaIdSearch}
                    onChange={(e) => setSarzaIdSearch(e.target.value)} // New search bar
                    style={{
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        width: '200px',
                    }}
                />
                <input
                    type="text"
                    placeholder="Pretraži Po Nalogu"
                    value={nalogSearch}
                    onChange={(e) => setNalogSearch(e.target.value)}
                    style={{
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        width: '200px',
                    }}
                />

                <select
                    value={completedFilter}
                    onChange={(e) => setCompletedFilter(e.target.value)}
                    style={{
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        width: '200px',
                    }}
                >
                    <option value="all">Sve Šarže</option>
                    <option value="1">Kompletirane</option>
                    <option value="0">Nezavršene</option>
                </select>
            </div>

            <div style={{maxHeight: 'calc(70vh - 50px)', overflowY: 'auto', paddingBottom: '40px'}}>
                <table className="nalogs-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nalog ID</th>
                        <th>Broj Komada + Alat</th>
                        <th>Ukupan Broj Komada</th>
                        <th>Škart</th>
                        <th>Ukupan Škart</th>
                        <th>Kada ID</th>
                        <th>Kompletirano</th>
                        <th>Kreirano</th>
                        <th>Završeno</th>
                    </tr>
                    </thead>
                    <tbody>
                    {currentSarzas.map((sarza) => (
                        <tr key={sarza.id}>
                            <td>{sarza.id}</td>
                            <td>{sarza.nalog_id}</td>
                            <td>
                                {sarza.broj_komada_alat
                                    ? JSON.parse(sarza.broj_komada_alat)
                                        .map(
                                            (item: { alat: string; broj_komada: string }) =>
                                                `${item.broj_komada} - ${item.alat}`
                                        )
                                        .join('; ')
                                    : '-'}
                            </td>
                            <td>{sarza.total_br_kmd}</td>
                            <td>
                                {sarza.skart
                                    ? `(${JSON.parse(sarza.skart)
                                        .map((item: { skart: string; alat: string;}) =>
                                            item.skart || item.alat 
                                                ? `${item.skart}-${item.alat}`
                                                : 'nema škarta'
                                        )
                                        .join('), (')})`
                                    : '-'}
                            </td>
                            <td>{sarza.total_skart}</td>
                            <td>{sarza.kada_id}</td>
                            <td>{sarza.completed === 1 ? 'Da' : 'Ne'}</td>
                            <td>{formatDateTo24Hour(sarza.created_at)}</td>
                            <td>{sarza.completed_at ? formatDateTo24Hour(sarza.completed_at) : '-'}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    style={{ marginRight: '10px', padding: '5px 10px' }}
                >
                    Prethodna
                </button>
                <span>
                    Stranica {currentPage} od {totalPages}
                </span>
                <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    style={{ marginLeft: '10px', padding: '5px 10px' }}
                >
                    Sljedeća
                </button>
            </div>
        </div>
    );
};

export default ViewSarza;
