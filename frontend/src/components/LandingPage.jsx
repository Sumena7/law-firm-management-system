import React from "react";
import { Link } from "react-router-dom";
import "../App.css";

function LandingPage() {
  return (
    <div className="lp-wrapper">
      <nav className="lp-nav">
        <div className="lp-logo">🏛️ EVEREST LAW CHAMBER</div>
        <div className="lp-nav-links">
          <a href="#about">About Us</a>
          <a href="#services">Specializations</a>
          <a href="#contact">Contact</a>
          <Link to="/auth/login" className="lp-login-btn">Login</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="lp-hero">
        <div className="lp-hero-content">
          <span className="lp-since">— Trusted Since 1980 —</span>
          <h1 className="lp-title">Expert Legal Advocacy <br/>in Jhapa</h1>
          <p className="lp-description">
            From complex international trade disputes to sensitive criminal defense, 
            our advocates provide the strategic counsel you need.
          </p>
          <div className="lp-action-btns">
            <Link to="/auth/register" className="lp-btn-primary">Book Appointment</Link>
            <a href="#services" className="lp-btn-secondary">Our Practice Areas</a>
          </div>
        </div>
        <div className="lp-image-container">
          <img 
            src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=600" 
            alt="Everest Law Chamber" 
            className="lp-main-img"
          />
        </div>
      </header>

      {/* About Us Section - Simplified but Substantial */}
      <section id="about" className="lp-section about-section">
        <div className="section-container">
          <label className="gold-label">THE CHAMBER</label>
          <h2>Decades of Legal Integrity</h2>
          <div className="divider"></div>
          <div className="about-text-simple">
            <p>
              Everest Law Chamber has been a pillar of the legal community in Jhapa, Nepal, since 1980. 
              Our firm was established with a singular vision: to provide accessible, high-quality 
              legal representation that stands as firm as the Himalayas. For over 40 years, we have 
              guided thousands of clients through the most challenging moments of their lives.
            </p>
            <p>
              We believe that justice is not just a concept, but a right. Our team of seasoned 
              advocates combines traditional legal wisdom with modern strategic thinking to 
              handle cases across criminal, civil, and international trade law. We don't just 
              offer advice; we offer a partnership built on absolute confidentiality and trust.
            </p>
          </div>
        </div>
      </section>

      {/* Services Section - All Dark Boxes */}
      <section id="services" className="lp-section services-section">
        <div className="section-container">
          <label className="gold-label">OUR SPECIALIZATIONS</label>
          <h2 className="section-title">Comprehensive Legal Solutions</h2>
          <div className="divider"></div>
          
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">⚖️</div>
              <h3>Criminal Defense</h3>
              <p>Robust defense strategies for criminal litigation, protecting your fundamental rights and freedom through every stage of the trial.</p>
            </div>

            <div className="service-card">
              <div className="service-icon">📜</div>
              <h3>Civil Law</h3>
              <p>Expert handling of family law, property disputes, torts, and contractual disagreements within the Nepalese legal framework.</p>
            </div>

            <div className="service-card">
              <div className="service-icon">🏠</div>
              <h3>Property Law</h3>
              <p>Specialized counsel for land disputes, inheritance issues, and secure real estate transactions specifically in the Jhapa region.</p>
            </div>

            <div className="service-card">
              <div className="service-icon">🌐</div>
              <h3>International Trade</h3>
              <p>Strategic management of cross-border disputes, import/export trade agreements, and commercial arbitration for local businesses.</p>
            </div>

            <div className="service-card">
              <div className="service-icon">✍️</div>
              <h3>Notary & Drafting</h3>
              <p>Precision drafting of legal documents, power of attorney, and official certification services required for government procedures.</p>
            </div>
          </div>

          <div className="services-cta">
            <p>Need legal advice for a specific case?</p>
            <Link to="/auth/register" className="lp-btn-primary">Book an Appointment Now</Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="lp-section contact-section">
        <div className="section-container">
          <h2>Get In Touch</h2>
          <div className="contact-grid">
            <div className="contact-card">
              <strong>📍 Office Location</strong>
              <p>Chandragadi, Jhapa, Nepal</p>
            </div>
            <div className="contact-card">
              <strong>📞 Phone</strong>
              <p>+023-583288</p>
            </div>
            <div className="contact-card">
              <strong>✉️ Email</strong>
              <p>everestlawchamber@gmail.com</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <p>&copy; {new Date().getFullYear()} Everest Law Chamber. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;