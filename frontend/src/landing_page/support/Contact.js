import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import {
  Mail,
  AlertCircle,
  Send,
  CheckCircle,
} from 'lucide-react';

const ContactSection = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState('');

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    else if (formData.message.trim().length < 10) newErrors.message = 'Message must be at least 10 characters';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSending(true);
    setServerError('');
    try {
      await axios.post(`${API_URL}/api/contact`, formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 6000);
    } catch (err) {
      setServerError('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="px-6 py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h2>
          <p className="text-lg text-gray-600">Have questions or feedback? Our team is here to assist you.</p>
        </div>

        {submitted && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <p className="text-green-800 font-medium">
              Message sent! We've received your query and will respond within 24–48 hours.
            </p>
          </div>
        )}

        {serverError && (
          <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-xl p-4 text-red-700 font-medium">
            {serverError}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
              <input
                type="text" id="name" name="name" value={formData.name} onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border-2 ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:border-blue-500 focus:outline-none transition-colors`}
                placeholder="Enter your full name"
              />
              {errors.name && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
              <input
                type="email" id="email" name="email" value={formData.email} onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border-2 ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:border-blue-500 focus:outline-none transition-colors`}
                placeholder="your.email@example.com"
              />
              {errors.email && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">Your Message *</label>
              <textarea
                id="message" name="message" value={formData.message} onChange={handleChange} rows="6"
                className={`w-full px-4 py-3 rounded-xl border-2 ${errors.message ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:border-blue-500 focus:outline-none transition-colors resize-none`}
                placeholder="How can we help you today?"
              />
              {errors.message && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.message}</p>}
            </div>

            <button
              type="submit" disabled={sending}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              {sending ? 'Sending…' : 'Submit Message'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
