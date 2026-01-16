import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/axios';
import type { IIncident } from '@repo/types';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export const PublicMapPage = () => {
    // Fetch directly from new public endpoint
    const { data: incidents, isLoading } = useQuery({
        queryKey: ['public-incidents'],
        queryFn: async () => {
            const { data } = await axiosInstance.get<IIncident[]>('/incidents/public');
            return data;
        }
    });

    return (
        <div className="h-screen w-full flex flex-col bg-slate-50">
            {/* Header */}
            <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-10 shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <ShieldAlert className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-slate-900">ResQ Public Map</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 hidden sm:block">
                        Already a responder?
                    </Link>
                    <Link to="/login" className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">
                        Sign In
                    </Link>
                    <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors hidden sm:inline-block">
                        Join Us
                    </Link>
                </div>
            </header>

            {/* Map Container */}
            <div className="flex-1 relative">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-20">
                        <div className="text-center">
                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">Loading Situational Awareness...</p>
                        </div>
                    </div>
                ) : (
                    <Map
                        initialViewState={{
                            longitude: 78.9629,
                            latitude: 20.5937,
                            zoom: 5
                        }}
                        style={{ width: '100%', height: '100%' }}
                        mapStyle={MAP_STYLE}
                        attributionControl={false}
                    >
                        {incidents?.map(inc => (
                            <Marker 
                                key={inc.id || (inc as any)._id} 
                                longitude={inc.location.lng} 
                                latitude={inc.location.lat}
                                color={inc.severity === 'CRITICAL' ? '#ef4444' : inc.severity === 'HIGH' ? '#f97316' : '#3b82f6'}
                                style={{cursor: 'pointer'}}
                            />
                        ))}
                    </Map>
                )}
                
                {/* Legend Overlay */}
                <div className="absolute bottom-6 left-4 bg-white/90 backdrop-blur p-4 rounded-xl border border-slate-200 shadow-lg max-w-xs z-10">
                    <h4 className="font-bold text-slate-900 mb-3 text-sm">Incident Severity</h4>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-red-500 border border-white ring-1 ring-red-100" />
                            <span className="text-xs font-medium text-slate-600">Critical</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-orange-500 border border-white ring-1 ring-orange-100" />
                            <span className="text-xs font-medium text-slate-600">High Priority</span>
                        </div>
                         <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-blue-500 border border-white ring-1 ring-blue-100" />
                            <span className="text-xs font-medium text-slate-600">Standard</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100">
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                            This map displays public safety incidents reported by the community. Locations are approximate.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
