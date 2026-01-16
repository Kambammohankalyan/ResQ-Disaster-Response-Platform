import React, { useState } from 'react';
import { useResources, useCreateResource } from '../../hooks/useResources';
import { Truck, Box, Package, MapPin, Plus, Ambulance, Users, Search, Filter, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';

export const ResourcePage = () => {
    const { data: resources, isLoading } = useResources();
    const { mutate, isPending } = useCreateResource();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [filterType, setFilterType] = useState<string>('ALL');
    const [formData, setFormData] = useState({
        type: 'AMBULANCE',
        quantity: 1,
        lat: '',
        lng: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutate({
            type: formData.type as any,
            quantity: Number(formData.quantity),
            location: {
                lat: parseFloat(formData.lat),
                lng: parseFloat(formData.lng)
            }
        });
        setIsFormOpen(false);
        setFormData({ type: 'AMBULANCE', quantity: 1, lat: '', lng: '' });
    };

    const filteredResources = resources?.filter(r => filterType === 'ALL' || r.type === filterType) || [];

    const stats = {
        total: resources?.length || 0,
        ambulances: resources?.filter(r => r.type === 'AMBULANCE').length || 0,
        personnel: resources?.filter(r => r.type === 'PERSONNEL').length || 0,
        supplies: resources?.filter(r => r.type === 'SUPPLY_KIT').length || 0
    };

    if (isLoading) return <div className="flex h-96 items-center justify-center text-slate-400">Loading inventory...</div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-4 flex justify-between items-end mb-2">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resource Inventory</h1>
                        <p className="text-sm text-slate-500">Track and allocate emergency assets in real-time.</p>
                    </div>
                    <button 
                        onClick={() => setIsFormOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Asset
                    </button>
                </div>
                
                <StatCard label="Total Assets" value={stats.total} icon={Package} bg="bg-slate-50" color="text-slate-600" />
                <StatCard label="Fleets Active" value={stats.ambulances} icon={Ambulance} bg="bg-red-50" color="text-red-600" />
                <StatCard label="Personnel" value={stats.personnel} icon={Users} bg="bg-blue-50" color="text-blue-600" />
                <StatCard label="Supply Kits" value={stats.supplies} icon={Box} bg="bg-emerald-50" color="text-emerald-600" />
            </div>

            {/* Filters */}
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex overflow-x-auto gap-2">
                {['ALL', 'AMBULANCE', 'PERSONNEL', 'SUPPLY_KIT', 'FIRE_TRUCK'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors",
                            filterType === type 
                                ? "bg-slate-800 text-white shadow-sm" 
                                : "text-slate-600 hover:bg-slate-100"
                        )}
                    >
                        {type.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map(resource => (
                    <div key={resource.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("p-3 rounded-lg bg-slate-50 group-hover:bg-blue-50 transition-colors", 
                                resource.type === 'AMBULANCE' ? 'text-red-500' :
                                resource.type === 'PERSONNEL' ? 'text-blue-500' : 
                                'text-emerald-500'
                            )}>
                                {resource.type === 'AMBULANCE' ? <Ambulance className="w-6 h-6" /> :
                                 resource.type === 'PERSONNEL' ? <Users className="w-6 h-6" /> :
                                 resource.type === 'FIRE_TRUCK' ? <Truck className="w-6 h-6" /> :
                                 <Box className="w-6 h-6" />}
                            </div>
                            <span className={cn(
                                "px-2.5 py-1 text-xs font-bold rounded-full",
                                resource.quantity > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}>
                                {resource.quantity > 0 ? 'AVAILABLE' : 'DEPLETED'}
                            </span>
                        </div>
                        
                        <div className="space-y-1 mb-4">
                             <h3 className="font-bold text-slate-900">{resource.type.replace('_', ' ')}</h3>
                             <p className="text-sm text-slate-500">Unit ID: {resource.id.slice(-6).toUpperCase()}</p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                             <div className="flex items-center">
                                 <Box className="w-4 h-4 mr-2 text-slate-400" />
                                 <span className="font-medium text-slate-700">{resource.quantity}</span>
                                 <span className="ml-1 text-xs">units</span>
                             </div>
                             <div className="flex items-center" title="Location">
                                 <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                                 <span className="text-xs">{resource.location.lat.toFixed(3)}, {resource.location.lng.toFixed(3)}</span>
                             </div>
                        </div>
                    </div>
                ))}
                
                {filteredResources.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No resources found matching this category.</p>
                    </div>
                )}
            </div>

            {/* Add Resource Modal Overlay */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">New Resource Allocation</h3>
                            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Resource Type</label>
                                <select 
                                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5"
                                    value={formData.type}
                                    onChange={e => setFormData({...formData, type: e.target.value})}
                                >
                                    <option value="AMBULANCE">🚑 Ambulance</option>
                                    <option value="SUPPLY_KIT">📦 Supply Kit</option>
                                    <option value="PERSONNEL">👥 Personnel Team</option>
                                    <option value="FIRE_TRUCK">🚒 Fire Truck</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    required
                                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5"
                                    value={formData.quantity}
                                    onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Latitude</label>
                                    <input 
                                        type="number" 
                                        step="any"
                                        placeholder="37.7749"
                                        required
                                        className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5 font-mono text-sm"
                                        value={formData.lat}
                                        onChange={e => setFormData({...formData, lat: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Longitude</label>
                                    <input 
                                        type="number" 
                                        step="any"
                                        placeholder="-122.4194"
                                        required
                                        className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5 font-mono text-sm"
                                        value={formData.lng}
                                        onChange={e => setFormData({...formData, lng: e.target.value})}
                                    />
                                </div>
                            </div>
                             <p className="text-xs text-slate-400 bg-slate-50 p-2 rounded">
                                Tip: Use the map view to pinpoint locations accurately before adding resources.
                            </p>

                            <div className="pt-2 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsFormOpen(false)}
                                    className="flex-1 py-2.5 px-4 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isPending}
                                    className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm disabled:opacity-50"
                                >
                                    {isPending ? 'Saving...' : 'Confirm Allocation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, bg, color }: any) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={cn("p-3 rounded-xl", bg, color)}>
            <Icon className="w-6 h-6" />
        </div>
    </div>
);
