import { useState } from 'react';
import { useCreateIncident } from '../hooks/useIncidents';
import { Loader2, Navigation, AlertTriangle, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import type { IIncident } from '@repo/types';

export default function IncidentForm() {
  const { mutate, isPending } = useCreateIncident();
  const [isLocating, setIsLocating] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    type: IIncident['type'];
    severity: IIncident['severity'];
    lat: string;
    lng: string;
  }>({
    title: '',
    description: '',
    type: 'OTHER',
    severity: 'MEDIUM',
    lat: '',
    lng: ''
  });

  const handleLocationClick = () => {
    if (!navigator.geolocation) {
       toast.error("Geolocation is not supported by your browser");
       return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
       (position) => {
          setFormData(prev => ({
             ...prev,
             lat: position.coords.latitude.toFixed(6),
             lng: position.coords.longitude.toFixed(6)
          }));
          setIsLocating(false);
          toast.success("Location acquired");
       },
       (error) => {
          console.error(error);
          setIsLocating(false);
          toast.error("Unable to retrieve your location");
       }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lat || !formData.lng) {
        toast.error("Please provide a location");
        return;
    }

    mutate({
      title: formData.title,
      description: formData.description,
      type: formData.type,
      severity: formData.severity,
      location: {
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng)
      }
    }, {
        onSuccess: () => {
            toast.success("Incident reported successfully");
            setFormData({
                title: '',
                description: '',
                type: 'OTHER',
                severity: 'MEDIUM',
                lat: '',
                lng: ''
            });
        },
        onError: (err: any) => {
            console.error(err);
            const msg = err.response?.data?.message || err.message || "Failed to submit report";
            toast.error(msg);
        }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center">
                <ShieldAlert className="w-5 h-5 mr-2 text-red-600" />
                New Incident Report
            </h3>
            <span className="text-xs text-slate-500 font-medium bg-white px-2 py-1 rounded border border-slate-200">
                Emergency Priority
            </span>
        </div>

        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Incident Type</label>
                    <div className="relative">
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                            className="w-full appearance-none rounded-lg border-slate-200 bg-slate-50/50 p-2.5 text-sm font-medium text-slate-700 focus:border-blue-500 focus:ring-blue-500 transition-all cursor-pointer"
                        >
                            <option value="FLOOD">🌊 Flood / Water Damage</option>
                            <option value="FIRE">🔥 Fire / Explosion</option>
                            <option value="MEDICAL">🚑 Medical Emergency</option>
                            <option value="EARTHQUAKE">🌋 Earthquake / Tremor</option>
                            <option value="OTHER">⚠️ Other Hazard</option>
                        </select>
                        <AlertTriangle className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Severity Level</label>
                    <div className="grid grid-cols-4 gap-2">
                        {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((level) => (
                            <button
                                type="button"
                                key={level}
                                onClick={() => setFormData({ ...formData, severity: level })}
                                className={cn(
                                    "flex items-center justify-center p-2 rounded-lg text-xs font-bold transition-all border",
                                    formData.severity === level 
                                        ? level === 'CRITICAL' ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-200" :
                                          level === 'HIGH' ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200" :
                                          level === 'MEDIUM' ? "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-200" :
                                          "bg-slate-500 text-white border-slate-500 shadow-md shadow-slate-200"
                                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                <input
                    type="text"
                    required
                    placeholder="E.g., Structural Fire, Vehicle Collision, Medical Emergency"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5 px-3 text-sm placeholder:text-slate-400"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Detailed Description</label>
                <textarea
                    required
                    rows={4}
                    placeholder="Provide a detailed situational report including casualty estimates and immediate hazards..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5 px-3 text-sm placeholder:text-slate-400 resize-none"
                />
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center justify-between">
                    <span>Location Details</span>
                    <span className="text-xs font-normal text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">Required</span>
                </label>
                
                <button
                    type="button"
                    onClick={handleLocationClick}
                    disabled={isLocating}
                    className="w-full mb-4 flex items-center justify-center px-4 py-3 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-all shadow-sm font-semibold text-sm group"
                >
                    {isLocating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Navigation className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />}
                    Detect My Current Location
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                        <input
                            type="number"
                            placeholder="Lat"
                            step="any"
                            required
                            value={formData.lat}
                            onChange={e => setFormData({ ...formData, lat: e.target.value })}
                            className="w-full rounded-lg border-slate-200 py-2 pl-8 pr-3 text-xs font-mono"
                        />
                        <span className="absolute left-3 top-2 text-slate-400 text-xs font-bold">Y</span>
                    </div>
                    <div className="relative">
                        <input
                            type="number"
                            placeholder="Lng"
                            step="any"
                            required
                            value={formData.lng}
                            onChange={e => setFormData({ ...formData, lng: e.target.value })}
                            className="w-full rounded-lg border-slate-200 py-2 pl-8 pr-3 text-xs font-mono"
                        />
                         <span className="absolute left-3 top-2 text-slate-400 text-xs font-bold">X</span>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="w-full flex justify-center py-3.5 px-4 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 transition-all shadow-lg shadow-slate-200 active:scale-[0.99]"
            >
                {isPending ? (
                    <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Processing Report...</>
                ) : (
                    'Submit Emergency Report'
                )}
            </button>
        </div>
    </form>
  );
}
