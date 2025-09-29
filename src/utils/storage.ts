import { Connection } from './csvParser';

const STORAGE_KEY = 'medallia-connections-data';
const VERSION_KEY = 'medallia-data-version';
const CURRENT_VERSION = '1.0';

export interface StoredData {
  version: string;
  allConnections: Connection[];
  medalliaConnections: Connection[];
  lastUpdated: string;
  manuallyAdded: string[]; // IDs of manually added connections
}

export class StorageManager {
  static saveData(allConnections: Connection[], medalliaConnections: Connection[], manuallyAddedIds: string[] = []): void {
    try {
      const data: StoredData = {
        version: CURRENT_VERSION,
        allConnections,
        medalliaConnections,
        lastUpdated: new Date().toISOString(),
        manuallyAdded: manuallyAddedIds
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);

      console.log(`Saved ${medalliaConnections.length} Medallia connections to localStorage`);
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  static loadData(): StoredData | null {
    try {
      const storedVersion = localStorage.getItem(VERSION_KEY);
      const storedData = localStorage.getItem(STORAGE_KEY);

      if (!storedData || !storedVersion) {
        return null;
      }

      if (storedVersion !== CURRENT_VERSION) {
        console.warn('Data version mismatch, clearing storage');
        this.clearData();
        return null;
      }

      const data: StoredData = JSON.parse(storedData);

      // Convert date strings back to Date objects
      data.allConnections = data.allConnections.map(conn => ({
        ...conn,
        connectedDate: new Date(conn.connectedDate)
      }));

      data.medalliaConnections = data.medalliaConnections.map(conn => ({
        ...conn,
        connectedDate: new Date(conn.connectedDate)
      }));

      console.log(`Loaded ${data.medalliaConnections.length} Medallia connections from localStorage`);
      return data;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      this.clearData();
      return null;
    }
  }

  static clearData(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VERSION_KEY);
    console.log('Cleared localStorage data');
  }

  static hasStoredData(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  static getDataSummary(): { count: number, lastUpdated: string } | null {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (!storedData) return null;

      const data: StoredData = JSON.parse(storedData);
      return {
        count: data.medalliaConnections.length,
        lastUpdated: data.lastUpdated
      };
    } catch {
      return null;
    }
  }

  static exportData(): string {
    const data = this.loadData();
    if (!data) throw new Error('No data to export');

    return JSON.stringify(data, null, 2);
  }

  static importData(jsonString: string): StoredData {
    try {
      const data: StoredData = JSON.parse(jsonString);

      // Validate the structure
      if (!data.allConnections || !data.medalliaConnections) {
        throw new Error('Invalid data format');
      }

      // Convert date strings back to Date objects
      data.allConnections = data.allConnections.map(conn => ({
        ...conn,
        connectedDate: new Date(conn.connectedDate)
      }));

      data.medalliaConnections = data.medalliaConnections.map(conn => ({
        ...conn,
        connectedDate: new Date(conn.connectedDate)
      }));

      this.saveData(data.allConnections, data.medalliaConnections, data.manuallyAdded);
      return data;
    } catch (error) {
      throw new Error(`Failed to import data: ${error}`);
    }
  }

  static trackManualAddition(connectionId: string): void {
    const data = this.loadData();
    if (data) {
      const manuallyAdded = Array.from(new Set([...data.manuallyAdded, connectionId]));
      this.saveData(data.allConnections, data.medalliaConnections, manuallyAdded);
    }
  }

  static getManuallyAddedIds(): string[] {
    const data = this.loadData();
    return data?.manuallyAdded || [];
  }
}