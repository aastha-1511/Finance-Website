import React from 'react';
import { ValuesSection, WhySection } from './Values';
import StatsSection from './Stats';
import AboutHero from './Hero';
import VisionSection from './Vision';
import MissionSection from './Mission';

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <AboutHero />
      
      {/* Vision Section */}
      <VisionSection />
      
      {/* Mission Section */}
      <MissionSection />
      
      {/* Values Section */}
      <ValuesSection />
      
      {/* Why We Built This */}
      <WhySection />
      
      {/* Stats Section */}
      <StatsSection />
    </div>
  );
};

export default About;