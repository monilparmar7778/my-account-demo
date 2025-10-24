// laseraccount.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Authservice } from '../authservice';

// Kendo UI imports
import { PDFExportModule, PDFExportComponent } from '@progress/kendo-angular-pdf-export';
import { ButtonModule } from '@progress/kendo-angular-buttons';
import { DateInputsModule } from '@progress/kendo-angular-dateinputs';
import { InputsModule } from '@progress/kendo-angular-inputs';
import { LabelModule } from '@progress/kendo-angular-label';

@Component({
  selector: 'app-laseraccount',
  imports: [
    CommonModule,
    FormsModule,
    PDFExportModule,
    ButtonModule,
    DateInputsModule,
    InputsModule,
    LabelModule,
  ],
  templateUrl: './laseraccount.html',
  styleUrl: './laseraccount.css'
})
export class Laseraccount implements OnInit {
  @ViewChild('pdfExport') pdfExport!: PDFExportComponent;

  // Simple data structure
  public gridData: { data: any[], total: number } = { data: [], total: 0 };

  // Filter criteria
  public username: string = '';
  public fromDate: Date | null = null;
  public toDate: Date | null = null;

  // Summary data
  public summary = {
    total_get_money: 0,
    total_give_money: 0,
    total_interest_amount: 0,
    net_balance: 0
  };

  // Loading state
  public loading: boolean = false;
  public currentDate: Date = new Date();

  // PDF data
  public pdfData: any[] = [];

  constructor(
    private authService: Authservice,
    private http: HttpClient
  ) {}

  ngOnInit() {}

  // Search accounts - FIXED: Include ALL required fields
  searchAccounts() {
    if (!this.username || this.username.trim() === '') {
      alert('Please enter a username');
      return;
    }

    if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
      alert('From date cannot be greater than To date');
      return;
    }

    this.loading = true;

    // FIXED: Include ALL required fields that API expects
    const request = {
      username: this.username.trim(),
      from_date: this.fromDate ? this.formatDate(this.fromDate) : null,
      to_date: this.toDate ? this.formatDate(this.toDate) : null,
      skip: 0, // Add if API requires pagination
      take: 1000, // Add if API requires pagination (get all records)
      sort: [{ field: 'get_date', dir: 'desc' }] // Required by API
    };

    console.log('Sending request:', request);

    this.http.post<any>('http://localhost:5221/api/AccountRecord/records', request)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.gridData = {
              data: response.data || [],
              total: response.total || 0
            };
            this.pdfData = response.data || [];
            this.summary = {
              total_get_money: response.total_get_money || 0,
              total_give_money: response.total_give_money || 0,
              total_interest_amount: response.total_interest_amount || 0,
              net_balance: response.net_balance || 0
            };
            
            console.log('Data loaded successfully:', this.gridData.data.length, 'records');
          } else {
            alert(response.message || 'Error loading data');
          }
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error:', error);
          
          // Enhanced error handling with detailed info
          let errorMessage = 'Error loading account records';
          
          if (error.status === 400) {
            if (error.error && error.error.errors) {
              // Show specific validation errors from API
              const validationErrors = error.error.errors;
              errorMessage = 'Validation errors:\n';
              for (const key in validationErrors) {
                errorMessage += `• ${key}: ${validationErrors[key].join(', ')}\n`;
              }
            } else {
              errorMessage = 'Bad request. Please check your input data.';
            }
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          } else if (error.status === 0) {
            errorMessage = 'Cannot connect to server. Please check if the server is running.';
          } else if (error.status === 404) {
            errorMessage = 'API endpoint not found. Please check the server URL.';
          }
          
          alert(errorMessage);
          this.loading = false;
        }
      });
  }

  // Export to PDF
  public exportPDF(): void {
    if (this.pdfExport && this.pdfData.length > 0) {
      setTimeout(() => {
        const fileName = `Account-Laser-Report-${this.username}-${new Date().getTime()}.pdf`;
        this.pdfExport.saveAs(fileName);
        console.log('PDF export initiated:', fileName);
      }, 100);
    } else {
      alert('No data available to export as PDF');
    }
  }

  // Export to Excel
  public exportExcel(): void {
    if (this.gridData.data.length > 0) {
      this.createCustomExcel();
    } else {
      alert('No data available to export as Excel');
    }
  }

  // Custom Excel creation
  private createCustomExcel(): void {
    const data = this.prepareExcelData();
    const csvContent = this.convertToCSV(data);
    const fileName = `Account-Laser-Report-${this.username}-${new Date().getTime()}.csv`;
    
    this.downloadCSV(csvContent, fileName);
    console.log('Excel export completed:', fileName);
  }

  // Prepare data for Excel export
  private prepareExcelData(): any[] {
    const excelData = [];
    
    // Header Section
    excelData.push(['Account Laser Report']);
    excelData.push(['']);
    excelData.push(['Username:', this.username]);
    excelData.push(['Period:', 
      `${this.fromDate ? this.formatDate(this.fromDate) : 'All Dates'} to ${this.toDate ? this.formatDate(this.toDate) : 'All Dates'}`]);
    excelData.push(['Generated on:', new Date().toLocaleString()]);
    excelData.push(['']);
    excelData.push(['']);
    
    // Summary Overview Section
    excelData.push(['Summary Overview']);
    excelData.push(['']);
    excelData.push(['Total Get Money', `₹${this.summary.total_get_money.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`]);
    excelData.push(['Total Give Money', `₹${this.summary.total_give_money.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`]);
    excelData.push(['Total Interest Amount', `₹${this.summary.total_interest_amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`]);
    excelData.push(['Net Balance', `₹${this.summary.net_balance.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`]);
    excelData.push(['']);
    excelData.push(['']);
    
    // Transaction Details Section
    excelData.push(['Transaction Details']);
    excelData.push(['']);
    
    // Column headers
    excelData.push([
      'Type',
      'Get Date',
      'Give Date',
      'Get Money',
      'Give Money',
      'Interest %'
    ]);
    
    // Data rows
    this.gridData.data.forEach((item: any) => {
      const getMoney = this.getGetMoney(item);
      const giveMoney = this.getGiveMoney(item);
      
      excelData.push([
        item.transaction_type,
        item.get_date ? this.formatDate(new Date(item.get_date)) : '-',
        item.give_date ? this.formatDate(new Date(item.give_date)) : '-',
        getMoney > 0 ? `₹${getMoney.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '₹0.00',
        giveMoney > 0 ? `₹${giveMoney.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '₹0.00',
        item.interest_percentage + '%'
      ]);
    });
    
    return excelData;
  }

  // Convert data to CSV format
  private convertToCSV(data: any[]): string {
    return data.map(row => 
      row.map((cell: any) => 
        typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n')) 
          ? `"${cell.replace(/"/g, '""')}"` 
          : cell
      ).join(',')
    ).join('\n');
  }

  // Download CSV file
  private downloadCSV(csvContent: string, fileName: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  }

  // Reset filters
  resetFilters() {
    this.username = '';
    this.fromDate = null;
    this.toDate = null;
    this.gridData = { data: [], total: 0 };
    this.pdfData = [];
    this.summary = {
      total_get_money: 0,
      total_give_money: 0,
      total_interest_amount: 0,
      net_balance: 0
    };
    
    console.log('Filters reset');
  }

  // Format date for API
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // FIXED: Helper method to get Get Money amount - correctly handles getmoney field from API
  getGetMoney(item: any): number {
    // For GET transactions, use getmoney field or amount
    if (item.transaction_type === 'GET') {
      return item.getmoney || item.amount || 0;
    }
    // For non-GET transactions, still try to get getmoney if available
    return item.getmoney || 0;
  }

  // FIXED: Helper method to get Give Money amount - correctly handles givemoney field from API
  getGiveMoney(item: any): number {
    // For GIVE transactions, use givemoney field or amount
    if (item.transaction_type === 'GIVE') {
      return item.givemoney || item.amount || 0;
    }
    // For non-GIVE transactions, still try to get givemoney if available
    return item.givemoney || 0;
  }

  // Additional helper method for interest amount calculation
  getInterestAmount(item: any): number {
    const getMoney = this.getGetMoney(item);
    return getMoney * (item.interest_percentage || 0) / 100;
  }

  // ========== NEW FUNCTIONALITY ADDED BELOW ==========

  /**
   * Validate date range with enhanced error messages
   */
  validateDateRange(): { isValid: boolean; message: string } {
    const currentDate = new Date();
    
    // Check if fromDate is in future
    if (this.fromDate && this.fromDate > currentDate) {
      return {
        isValid: false,
        message: 'From date cannot be in the future'
      };
    }
    
    // Check if toDate is in future
    if (this.toDate && this.toDate > currentDate) {
      return {
        isValid: false,
        message: 'To date cannot be in the future'
      };
    }
    
    // Check if fromDate is after toDate
    if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
      return {
        isValid: false,
        message: 'From date cannot be greater than To date'
      };
    }
    
    // Check if date range is too large (optional)
    if (this.fromDate && this.toDate) {
      const diffTime = Math.abs(this.toDate.getTime() - this.fromDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 365) {
        return {
          isValid: true,
          message: `Warning: You are viewing data for ${diffDays} days. Consider narrowing your date range for better performance.`
        };
      }
    }
    
    return { isValid: true, message: '' };
  }

  /**
   * Enhanced search with validation
   */
  enhancedSearchAccounts(): void {
    // Validate username
    if (!this.username || this.username.trim() === '') {
      this.showNotification('Please enter a username', 'warning');
      return;
    }

    // Validate date range
    const dateValidation = this.validateDateRange();
    if (!dateValidation.isValid) {
      this.showNotification(dateValidation.message, 'error');
      return;
    }

    // Show warning message if exists
    if (dateValidation.message) {
      this.showNotification(dateValidation.message, 'warning');
    }

    // Proceed with original search
    this.searchAccounts();
  }

  /**
   * Show notification message
   */
  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    // Create temporary notification
    const notification = document.createElement('div');
    
    // FIXED: Type-safe color mapping
    const colors: { [key: string]: string } = {
      success: '#48bb78',
      error: '#f56565',
      warning: '#ed8936',
      info: '#4299e1'
    };
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type] || '#4299e1'};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      max-width: 400px;
      font-weight: 600;
      animation: slideIn 0.3s ease;
    `;
    
    // FIXED: Type-safe icon mapping
    const icons: { [key: string]: string } = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 1.2em;">${icons[type] || 'ℹ️'}</span>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    // Remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 5000);
  }

  /**
   * Export with progress indicator
   */
  async exportWithProgress(format: 'pdf' | 'excel'): Promise<void> {
    if (this.gridData.data.length === 0) {
      this.showNotification('No data available to export', 'warning');
      return;
    }

    // Show progress notification
    const progressNotification = document.createElement('div');
    progressNotification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4299e1;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      max-width: 400px;
      font-weight: 600;
      animation: slideIn 0.3s ease;
    `;

    progressNotification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 1.2em;">⏳</span>
        <span>Preparing ${format.toUpperCase()} export...</span>
      </div>
    `;

    document.body.appendChild(progressNotification);

    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (format === 'pdf') {
        this.exportPDF();
      } else {
        this.exportExcel();
      }

      // Update to success message
      progressNotification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 1.2em;">✅</span>
          <span>${format.toUpperCase()} export completed!</span>
        </div>
      `;
      progressNotification.style.background = '#48bb78';

    } catch (error) {
      // Update to error message
      progressNotification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 1.2em;">❌</span>
          <span>Export failed. Please try again.</span>
        </div>
      `;
      progressNotification.style.background = '#f56565';
    }

    // Remove after 3 seconds
    setTimeout(() => {
      if (progressNotification.parentNode) {
        progressNotification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
          if (progressNotification.parentNode) {
            progressNotification.parentNode.removeChild(progressNotification);
          }
        }, 300);
      }
    }, 3000);
  }

  /**
   * Quick date range presets
   */
  applyDatePreset(preset: 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'lastMonth'): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (preset) {
      case 'today':
        this.fromDate = new Date(today);
        this.toDate = new Date(today);
        break;

      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        this.fromDate = yesterday;
        this.toDate = yesterday;
        break;

      case 'thisWeek':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        this.fromDate = startOfWeek;
        this.toDate = new Date(today);
        break;

      case 'thisMonth':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        this.fromDate = startOfMonth;
        this.toDate = new Date(today);
        break;

      case 'lastMonth':
        const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        this.fromDate = firstDayLastMonth;
        this.toDate = lastDayLastMonth;
        break;
    }

    this.showNotification(`Applied ${preset.replace(/([A-Z])/g, ' $1').toLowerCase()} preset`, 'success');
  }

  /**
   * Enhanced reset with confirmation
   */
  enhancedResetFilters(): void {
    if (this.gridData.data.length > 0) {
      const confirmed = confirm('Are you sure you want to clear all filters and data?');
      if (!confirmed) {
        return;
      }
    }
    
    this.resetFilters();
    this.showNotification('All filters have been reset', 'success');
  }

  /**
   * Copy summary to clipboard
   */
  copySummaryToClipboard(): void {
    const summaryText = `
Account Laser Summary - ${this.username}
─────────────────────────────
Total Get Money: ₹${this.summary.total_get_money.toFixed(2)}
Total Give Money: ₹${this.summary.total_give_money.toFixed(2)}
Total Interest: ₹${this.summary.total_interest_amount.toFixed(2)}
Net Balance: ₹${this.summary.net_balance.toFixed(2)}
Generated: ${this.currentDate.toLocaleString()}
    `.trim();

    navigator.clipboard.writeText(summaryText).then(() => {
      this.showNotification('Summary copied to clipboard!', 'success');
    }).catch(() => {
      this.showNotification('Failed to copy summary', 'error');
    });
  }

  /**
   * Print friendly report
   */
  printReport(): void {
    if (this.gridData.data.length === 0) {
      this.showNotification('No data available to print', 'warning');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.showNotification('Please allow popups to print report', 'error');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Account Laser Report - ${this.username}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
          .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .summary-item { padding: 15px; border: 1px solid #ddd; border-radius: 5px; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          @media print { body { margin: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Account Laser Report</h1>
          <p><strong>Username:</strong> ${this.username}</p>
          <p><strong>Period:</strong> ${this.fromDate ? this.formatDate(this.fromDate) : 'All Dates'} to ${this.toDate ? this.formatDate(this.toDate) : 'All Dates'}</p>
          <p><strong>Generated:</strong> ${this.currentDate.toLocaleString()}</p>
        </div>
        
        <div class="summary">
          <div class="summary-item">Total Get Money: ₹${this.summary.total_get_money.toFixed(2)}</div>
          <div class="summary-item">Total Give Money: ₹${this.summary.total_give_money.toFixed(2)}</div>
          <div class="summary-item">Total Interest: ₹${this.summary.total_interest_amount.toFixed(2)}</div>
          <div class="summary-item">Net Balance: ₹${this.summary.net_balance.toFixed(2)}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Get Date</th>
              <th>Give Date</th>
              <th>Get Money</th>
              <th>Give Money</th>
              <th>Interest %</th>
            </tr>
          </thead>
          <tbody>
            ${this.gridData.data.map(item => `
              <tr>
                <td>${item.transaction_type}</td>
                <td>${item.get_date ? this.formatDate(new Date(item.get_date)) : '-'}</td>
                <td>${item.give_date ? this.formatDate(new Date(item.give_date)) : '-'}</td>
                <td>₹${this.getGetMoney(item).toFixed(2)}</td>
                <td>₹${this.getGiveMoney(item).toFixed(2)}</td>
                <td>${item.interest_percentage ? item.interest_percentage.toFixed(2) : '0.00'}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()">Print Report</button>
          <button onclick="window.close()">Close</button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  }
}