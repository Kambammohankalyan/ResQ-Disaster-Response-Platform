import { Link } from 'react-router-dom';
import { ShieldAlert, Activity, LayoutDashboard, CheckCircle, ArrowRight, Map } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage = () => {
    const { isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Navbar */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <ShieldAlert className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-bold text-xl text-slate-900 tracking-tight">ResQ</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <Link 
                                to="/dashboard" 
                                className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex items-center gap-2"
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                Go to Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                                    Sign In
                                </Link>
                                <Link to="/register" className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-grow">
                <div className="relative overflow-hidden bg-slate-900 py-24 sm:py-32">
                    <div className="absolute inset-0 z-0">
                         <img 
                            src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80" 
                            alt="Disaster Response" 
                            className="w-full h-full object-cover opacity-20"
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40" />
                    </div>

                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="inline-flex items-center rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-sm font-medium text-blue-400 mb-6 backdrop-blur-sm">
                            <Activity className="w-4 h-4 mr-2" />
                            Active Response System
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-6">
                            Crisis Response. <br className="hidden sm:block" />
                            <span className="text-blue-500">Coordinate in Real-Time.</span>
                        </h1>
                        <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto mb-10">
                            ResQ connects civilians, volunteers, and dispatchers in a unified offline-first platform for disaster management and rapid resource allocation.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/public-map" className="px-8 py-3.5 bg-white text-blue-600 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center border border-slate-200">
                                <Map className="w-4 h-4 mr-2" />
                                View Live Map
                            </Link>
                            <Link to="/register" className="px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center">
                                Report an Incident <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto sm:mx-0">
                                    <Map className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Live Situation Map</h3>
                                <p className="text-slate-500">Real-time geospatial visualization of incidents and resources with offline caching.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 mx-auto sm:mx-0">
                                    <Activity className="w-6 h-6 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Rapid Dispatch</h3>
                                <p className="text-slate-500">Automated task allocation and resource tracking for efficient emergency response.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto sm:mx-0">
                                    <ShieldAlert className="w-6 h-6 text-purple-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Secure & Reliable</h3>
                                <p className="text-slate-500">Enterprise-grade security with offline-first support for degraded network environments.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-slate-50 border-t border-slate-200 py-8">
                <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
                    &copy; {new Date().getFullYear()} ResQ Disaster Management System. All rights reserved.
                </div>
            </footer>
        </div>
    );
};