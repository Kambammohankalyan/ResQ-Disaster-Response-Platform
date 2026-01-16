import React, { useState } from 'react';
import { useIncidents } from '../../hooks/useIncidents';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { verifyIncident } from '../../api';
import { axiosInstance } from '../../lib/axios';
import { 
    Check, UserPlus, AlertOctagon, Map as MapIcon, 
    ListFilter, Siren, Radio, ShieldCheck 
} from 'lucide-react';
import type { IUser, IIncident } from '@repo/types';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export const CommandCenterPage = () => {
    const { data: incidents, isLoading } = useIncidents();
    const queryClient = useQueryClient();
    const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS'>('ALL');

    // Fetch Responders for assignment dropdown
    const { data: responders } = useQuery({
        queryKey: ['responders'],
        queryFn: async () => {
             const { data } = await axiosInstance.get<IUser[]>('/users');
             return data.filter(u => u.roles.some((r: any) => r.name === 'Volunteer' || r.name === 'Dispatcher'));
        }
    });

    const verifyMutation = useMutation({
        mutationFn: verifyIncident,
        onSuccess: () => {
            toast.success('Incident Verified');
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
        }
    });

    const assignMutation = useMutation({
        mutationFn: ({ incidentId, responderId }: { incidentId: string, responderId: string }) => 
            axiosInstance.post(`/incidents/${incidentId}/assign/${responderId}`),
        onSuccess: () => {
            toast.success('Responder Assigned');
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
        },
        onError: () => toast.error('Failed to assign responder')
    });

    const pendingIncidents = incidents?.filter(i => i.status === 'OPEN') || [];
    const activeIncidents = incidents?.filter(i => i.status === 'IN_PROGRESS') || [];
    const criticalIncidents = incidents?.filter(i => i.severity === 'CRITICAL') || [];

    const filteredIncidents = incidents?.filter(i => {
        if (filterStatus === 'ALL') return true;
        return i.status === filterStatus;
    }) || [];

    const selectedIncident = incidents?.find(i => i.id === selectedIncidentId);

    if (isLoading) return <div className="flex h-96 items-center justify-center text-slate-400">Initializing Command Center...</div>;

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col space-y-6">
            {/* Top Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard 
                    label="Pending Dispatch" 
                    value={pendingIncidents.length} 
                    icon={Radio} 
                    color="text-amber-600" 
                    bgColor="bg-amber-50"
                />
                <StatCard 
                    label="Active Operations" 
                    value={activeIncidents.length} 
                    icon={Siren} 
                    color="text-blue-600" 
                    bgColor="bg-blue-50"
                    animate
                />
                <StatCard 
                    label="Critical Alerts" 
                    value={criticalIncidents.length} 
                    icon={AlertOctagon} 
                    color="text-red-600" 
                    bgColor="bg-red-50"
                />
                <StatCard 
                    label="Active Units" 
                    value={responders?.length || 0} 
                    icon={ShieldCheck} 
                    color="text-emerald-600" 
                    bgColor="bg-emerald-50"
                />
            </div>

            {/* Main Operations View */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                
                {/* Left Panel: Incident Feed */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h2 className="font-bold text-slate-700 flex items-center">
                            <ListFilter className="w-4 h-4 mr-2" /> Live Feed
                        </h2>
                        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                            {(['ALL', 'OPEN', 'IN_PROGRESS'] as const).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={cn(
                                        "px-3 py-1 text-xs font-semibold rounded-md transition-all",
                                        filterStatus === status 
                                            ? "bg-slate-800 text-white shadow-sm" 
                                            : "text-slate-500 hover:bg-slate-50"
                                    )}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {filteredIncidents.map(incident => (
                            <div 
                                key={incident.id}
                                onClick={() => setSelectedIncidentId(incident.id)}
                                className={cn(
                                    "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                                    selectedIncidentId === incident.id 
                                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" 
                                        : "border-slate-200 bg-white hover:border-blue-300"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={cn(
                                        "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
                                        incident.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : 
                                        incident.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                    )}>
                                        {incident.severity}
                                    </span>
                                    <span className="text-xs text-slate-400">{formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}</span>
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 truncate">{incident.title}</h3>
                                <p className="text-xs text-slate-500 truncate">{incident.type}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Center/Right Panel: Detail & Map View */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    {selectedIncident ? (
                        <div className="h-full flex flex-col">
                            {/* Toolbar */}
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div>
                                    <h2 className="font-bold text-lg text-slate-900 flex items-center">
                                        {selectedIncident.title}
                                    </h2>
                                    <p className="text-sm text-slate-500 flex items-center mt-1">
                                        <MapIcon className="w-3 h-3 mr-1" /> 
                                        {selectedIncident.location.lat.toFixed(5)}, {selectedIncident.location.lng.toFixed(5)}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                     {!selectedIncident.verified && (
                                        <button 
                                            onClick={() => verifyMutation.mutate(selectedIncident.id)}
                                            className="flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 shadow-sm"
                                        >
                                            <Check className="w-4 h-4 mr-2" /> Verify
                                        </button>
                                     )}
                                </div>
                            </div>

                            {/* Main Content Split: Details + Map Placeholder */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2">
                                <div className="p-6 border-r border-slate-100 bg-slate-50/50 space-y-6">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                                        <p className="text-sm text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                                            {selectedIncident.description || "No description provided."}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assignment</h3>
                                        {selectedIncident.assignedToId ? (
                                            <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
                                                <UserPlus className="w-4 h-4 mr-2" />
                                                <span className="text-sm font-medium">Assigned to Unit {selectedIncident.assignedToId.slice(0, 5)}...</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <select 
                                                    className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    onChange={(e) => {
                                                        if(e.target.value) assignMutation.mutate({ incidentId: selectedIncident.id, responderId: e.target.value });
                                                    }}
                                                    value=""
                                                >
                                                    <option value="" disabled>Select Responder Unit...</option>
                                                    {responders?.map(r => (
                                                        <option key={r.id} value={r.id}>
                                                            {r.firstName} {r.lastName} ({r.email})
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-slate-400">Select a unit to dispatch immediately.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                                            <div className="text-xs text-slate-400">Created</div>
                                            <div className="text-sm font-semibold">{new Date(selectedIncident.createdAt).toLocaleTimeString()}</div>
                                        </div>
                                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                                            <div className="text-xs text-slate-400">Status</div>
                                            <div className={cn("text-sm font-semibold", 
                                                selectedIncident.status === 'OPEN' ? 'text-blue-600' : 'text-slate-900'
                                            )}>
                                                {selectedIncident.status}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tactical Map View */}
                                <div className="relative h-full min-h-[400px] w-full bg-slate-100 overflow-hidden">
                                     <Map
                                        initialViewState={{
                                            longitude: selectedIncident.location.lng,
                                            latitude: selectedIncident.location.lat,
                                            zoom: 14
                                        }}
                                        style={{ width: '100%', height: '100%' }}
                                        mapStyle={MAP_STYLE}
                                        attributionControl={false}
                                     >
                                        <Marker 
                                            longitude={selectedIncident.location.lng} 
                                            latitude={selectedIncident.location.lat} 
                                            anchor="bottom"
                                        >
                                             <div className="relative">
                                                 <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg animate-ping absolute inset-0 opacity-75"></div>
                                                 <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-lg relative z-10"></div>
                                             </div>
                                        </Marker>
                                     </Map>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                            <Siren className="w-16 h-16 mb-4 text-slate-200" />
                            <p className="font-medium">Select an incident from the live feed to view tactical details.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, color, bgColor, animate }: any) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={cn("p-3 rounded-xl", bgColor, color)}>
            <Icon className={cn("w-6 h-6", animate && "animate-pulse")} />
        </div>
    </div>
);
