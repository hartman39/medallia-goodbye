import React, { useState, useMemo } from 'react';
import { Connection } from '../../utils/csvParser';

interface ManageConnectionsProps {
  connections: Connection[];
  onUpdateConnections: (updatedConnections: Connection[]) => void;
}

const ManageConnections: React.FC<ManageConnectionsProps> = ({
  connections,
  onUpdateConnections
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConnections, setSelectedConnections] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const filteredConnections = useMemo(() => {
    if (!searchTerm) return connections;

    return connections.filter(connection =>
      connection.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.position.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, connections]);

  const handleConnectionToggle = (connectionId: string) => {
    const newSelected = new Set(selectedConnections);
    if (newSelected.has(connectionId)) {
      newSelected.delete(connectionId);
    } else {
      newSelected.add(connectionId);
    }
    setSelectedConnections(newSelected);
  };

  const handleRemoveSelected = () => {
    if (selectedConnections.size === 0) return;
    setShowConfirmDialog(true);
  };

  const confirmRemoval = () => {
    const updatedConnections = connections.filter(c => !selectedConnections.has(c.id));
    onUpdateConnections(updatedConnections);
    setSelectedConnections(new Set());
    setShowConfirmDialog(false);
  };

  const handleSelectAll = () => {
    const allIds = new Set(filteredConnections.map(c => c.id));
    setSelectedConnections(allIds);
  };

  const handleClearSelection = () => {
    setSelectedConnections(new Set());
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Manage Connections</h2>
          <p className="text-gray-600 mb-6">
            Review and remove connections that were incorrectly added to your Medallia list.
            Currently showing {connections.length} Medallia connections.
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
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              {selectedConnections.size > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleRemoveSelected}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700"
                  >
                    🗑️ Remove {selectedConnections.size} Connection{selectedConnections.size !== 1 ? 's' : ''}
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

            {filteredConnections.length > 0 && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-red-600 hover:text-red-800 underline"
                >
                  Select All Visible ({filteredConnections.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Connection List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">
              Medallia Connections ({filteredConnections.length})
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Select connections to remove from your Medallia list
            </p>
          </div>

          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {filteredConnections.map((connection) => (
              <div
                key={connection.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  selectedConnections.has(connection.id) ? 'bg-red-50 border-l-4 border-red-500' : ''
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
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded mt-1 flex-shrink-0"
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
                    <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      ✓ Medallia
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {filteredConnections.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                {searchTerm ? 'No connections match your search.' : 'No connections found.'}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Warning:</strong> Removed connections will be permanently deleted from your Medallia list.
                  Make sure to export your data before making changes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Removal
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove {selectedConnections.size} connection{selectedConnections.size !== 1 ? 's' : ''}?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoval}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Remove {selectedConnections.size} Connection{selectedConnections.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageConnections;