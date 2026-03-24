import React from 'react';
import FeaturesHero from './Hero';
import FeaturesCTA from './CTA';
import MainFeatures from './features';


const Features = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <FeaturesHero />
      
      {/* Main Features */}
      <MainFeatures />
      
      {/* CTA Section */}
      <FeaturesCTA />
    </div>
  );
};

export default Features;