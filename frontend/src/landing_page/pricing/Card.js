import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Zap, Crown, Rocket } from 'lucide-react';

const PricingCards = ({ billingCycle }) => {
  const plans = [
    {
      name: 'Free',
      icon: <Zap className="w-8 h-8" />,
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: 'Perfect for getting started',
      gradient: 'from-gray-500 to-gray-600',
      features: [
        'Mock trading with $10,000 virtual cash',
        'Basic expense tracking',
        'Access to finance blogs',
        'Community chat access',
        'Email support'
      ],
      limitations: [
        'Limited AI assistant queries (10/day)',
        'Basic portfolio analytics',
        'Standard community features'
      ]
    },
    {
      name: 'Pro',
      icon: <Crown className="w-8 h-8" />,
      monthlyPrice: 499,
      yearlyPrice: 4790,
      description: 'For serious learners',
      gradient: 'from-blue-600 to-indigo-600',
      popular: true,
      features: [
        'Everything in Free, plus:',
        'Mock trading with $100,000 virtual cash',
        'Advanced expense analytics',
        'Unlimited AI assistant queries',
        'Advanced portfolio insights',
        'Priority community features',
        'Voice calls in groups',
        'Custom budget categories',
        'Priority email support'
      ],
      limitations: []
    },
    {
      name: 'Premium',
      icon: <Rocket className="w-8 h-8" />,
      monthlyPrice: 999,
      yearlyPrice: 9590,
      description: 'Maximum features unlocked',
      gradient: 'from-purple-600 to-pink-600',
      features: [
        'Everything in Pro, plus:',
        'Mock trading with unlimited virtual cash',
        'Real-time market data integration',
        'AI-powered investment recommendations',
        'Custom AI financial advisor',
        'Advanced tax optimization tools',
        'Private community groups',
        'Exclusive webinars & workshops',
        '24/7 priority support',
        'API access for developers'
      ],
      limitations: []
    }
  ];

  return (
    <section className="px-6 py-20 max-w-7xl mx-auto">
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <PricingCard key={index} plan={plan} billingCycle={billingCycle} />
        ))}
      </div>
    </section>
  );
};

const PricingCard = ({ plan, billingCycle }) => {
  const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  const monthlyEquivalent = billingCycle === 'yearly' ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;

  return (
    <div className={`relative bg-white rounded-3xl shadow-xl border-2 ${plan.popular ? 'border-blue-500 scale-105' : 'border-gray-200'
      } p-8 hover:shadow-2xl transition-all`}>
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
            MOST POPULAR
          </span>
        </div>
      )}

      <div className={`bg-gradient-to-br ${plan.gradient} text-white w-16 h-16 rounded-xl flex items-center justify-center mb-6`}>
        {plan.icon}
      </div>

      <h3 className="text-3xl font-bold text-gray-900 mb-2">{plan.name}</h3>
      <p className="text-gray-600 mb-6">{plan.description}</p>

      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold text-gray-900">₹{monthlyEquivalent}</span>
          <span className="text-gray-600">/month</span>
        </div>
        {billingCycle === 'yearly' && price > 0 && (
          <p className="text-sm text-green-600 font-semibold mt-2">
            Billed ₹{price} annually
          </p>
        )}
      </div>

      <Link to={plan.monthlyPrice === 0 ? '/login' : '/support'}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg mb-8 block text-center ${plan.popular
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`} style={{ textDecoration: 'none' }}>
        {plan.monthlyPrice === 0 ? 'Get Started Free' : 'Contact Support'}
      </Link>

      <div className="space-y-4">
        <p className="text-sm font-semibold text-gray-900 uppercase tracking-wider">What's included:</p>
        {plan.features.map((feature, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="bg-green-100 rounded-full p-1 flex-shrink-0">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-gray-700 text-sm">{feature}</span>
          </div>
        ))}

        {plan.limitations.length > 0 && (
          <>
            <div className="border-t border-gray-200 my-4"></div>
            {plan.limitations.map((limitation, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="bg-gray-100 rounded-full p-1 flex-shrink-0">
                  <X className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-gray-500 text-sm">{limitation}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default PricingCards;