import { Link } from 'react-router-dom';

const NaloziSarze = () => {
    return (
        <div style={styles.pageContainer}>
            <div style={styles.headerContainer}>
                <h2 style={styles.headerText}>Upravljanje Nalozima i Šaržama</h2>
                <Link to="/" className="nazad">Nazad</Link>
            </div>

            <div style={styles.buttonContainer}>
                <Link to="/novi-nalog" style={styles.link}>
                    <button style={styles.button}>KREIRAJ NALOG</button>
                </Link>
                <Link to="/nova-sarza" style={styles.link}>
                    <button style={styles.button}>KREIRAJ ŠARŽU</button>
                </Link>
                <Link to="/dodijeli-skart" style={styles.link}>
                    <button style={styles.button}>EVIDENCIJA ŠKARTA</button>
                </Link>
                <Link to="/vidi-nalog" style={styles.link}>
                    <button style={styles.button}>PREGLED NALOGA</button>
                </Link>
                <Link to="/vidi-sarze" style={styles.link}>
                    <button style={styles.button}>PREGLED ŠARŽI</button>
                </Link>
                {/* New buttons */}
                <Link to="/kompletiraj-nalog" style={styles.link}>
                    <button style={styles.button}>KOMPLETIRAJ NALOG</button>
                </Link>
                <Link to="/kompletiraj-sarzu" style={styles.link}>
                    <button style={styles.button}>KOMPLETIRAJ ŠARŽU</button>
                </Link>
            </div>
        </div>
    );
};

const styles = {
    pageContainer: {
        display: 'flex',
        flexDirection: 'column' as 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f4f4f9',
        fontFamily: 'Arial, sans-serif',
        padding: '20px',
    },

    headerContainer: {
        width: '100%',
        textAlign: 'center' as 'center',
        marginBottom: '30px',
    },

    headerText: {
        fontSize: '2rem',
        color: '#333',
        margin: '10px 0',
    },

    buttonContainer: {
        display: 'flex',
        flexDirection: 'column' as 'column',
        gap: '15px',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: 'rgba(255,255,255,0.42)',
        border: '1px solid #ddd',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        maxWidth: '300px',
        width: '100%',
        position: 'absolute' as 'absolute', // Absolute positioning for centering
        top: '50%', // Center vertically
        left: '50%', // Center horizontally
        transform: 'translate(-50%, -50%)', // Adjust position by half the width and height
        marginTop: '0', // Remove the margin-top to prevent shifting
    },

    button: {
        width: '250px',
        height: '50px',
        fontSize: '1rem',
        border: 'none',
        borderRadius: '5px',
        backgroundColor: '#4CAF50',
        color: 'white',
        cursor: 'pointer',
        transition: 'background-color 0.3s, transform 0.2s',
    },

    link: {
        textDecoration: 'none',
    },
};

export default NaloziSarze;
