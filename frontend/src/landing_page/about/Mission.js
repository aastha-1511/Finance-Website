import React from 'react';
import { TrendingUp, Heart, Globe, Zap } from 'lucide-react';

const MissionSection = () => {
  const missions = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Simplify Complexity",
      description: "Transform complicated financial concepts into simple, actionable insights that anyone can understand and apply."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Drive Growth",
      description: "Help users grow their wealth through intelligent analytics, personalized recommendations, and data-driven strategies."
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Build Trust",
      description: "Create a secure, transparent platform where users feel confident managing their most sensitive financial information."
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Expand Access",
      description: "Make professional-grade financial tools accessible to everyone, breaking down barriers to financial education and success."
    }
  ];

  return (
    <section className="px-6 py-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Our Mission</span>
          <h2 className="text-4xl font-bold text-gray-900 mb-4 mt-2">How We're Making It Happen</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Four core pillars guide everything we build and every decision we make
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {missions.map((mission, index) => (
            <MissionCard key={index} {...mission} />
          ))}
        </div>
      </div>
    </section>
  );
};

const MissionCard = ({ icon, title, description }) => {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-2xl hover:shadow-xl transition-all border border-gray-100">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white w-14 h-14 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};

export default MissionSection;