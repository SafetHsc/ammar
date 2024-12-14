import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Nalog {
    id: number;
    broj_naloga: string;
    firma: string;
    broj_komada_alat: string;
    total_broj_komada: number;
    remaining_broj_komada_alat: string;
    completed: number;
    created_at: string;
    completed_at: string | null;
}

const KompletirajNalog: React.FC = () => {
    const [nalogs, setNalogs] = useState<Nalog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 10;

    useEffect(() => {
        const fetchNalogs = async () => {
            try {
                const response = await fetch('/api/nalogs');
                if (!response.ok) throw new Error('Failed to fetch nalogs');
                const data: Nalog[] = await response.json();
                // Filter out only incomplete nalogs (completed = 0)
                const incompleteNalogs = data.filter(nalog => nalog.completed === 0);
                setNalogs(incompleteNalogs);
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

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentNalogs = nalogs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.max(Math.ceil(nalogs.length / itemsPerPage), 1);

    const handlePreviousPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    // Function to check if all pieces are processed
    const isCompletedValid = (remaining_broj_komada_alat: string): boolean => {
        try {
            const remaining = JSON.parse(remaining_broj_komada_alat);
            const totalRemaining = remaining.reduce((sum: number, item: { broj_komada: number }) => sum + item.broj_komada, 0);
            return totalRemaining <= 0;
        } catch (error) {
            console.error("Invalid JSON format for remaining_broj_komada_alat", error);
            return false;
        }
    };

    // Function to handle "Kompletiraj" button click
    const handleComplete = async (id: number, remaining_broj_komada_alat: string) => {
        if (!isCompletedValid(remaining_broj_komada_alat)) {
            alert('Nalog ne može biti kompletiran dok svi komadi nisu obrađeni!');
            return;
        }

        try {
            const response = await fetch(`/api/nalogs/${id}/complete`, {
                method: 'PUT',
            });

            if (response.ok) {
                alert('Nalog označen kao kompletiran!');
                // Remove the completed nalog from the list without refreshing the page
                setNalogs(nalogs.filter(nalog => nalog.id !== id));
            } else {
                alert('Error completing nalog');
            }
        } catch (error) {
            console.error('Error completing nalog:', error);
            alert('Error completing nalog');
        }
    };

    return (
        <div className="view-nalogs">
            <h2 className="sarza-h2">Kompletiraj Naloge</h2>
            <div className="sarza-nazad" style={{ marginBottom: '20px' }}>
                <Link to="/nalozi-sarze">Nazad</Link>
            </div>

            <div style={{ maxHeight: 'calc(70vh - 50px)', overflowY: 'auto', paddingBottom: '40px' }}>
                <table className="nalogs-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Broj Naloga</th>
                        <th>Firma</th>
                        <th>Zaprimljeni Alati</th>
                        <th>Neobrađeni Alati</th>
                        <th>Kreirano</th>
                        <th>Akcija</th>
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
                            <td>{new Date(nalog.created_at).toLocaleString()}</td>
                            <td>
                                <button
                                    style={{
                                        padding: '5px 10px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => handleComplete(nalog.id, nalog.remaining_broj_komada_alat)}
                                >
                                    Kompletiraj
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div style={{marginTop: '10px', display: 'flex', justifyContent: 'center'}}>
                <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    style={{marginRight: '10px', padding: '5px 10px'}}
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

export default KompletirajNalog;
