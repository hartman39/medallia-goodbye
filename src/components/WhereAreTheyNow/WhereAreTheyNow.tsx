import React, { useState, useMemo } from 'react';
import { Connection } from '../../utils/csvParser';

interface WhereAreTheyNowProps {
  connections: Connection[];
}

interface CompanyCluster {
  company: string;
  count: number;
  connections: Connection[];
  color: string;
}

const WhereAreTheyNow: React.FC<WhereAreTheyNowProps> = ({ connections }) => {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  // Color palette for top companies
  const companyColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Orange
    '#8B5CF6', // Purple
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange-red
    '#A855F7', // Violet
    '#059669'  // Emerald
  ];

  const topCompanies = useMemo(() => {
    // Count connections by current company (excluding Medallia)
    const companyCounts: Record<string, Connection[]> = {};

    connections.forEach(conn => {
      const company = conn.company.trim();
      // Skip current Medallia employees and empty companies
      if (!company || company.toLowerCase().includes('medallia')) return;

      if (!companyCounts[company]) {
        companyCounts[company] = [];
      }
      companyCounts[company].push(conn);
    });

    // Filter companies with at least 5 former Medallians and sort by count
    const sortedCompanies = Object.entries(companyCounts)
      .map(([company, conns]) => ({
        company,
        count: conns.length,
        connections: conns,
        color: companyColors[0] // Will be assigned below
      }))
      .filter(cluster => cluster.count >= 5)
      .sort((a, b) => b.count - a.count);

    // Assign colors
    sortedCompanies.forEach((cluster, index) => {
      cluster.color = companyColors[index % companyColors.length];
    });

    return sortedCompanies;
  }, [connections]);

  const totalFormerMedallians = useMemo(() => {
    return connections.filter(conn =>
      conn.company.trim() &&
      !conn.company.toLowerCase().includes('medallia')
    ).length;
  }, [connections]);

  const formatCompanyName = (company: string) => {
    // Clean up company names for display
    return company
      .replace(/,?\s*(Inc\.?|LLC|Corp\.?|Corporation|Ltd\.?|Limited)$/i, '')
      .trim();
  };

  const handleCompanyClick = (company: string) => {
    setSelectedCompany(selectedCompany === company ? null : company);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Where Are They Now?
          </h1>
          <p className="text-xl text-slate-300 mb-2">
            Former Medallia colleagues have moved on to amazing places
          </p>
          <p className="text-lg text-slate-400">
            {totalFormerMedallians} former Medallians • {topCompanies.length} companies with 5+ alumni
          </p>
        </div>

        {/* Company Clusters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          {topCompanies.map((cluster, index) => (
            <div
              key={cluster.company}
              className={`relative bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                selectedCompany === cluster.company ? 'ring-4 ring-blue-400 scale-105' : ''
              }`}
              onClick={() => handleCompanyClick(cluster.company)}
            >
              {/* Company rank badge */}
              <div
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: cluster.color }}
              >
                #{index + 1}
              </div>

              {/* Company header */}
              <div
                className="h-20 flex items-center justify-center text-white"
                style={{ backgroundColor: cluster.color }}
              >
                <h3 className="text-lg font-semibold text-center px-4">
                  {formatCompanyName(cluster.company)}
                </h3>
              </div>

              {/* Stats */}
              <div className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {cluster.count}
                  </div>
                  <div className="text-sm text-gray-600">
                    {cluster.count === 1 ? 'Former Medallian' : 'Former Medallians'}
                  </div>
                </div>

                {/* Connection dots preview */}
                <div className="mt-4 flex flex-wrap gap-1 justify-center">
                  {cluster.connections.slice(0, 12).map((conn, idx) => (
                    <div
                      key={conn.id}
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cluster.color }}
                      title={`${conn.firstName} ${conn.lastName}`}
                    />
                  ))}
                  {cluster.count > 12 && (
                    <div className="w-3 h-3 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-xs text-gray-600">+</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Company Details */}
        {selectedCompany && (
          <div className="bg-white rounded-xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Former Medallians at {formatCompanyName(selectedCompany)}
                </h2>
                <p className="text-gray-600 mt-1">
                  {topCompanies.find(c => c.company === selectedCompany)?.count} colleagues who moved here
                </p>
              </div>
              <button
                onClick={() => setSelectedCompany(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topCompanies
                .find(c => c.company === selectedCompany)
                ?.connections.map(conn => (
                <div key={conn.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="font-semibold text-gray-900">
                    {conn.firstName} {conn.lastName}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {conn.position}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Connected: {conn.connectedDate.toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fun Stats */}
        <div className="mt-12 bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            🚀 The Medallia Alumni Network
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {topCompanies.reduce((sum, cluster) => sum + cluster.count, 0)}
              </div>
              <div className="text-slate-300">
                Alumni at Top Companies
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400 mb-2">
                {topCompanies.length}
              </div>
              <div className="text-slate-300">
                Major Companies Represented
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {topCompanies[0]?.count || 0}
              </div>
              <div className="text-slate-300">
                Largest Alumni Group ({formatCompanyName(topCompanies[0]?.company || '')})
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-400">
          <p>Click on any company to see which former Medallians work there</p>
        </div>
      </div>
    </div>
  );
};

export default WhereAreTheyNow;