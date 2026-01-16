import React, { useState } from 'react';
import { useIncidents } from '../../hooks/useIncidents';
import { useAuth } from '../../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { claimIncident, updateIncidentStatus } from '../../api';
import { MapPin, Clock, AlertTriangle, CheckCircle, ArrowRight, Activity, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import type { IIncident } from '@repo/types';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const MiniMap = ({ lat, lng }: { lat: number, lng: number }) => {
    // Ensure coordinates are numbers
    const latitude = Number(lat);
    const longitude = Number(lng);

    if (isNaN(latitude) || isNaN(longitude)) return <div className="h-32 bg-slate-100 flex items-center justify-center text-xs text-slate-400">Invalid Location</div>;

    return (
        <div className="h-32 w-full rounded-xl overflow-hidden mb-4 relative z-0 border border-slate-100">
            <Map
                initialViewState={{
                    longitude: longitude,
                    latitude: latitude,
                    zoom: 13
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle={MAP_STYLE}
                attributionControl={false}
                interactive={false} // Static map
            >
                <Marker longitude={longitude} latitude={latitude} anchor="bottom">
                    <div className="p-1 bg-red-500 rounded-full border-2 border-white shadow-md">
                        <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                </Marker>
            </Map>
        </div>
    );
};

export const TaskBoardPage = () => {
    const { data: incidents, isLoading } = useIncidents();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const claimMutation = useMutation({
        mutationFn: claimIncident,
        onSuccess: () => {
            toast.success('Task claimed successfully');
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
        },
        onError: (err: any) => {
            console.error(err);
            const msg = err.response?.data?.message || err.message || 'Failed to claim task';
            toast.error(msg);
        }
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: 'IN_PROGRESS' | 'RESOLVED' }) => 
            updateIncidentStatus(id, status),
        onSuccess: () => {
            toast.success('Status updated');
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
        },
        onError: (err: any) => {
             console.error(err);
             toast.error("Failed to update status");
        }
    });

    if (isLoading) return <div className="flex h-96 items-center justify-center text-slate-400">Loading tasks...</div>;

    // Filter logic
    const avaiableTasks = incidents?.filter(i => !i.assignedToId && i.status === 'OPEN') || [];
    const myTasks = incidents?.filter(i => i.assignedToId === user?.id && i.status !== 'RESOLVED') || [];

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Responder Task Board</h1>
                <p className="mt-2 text-slate-500">Manage your active assignments and pick up new emergency requests.</p>
            </div>

            {/* My Active Tasks */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center text-blue-800">
                        <Activity className="w-5 h-5 mr-2" />
                        My Assignments
                        <span className="ml-3 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                            {myTasks.length}
                        </span>
                    </h2>
                </div>
                
                {myTasks.length === 0 ? (
                    <div className="p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                        <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">You have no active tasks.</p>
                        <p className="text-sm text-slate-400">Select a task from the available list below to get started.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {myTasks.map(task => (
                            <TaskCard 
                                key={task.id} 
                                task={task} 
                                isAssignedToMe={true} 
                                onUpdateStatus={(status) => statusMutation.mutate({ id: task.id, status })}
                                isLoading={statusMutation.isPending}
                            />
                        ))}
                    </div>
                )}
            </div>

            <hr className="border-slate-200" />

            {/* Available Tasks */}
            <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center text-slate-800">
                        <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
                        Available For Pickup
                        <span className="ml-3 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                            {avaiableTasks.length}
                        </span>
                    </h2>
                </div>
                
                {avaiableTasks.length === 0 ? (
                     <div className="p-10 bg-slate-50 rounded-2xl text-center">
                         <p className="text-slate-500">No open incidents available at the moment.</p>
                     </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {avaiableTasks.map(task => (
                            <TaskCard 
                                key={task.id} 
                                task={task} 
                                isAssignedToMe={false}
                                onClaim={() => claimMutation.mutate(task.id)}
                                isLoading={claimMutation.isPending}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const TaskCard = ({ task, isAssignedToMe, onClaim, onUpdateStatus, isLoading }: { 
    task: IIncident, 
    isAssignedToMe: boolean,
    onClaim?: () => void,
    onUpdateStatus?: (s: 'IN_PROGRESS' | 'RESOLVED') => void,
    isLoading: boolean
}) => (
    <div className={cn(
        "flex flex-col bg-white p-5 rounded-2xl border transition-all duration-200",
        isAssignedToMe 
            ? "border-blue-200 shadow-md shadow-blue-100 ring-1 ring-blue-100" 
            : "border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200"
    )}>
        <div className="flex justify-between items-start mb-4">
            <span className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wide",
                task.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                task.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                'bg-blue-100 text-blue-700'
            )}>
                {task.severity}
            </span>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                {task.type || 'INCIDENT'}
            </span>
        </div>
        
        <h3 className="font-bold text-slate-900 text-lg mb-2 leading-relaxed">{task.title}</h3>

        {/* MiniMap Preview */}
        <MiniMap lat={task.location.lat} lng={task.location.lng} />

        <p className="text-sm text-slate-500 mb-6 line-clamp-2 flex-grow">{task.description || 'No description provided.'}</p>
        
        <div className="space-y-2 mb-6 text-sm text-slate-500">
             <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-slate-400" /> 
                <span className="truncate">Lat: {Number(task.location.lat).toFixed(4)}, Lng: {Number(task.location.lng).toFixed(4)}</span>
             </div>
             <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-slate-400" /> 
                <span>{new Date(task.createdAt).toLocaleString()}</span>
             </div>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100">
            {isAssignedToMe ? (
                <div className="grid grid-cols-2 gap-3">
                    {task.status !== 'IN_PROGRESS' ? (
                        <button 
                            onClick={() => onUpdateStatus?.('IN_PROGRESS')}
                            disabled={isLoading}
                            className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Start Task'}
                        </button>
                    ) : (
                         <div className="flex items-center justify-center text-blue-600 text-sm font-semibold bg-blue-50 rounded-xl py-2.5">
                             <Activity className="w-4 h-4 mr-2 animate-pulse" /> In Progress
                         </div>
                    )}
                    <button 
                        onClick={() => onUpdateStatus?.('RESOLVED')}
                        disabled={isLoading}
                        className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm shadow-green-200 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Resolve'}
                    </button>
                </div>
            ) : (
                <button 
                    onClick={onClaim}
                    disabled={isLoading}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors flex justify-center items-center shadow-lg shadow-slate-200 disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Accepting...
                        </>
                    ) : (
                        <>
                            Accept Assignment <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                    )}
                </button>
            )}
        </div>
    </div>
);
