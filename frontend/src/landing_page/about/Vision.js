import React from 'react';
import { Lightbulb} from 'lucide-react';

const VisionSection = () => {
  return (
    <section className="px-6 py-20 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl mb-6">
            <Lightbulb className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Vision</h2>
        </div>
        
        <div className="bg-white rounded-3xl p-10 shadow-xl">
          <p className="text-2xl text-gray-700 leading-relaxed text-center mb-6">
            "A world where everyone has the tools, knowledge, and confidence to achieve financial freedom."
          </p>
          <p className="text-lg text-gray-600 leading-relaxed">
            We envision a future where financial stress is a thing of the past. Where intelligent technology works alongside human intuition to help people make informed decisions. Where budgeting isn't a chore, but an empowering practice. We're building more than just software—we're creating a movement toward financial wellness and independence for all.
          </p>
        </div>
      </div>
    </section>
  );
};

export default VisionSection;