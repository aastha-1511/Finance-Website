import React from 'react';
import CTASection from './CTA';
import HeroSection from './Hero';
import FeaturesSection from './Features';
import HowItWorksSection from './HowItWorks';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Features Section */}
      <FeaturesSection />
      
      {/* How It Works Section */}
      <HowItWorksSection />
      
      {/* CTA Section */}
      <CTASection />

    </div>
  );
};

export default HomePage;