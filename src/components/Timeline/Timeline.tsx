import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Connection } from '../../utils/csvParser';
import { DataProcessor } from '../../utils/dataProcessor';

interface TimelineProps {
  connections: Connection[];
}

const Timeline: React.FC<TimelineProps> = ({ connections }) => {
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const yearGroups = useMemo(() => {
    return DataProcessor.groupByYear(connections);
  }, [connections]);

  const stats = useMemo(() => {
    return DataProcessor.calculateStats(connections);
  }, [connections]);

  useEffect(() => {
    // Show tooltip on first visit
    const hasSeenTooltip = localStorage.getItem('timelineTooltipSeen');
    if (!hasSeenTooltip) {
      setShowTooltip(true);
      // Auto-hide after 6 seconds
      const timer = setTimeout(() => {
        setShowTooltip(false);
        localStorage.setItem('timelineTooltipSeen', 'true');
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleYearClick = (year: number) => {
    setExpandedYear(expandedYear === year ? null : year);
    // Hide tooltip when user clicks a year
    if (showTooltip) {
      setShowTooltip(false);
      localStorage.setItem('timelineTooltipSeen', 'true');
    }
  };

  const getDepartmentColor = (department?: string): string => {
    const colors: Record<string, string> = {
      'engineering': 'bg-blue-100 text-blue-800',
      'product': 'bg-green-100 text-green-800',
      'design': 'bg-yellow-100 text-yellow-800',
      'data': 'bg-purple-100 text-purple-800',
      'sales': 'bg-red-100 text-red-800',
      'marketing': 'bg-orange-100 text-orange-800',
      'customer success': 'bg-cyan-100 text-cyan-800',
      'operations': 'bg-gray-100 text-gray-800',
      'hr': 'bg-pink-100 text-pink-800',
      'finance': 'bg-lime-100 text-lime-800'
    };
    return colors[department || 'unknown'] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-medallia-purple to-medallia-blue text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">My Medallia Journey</h1>
            <p className="text-xl opacity-90">
              1,133 amazing colleagues across 13 years
            </p>
            <p className="text-lg opacity-75 mt-2">
              From July 2012 to September 19, 2025
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Interactive Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg p-4 shadow-lg relative"
            >
              <div className="flex items-center space-x-2">
                <span className="text-2xl">👆</span>
                <div>
                  <p className="font-semibold text-lg">Click on any year to explore!</p>
                  <p className="text-sm opacity-90">See the amazing people who joined Medallia each year</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTooltip(false);
                  localStorage.setItem('timelineTooltipSeen', 'true');
                }}
                className="absolute top-2 right-2 text-white/70 hover:text-white"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

          {/* Year groups */}
          <div className="space-y-8">
            {yearGroups.map((yearGroup, index) => (
              <motion.div
                key={yearGroup.year}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Year marker */}
                <div className="flex items-center">
                  <button
                    onClick={() => handleYearClick(yearGroup.year)}
                    className="relative z-10 flex items-center justify-center w-16 h-16 bg-white border-4 border-medallia-purple rounded-full shadow-lg hover:bg-medallia-purple hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-lg">{yearGroup.year}</span>
                  </button>

                  <div className="ml-6 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {yearGroup.year}
                      </h3>
                      <span className="bg-medallia-purple text-white px-3 py-1 rounded-full text-sm font-medium">
                        {yearGroup.count} connections
                      </span>
                    </div>

                    {yearGroup.year === stats.peakYear?.year && (
                      <span className="inline-block mt-1 text-sm text-medallia-purple font-medium">
                        🎉 Peak connection year!
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded year content */}
                <AnimatePresence>
                  {expandedYear === yearGroup.year && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-20 mt-4 overflow-hidden"
                    >
                      <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {yearGroup.connections.map((connection) => (
                            <motion.div
                              key={connection.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => setSelectedConnection(connection)}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">
                                    {connection.firstName} {connection.lastName}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {connection.position}
                                  </p>
                                </div>
                              </div>

                              {connection.department && (
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getDepartmentColor(connection.department)}`}>
                                  {connection.department}
                                </span>
                              )}

                              <div className="mt-3 text-xs text-gray-500">
                                Connected: {formatDate(connection.connectedDate)}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Connection Details Modal */}
      <AnimatePresence>
        {selectedConnection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedConnection(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedConnection.firstName} {selectedConnection.lastName}
                </h3>
                <button
                  onClick={() => setSelectedConnection(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Position:</span>
                  <p className="text-gray-900">{selectedConnection.position}</p>
                </div>

                {selectedConnection.department && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Department:</span>
                    <span className={`ml-2 inline-block px-2 py-1 rounded-full text-xs font-medium ${getDepartmentColor(selectedConnection.department)}`}>
                      {selectedConnection.department}
                    </span>
                  </div>
                )}

                {selectedConnection.team && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Team:</span>
                    <p className="text-gray-900">{selectedConnection.team}</p>
                  </div>
                )}

                <div>
                  <span className="text-sm font-medium text-gray-500">Connected:</span>
                  <p className="text-gray-900">{formatDate(selectedConnection.connectedDate)}</p>
                </div>

                {selectedConnection.email && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Email:</span>
                    <p className="text-gray-900">{selectedConnection.email}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <textarea
                  placeholder="Add a personal thank you message..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                  defaultValue={selectedConnection.thankYouMessage || ''}
                  onChange={(e) => {
                    // In a real app, this would update the connection data
                    console.log('Thank you message:', e.target.value);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Stats */}
      <div className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-medallia-purple">
                {stats.totalConnections}
              </div>
              <div className="text-sm text-gray-600">Total Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-medallia-purple">
                {Math.round(stats.averageConnectionsPerYear)}
              </div>
              <div className="text-sm text-gray-600">Avg per Year</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-medallia-purple">
                {stats.peakYear?.count || 0}
              </div>
              <div className="text-sm text-gray-600">Peak Year ({stats.peakYear?.year})</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;