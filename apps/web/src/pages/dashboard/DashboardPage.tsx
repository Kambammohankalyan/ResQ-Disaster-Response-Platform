import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStats } from '../../hooks/useStats';
import { useIncidents } from '../../hooks/useIncidents';
import { useQuery } from '@tanstack/react-query';
import { fetchMyIncidents, fetchIncidents } from '../../api';
import { ShieldCheck, Server, Radio, Users, PlusCircle, AlertCircle, MapPin, Activity, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export const DashboardPage = () => {
  const { user, hasPermission } = useAuth();
  const { data: statsData, isLoading } = useStats();
  
  const isCivilian = !hasPermission('task:accept') && !hasPermission('incident:verify');
  const isVolunteer = hasPermission('task:accept');
  const isDispatcher = hasPermission('incident:verify');

  const { data: globalIncidents } = useQuery({
      queryKey: ['incidents'],
      queryFn: fetchIncidents,
      enabled: !isCivilian
  });

  const { data: myIncidents } = useQuery({
      queryKey: ['my-incidents'],
      queryFn: fetchMyIncidents,
      enabled: isCivilian
  });

  const incidents = isCivilian ? myIncidents : globalIncidents;


  const stats = [
    { 
      name: 'Active Incidents', 
      value: isLoading ? '...' : (statsData?.activeIncidents || 0).toString(), 
      icon: Radio, 
      color: 'text-red-500', 
      bg: 'bg-red-500/10' 
    },
    { 
      name: 'Available Resources', 
      value: isLoading ? '...' : (statsData?.availableResources || 0).toString(), 
      icon: ShieldCheck, 
      color: 'text-green-500', 
      bg: 'bg-green-500/10' 
    },
    { 
      name: 'System Status', 
      value: isLoading ? '...' : (statsData?.systemStatus || 'Unknown'), 
      icon: Server, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10' 
    },
  ];
  
  if (isDispatcher || user?.scopes?.includes('admin:access')) {
    stats.push({ 
      name: 'Active Responders', 
      value: isLoading ? '...' : (statsData?.activeResponders || 0).toString(), 
      icon: Users, 
      color: 'text-purple-500', 
      bg: 'bg-purple-500/10' 
    });
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 p-1">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="mt-2 text-slate-500">
            Welcome back, <span className="font-semibold text-slate-700">{user?.email?.split('@')[0]}</span>.
            {isCivilian && " Stay safe and report incidents."}
            {isVolunteer && " Ready to respond?"}
            {isDispatcher && " Monitoring emergency channels."}
          </p>
        </div>
        <div className="flex gap-3">
            {isCivilian && (
               <Link to="/dashboard/reports" className="px-4 py-2 bg-red-600 rounded-lg text-sm font-medium text-white hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Report Incident
               </Link>
            )}
            {isVolunteer && (
               <Link to="/dashboard/tasks" className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Find Tasks
               </Link>
            )}
            {isDispatcher && (
               <Link to="/dashboard/command" className="px-4 py-2 bg-purple-600 rounded-lg text-sm font-medium text-white hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all flex items-center">
                  <Server className="w-4 h-4 mr-2" />
                  Command Center
               </Link>
            )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-200 transition-all hover:shadow-md hover:border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                 <p className="text-sm font-medium text-slate-500">{item.name}</p>
                 <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
              </div>
              <div className={`rounded-xl ${item.bg} p-3 transition-transform group-hover:scale-110`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Role Based Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed / Map Placeholder */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden flex flex-col h-[400px]">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-bold text-slate-900 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-slate-400" />
                    Live Activity Map
                 </h3>
                 <Link to="/dashboard/map" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center">
                    View Full Map <ArrowUpRight className="w-3 h-3 ml-1" />
                 </Link>
              </div>
              <div className="flex-1 rounded-xl overflow-hidden relative border border-slate-100">
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
                      {incidents?.slice(0, 10).map(inc => (
                          <Marker 
                            key={inc.id} 
                            longitude={inc.location.lng} 
                            latitude={inc.location.lat}
                            color={inc.severity === 'CRITICAL' ? '#ef4444' : '#3b82f6'} 
                          />
                      ))}
                  </Map>
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm border border-slate-200">
                      Live Feed • Updates Real-time
                  </div>
              </div>
           </div>
        </div>

        {/* Sidebar / Quick Actions */}
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
               <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
               <div className="space-y-3">
                  {isCivilian && (
                     <Link to="/dashboard/reports" className="block w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-left transition-colors">
                        <div className="font-medium text-slate-900">My Reports</div>
                        <div className="text-xs text-slate-500">Check status of your submissions</div>
                     </Link>
                  )}
                  {(isVolunteer || isDispatcher) && (
                     <Link to="/dashboard/resources" className="block w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-left transition-colors">
                        <div className="font-medium text-slate-900">Resource Inventory</div>
                        <div className="text-xs text-slate-500">Check available equipment</div>
                     </Link>
                  )}
                  {isDispatcher && (
                     <Link to="/dashboard/command" className="block w-full p-3 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 text-left transition-colors">
                        <div className="font-medium text-amber-900 flex items-center">
                           <AlertCircle className="w-4 h-4 mr-2" />
                           Pending Verifications
                        </div>
                        <div className="text-xs text-amber-700">Review new incident reports</div>
                     </Link>
                  )}
               </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-lg p-6 text-white">
                <h4 className="font-bold text-lg mb-2">ResQ Mobile App</h4>
                <p className="text-slate-300 text-sm mb-4">Download our offline-first mobile app for field operations.</p>
                <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium text-sm transition-colors border border-white/10">
                   Get App Link
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
