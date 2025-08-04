const fs = require('fs').promises;
const path = require('path');
const csv = require('fast-csv');
const xlsx = require('xlsx');
const { jsPDF } = require('jspdf');

/**
 * Export utilities for generating CSV, Excel, and PDF files
 */
class ExportUtils {
  constructor() {
    this.exportsDir = path.join(__dirname, '../exports');
    this.initializationPromise = this.ensureExportsDir();
  }

  /**
   * Ensure exports directory exists
   */
  async ensureExportsDir() {
    try {
      await fs.access(this.exportsDir);
    } catch (error) {
      await fs.mkdir(this.exportsDir, { recursive: true });
    }
  }

  /**
   * Generate CSV file from data
   * @param {Array} data - Array of objects to export
   * @param {String} filename - Name of the file
   * @param {Array} headers - Optional headers array
   * @returns {String} File path
   */
  async generateCSV(data, filename, headers = null) {
    await this.initializationPromise;
    const filePath = path.join(this.exportsDir, `${filename}.csv`);
    
    try {
      // Manual CSV generation - more reliable than streaming
      let csvContent = '';
      
      if (data.length > 0) {
        // Generate headers from first row if not provided
        const csvHeaders = headers || Object.keys(data[0]);
        csvContent += csvHeaders.map(header => `"${header.replace(/"/g, '""')}"`).join(',') + '\n';
        
        // Generate data rows
        for (const row of data) {
          const csvRow = csvHeaders.map(header => {
            const value = row[header] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',');
          csvContent += csvRow + '\n';
        }
      }
      
      // Write file synchronously to avoid streaming issues
      await require('fs').promises.writeFile(filePath, csvContent, 'utf8');
      console.log(`CSV file generated: ${filePath}`);
      return filePath;
      
    } catch (error) {
      console.error('CSV generation error:', error);
      throw error;
    }
  }

  /**
   * Generate Excel file from data
   * @param {Array} data - Array of objects to export
   * @param {String} filename - Name of the file
   * @param {String} sheetName - Name of the sheet
   * @returns {String} File path
   */
  async generateExcel(data, filename, sheetName = 'Sheet1') {
    const filePath = path.join(this.exportsDir, `${filename}.xlsx`);
    
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);
    
    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
    xlsx.writeFile(workbook, filePath);
    
    return filePath;
  }

  /**
   * Generate PDF report
   * @param {Object} options - PDF generation options
   * @returns {String} File path
   */
  async generatePDF(options) {
    const {
      title,
      data,
      columns,
      filename,
      subtitle = '',
      footer = '',
      orientation = 'portrait'
    } = options;

    const doc = new jsPDF(orientation);
    const filePath = path.join(this.exportsDir, `${filename}.pdf`);

    try {
      // Title
      doc.setFontSize(20);
      doc.text(title, 14, 22);

      // Subtitle
      if (subtitle) {
        doc.setFontSize(12);
        doc.text(subtitle, 14, 32);
      }

      // Generated date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, subtitle ? 42 : 32);

      // Use simple text layout for PDF generation
      const tableY = subtitle ? 52 : 42;
      doc.setFontSize(10);
      let yPos = tableY;
      
      // Headers
      doc.setFont(undefined, 'bold');
      const headerText = columns.map(col => col.header || col.key).join(' | ');
      doc.text(headerText, 14, yPos);
      yPos += 10;
      
      // Data rows
      doc.setFont(undefined, 'normal');
      data.slice(0, 30).forEach((row, index) => { // Limit to 30 rows to prevent overflow
        const rowText = columns.map(col => {
          const value = this.getNestedValue(row, col.key);
          return String(value || '').substring(0, 15); // Limit text length
        }).join(' | ');
        doc.text(rowText, 14, yPos);
        yPos += 7;
        
        // Add new page if needed
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
      });
      
      if (data.length > 30) {
        doc.text(`... and ${data.length - 30} more records`, 14, yPos + 10);
      }

      // Footer
      if (footer) {
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(8);
        doc.text(footer, 14, pageHeight - 10);
      }

      // Save file
      doc.save(filePath);
      console.log(`PDF file generated: ${filePath}`);
      return filePath;
      
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  }

  /**
   * Get nested object value by key path
   * @param {Object} obj - Object to search
   * @param {String} path - Dot notation path
   * @returns {*} Value
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((o, p) => o && o[p], obj);
  }

  /**
   * Clean up old export files
   * @param {Number} maxAge - Max age in milliseconds
   */
  async cleanupOldFiles(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    try {
      const files = await fs.readdir(this.exportsDir);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(this.exportsDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`Cleaned up old export file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up export files:', error);
    }
  }

  /**
   * Format currency value
   * @param {Number} value - Numeric value
   * @param {String} currency - Currency code
   * @returns {String} Formatted currency
   */
  formatCurrency(value, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(value || 0);
  }

  /**
   * Format date value
   * @param {Date|String} date - Date value
   * @returns {String} Formatted date
   */
  formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }

  /**
   * Format datetime value
   * @param {Date|String} date - Date value
   * @returns {String} Formatted datetime
   */
  formatDateTime(date) {
    if (!date) return '';
    return new Date(date).toLocaleString();
  }

  /**
   * Calculate percentage
   * @param {Number} value - Value
   * @param {Number} total - Total
   * @returns {String} Percentage
   */
  formatPercentage(value, total) {
    if (!total) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  }
}

module.exports = new ExportUtils();
