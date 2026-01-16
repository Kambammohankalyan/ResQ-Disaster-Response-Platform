import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMyIncidents } from '../../api';
import { Loader2, Plus, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import IncidentForm from '../../components/IncidentForm';
import { cn } from '../../lib/utils'; // Assuming this utility exists

export const MyReportsPage = () => {
    const { data: incidents, isLoading, isError, error } = useQuery({
        queryKey: ['my-incidents'],
        queryFn: fetchMyIncidents,
        retry: 1
    });

    if (isError) {
        return (
            <div className="max-w-7xl mx-auto p-8 text-center">
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 inline-block">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-900 mb-2">Failed to Load Reports</h2>
                    <p className="text-red-700 mb-4 text-sm max-w-md mx-auto">{(error as any)?.message || 'We could not retrieve your incident history at this time.'}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
             <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Incident Reporting</h1>
                <p className="mt-2 text-slate-500">Submit and track your emergency assistance requests.</p>
             </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                        <div className="flex">
                            <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                            <div>
                                <h3 className="text-sm font-medium text-red-800">Emergency Notice</h3>
                                <div className="mt-1 text-sm text-red-700">
                                    <p>If you or someone else is in immediate life-threatening danger, please <strong>call 911</strong> or your local emergency services immediately. ResQ is a volunteer coordination platform.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                                <Plus className="w-5 h-5 mr-2 text-blue-600" />
                                New Request
                            </h2>
                        </div>
                        <IncidentForm />
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full max-h-[calc(100vh-12rem)]">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-slate-500" />
                                Your History
                            </h2>
                            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {incidents?.length || 0} Reports
                            </span>
                        </div>
                        
                        <div className="flex-1 overflow-auto p-6">
                            {isLoading ? (
                                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-400" /></div>
                            ) : (
                                <div className="space-y-4">
                                    {incidents?.length === 0 && (
                                        <div className="text-center py-12 px-4">
                                            <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                                <FileText className="text-slate-300 w-6 h-6" />
                                            </div>
                                            <p className="text-slate-500 text-sm">You haven't reported any incidents yet.</p>
                                        </div>
                                    )}
                                    {incidents?.map(inc => (
                                        <div key={inc.id || (inc as any)._id} className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{inc.title}</h3>
                                                    <p className="text-xs text-slate-500 mt-1 flex items-center">
                                                        {new Date(inc.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                                    inc.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 
                                                    inc.assignedToId ? 'bg-blue-100 text-blue-700' : 
                                                    'bg-amber-100 text-amber-700'
                                                )}>
                                                    {inc.status === 'OPEN' && inc.assignedToId ? 'In Progress' : inc.status}
                                                </span>
                                            </div>
                                            
                                            <div className="text-sm text-slate-600 line-clamp-2 mb-3">
                                                {inc.description}
                                            </div>

                                            <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-50">
                                                <span className="text-slate-400 font-mono">ID: {(inc.id || (inc as any)._id || '').toString().slice(-6)}</span>
                                                {inc.verified ? (
                                                     <span className="flex items-center text-green-600 font-medium">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                                                     </span>
                                                ) : <span className="text-slate-400 italic">Pending verification</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
