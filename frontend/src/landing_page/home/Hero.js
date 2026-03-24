import React from 'react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* ── Bull background image ── */}
      <div
        style={{
          backgroundImage: 'url(/assets/bull.avif)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          backgroundRepeat: 'no-repeat',
        }}
        className="relative min-h-screen flex items-center justify-center"
      >
        {/* dark gradient overlay so text is legible */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(15,23,42,0.82) 0%, rgba(30,27,75,0.70) 50%, rgba(88,28,135,0.55) 100%)',
          }}
        />

        {/* ── Content ── */}
        <div className="relative z-10 text-center px-6 py-24 max-w-5xl mx-auto">
          <div className="inline-block mb-6">
            <span className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
              Trusted by 10,000+ Users
            </span>
          </div>

          <h1
            className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 50%, #c4b5fd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Smart Finance Insights<br />for Smarter Decisions
          </h1>

          <p className="text-xl text-white/75 mb-10 max-w-3xl mx-auto leading-relaxed">
            Take control of your financial future with powerful budgeting tools,
            intelligent investment analytics, and personalized insights that help
            you make informed decisions every day.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/login">
              <button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-xl hover:shadow-indigo-500/40">
                Get Started Free
              </button>
            </Link>
          </div>

          {/* subtle stat strip */}
          {/* <div className="mt-16 flex flex-wrap justify-center gap-10">
            {[
              { label: 'Assets Tracked', value: '₹2.4B+' },
              { label: 'Active Users', value: '10K+' },
              { label: 'Stocks Covered', value: '5,000+' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-extrabold text-white">{value}</p>
                <p className="text-sm text-white/60 mt-1">{label}</p>
              </div>
            ))}
          </div> */}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

