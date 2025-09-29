import React, { useState, useMemo } from 'react';
import { Connection } from '../../utils/csvParser';
import { StorageManager } from '../../utils/storage';
import { ProductionDataManager } from '../../utils/productionData';

interface ReviewConnectionsProps {
  allConnections: Connection[];
  medalliaConnections: Connection[];
  onUpdateConnections: (updatedConnections: Connection[]) => void;
}

const ReviewConnections: React.FC<ReviewConnectionsProps> = ({
  allConnections,
  medalliaConnections,
  onUpdateConnections
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConnections, setSelectedConnections] = useState<Set<string>>(new Set());
  const [showOnlyUnmatched, setShowOnlyUnmatched] = useState(true);

  const medalliaIds = useMemo(() =>
    new Set(medalliaConnections.map(c => c.id)),
    [medalliaConnections]
  );

  const unmatchedConnections = useMemo(() =>
    allConnections.filter(c => !medalliaIds.has(c.id)),
    [allConnections, medalliaIds]
  );

  const connectionsToShow = useMemo(() => {
    const baseConnections = showOnlyUnmatched ? unmatchedConnections : allConnections;

    if (!searchTerm) return baseConnections;

    return baseConnections.filter(connection =>
      connection.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.position.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, showOnlyUnmatched, unmatchedConnections, allConnections]);

  const handleConnectionToggle = (connectionId: string) => {
    const newSelected = new Set(selectedConnections);
    if (newSelected.has(connectionId)) {
      newSelected.delete(connectionId);
    } else {
      newSelected.add(connectionId);
    }
    setSelectedConnections(newSelected);
  };

  const handleAddSelectedToMedallia = () => {
    const connectionsToAdd = allConnections
      .filter(c => selectedConnections.has(c.id))
      .map(c => ({ ...c, isMedallia: true }));

    const updatedAllConnections = allConnections.map(c =>
      selectedConnections.has(c.id) ? { ...c, isMedallia: true } : c
    );

    onUpdateConnections(updatedAllConnections);
    setSelectedConnections(new Set());
  };

  const handleSelectAll = () => {
    const allIds = new Set(connectionsToShow.map(c => c.id));
    setSelectedConnections(allIds);
  };

  const handleClearSelection = () => {
    setSelectedConnections(new Set());
  };

  const handleExportData = () => {
    try {
      const dataString = StorageManager.exportData();
      const blob = new Blob([dataString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `medallia-connections-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export data: ' + error);
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = StorageManager.importData(content);
        onUpdateConnections(importedData.allConnections);
        alert(`Successfully imported ${importedData.medalliaConnections.length} Medallia connections!`);
      } catch (error) {
        alert('Failed to import data: ' + error);
      }
    };
    reader.readAsText(file);
  };

  const handleGenerateProductionData = async () => {
    try {
      await ProductionDataManager.exportProductionDataFile();
      alert('Production data file generated! Replace the PRODUCTION_CONNECTIONS in src/utils/productionData.ts with the downloaded file content.');
    } catch (error) {
      alert('Failed to generate production data: ' + error);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Review All Connections</h2>
          <p className="text-gray-600 mb-6">
            Found {medalliaConnections.length} automatic Medallia matches.
            Review {unmatchedConnections.length} remaining connections to manually add any colleagues we missed.
          </p>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <input
                  type="text"
                  placeholder="Search connections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medallia-purple focus:border-transparent"
                />

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showOnlyUnmatched}
                    onChange={(e) => setShowOnlyUnmatched(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Show only unmatched connections</span>
                </label>
              </div>

              {selectedConnections.size > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleAddSelectedToMedallia}
                    className="bg-medallia-purple text-white px-4 py-2 rounded-lg font-medium hover:bg-medallia-darkPurple"
                  >
                    Add {selectedConnections.size} to Medallia ({selectedConnections.size})
                  </button>
                  <button
                    onClick={handleClearSelection}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {connectionsToShow.length > 0 && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-medallia-purple hover:text-medallia-darkPurple underline"
                >
                  Select All ({connectionsToShow.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Connection List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">
              {showOnlyUnmatched ? 'Unmatched' : 'All'} Connections
              ({connectionsToShow.length})
            </h3>
          </div>

          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {connectionsToShow.map((connection) => (
              <div
                key={connection.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  selectedConnections.has(connection.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => handleConnectionToggle(connection.id)}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedConnections.has(connection.id)}
                        onChange={() => handleConnectionToggle(connection.id)}
                        className="h-4 w-4 text-medallia-purple focus:ring-medallia-purple border-gray-300 rounded mt-1 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-gray-900 text-base leading-tight">
                          {connection.firstName} {connection.lastName}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1 leading-tight">
                          {connection.position}
                        </p>
                        <p className="text-sm text-gray-500 leading-tight">
                          {connection.company}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="text-sm text-gray-500">
                      {formatDate(connection.connectedDate)}
                    </div>
                    {connection.email && (
                      <div className="text-xs text-gray-400 mt-1 max-w-32 truncate">
                        {connection.email}
                      </div>
                    )}
                    {connection.isMedallia && (
                      <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        ✓ Medallia
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {connectionsToShow.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                {searchTerm ? 'No connections match your search.' : 'No connections to review.'}
              </div>
            )}
          </div>
        </div>

        {/* Summary & Export/Import */}
        <div className="mt-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-800">
                  <strong>Summary:</strong> {medalliaConnections.length} confirmed Medallia connections,
                  {unmatchedConnections.length} unreviewed connections
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Data Management</h3>
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                onClick={handleExportData}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
              >
                📤 Export Data
              </button>

              <label className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 cursor-pointer">
                📤 Import Data
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>

              <div className="text-xs text-gray-600 flex items-center">
                💾 All changes are automatically saved to your browser
              </div>
            </div>

            <div className="border-t border-gray-300 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">🚀 Production Deployment</h4>
              <div className="flex flex-wrap gap-3 items-center">
                <button
                  onClick={handleGenerateProductionData}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  🏗️ Generate Production Data
                </button>
                <div className="text-xs text-gray-600 max-w-md">
                  Creates a production-ready file with your curated connections (emails removed for privacy)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewConnections;