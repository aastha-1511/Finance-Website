import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
    return (
        <footer style={{ backgroundColor: "rgb(240,240,240)" }}>
            <div className='container border-top'>
                {/* Columns: 2-up on mobile (col-6), 4-up on desktop (col) */}
                <div className='row mt-3 mt-md-5'>
                    <div className='col-6 col-md mb-3'>
                        <img src='assets/FINANCEHUB.png' alt='logo' style={{ width: "28%", marginBottom: "8px" }}></img>
                        <p style={{ fontSize: "12px", margin: 0 }}>© 2010 - 2025, FinanceHub Broking Ltd.<br />All rights reserved</p>
                    </div>
                    <div className='col-6 col-md mb-3'>
                        <p style={{ fontWeight: 700, fontSize: "13px", marginBottom: "6px" }}>Company</p>
                        <div style={{ fontSize: "12px", lineHeight: "1.9" }}>
                            <Link to="/about">About</Link><br />
                            <Link to="/features">Products</Link><br />
                            <Link to="/pricing">Pricing</Link><br />
                            <Link to="/community">Community</Link><br />
                            <Link to="/support">Careers</Link>
                        </div>
                    </div>
                    <div className='col-6 col-md mb-3'>
                        <p style={{ fontWeight: 700, fontSize: "13px", marginBottom: "6px" }}>Support</p>
                        <div style={{ fontSize: "12px", lineHeight: "1.9" }}>
                            <Link to="/support">Contact us</Link><br />
                            <Link to="/support">Support portal</Link><br />
                            <Link to="/community">Community blog</Link><br />
                            <Link to="/support">Downloads &amp; resources</Link><br />
                            <Link to="/support">How to file a complaint?</Link>
                        </div>
                    </div>
                    <div className='col-6 col-md mb-3'>
                        <p style={{ fontWeight: 700, fontSize: "13px", marginBottom: "6px" }}>Account</p>
                        <div style={{ fontSize: "12px", lineHeight: "1.9" }}>
                            <Link to="/login">Open an account</Link><br />
                            <Link to="/login">Sign In</Link><br />
                            <Link to="/features">Features</Link>
                        </div>
                    </div>
                </div>
                {/* Disclaimer — smaller and tighter on mobile */}
                <div className='mt-3 mt-md-4 pb-3 text-muted' style={{ fontSize: "11px" }}>
                    <p style={{ marginBottom: "6px" }}>FinanceHub Broking Ltd.: Member of NSE, BSE &amp; MCX – SEBI Registration no.: INZ000031633. Investments in securities market are subject to market risks; read all the related documents carefully before investing.</p>
                    <p style={{ marginBottom: 0 }}>Attention investors: 1) Stock brokers can accept securities as margins from clients only by way of pledge in the depository system. 2) Update your e-mail and phone number with your stock broker / depository participant and receive OTP directly from depository.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;