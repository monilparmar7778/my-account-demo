// laseraccount.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Authservice } from '../authservice';

// Kendo UI imports
import { PDFExportModule, PDFExportComponent } from '@progress/kendo-angular-pdf-export';
import { ButtonModule } from '@progress/kendo-angular-buttons';
import { DateInputsModule } from '@progress/kendo-angular-dateinputs';
import { InputsModule } from '@progress/kendo-angular-inputs';
import { LabelModule } from '@progress/kendo-angular-label';
import { DropDownsModule } from '@progress/kendo-angular-dropdowns';

interface User {
  user_id: number;
  username: string;
}

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
    DropDownsModule,
  ],
  templateUrl: './laseraccount.html',
  styleUrl: './laseraccount.css'
})
export class Laseraccount implements OnInit {
  @ViewChild('pdfExport') pdfExport!: PDFExportComponent;

  // Simple data structure
  public gridData: { data: any[], total: number } = { data: [], total: 0 };

  // Filter criteria - CHANGED: Now using user_id instead of username string
  public selectedUserId: number | null = null;
  public usersList: User[] = [];
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
  public isUsersLoading: boolean = false;
  public currentDate: Date = new Date();

  // PDF data
  public pdfData: any[] = [];

  constructor(
    private authService: Authservice
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  // Load users for dropdown
  loadUsers() {
    this.isUsersLoading = true;
    this.authService.getUsersBasicInfo().subscribe({
      next: (response: any) => {
        this.isUsersLoading = false;
        if (response.success && response.data) {
          this.usersList = response.data;
          console.log('Loaded users for dropdown:', this.usersList);
        } else {
          this.showNotification('Failed to load users list.', 'error');
        }
      },
      error: (error: any) => {
        this.isUsersLoading = false;
        console.error('Error loading users:', error);
        this.showNotification('Error loading users list. Please try again.', 'error');
      }
    });
  }

  // Get selected username for display
  getSelectedUsername(): string {
    if (this.selectedUserId) {
      const user = this.usersList.find(u => u.user_id === this.selectedUserId);
      return user ? user.username : '';
    }
    return '';
  }

  // Search accounts using AuthService - UPDATED to use user_id
  searchAccounts() {
    if (!this.selectedUserId) {
      this.showNotification('Please select a user', 'warning');
      return;
    }

    if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
      this.showNotification('From date cannot be greater than To date', 'error');
      return;
    }

    this.loading = true;

    // Get username for the selected user_id
    const selectedUser = this.usersList.find(u => u.user_id === this.selectedUserId);
    if (!selectedUser) {
      this.showNotification('Selected user not found', 'error');
      this.loading = false;
      return;
    }

    // Prepare request using AuthService format - FIXED DATE PASSING
    const request = {
      username: selectedUser.username, // Pass username to backend function
      from_date: this.fromDate ? this.formatDateForAPI(this.fromDate) : null,
      to_date: this.toDate ? this.formatDateForAPI(this.toDate) : null,
      skip: 0,
      take: 1000,
      sort: [{ field: 'get_date', dir: 'desc' }]
    };

    console.log('Searching accounts with request:', request);
    console.log('Selected User ID:', this.selectedUserId);
    console.log('Selected Username:', selectedUser.username);

    // Use AuthService to get account records
    this.authService.getAccountRecords(request)
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
            this.showNotification(`Found ${this.gridData.data.length} records for ${selectedUser.username}`, 'success');
          } else {
            this.showNotification(response.message || 'Error loading data', 'error');
          }
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading account records:', error);
          
          let errorMessage = 'Error loading account records';
          
          if (error.status === 401) {
            errorMessage = 'Authentication failed. Please login again.';
            this.authService.logout();
          } else if (error.status === 403) {
            errorMessage = 'Access denied. You do not have permission to view these records.';
          } else if (error.status === 400) {
            if (error.error && error.error.errors) {
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
            errorMessage = 'API endpoint not found. Please check the server configuration.';
          }
          
          this.showNotification(errorMessage, 'error');
          this.loading = false;
        }
      });
  }

  // Enhanced search with validation - UPDATED
  enhancedSearchAccounts(): void {
    // Validate user selection
    if (!this.selectedUserId) {
      this.showNotification('Please select a user', 'warning');
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

    // Check authentication before proceeding
    if (!this.authService.isLoggedIn()) {
      this.showNotification('Your session has expired. Please login again.', 'error');
      this.authService.logout();
      return;
    }

    // Proceed with search
    this.searchAccounts();
  }

  // FIXED: Format date for API - ensure proper date passing
  private formatDateForAPI(date: Date): string {
    // Create a new date to avoid timezone issues
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate.toISOString().split('T')[0];
  }

  // Format date for display (keep existing)
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Reset filters - UPDATED
  resetFilters() {
    this.selectedUserId = null;
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
    this.showNotification('All filters have been reset', 'info');
  }

  // Export to PDF
  public exportPDF(): void {
    if (this.pdfExport && this.pdfData.length > 0) {
      setTimeout(() => {
        const selectedUser = this.usersList.find(u => u.user_id === this.selectedUserId);
        const userName = selectedUser ? selectedUser.username : 'Unknown';
        const fileName = `Account-Laser-Report-${userName}-${new Date().getTime()}.pdf`;
        this.pdfExport.saveAs(fileName);
        console.log('PDF export initiated:', fileName);
        this.showNotification('PDF export started', 'success');
      }, 100);
    } else {
      this.showNotification('No data available to export as PDF', 'warning');
    }
  }

  // Export to Excel
  public exportExcel(): void {
    if (this.gridData.data.length > 0) {
      this.createCustomExcel();
    } else {
      this.showNotification('No data available to export as Excel', 'warning');
    }
  }

  // Custom Excel creation
  private createCustomExcel(): void {
    const data = this.prepareExcelData();
    const csvContent = this.convertToCSV(data);
    const selectedUser = this.usersList.find(u => u.user_id === this.selectedUserId);
    const userName = selectedUser ? selectedUser.username : 'Unknown';
    const fileName = `Account-Laser-Report-${userName}-${new Date().getTime()}.csv`;
    
    this.downloadCSV(csvContent, fileName);
    console.log('Excel export completed:', fileName);
    this.showNotification('Excel file downloaded successfully', 'success');
  }

  // Prepare data for Excel export
  private prepareExcelData(): any[] {
    const selectedUser = this.usersList.find(u => u.user_id === this.selectedUserId);
    const userName = selectedUser ? selectedUser.username : 'Unknown';
    
    const excelData = [];
    
    // Header Section
    excelData.push(['Account Laser Report']);
    excelData.push(['']);
    excelData.push(['Username:', userName]);
    excelData.push(['Period:', 
      `${this.fromDate ? this.formatDate(this.fromDate) : 'All Dates'} to ${this.toDate ? this.formatDate(this.toDate) : 'All Dates'}`]);
    excelData.push(['Generated on:', new Date().toLocaleString()]);
    excelData.push(['Generated by:', this.authService.getUsername() || 'Unknown User']);
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

  // Helper method to get Get Money amount
  getGetMoney(item: any): number {
    if (item.transaction_type === 'GET') {
      return item.getmoney || item.amount || 0;
    }
    return item.getmoney || 0;
  }

  // Helper method to get Give Money amount
  getGiveMoney(item: any): number {
    if (item.transaction_type === 'GIVE') {
      return item.givemoney || item.amount || 0;
    }
    return item.givemoney || 0;
  }

  // Additional helper method for interest amount calculation
  getInterestAmount(item: any): number {
    const getMoney = this.getGetMoney(item);
    return getMoney * (item.interest_percentage || 0) / 100;
  }

  // ========== ENHANCED FUNCTIONALITY ==========

  /**
   * Validate date range with enhanced error messages - FIXED DATE COMPARISON
   */
  validateDateRange(): { isValid: boolean; message: string } {
    const currentDate = new Date();
    currentDate.setHours(23, 59, 59, 999); // Set to end of day for comparison
    
    // Check if fromDate is in future
    if (this.fromDate) {
      const fromDateCopy = new Date(this.fromDate);
      fromDateCopy.setHours(0, 0, 0, 0);
      const currentDateStart = new Date();
      currentDateStart.setHours(0, 0, 0, 0);
      
      if (fromDateCopy > currentDateStart) {
        return {
          isValid: false,
          message: 'From date cannot be in the future'
        };
      }
    }
    
    // Check if toDate is in future
    if (this.toDate) {
      const toDateCopy = new Date(this.toDate);
      toDateCopy.setHours(0, 0, 0, 0);
      const currentDateStart = new Date();
      currentDateStart.setHours(0, 0, 0, 0);
      
      if (toDateCopy > currentDateStart) {
        return {
          isValid: false,
          message: 'To date cannot be in the future'
        };
      }
    }
    
    // Check if fromDate is after toDate
    if (this.fromDate && this.toDate) {
      const fromDateCopy = new Date(this.fromDate);
      const toDateCopy = new Date(this.toDate);
      fromDateCopy.setHours(0, 0, 0, 0);
      toDateCopy.setHours(0, 0, 0, 0);
      
      if (fromDateCopy > toDateCopy) {
        return {
          isValid: false,
          message: 'From date cannot be greater than To date'
        };
      }
    }
    
    // Check if date range is too large (optional)
    if (this.fromDate && this.toDate) {
      const fromDateCopy = new Date(this.fromDate);
      const toDateCopy = new Date(this.toDate);
      fromDateCopy.setHours(0, 0, 0, 0);
      toDateCopy.setHours(0, 0, 0, 0);
      
      const diffTime = Math.abs(toDateCopy.getTime() - fromDateCopy.getTime());
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
   * Quick date range presets - FIXED DATE SETTING
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

    // Ensure dates are properly set without time component
    if (this.fromDate) this.fromDate.setHours(0, 0, 0, 0);
    if (this.toDate) this.toDate.setHours(23, 59, 59, 999);

    this.showNotification(`Applied ${preset.replace(/([A-Z])/g, ' $1').toLowerCase()} preset`, 'success');
  }

  /**
   * Show notification message
   */
  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    // Create temporary notification
    const notification = document.createElement('div');
    
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
  }

  /**
   * Copy summary to clipboard
   */
  copySummaryToClipboard(): void {
    const selectedUser = this.usersList.find(u => u.user_id === this.selectedUserId);
    const userName = selectedUser ? selectedUser.username : 'Unknown';
    
    const summaryText = `
Account Laser Summary - ${userName}
─────────────────────────────
Total Get Money: ₹${this.summary.total_get_money.toFixed(2)}
Total Give Money: ₹${this.summary.total_give_money.toFixed(2)}
Total Interest: ₹${this.summary.total_interest_amount.toFixed(2)}
Net Balance: ₹${this.summary.net_balance.toFixed(2)}
Generated: ${this.currentDate.toLocaleString()}
Generated by: ${this.authService.getUsername() || 'Unknown User'}
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

    const selectedUser = this.usersList.find(u => u.user_id === this.selectedUserId);
    const userName = selectedUser ? selectedUser.username : 'Unknown';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Account Laser Report - ${userName}</title>
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
          <p><strong>Username:</strong> ${userName}</p>
          <p><strong>Period:</strong> ${this.fromDate ? this.formatDate(this.fromDate) : 'All Dates'} to ${this.toDate ? this.formatDate(this.toDate) : 'All Dates'}</p>
          <p><strong>Generated:</strong> ${this.currentDate.toLocaleString()}</p>
          <p><strong>Generated by:</strong> ${this.authService.getUsername() || 'Unknown User'}</p>
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

  /**
   * Check authentication status
   */
  checkAuthentication(): boolean {
    if (!this.authService.isLoggedIn()) {
      this.showNotification('Your session has expired. Please login again.', 'error');
      return false;
    }
    return true;
  }

  /**
   * Get current user info
   */
  getCurrentUserInfo(): string {
    const user = this.authService.getUser();
    return user ? `${user.username} (ID: ${user.user_id})` : 'Not logged in';
  }
}