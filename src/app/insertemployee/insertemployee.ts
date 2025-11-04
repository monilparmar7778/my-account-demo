import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Authservice } from '../authservice';

// Import Kendo UI modules
import { DatePickerModule } from '@progress/kendo-angular-dateinputs';
import { IntlModule } from '@progress/kendo-angular-intl';

@Component({
  selector: 'app-insertemployee',
  imports: [FormsModule, CommonModule, DatePickerModule, IntlModule], // Add both modules
  templateUrl: './insertemployee.html',
  styleUrl: './insertemployee.css'
})
export class Insertemployee {
  employeeData = {
    employee_name: '',
    employee_amount: null as number | null,
    employee_descripation: '',
    insert_date: new Date() // Add insert_date property
  };

  isLoading = false;
  message = '';
  messageType = ''; // 'success' or 'error'

  constructor(private authService: Authservice) { }

  onCreateEmployee() {
    // Validation
    if (!this.employeeData.employee_name || !this.employeeData.employee_amount) {
      this.showMessage('Employee name and amount are required', 'error');
      return;
    }

    if (this.employeeData.employee_amount < 0) {
      this.showMessage('Employee amount cannot be negative', 'error');
      return;
    }

    this.isLoading = true;
    this.message = '';

    // Format date to YYYY-MM-DD for API
    const formattedData = {
      ...this.employeeData,
      insert_date: this.formatDate(this.employeeData.insert_date)
    };

    // Call the employee service to create employee
    this.authService.createEmployee(formattedData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.showMessage(`Employee created successfully! Employee ID: ${response.emp_details_id}`, 'success');
          this.resetForm();
        } else {
          this.showMessage(response.message || 'Failed to create employee', 'error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.showMessage('Error creating employee: ' + error.message, 'error');
        console.error('Create employee error:', error);
      }
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  private showMessage(message: string, type: 'success' | 'error') {
    this.message = message;
    this.messageType = type;
    
    // Auto hide message after 5 seconds
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }

  private resetForm() {
    this.employeeData = {
      employee_name: '',
      employee_amount: null,
      employee_descripation: '',
      insert_date: new Date() // Reset to current date
    };
  }
}