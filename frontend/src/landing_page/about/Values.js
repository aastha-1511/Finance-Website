import React from 'react';


const ValuesSection = () => {
  const values = [
    {
      title: "Innovation First",
      description: "We constantly push boundaries, exploring new technologies and approaches to solve financial challenges in creative ways.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      title: "User-Centric Design",
      description: "Every feature, every button, every interaction is designed with our users' needs and experiences at the forefront.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: "Integrity & Security",
      description: "We treat user data with the utmost respect, implementing bank-level security and maintaining complete transparency.",
      gradient: "from-emerald-500 to-teal-500"
    }
  ];

  return (
    <section className="px-6 py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Our Values</span>
          <h2 className="text-4xl font-bold text-gray-900 mb-4 mt-2">What We Stand For</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <ValueCard key={index} {...value} />
          ))}
        </div>
      </div>
    </section>
  );
};

const ValueCard = ({ title, description, gradient }) => {
  return (
    <div className="relative group">
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-all`}></div>
      <div className="relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

const WhySection = () => {
  return (
    <section className="px-6 py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-white mb-6">Why This Matters</h2>
        <p className="text-xl text-blue-100 leading-relaxed mb-8">
          Financial stress affects millions of people worldwide. Many lack access to the tools and education needed to manage their money effectively. Traditional financial services are often complex, expensive, and intimidating. We believe everyone deserves a better way.
        </p>
        <p className="text-xl text-blue-100 leading-relaxed">
          That's why we created this platform—to bridge the gap between complex financial concepts and everyday decision-making, making financial wellness achievable for everyone, everywhere.
        </p>
      </div>
    </section>
  );
};
export { ValuesSection, WhySection };