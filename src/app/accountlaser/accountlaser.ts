// accountlaser.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Authservice } from '../authservice';

// Kendo UI imports
import { GridModule, GridDataResult, PageChangeEvent } from '@progress/kendo-angular-grid';
import { PDFExportModule } from '@progress/kendo-angular-pdf-export';
import { ExcelExportModule } from '@progress/kendo-angular-excel-export';
import { ButtonModule } from '@progress/kendo-angular-buttons';
import { DateInputsModule } from '@progress/kendo-angular-dateinputs';
import { InputsModule } from '@progress/kendo-angular-inputs';
import { LabelModule } from '@progress/kendo-angular-label';
import { DropDownsModule } from '@progress/kendo-angular-dropdowns';

@Component({
  selector: 'app-accountlaser',
  imports: [
    CommonModule,
    FormsModule,
    GridModule,
    PDFExportModule,
    ExcelExportModule,
    ButtonModule,
    DateInputsModule,
    InputsModule,
    LabelModule,
    DropDownsModule
  ],
  templateUrl: './accountlaser.html',
  styleUrls: ['./accountlaser.css']
})
export class Accountlaser implements OnInit {
  // Grid data
  public gridData: GridDataResult = { data: [], total: 0 };
  public pageSize = 20;
  public skip = 0;

  // Filter criteria
  public username: string = '';
  public fromDate: Date | null = null;
  public toDate: Date | null = null;

  // Summary data
  public summary = {
    total_get_money: 0,
    total_give_money: 0,
    total_interest: 0,
    net_balance: 0
  };

  // Loading state
  public loading: boolean = false;

  // User list for dropdown
  public users: any[] = [];

  constructor(private authService: Authservice) {}

  ngOnInit() {
    this.loadUsers();
  }

  // Load users for dropdown using AuthService
  loadUsers() {
    this.authService.getUsers().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.users = response.data;
        } else {
          console.error('Failed to load users:', response.message);
        }
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        alert('Error loading users list');
      }
    });
  }

  // Search accounts using AuthService
  searchAccounts() {
    if (!this.username) {
      alert('Please select a username');
      return;
    }

    this.loading = true;

    const request = {
      username: this.username,
      from_date: this.fromDate ? this.formatDate(this.fromDate) : null,
      to_date: this.toDate ? this.formatDate(this.toDate) : null,
      skip: this.skip,
      take: this.pageSize,
      sort: [{ field: 'transaction_date', dir: 'desc' }]
    };

    // Use AuthService instead of direct HTTP call
    this.authService.getAccountRecords(request).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.gridData = {
            data: response.data,
            total: response.total
          };
          this.summary = {
            total_get_money: response.total_get_money,
            total_give_money: response.total_give_money,
            total_interest: response.total_interest,
            net_balance: response.net_balance
          };
        } else {
          alert(response.message || 'Error loading data');
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error:', error);
        alert('Error loading account records');
        this.loading = false;
      }
    });
  }

  // Page change event
  public pageChange(event: PageChangeEvent): void {
    this.skip = event.skip;
    this.searchAccounts();
  }

  // Export to PDF
  public exportPDF(): void {
    const gridElement = document.querySelector('.k-grid') as any;
    if (gridElement && gridElement.saveAsPDF) {
      gridElement.saveAsPDF();
    }
  }

  // Export to Excel
  public exportExcel(): void {
    const gridElement = document.querySelector('.k-grid') as any;
    if (gridElement && gridElement.saveAsExcel) {
      gridElement.saveAsExcel();
    }
  }

  // Reset filters
  resetFilters() {
    this.username = '';
    this.fromDate = null;
    this.toDate = null;
    this.gridData = { data: [], total: 0 };
    this.summary = {
      total_get_money: 0,
      total_give_money: 0,
      total_interest: 0,
      net_balance: 0
    };
  }

  // Format date for API
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Get user info from first record
  getUserInfo(): any {
    if (this.gridData.data.length > 0) {
      const firstRecord = this.gridData.data[0];
      return {
        full_name: firstRecord.full_name,
        mobile_no: firstRecord.mobile_no,
        email: firstRecord.email
      };
    }
    return null;
  }
}