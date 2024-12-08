import { Link } from 'react-router-dom';

const NaloziSarze = () => {
    return (
        <div style={styles.pageContainer}>
            <div style={styles.headerContainer}>
                <h2 style={styles.title}>Upravljanje Nalozima i Šaržama</h2>
                <Link to="/" style={styles.backLink}>Nazad</Link>
            </div>
            <div style={styles.buttonContainer}>
                <Link to="/novi-nalog">
                    <button style={styles.button}>KREIRAJ NALOG</button>
                </Link>
                <Link to="/nova-sarza">
                    <button style={styles.button}>KREIRAJ ŠARŽU</button>
                </Link>
                <Link to="/vidi-nalog">
                    <button style={styles.button}>PREGLED NALOGA</button>
                </Link>
                <Link to="/vidi-sarze">
                    <button style={styles.button}>PREGLED ŠARŽI</button>
                </Link>
                {/* New buttons */}
                <Link to="/kompletiraj-nalog">
                    <button style={styles.button}>KOMPLETIRAJ NALOG</button>
                </Link>
                <Link to="/kompletiraj-sarzu">
                    <button style={styles.button}>KOMPLETIRAJ ŠARŽU</button>
                </Link>
            </div>
        </div>
    );
}

const styles = {
    pageContainer: {
        display: 'flex',
        flexDirection: 'column' as 'column', // Stack elements vertically
        justifyContent: 'flex-start', // Align to top, but leave space below for buttons
        alignItems: 'center', // Center horizontally
        minHeight: '100vh', // Full screen height
        backgroundColor: '#f4f4f9', // Light background for the page
        fontFamily: 'Arial, sans-serif',
        padding: '20px',
    },
    headerContainer: {
        textAlign: 'center' as 'center', // Center header text
        width: '100%',
        marginBottom: '10px', // Reduced space between header and buttons
    },
    title: {
        fontSize: '2rem',
        marginBottom: '10px',
    },
    backLink: {
        display: 'block',
        textDecoration: 'none',
        color: 'blue',
        fontSize: '18px',
    },
    buttonContainer: {
        display: 'flex',
        flexDirection: 'column' as 'column', // Stack buttons vertically
        gap: '10px', // Spacing between buttons
        alignItems: 'center',
        padding: '20px', // Reduced padding for a more compact container
        backgroundColor: '#e0e0e0', // Darker background for the button container
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        width: 'auto',
        maxWidth: '400px', // Width of the container
        maxHeight: '450px', // Set a max height to avoid overflow
        marginTop: '20px', // Ensure space between header and button container
        position: 'absolute' as 'absolute', // Absolute positioning to keep it centered
        top: '50%', // Center vertically
        transform: 'translateY(-50%)', // Offset the container by half its height to truly center it
        overflowY: 'auto' as 'auto', // Correct type for overflowY
    },
    button: {
        width: '250px', // Increased width for buttons
        height: '50px', // Slightly smaller height for buttons to avoid excess height
        fontSize: '1rem',
        border: 'none',
        borderRadius: '5px',
        backgroundColor: '#4CAF50',
        color: 'white',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
    },
};

export default NaloziSarze;
