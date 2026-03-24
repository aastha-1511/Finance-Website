import React from 'react';
import {  Users, TrendingUp, Heart,  Award } from 'lucide-react';

const StatsSection = () => {
  const stats = [
    { number: "10,000+", label: "Active Users", icon: <Users className="w-8 h-8" /> },
    { number: "₹50M+", label: "Managed Assets", icon: <TrendingUp className="w-8 h-8" /> },
    { number: "98%", label: "User Satisfaction", icon: <Award className="w-8 h-8" /> },
    { number: "24/7", label: "Support Available", icon: <Heart className="w-8 h-8" /> }
  ];

  return (
    <section className="px-6 py-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Impact in Numbers</h2>
          <p className="text-lg text-gray-600">Growing together, achieving more every day</p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
};

const StatCard = ({ number, label, icon }) => {
  return (
    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <div className="text-4xl font-bold text-gray-900 mb-2">{number}</div>
      <div className="text-gray-600 font-medium">{label}</div>
    </div>
  );
};

export default StatsSection;