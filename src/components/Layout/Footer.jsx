import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="app-footer">
            <div className="footer-content">
                <div className="footer-brand">PADDOCKPULSE</div>
                <div className="footer-links">
                    <a href="https://github.com/scarfl1ck1012/PaddockPulse" target="_blank" rel="noreferrer">GitHub Repo</a>
                    <span>|</span>
                    <a href="#">Privacy Policy</a>
                </div>
                <div className="footer-legal">
                    <p>Disclaimer: This app is unofficial and is not associated in any way with the Formula 1 companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks of Formula One Licensing B.V.</p>
                    <p>Data provided by OpenF1, Jolpica-F1, and Open-Meteo APIs for educational purposes.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
