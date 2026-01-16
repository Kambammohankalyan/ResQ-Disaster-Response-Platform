import IncidentForm from './components/IncidentForm';
import IncidentMap from './components/IncidentMap';
import { useIncidents } from './hooks/useIncidents';

function App() {
  const { data: incidents, isLoading } = useIncidents();

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-gray-100">
      {/* Sidebar / Form Area */}
      <div className="w-full md:w-1/3 p-4 overflow-y-auto space-y-6 z-10 shadow-xl bg-gray-50">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-indigo-900">ResQ System</h1>
          <p className="text-sm text-gray-600">Offline-First Disaster Response</p>
        </header>
        
        <IncidentForm />

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-bold text-lg mb-2">Recent Incidents</h2>
          {isLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <div className="space-y-2">
              {incidents?.length === 0 && <p className="text-gray-400">No incidents reported.</p>}
              {incidents?.slice().reverse().map(inc => (
                <div key={inc.id} className="border-l-4 border-indigo-500 pl-3 py-2 bg-gray-50 rounded">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold">{inc.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      inc.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                      inc.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      inc.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {inc.severity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(inc.createdAt).toLocaleString()} <br/>
                    Status: {inc.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 h-full relative">
        <IncidentMap />
      </div>
    </div>
  );
}

export default App;
