import React from 'react';
import IncidentMap from '../../components/IncidentMap';

export const MapPage = () => {
  return (
    <div className="h-[calc(100vh-4rem-3rem)] w-full rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white">
      <IncidentMap />
    </div>
  );
};
