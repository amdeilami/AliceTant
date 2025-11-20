/**
 * Home page component.
 * Displays the landing page with hero section and backend status.
 */
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

function Home() {
    const [status, setStatus] = useState('Checking...');

    useEffect(() => {
        api.get('/health/')
            .then(response => {
                setStatus(response.data.message);
            })
            .catch(error => {
                setStatus('Error connecting to backend');
                console.error('API Error:', error);
            });
    }, []);

    return (
        <Layout>
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        Welcome to AliceTant
                    </h1>
                    <p className="text-xl md:text-2xl mb-8 text-indigo-100">
                        Your personal booking assistant for seamless appointment scheduling
                    </p>
                    <div className="flex justify-center gap-4">
                        <button className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-3 rounded-lg font-semibold transition-colors">
                            Get Started
                        </button>
                        <button className="bg-indigo-700 text-white hover:bg-indigo-800 px-8 py-3 rounded-lg font-semibold transition-colors">
                            Learn More
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                        Why Choose AliceTant?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Scheduling</h3>
                            <p className="text-gray-600">
                                Book appointments in seconds with our intuitive interface
                            </p>
                        </div>
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Reliable</h3>
                            <p className="text-gray-600">
                                Your data is protected with enterprise-grade security
                            </p>
                        </div>
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Lightning Fast</h3>
                            <p className="text-gray-600">
                                Optimized performance for the best user experience
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Backend Status Section */}
            <section className="py-8 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">System Status</h3>
                        <div className="inline-flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${status.includes('Error') ? 'bg-red-500' : 'bg-green-500'}`}></span>
                            <span className="text-gray-700">{status}</span>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
}

export default Home;
