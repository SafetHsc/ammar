import React, { useState, useEffect } from "react";

const Signali: React.FC = () => {
    // Light states for each status
    const [isMismatchOn, setIsMismatchOn] = useState(false);
    const [isSensorErrorOn, setIsSensorErrorOn] = useState(false);
    const [isStuckOn, setIsStuckOn] = useState(false);

    useEffect(() => {
        // Function to toggle light on and off for a specific duration
        const startBlinking = (setState: React.Dispatch<React.SetStateAction<boolean>>, interval: number) => {
            const toggleLight = () => {
                setState((prev) => !prev);
            };
            const cycle = setInterval(toggleLight, interval); // Toggle every interval time (e.g., 1 second)

            return () => clearInterval(cycle); // Clear interval when component unmounts
        };

        // Start blinking with a cycle of 1 second on, 1 second off (for temperature mismatch)
        const mismatchCleanup = startBlinking(setIsMismatchOn, 1000);

        // Start blinking with a cycle of 3 seconds on, 3 seconds off (for sensor error)
        const sensorErrorCleanup = startBlinking(setIsSensorErrorOn, 3000);

        // Start blinking with a cycle of 5 seconds on, 5 seconds off (for stuck temperature)
        const stuckCleanup = startBlinking(setIsStuckOn, 5000);

        // Cleanup intervals when component is unmounted
        return () => {
            mismatchCleanup();
            sensorErrorCleanup();
            stuckCleanup();
        };
    }, []);

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center", // Center the container vertically
                alignItems: "center", // Center the container horizontally
                height: "100vh",
                backgroundColor: "white",
                marginTop: "-5rem"
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start", // Align items to the left inside the container
                    gap: "20px", // Add space between items
                }}
            >
                {/* Temperature Mismatch */}
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                        style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            backgroundColor: isMismatchOn ? "orange" : "gray",
                            boxShadow: isMismatchOn ? "0 0 10px orange" : "none",
                            transition: "background-color 0.3s ease, box-shadow 0.3s ease",
                            marginRight: "20px",
                        }}
                    ></div>
                    <p style={{ margin: 0, fontSize: "16px" }}>
                    <b>Temperatura nejednaka u kontroleru i sistemu:</b> kratki pulsevi u trajanju od 1 sekunde (1s uključeno - 1s isključeno)
                    </p>
                </div>

                {/* Sensor Error */}
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                        style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            backgroundColor: isSensorErrorOn ? "orange" : "gray",
                            boxShadow: isSensorErrorOn ? "0 0 10px orange" : "none",
                            transition: "background-color 0.3s ease, box-shadow 0.3s ease",
                            marginRight: "20px",
                        }}
                    ></div>
                    <p style={{ margin: 0, fontSize: "16px" }}>
                        <b>Greška senzora (pokvaren ili odspojen):</b> kratki pulsevi u trajanju od 3 sekunde (3s uključeno - 3s isključeno)
                    </p>
                </div>

                {/* Temperature Stuck */}
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                        style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            backgroundColor: isStuckOn ? "orange" : "gray",
                            boxShadow: isStuckOn ? "0 0 10px orange" : "none",
                            transition: "background-color 0.3s ease, box-shadow 0.3s ease",
                            marginRight: "20px",
                        }}
                    ></div>
                    <p style={{ margin: 0, fontSize: "16px" }}>
                    <b>Temperatura se ne povećava:</b> pulsevi u trajanju od 5 sekundi (5s uključeno - 5s isključeno)
                    </p>
                </div>

                {/* Temperature Exceeds Limit */}
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                        style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            backgroundColor: "orange", // Always on
                            boxShadow: "0 0 10px orange",
                            marginRight: "20px",
                        }}
                    ></div>
                    <p style={{ margin: 0, fontSize: "16px" }}>
                    <b>Temperatura prekoračuje gornju granicu:</b> Svjetlo upaljeno kontinuirano
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signali;
