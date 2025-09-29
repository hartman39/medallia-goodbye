import { Connection } from './csvParser';

export interface YearGroup {
  year: number;
  connections: Connection[];
  count: number;
}

export interface ConnectionStats {
  totalConnections: number;
  totalYears: number;
  averageConnectionsPerYear: number;
  departmentCounts: Record<string, number>;
  teamCounts: Record<string, number>;
  firstConnection?: Connection;
  lastConnection?: Connection;
  peakYear?: YearGroup;
}

export class DataProcessor {
  static groupByYear(connections: Connection[]): YearGroup[] {
    const yearMap = new Map<number, Connection[]>();

    connections.forEach(connection => {
      let year = connection.connectedDate.getFullYear();
      // Move connections prior to 2012 to 2012
      if (year < 2012) {
        year = 2012;
      }
      if (!yearMap.has(year)) {
        yearMap.set(year, []);
      }
      yearMap.get(year)!.push(connection);
    });

    return Array.from(yearMap.entries())
      .map(([year, connections]) => ({
        year,
        connections: connections.sort((a, b) => a.connectedDate.getTime() - b.connectedDate.getTime()),
        count: connections.length
      }))
      .sort((a, b) => a.year - b.year);
  }

  static calculateStats(connections: Connection[]): ConnectionStats {
    if (connections.length === 0) {
      return {
        totalConnections: 0,
        totalYears: 0,
        averageConnectionsPerYear: 0,
        departmentCounts: {},
        teamCounts: {}
      };
    }

    const yearGroups = this.groupByYear(connections);
    const departmentCounts: Record<string, number> = {};
    const teamCounts: Record<string, number> = {};

    connections.forEach(connection => {
      if (connection.department) {
        departmentCounts[connection.department] = (departmentCounts[connection.department] || 0) + 1;
      }
      if (connection.team) {
        teamCounts[connection.team] = (teamCounts[connection.team] || 0) + 1;
      }
    });

    const sortedConnections = [...connections].sort((a, b) => a.connectedDate.getTime() - b.connectedDate.getTime());
    const peakYear = yearGroups.reduce((max, current) => current.count > max.count ? current : max);

    return {
      totalConnections: connections.length,
      totalYears: yearGroups.length,
      averageConnectionsPerYear: connections.length / yearGroups.length,
      departmentCounts,
      teamCounts,
      firstConnection: sortedConnections[0],
      lastConnection: sortedConnections[sortedConnections.length - 1],
      peakYear
    };
  }

  static getTimelineData(connections: Connection[]): YearGroup[] {
    return this.groupByYear(connections);
  }

  static getNetworkData(connections: Connection[]): Connection[] {
    // For network visualization, we might want to add additional processing
    // For now, return connections with enhanced data for D3.js
    return connections.map(connection => ({
      ...connection,
      // Add network-specific properties
      size: this.calculateNodeSize(connection),
      color: this.getNodeColor(connection.department)
    }));
  }

  private static calculateNodeSize(connection: Connection): number {
    // Base size calculation - could be enhanced with more data
    let size = 10;

    // Increase size based on seniority keywords in position
    const seniorKeywords = ['senior', 'lead', 'principal', 'staff', 'director', 'manager', 'vp', 'head'];
    const lowerPosition = connection.position.toLowerCase();

    if (seniorKeywords.some(keyword => lowerPosition.includes(keyword))) {
      size += 5;
    }

    return size;
  }

  private static getNodeColor(department?: string): string {
    const departmentColors: Record<string, string> = {
      'engineering': '#3B82F6',
      'product': '#10B981',
      'design': '#F59E0B',
      'data': '#8B5CF6',
      'sales': '#EF4444',
      'marketing': '#F97316',
      'customer success': '#06B6D4',
      'operations': '#6B7280',
      'hr': '#EC4899',
      'finance': '#84CC16'
    };

    return departmentColors[department || 'unknown'] || '#9CA3AF';
  }

  static searchConnections(connections: Connection[], query: string): Connection[] {
    const lowerQuery = query.toLowerCase();

    return connections.filter(connection =>
      connection.firstName.toLowerCase().includes(lowerQuery) ||
      connection.lastName.toLowerCase().includes(lowerQuery) ||
      connection.position.toLowerCase().includes(lowerQuery) ||
      connection.department?.toLowerCase().includes(lowerQuery) ||
      connection.team?.toLowerCase().includes(lowerQuery) ||
      connection.email.toLowerCase().includes(lowerQuery)
    );
  }

  static filterByDepartment(connections: Connection[], department: string): Connection[] {
    return connections.filter(connection => connection.department === department);
  }

  static filterByYear(connections: Connection[], year: number): Connection[] {
    return connections.filter(connection => connection.connectedDate.getFullYear() === year);
  }

  static filterByDateRange(connections: Connection[], startDate: Date, endDate: Date): Connection[] {
    return connections.filter(connection =>
      connection.connectedDate >= startDate && connection.connectedDate <= endDate
    );
  }

  static exportToCSV(connections: Connection[]): string {
    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Company',
      'Position',
      'Department',
      'Team',
      'Connected Date',
      'Thank You Message'
    ];

    const csvRows = [
      headers.join(','),
      ...connections.map(connection => [
        connection.firstName,
        connection.lastName,
        connection.email,
        connection.company,
        connection.position,
        connection.department || '',
        connection.team || '',
        connection.connectedDate.toLocaleDateString(),
        connection.thankYouMessage || ''
      ].map(field => `"${field}"`).join(','))
    ];

    return csvRows.join('\n');
  }

  static getFirstDayLastDayComparison(connections: Connection[]) {
    const sortedConnections = [...connections].sort((a, b) => a.connectedDate.getTime() - b.connectedDate.getTime());

    if (sortedConnections.length === 0) {
      return { firstMonth: [], currentState: [] };
    }

    const firstConnectionDate = sortedConnections[0].connectedDate;
    const firstMonthEnd = new Date(firstConnectionDate);
    firstMonthEnd.setMonth(firstMonthEnd.getMonth() + 1);

    const firstMonth = sortedConnections.filter(connection =>
      connection.connectedDate <= firstMonthEnd
    );

    return {
      firstMonth,
      currentState: sortedConnections,
      growth: {
        connections: sortedConnections.length - firstMonth.length,
        departments: new Set(sortedConnections.map(c => c.department)).size - new Set(firstMonth.map(c => c.department)).size,
        teams: new Set(sortedConnections.map(c => c.team)).size - new Set(firstMonth.map(c => c.team)).size
      }
    };
  }
}