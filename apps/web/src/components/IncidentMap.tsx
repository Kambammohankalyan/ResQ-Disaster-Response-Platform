import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useIncidents } from '../hooks/useIncidents';
import { useResources } from '../hooks/useResources';
import { useMemo, useState } from 'react';
import { AlertTriangle, Ambulance, Box, Flame, Users, Truck } from 'lucide-react';
import type { IIncident, IResource } from '@repo/types';
import { formatDistanceToNow } from 'date-fns';

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export default function IncidentMap() {
  const { data: incidents } = useIncidents();
  const { data: resources } = useResources();
  const [popupInfo, setPopupInfo] = useState<{ type: 'incident' | 'resource', data: IIncident | IResource } | null>(null);

  const incidentMarkers = useMemo(() => incidents?.map(incident => (
    <Marker
      key={incident.id}
      longitude={incident.location.lng}
      latitude={incident.location.lat}
      anchor="bottom"
      onClick={e => {
        e.originalEvent.stopPropagation();
        setPopupInfo({ type: 'incident', data: incident });
      }}
      style={{ cursor: 'pointer' }}
    >
        <div className={`p-2 rounded-full border-2 border-white shadow-lg ${
            incident.severity === 'CRITICAL' ? 'bg-red-500 text-white' :
            incident.severity === 'HIGH' ? 'bg-orange-500 text-white' :
            incident.severity === 'MEDIUM' ? 'bg-yellow-400 text-slate-900' :
            'bg-blue-500 text-white'
        }`}>
            {incident.type === 'FIRE' ? <Flame className="w-5 h-5" /> :
             incident.type === 'MEDICAL' ? <Ambulance className="w-5 h-5" /> :
             <AlertTriangle className="w-5 h-5" />}
        </div>
    </Marker>
  )), [incidents]);

  const resourceMarkers = useMemo(() => resources?.map(resource => (
    <Marker
      key={resource.id}
      longitude={resource.location.lng}
      latitude={resource.location.lat}
      anchor="bottom"
      onClick={e => {
        e.originalEvent.stopPropagation();
        setPopupInfo({ type: 'resource', data: resource as IResource });
      }}
      style={{ cursor: 'pointer' }}
    >
        <div className="p-1.5 rounded-lg border-2 border-white shadow-lg bg-slate-800 text-emerald-400">
             {resource.type === 'AMBULANCE' ? <Ambulance className="w-4 h-4" /> :
              resource.type === 'PERSONNEL' ? <Users className="w-4 h-4" /> :
              resource.type === 'FIRE_TRUCK' ? <Truck className="w-4 h-4" /> :
              <Box className="w-4 h-4" />}
        </div>
    </Marker>
  )), [resources]);

  return (
    <div className="h-full w-full relative">
      <Map
        initialViewState={{
          longitude: 78.9629,
          latitude: 20.5937,
          zoom: 5
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
      >
        <NavigationControl position="top-right" />
        {incidentMarkers}
        {resourceMarkers}

        {popupInfo && (
            <Popup
                anchor="top"
                longitude={popupInfo.data.location.lng}
                latitude={popupInfo.data.location.lat}
                onClose={() => setPopupInfo(null)}
                offset={10}
            >
                <div className="min-w-[200px] p-1">
                    {popupInfo.type === 'incident' ? (
                        <>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    (popupInfo.data as IIncident).severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                    'bg-slate-100 text-slate-700'
                                }`}>
                                    {(popupInfo.data as IIncident).severity}
                                </span>
                                <span className="text-xs text-slate-400">
                                    {formatDistanceToNow(new Date((popupInfo.data as IIncident).createdAt), { addSuffix: true })}
                                </span>
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1">{(popupInfo.data as IIncident).title}</h3>
                            <p className="text-sm text-slate-600 mb-2">{(popupInfo.data as IIncident).description}</p>
                            <div className="text-xs text-slate-500 font-mono">
                                Type: {(popupInfo.data as IIncident).type}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                    RESOURCE
                                </span>
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1">
                                {(popupInfo.data as IResource).type.replace('_', ' ')}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Box className="w-4 h-4" />
                                <span>Quantity: {(popupInfo.data as IResource).quantity}</span>
                            </div>
                        </>
                    )}
                </div>
            </Popup>
        )}
      </Map>
      
      {/* Legend Override */}
      <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg border border-slate-200 text-xs space-y-2">
        <div className="font-bold text-slate-900 mb-1">Map Legend</div>
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Critical Incident</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>High Severity</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-slate-800 border-emerald-400 border-2"></div>
            <span>Active Resource</span>
        </div>
      </div>
    </div>
  );
}
