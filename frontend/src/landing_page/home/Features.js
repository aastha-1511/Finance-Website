import React from 'react';
import { TrendingUp, Shield, Wallet} from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: <Wallet className="w-12 h-12" />,
      title: "Smart Budgeting",
      description: "Track expenses, set budget limits, and get real-time alerts when you're approaching your spending limits.",
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-50 to-teal-50"
    },
    {
      icon: <TrendingUp className="w-12 h-12" />,
      title: "Investment Analytics",
      description: "Analyze your portfolio performance with advanced metrics and AI-powered recommendations for better returns.",
      gradient: "from-blue-600 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50"
    },
    {
      icon: <Shield className="w-12 h-12" />,
      title: "Secure & Reliable",
      description: "Bank-level encryption ensures your financial data is protected with the highest security standards.",
      gradient: "from-purple-600 to-pink-600",
      bgGradient: "from-purple-50 to-pink-50"
    }
  ];

  return (
    <section className="px-6 py-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-4">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Features</span>
        </div>
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
          Everything You Need to Master Your Finances
        </h2>
        <p className="text-center text-gray-600 mb-16 text-lg">
          Powerful features designed to simplify your financial journey
        </p>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon, title, description, gradient, bgGradient }) => {
  return (
    <div className={`bg-gradient-to-br ${bgGradient} p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-gray-100`}>
      <div className={`bg-gradient-to-br ${gradient} text-white w-16 h-16 rounded-xl flex items-center justify-center mb-6 shadow-md`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};

export default FeaturesSection;