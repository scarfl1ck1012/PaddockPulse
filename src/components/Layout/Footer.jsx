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
                    <p>PaddockPulse is an unofficial fan application. F1, FORMULA ONE, and all associated marks are trademarks of Formula One Licensing B.V. Data sourced from OpenF1 and Jolpica (public APIs).</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
