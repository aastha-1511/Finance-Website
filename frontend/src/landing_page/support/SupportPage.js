import React from 'react';
import SupportHero from './Hero';
import FAQSection from './FAQ';
import ContactSection from './Contact';

const Support = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <SupportHero />
      
      {/* FAQ Section */}
      <FAQSection />
      
      {/* Contact Form Section */}
      <ContactSection />
    </div>
  );
};

export default Support;