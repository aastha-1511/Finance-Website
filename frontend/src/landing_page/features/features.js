import React from 'react';
import { 
  TrendingUp, 
  Wallet, 
  Bot, 
  BookOpen, 
  Users,
  MessageCircle
} from 'lucide-react';

const MainFeatures = () => {
  const features = [
    {
      icon: <TrendingUp className="w-12 h-12" />,
      title: "Mock Trading",
      description: "Practice trading stocks with virtual money in a real-time market environment without any financial risk",
      gradient: "from-blue-500 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50"
    },
    {
      icon: <Wallet className="w-12 h-12" />,
      title: "Expense Management",
      description: "Track your daily expenses, categorize spending, and visualize where your money goes with intuitive charts",
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-50 to-teal-50"
    },
    {
      icon: <Bot className="w-12 h-12" />,
      title: "AI Assistant",
      description: "Chat with our intelligent AI assistant for personalized financial advice, trading tips, and money management guidance",
      gradient: "from-purple-500 to-pink-600",
      bgGradient: "from-purple-50 to-pink-50"
    },
    {
      icon: <BookOpen className="w-12 h-12" />,
      title: "Finance Blogs",
      description: "Access curated articles, market insights, investment strategies, and financial literacy content from experts",
      gradient: "from-orange-500 to-red-600",
      bgGradient: "from-orange-50 to-red-50"
    },
    {
      icon: <Users className="w-12 h-12" />,
      title: "Community Groups",
      description: "Form groups with other investors, share ideas, discuss strategies, and learn together in a supportive environment",
      gradient: "from-cyan-500 to-blue-600",
      bgGradient: "from-cyan-50 to-blue-50"
    },
    {
      icon: <MessageCircle className="w-12 h-12" />,
      title: "Group Chat & Calls",
      description: "Connect with community members through text chat and voice calls to discuss markets and share knowledge in real-time",
      gradient: "from-violet-500 to-purple-600",
      bgGradient: "from-violet-50 to-purple-50"
    }
  ];

  return (
    <section className="px-6 py-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Core Features</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Six powerful tools designed to help you master your finances and grow your wealth
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
    <div className={`bg-gradient-to-br ${bgGradient} p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-gray-100 group`}>
      <div className={`bg-gradient-to-br ${gradient} text-white w-20 h-20 rounded-xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};

export default MainFeatures;