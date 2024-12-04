import { Link } from "react-router-dom";

function NaloziSarze() {
    return (
        <div className="centered-buttons">
            <Link to="/novi-nalog">
                <button className="ns-btn">
                    KREIRAJ NALOG
                </button>
            </Link>
            <Link to="/nova-sarza">
                <button className="ns-btn">
                    KREIRAJ SARZU
                </button>
            </Link>
            <Link to="/vidi-nalog">
                <button className="ns-btn">
                    PREGLED NALOGA
                </button>
            </Link>
            <Link to="/vidi-sarze">
                <button className="ns-btn">
                    PREGLED SARZI
                </button>
            </Link>
        </div>
    );
}

export default NaloziSarze;
