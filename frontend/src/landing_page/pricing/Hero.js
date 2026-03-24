import React from 'react';

const PricingHero = ({ billingCycle, setBillingCycle }) => {
  return (
    <section className="px-6 py-20 max-w-7xl mx-auto">
      <div className="text-center">
        <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Pricing Plans</span>
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-900 via-blue-700 to-purple-700 bg-clip-text text-transparent mb-6 mt-4">
          Choose Your Perfect Plan
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-10">
          Start free and upgrade as you grow. All plans include access to our core features
        </p>
        
        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-white rounded-full p-1 shadow-lg border-2 border-gray-200">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              billingCycle === 'monthly'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-3 rounded-full font-semibold transition-all relative ${
              billingCycle === 'yearly'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default PricingHero;