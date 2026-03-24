import React from 'react';
import { Target, Users } from 'lucide-react';

const AboutHero = () => {
    return (
        <section className="px-6 py-20 max-w-7xl mx-auto">
            <div className="text-center">
                <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">About Us</span>
                <h1 className="text-5xl md:text-6xl font-bold leading-[1.15] pb-2 bg-gradient-to-r from-blue-900 via-blue-700 to-purple-700 bg-clip-text text-transparent mb-6 mt-4">
                    Building the Future of Personal Finance
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                    We're on a mission to democratize financial literacy and empower everyone to make smarter money decisions through intelligent technology and intuitive design.
                </p>
            </div>

            <div className="mt-16 grid md:grid-cols-2 gap-8 items-center">
                <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl p-1 shadow-2xl">
                    <div className="bg-white rounded-3xl overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop"
                            alt="Team collaboration on financial technology"
                            className="w-full h-80 object-cover"
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl text-white">
                            <Target className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Our Goal</h3>
                            <p className="text-gray-600">Make financial management accessible, simple, and effective for everyone, regardless of their background or experience level.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl text-white">
                            <Users className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Who We Serve</h3>
                            <p className="text-gray-600">From students managing their first budget to families planning their future, we build tools for everyone on their financial journey.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutHero;