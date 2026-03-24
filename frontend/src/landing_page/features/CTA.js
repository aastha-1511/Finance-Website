import React from 'react';
import { Link } from 'react-router-dom';

const FeaturesCTA = () => {
  return (
    <section className="px-6 py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/50 to-purple-600/50"></div>
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to Start Your Financial Journey?
        </h2>
        <p className="text-xl text-blue-100 mb-10">
          Join our community and access all features completely free
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/login"
            className="bg-white text-blue-600 hover:bg-gray-50 px-10 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl"
            style={{ textDecoration: 'none' }}
          >
            Get Started Free
          </Link>
          <Link
            to="/features"
            className="border-2 border-white text-white hover:bg-white/10 px-10 py-4 rounded-xl font-bold text-lg transition-all"
            style={{ textDecoration: 'none' }}
          >
            Explore Features
          </Link>
        </div>

        <p className="text-blue-100 mt-6">
          No credit card required • Join thousands of users • Free forever
        </p>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-pink-400/20 rounded-full blur-3xl"></div>
    </section>
  );
};

export default FeaturesCTA;