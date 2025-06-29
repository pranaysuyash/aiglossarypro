import { Response } from 'express';

interface CSVColumn {
  key: string;
  header: string;
  formatter?: (value: any) => string;
}

/**
 * Generate CSV string from data array
 */
export function generateCSV(data: any[], columns: CSVColumn[]): string {
  // Generate header row
  const headers = columns.map(col => escapeCSVValue(col.header)).join(',');
  
  // Generate data rows
  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col.key];
      const formattedValue = col.formatter ? col.formatter(value) : value;
      return escapeCSVValue(formattedValue);
    }).join(',');
  }).join('\n');
  
  return `${headers}\n${rows}`;
}

/**
 * Escape CSV value to handle commas, quotes, and newlines
 */
export function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // Check if value needs escaping
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    // Escape quotes by doubling them
    const escapedValue = stringValue.replace(/"/g, '""');
    return `"${escapedValue}"`;
  }
  
  return stringValue;
}

/**
 * Send CSV response with proper headers
 */
export function sendCSVResponse(res: Response, data: string, filename: string): void {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(data);
}

/**
 * Common CSV formatters
 */
export const csvFormatters = {
  date: (value: Date | string) => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  },
  
  dateTime: (value: Date | string) => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString();
  },
  
  currency: (value: number, currency: string = 'USD') => {
    if (value === null || value === undefined) return '';
    return `${currency} ${(value / 100).toFixed(2)}`; // Assuming value is in cents
  },
  
  boolean: (value: boolean) => {
    return value ? 'Yes' : 'No';
  },
  
  number: (value: number, decimals: number = 2) => {
    if (value === null || value === undefined) return '';
    return value.toFixed(decimals);
  },
  
  percentage: (value: number, decimals: number = 2) => {
    if (value === null || value === undefined) return '';
    return `${(value * 100).toFixed(decimals)}%`;
  }
};

/**
 * Generate CSV for common data types
 */
export const csvGenerators = {
  /**
   * Generate CSV for user data
   */
  users: (users: any[]) => {
    const columns: CSVColumn[] = [
      { key: 'id', header: 'User ID' },
      { key: 'email', header: 'Email' },
      { key: 'firstName', header: 'First Name' },
      { key: 'lastName', header: 'Last Name' },
      { key: 'role', header: 'Role' },
      { key: 'isActive', header: 'Active', formatter: csvFormatters.boolean },
      { key: 'createdAt', header: 'Created Date', formatter: csvFormatters.date },
      { key: 'lastLoginAt', header: 'Last Login', formatter: csvFormatters.dateTime }
    ];
    
    return generateCSV(users, columns);
  },
  
  /**
   * Generate CSV for revenue/purchase data
   */
  purchases: (purchases: any[]) => {
    const columns: CSVColumn[] = [
      { key: 'createdAt', header: 'Date', formatter: csvFormatters.dateTime },
      { key: 'gumroadOrderId', header: 'Order ID' },
      { key: 'userId', header: 'User ID' },
      { key: 'userEmail', header: 'Email' },
      { key: 'amount', header: 'Amount', formatter: (v) => csvFormatters.currency(v, 'USD') },
      { key: 'currency', header: 'Currency' },
      { key: 'status', header: 'Status' },
      { key: 'country', header: 'Country' },
      { key: 'paymentMethod', header: 'Payment Method' }
    ];
    
    return generateCSV(purchases, columns);
  },
  
  /**
   * Generate CSV for terms data
   */
  terms: (terms: any[]) => {
    const columns: CSVColumn[] = [
      { key: 'id', header: 'Term ID' },
      { key: 'name', header: 'Term Name' },
      { key: 'category', header: 'Category' },
      { key: 'viewCount', header: 'Views' },
      { key: 'createdAt', header: 'Created Date', formatter: csvFormatters.date },
      { key: 'updatedAt', header: 'Updated Date', formatter: csvFormatters.date }
    ];
    
    return generateCSV(terms, columns);
  }
};