import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";

interface Nalog {
    id: number;
    broj_naloga: string;
    firma: string;
    broj_komada_alat: string;
    total_broj_komada: number;
    opis: string;
    remaining_broj_komada_alat: string;
    completed: number;
    created_at: string;
    completed_at: string | null;
    sarze: string;
}

const ViewNalog: React.FC = () => {
    const [nalogs, setNalogs] = useState<Nalog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState<string>('all');
    const [idSearch, setIdSearch] = useState<string>(''); // New state for ID search
    const [brojNalogSearch, setBrojNalogSearch] = useState<string>('');
    const [firmaSearch, setFirmaSearch] = useState<string>('');

    const itemsPerPage = 10;

    useEffect(() => {
        const fetchNalogs = async () => {
            try {
                const response = await fetch('/api/nalogs/view');
                if (!response.ok) throw new Error('Failed to fetch nalogs');
                const data: Nalog[] = await response.json();
                setNalogs(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchNalogs();
    }, []);

    if (loading) return <p>Učitavanje naloga...</p>;
    if (error) return <p>Error: {error}</p>;

    // Filter logic
    const filteredNalogs = nalogs.filter((nalog) => {
        const matchesFilter = filter === 'all' || nalog.completed.toString() === filter;
        const matchesId = nalog.id.toString().includes(idSearch.trim());
        const matchesBrojNalog = nalog.broj_naloga.toLowerCase().includes(brojNalogSearch.toLowerCase());
        const matchesFirma = nalog.firma.toLowerCase().includes(firmaSearch.toLowerCase());
        return matchesFilter && matchesId && matchesBrojNalog && matchesFirma;
    });

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentNalogs = filteredNalogs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.max(Math.ceil(filteredNalogs.length / itemsPerPage), 1);

    const handlePreviousPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setFilter(event.target.value);
        setCurrentPage(1); // Reset to first page on filter change
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
            <h2 className="sarza-h2">Pregled Naloga</h2>
            <div className="sarza-nazad" style={{ marginBottom: '20px' }}>
                <Link to="/nalozi-sarze">Nazad</Link>
            </div>

            <div style={{marginBottom: '20px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                <div style={{display: 'flex', gap: '25px'}}> {/* Adjust gap here */}
                    <div>
                        <input
                            type="text"
                            placeholder="Pretraži ID"
                            value={idSearch}
                            onChange={(e) => setIdSearch(e.target.value)}
                            style={{
                                padding: '10px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                backgroundColor: '#fff',
                                width: '100%',
                            }}
                        />
                    </div>
                    <div>
                        <input
                            type="text"
                            placeholder="Pretraži Broj Naloga"
                            value={brojNalogSearch}
                            onChange={(e) => setBrojNalogSearch(e.target.value)}
                            style={{
                                padding: '10px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                backgroundColor: '#fff',
                                width: '100%',
                            }}
                        />
                    </div>
                    <div>
                        <input
                            type="text"
                            placeholder="Pretraži Firmu"
                            value={firmaSearch}
                            onChange={(e) => setFirmaSearch(e.target.value)}
                            style={{
                                padding: '10px',
                                paddingRight: '1px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                backgroundColor: '#fff',
                                width: '100%',
                            }}
                        />
                    </div>
                </div>

                <div style={{width: '200px'}}>
                    <select
                        value={filter}
                        onChange={handleFilterChange}
                        style={{
                            padding: '10px',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            backgroundColor: '#fff',
                            width: '100%',
                        }}
                    >
                        <option value="all">Svi Nalozi</option>
                        <option value="1">Kompletirani</option>
                        <option value="0">Nezavršeni</option>
                    </select>
                </div>
            </div>

            <div style={{maxHeight: 'calc(70vh - 50px)', overflowY: 'auto', paddingBottom: '40px'}}>
                <table className="nalogs-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Broj Naloga</th>
                        <th>Firma</th>
                        <th>Zaprimljeni Alati</th>
                        <th>Ukupnih Komada</th>
                        <th>Opis</th>
                        <th>Neobrađeni Alati</th>
                        <th>Kompletirano</th>
                        <th>Datum Kreiranja</th>
                        <th>Datum Završetka</th>
                        <th>Šarže (ID)</th>
                    </tr>
                    </thead>
                    <tbody>
                    {currentNalogs.map((nalog) => (
                        <tr key={nalog.id}>
                            <td>{nalog.id}</td>
                            <td>{nalog.broj_naloga}</td>
                            <td>{nalog.firma}</td>
                            <td>
                                {nalog.broj_komada_alat
                                    ? JSON.parse(nalog.broj_komada_alat)
                                        .map(
                                            (item: { alat: string; broj_komada: string }) =>
                                                `${item.broj_komada} - ${item.alat}`
                                        )
                                        .join('; ')
                                    : '-'}
                            </td>
                            <td>{nalog.total_broj_komada}</td>
                            <td style={{wordWrap: 'break-word', maxWidth: '200px'}}>
                                {nalog.opis || '-'}
                            </td>
                            <td>
                                {nalog.remaining_broj_komada_alat
                                    ? JSON.parse(nalog.remaining_broj_komada_alat)
                                        .map(
                                            (item: { alat: string; broj_komada: string }) =>
                                                `${item.broj_komada} - ${item.alat}`
                                        )
                                        .join('; ')
                                    : '-'}
                            </td>
                            <td>{nalog.completed === 1 ? 'Da' : 'Ne'}</td>
                            <td>{formatDateTo24Hour(nalog.created_at)}</td>
                            <td>{nalog.completed_at ? formatDateTo24Hour(nalog.completed_at) : '-'}</td>
                            <td>{nalog.sarze ? nalog.sarze.split(',').join(', ') : '-'}</td>
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

export default ViewNalog;
