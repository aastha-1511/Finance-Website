import React from 'react';

const FeaturesHero = () => {
  return (
    <section className="px-6 py-20 max-w-7xl mx-auto">
      <div className="text-center">
        <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">What We Offer</span>
        <h1 className="text-5xl md:text-6xl font-bold leading-[1.15] pb-2 bg-gradient-to-r from-blue-900 via-blue-700 to-purple-700 bg-clip-text text-transparent mb-6 mt-4">
          Everything You Need in One Place
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Trade stocks, manage expenses, get AI assistance, read finance blogs, and connect with a community of like-minded investors
        </p>
      </div>
      
      {/* <div className="mt-16 rounded-3xl shadow-2xl overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=500&fit=crop" 
          alt="Financial platform dashboard"
          className="w-full h-96 object-cover"
        />
      </div> */}

      <div className="mt-16 relative h-72 rounded-3xl overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-700 to-purple-700 opacity-90" />
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.25),transparent_60%)]" />

  <div className="relative h-full flex items-center justify-center text-white text-center px-6">
    <p className="text-2xl font-medium max-w-3xl">
      One platform. Smarter decisions. Complete financial clarity.
    </p>
  </div>
</div>

    </section>
  );
};


export default FeaturesHero;