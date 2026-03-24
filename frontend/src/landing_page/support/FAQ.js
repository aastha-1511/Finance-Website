import React,  { useState } from 'react';
import { 
  HelpCircle, 
  Lock,
  Code,
  GraduationCap,
  Shield,
  DollarSign
} from 'lucide-react';

const FAQSection = () => {
  const faqs = [
    {
      icon: <Shield className="w-6 h-6" />,
      question: "What type of platform is this?",
      answer: "This is a financial education and simulation platform designed to help users learn about investing, budgeting, and financial management in a risk-free environment. It provides realistic simulations of market conditions and financial scenarios without involving actual monetary transactions.",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: <Lock className="w-6 h-6" />,
      question: "How is my data protected?",
      answer: "We implement industry-standard security measures including data encryption, secure authentication protocols, and regular security audits. All user information is stored securely and we follow best practices for data protection. However, we recommend using test data rather than real financial information when using simulation features.",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      question: "Does the mock trading involve real money?",
      answer: "No, all trading on this platform is simulated using virtual currency. While market data may reflect real-world trends for educational purposes, no actual financial transactions occur. This allows users to practice trading strategies and learn market dynamics without financial risk.",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: <GraduationCap className="w-6 h-6" />,
      question: "Who can benefit from this platform?",
      answer: "This platform is ideal for anyone looking to improve their financial literacy - from beginners learning basic budgeting concepts to intermediate users wanting to understand investment strategies. It serves as a practical learning tool for those interested in personal finance management and market analysis.",
      color: "from-orange-500 to-red-600"
    },
    {
      icon: <Code className="w-6 h-6" />,
      question: "What technologies power this platform?",
      answer: "Our platform is built using modern web technologies including React for the frontend, with responsive design principles to ensure accessibility across all devices. We utilize secure backend systems, real-time data processing, and AI-powered features to deliver an engaging and educational experience.",
      color: "from-cyan-500 to-blue-600"
    },
    {
      icon: <HelpCircle className="w-6 h-6" />,
      question: "Can I get personalized financial advice?",
      answer: "This platform provides educational content and simulated scenarios but does not offer personalized financial advice. For specific financial guidance tailored to your situation, we recommend consulting with licensed financial advisors, certified financial planners, or other qualified professionals.",
      color: "from-indigo-500 to-purple-600"
    }
  ];

  return (
    <section className="px-6 py-20 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl mb-4">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-gray-600">
            Common questions about our platform and services
          </p>
        </div>
        
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <FAQCard key={index} {...faq} />
          ))}
        </div>
      </div>
    </section>
  );
};

const FAQCard = ({ icon, question, answer, color }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-200 overflow-hidden"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-8 py-6 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-4">
          <div className={`bg-gradient-to-br ${color} text-white w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0`}>
            {icon}
          </div>
          <h3 className="text-xl font-bold text-gray-900">{question}</h3>
        </div>
        <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {isOpen && (
        <div className="px-8 pb-6">
          <div className="pl-16">
            <p className="text-gray-700 leading-relaxed">{answer}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQSection;