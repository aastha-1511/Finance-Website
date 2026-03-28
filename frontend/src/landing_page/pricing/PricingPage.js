import React, { useState } from 'react';
import PricingHero from './Hero';
import PricingFAQ from './FAQ';
import PricingCards from './Card';

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <PricingHero billingCycle={billingCycle} setBillingCycle={setBillingCycle} />
      
      {/* Pricing Cards */}
      <PricingCards billingCycle={billingCycle} />
      
      {/* FAQ Section */}
      <PricingFAQ />
    </div>
  );
};

export default Pricing;