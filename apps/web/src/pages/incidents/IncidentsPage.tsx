import React from 'react';
import IncidentForm from '../../components/IncidentForm';
import { useIncidents } from '../../hooks/useIncidents';
import { cn } from '../../lib/utils';
import { AlertTriangle, Clock, MapPin } from 'lucide-react';

export const IncidentsPage = () => {
  const { data: incidents, isLoading } = useIncidents();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900">Incident Management</h1>
            <span className="text-sm text-slate-500">Total: {incidents?.length || 0}</span>
        </div>

        {isLoading ? (
             <div className="text-center py-12 text-slate-500">Loading incidents...</div>
        ) : (
            <div className="grid grid-cols-1 gap-4">
              {incidents?.length === 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 text-center text-slate-500">
                    No incidents reported yet.
                </div>
              )}
              {incidents?.slice().reverse().map((inc) => (
                <div key={inc.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">{inc.title}</h3>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase",
                      inc.severity === 'CRITICAL' ? "bg-red-100 text-red-800" :
                      inc.severity === 'HIGH' ? "bg-orange-100 text-orange-800" :
                      inc.severity === 'MEDIUM' ? "bg-yellow-100 text-yellow-800" :
                      "bg-blue-100 text-blue-800"
                    )}>
                      {inc.severity}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-500 mt-4">
                     <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Lat: {inc.location?.lat?.toFixed(4)}, Lng: {inc.location?.lng?.toFixed(4)}
                     </div>
                     <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {new Date(inc.createdAt).toLocaleString()}
                     </div>
                     <div className="flex items-center col-span-1 sm:col-span-2 mt-2">
                        <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                            inc.status === 'RESOLVED' ? "bg-green-100 text-green-800" :
                            "bg-slate-100 text-slate-800"
                        )}>
                            Status: {inc.status}
                        </span>
                     </div>
                  </div>
                </div>
              ))}
            </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
             <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
                Report New Incident
             </h2>
             <IncidentForm />
        </div>
      </div>
    </div>
  );
};
