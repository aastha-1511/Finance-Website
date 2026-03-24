import React from 'react';
import { Sparkles, Target, Zap } from 'lucide-react';

const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      title: "Create Your Account",
      description: "Sign up in seconds and connect your bank accounts securely using our encrypted integration.",
      icon: <Sparkles className="w-10 h-10" />,
      color: "from-amber-500 to-orange-500"
    },
    {
      number: "02",
      title: "Set Your Goals",
      description: "Define your financial objectives, whether it's saving, investing, or managing debt.",
      icon: <Target className="w-10 h-10" />,
      color: "from-blue-500 to-cyan-500"
    },
    {
      number: "03",
      title: "Get Insights & Grow",
      description: "Receive personalized recommendations and watch your wealth grow with data-driven decisions.",
      icon: <Zap className="w-10 h-10" />,
      color: "from-violet-500 to-purple-500"
    }
  ];

  return (
    <section className="px-6 py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-4">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Simple Process</span>
        </div>
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
          How It Works
        </h2>
        <p className="text-center text-gray-600 mb-16 text-lg">
          Get started in three simple steps
        </p>
        
        <div className="grid md:grid-cols-3 gap-8 relative">
          {steps.map((step, index) => (
            <StepCard key={index} {...step} isLast={index === steps.length - 1} />
          ))}
        </div>
      </div>
    </section>
  );
};

const StepCard = ({ number, title, description, icon, color, isLast }) => {
  return (
    <div className="relative">
      <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100">
        <div className={`bg-gradient-to-br ${color} text-white w-16 h-16 rounded-xl flex items-center justify-center mb-6 shadow-md`}>
          {icon}
        </div>
        <div className="text-5xl font-bold text-gray-200 mb-4">{number}</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
      {!isLast && (
        <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
          <div className="text-blue-300 text-4xl">→</div>
        </div>
      )}
    </div>
  );
};

export default HowItWorksSection;