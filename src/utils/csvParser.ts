export interface Connection {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  position: string;
  department?: string;
  team?: string;
  connectedDate: Date;
  profileUrl?: string;
  profilePicture?: string;
  isMedallia: boolean;
  notes?: string;
  projects?: string[];
  thankYouMessage?: string;
}

export interface ParsedCSVRow {
  'First Name': string;
  'Last Name': string;
  'URL': string;
  'Email Address': string;
  'Company': string;
  'Position': string;
  'Connected On': string;
}

export class CSVParser {
  static parseCSV(csvContent: string): { medalliaConnections: Connection[], allConnections: Connection[] } {
    const lines = csvContent.split('\n');

    // Find the header line (skip LinkedIn's notes section)
    let headerLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('First Name') && lines[i].includes('Last Name')) {
        headerLineIndex = i;
        break;
      }
    }

    if (headerLineIndex === -1) {
      throw new Error('Could not find CSV headers. Please ensure the file contains LinkedIn connection data.');
    }

    const headers = lines[headerLineIndex].split(',').map(h => h.trim().replace(/"/g, ''));
    const allConnections: Connection[] = [];
    const medalliaConnections: Connection[] = [];

    for (let i = headerLineIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = this.parseCSVLine(line);
      if (values.length < headers.length) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      const connection = this.rowToConnection(row);
      allConnections.push(connection);

      if (connection.isMedallia) {
        medalliaConnections.push(connection);
      }
    }

    const sortByDate = (a: Connection, b: Connection) => a.connectedDate.getTime() - b.connectedDate.getTime();

    return {
      medalliaConnections: medalliaConnections.sort(sortByDate),
      allConnections: allConnections.sort(sortByDate)
    };
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  private static rowToConnection(row: ParsedCSVRow): Connection {
    const company = row.Company || '';
    const isMedallia = this.isMedalliaConnection(row);

    return {
      id: this.generateId(row['First Name'], row['Last Name'], row['Connected On']),
      firstName: row['First Name'] || '',
      lastName: row['Last Name'] || '',
      email: row['Email Address'] || '',
      company: company,
      position: row.Position || '',
      department: this.extractDepartment(row.Position || ''),
      team: this.extractTeam(row.Position || ''),
      connectedDate: this.parseDate(row['Connected On']),
      profileUrl: row['URL'],
      isMedallia: isMedallia
    };
  }

  private static isMedalliaCompany(company: string): boolean {
    const medalliaVariations = [
      'medallia',
      'medallia inc',
      'medallia, inc.',
      'medallia corporation'
    ];

    return medalliaVariations.some(variation =>
      company.toLowerCase().includes(variation)
    );
  }

  private static isMedalliaConnection(row: ParsedCSVRow): boolean {
    const company = (row.Company || '').toLowerCase();
    const position = (row.Position || '').toLowerCase();
    const email = (row['Email Address'] || '').toLowerCase();

    // Current Medallia employees
    if (this.isMedalliaCompany(company)) {
      return true;
    }

    // Former Medallia employees - check email domain
    if (email.includes('@medallia.com')) {
      return true;
    }

    // Position-based detection for people who mention Medallia in their title
    const medalliaPositionKeywords = [
      'medallia',
      'ex-medallia',
      'former medallia',
      'previously medallia'
    ];

    if (medalliaPositionKeywords.some(keyword =>
      position.includes(keyword) || company.includes(keyword)
    )) {
      return true;
    }

    // Additional heuristics for likely Medallia connections
    // People with Medallia-specific roles or technologies
    const medalliaSpecificTerms = [
      'customer experience',
      'cx platform',
      'voice of customer',
      'experience management',
      'customer feedback',
      'digital experience'
    ];

    // Only include these if they're connected relatively recently (2020+)
    // as these terms became more common with Medallia's growth
    const connectedDate = this.parseDate(row['Connected On']);
    const isRecentConnection = connectedDate.getFullYear() >= 2020;

    if (isRecentConnection &&
        medalliaSpecificTerms.some(term => position.includes(term))) {
      return true;
    }

    return false;
  }

  private static extractDepartment(position: string): string | undefined {
    const departmentKeywords = {
      'engineering': ['engineer', 'developer', 'software', 'technical', 'backend', 'frontend', 'fullstack', 'devops', 'qa', 'sre'],
      'product': ['product', 'pm', 'product manager'],
      'design': ['designer', 'ux', 'ui', 'design'],
      'data': ['data', 'analytics', 'scientist', 'analyst'],
      'sales': ['sales', 'account', 'revenue'],
      'marketing': ['marketing', 'growth', 'demand'],
      'customer success': ['customer success', 'cs', 'support'],
      'operations': ['operations', 'ops', 'business operations'],
      'hr': ['human resources', 'hr', 'people', 'talent'],
      'finance': ['finance', 'accounting', 'financial']
    };

    const lowerPosition = position.toLowerCase();

    for (const [dept, keywords] of Object.entries(departmentKeywords)) {
      if (keywords.some(keyword => lowerPosition.includes(keyword))) {
        return dept;
      }
    }

    return undefined;
  }

  private static extractTeam(position: string): string | undefined {
    const teamKeywords = {
      'platform': ['platform', 'infrastructure', 'core'],
      'frontend': ['frontend', 'front-end', 'ui', 'web'],
      'backend': ['backend', 'back-end', 'api', 'server'],
      'mobile': ['mobile', 'ios', 'android'],
      'data': ['data', 'analytics', 'ml', 'machine learning'],
      'security': ['security', 'infosec', 'cybersecurity'],
      'devops': ['devops', 'sre', 'reliability', 'deployment']
    };

    const lowerPosition = position.toLowerCase();

    for (const [team, keywords] of Object.entries(teamKeywords)) {
      if (keywords.some(keyword => lowerPosition.includes(keyword))) {
        return team;
      }
    }

    return undefined;
  }

  private static parseDate(dateString: string): Date {
    if (!dateString) return new Date();

    // Handle LinkedIn's date format: "25 Sep 2025"
    const linkedInFormat = /(\d{1,2})\s+(\w{3})\s+(\d{4})/;
    const match = dateString.match(linkedInFormat);

    if (match) {
      const day = parseInt(match[1]);
      const monthStr = match[2];
      const year = parseInt(match[3]);

      const monthMap: Record<string, number> = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };

      const month = monthMap[monthStr];
      if (month !== undefined) {
        return new Date(year, month, day);
      }
    }

    // Handle other date formats that might exist
    const formats = [
      /(\d{2})\/(\d{2})\/(\d{4})/, // MM/DD/YYYY
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // M/D/YYYY
    ];

    for (const format of formats) {
      const formatMatch = dateString.match(format);
      if (formatMatch) {
        if (format === formats[1]) { // YYYY-MM-DD
          return new Date(parseInt(formatMatch[1]), parseInt(formatMatch[2]) - 1, parseInt(formatMatch[3]));
        } else { // MM/DD/YYYY or M/D/YYYY
          return new Date(parseInt(formatMatch[3]), parseInt(formatMatch[1]) - 1, parseInt(formatMatch[2]));
        }
      }
    }

    // Fallback to Date constructor
    return new Date(dateString);
  }

  private static generateId(firstName: string, lastName: string, connectedOn: string): string {
    const name = `${firstName}_${lastName}`.toLowerCase().replace(/\s+/g, '_');
    const date = connectedOn.replace(/[^\d]/g, '');
    return `${name}_${date}`;
  }
}