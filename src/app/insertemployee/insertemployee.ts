import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Authservice } from '../authservice';

// Import Kendo UI modules
import { DatePickerModule } from '@progress/kendo-angular-dateinputs';
import { DropDownListModule } from '@progress/kendo-angular-dropdowns';
import { IntlModule } from '@progress/kendo-angular-intl';

@Component({
  selector: 'app-insertemployee',
  imports: [FormsModule, CommonModule, DatePickerModule, DropDownListModule, IntlModule],
  templateUrl: './insertemployee.html',
  styleUrl: './insertemployee.css'
})
export class Insertemployee implements OnInit {
  employeeData = {
    employee_id: null as number | null,
    employee_amount: null as number | null,
    employee_descripation: '',
    insert_date: new Date()
  };

  // Employees list from API
  employeesList: any[] = [];
  
  isLoading = false;
  isLoadingEmployees = false;
  message = '';
  messageType = ''; // 'success' or 'error'

  constructor(private authService: Authservice) { }

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.isLoadingEmployees = true;
    
    // You'll need to add this method to your AuthService
    this.authService.getEmployeesDetails().subscribe({
      next: (response) => {
        this.isLoadingEmployees = false;
        if (response.success && response.data) {
          this.employeesList = response.data;
          console.log('Loaded employees:', this.employeesList);
        } else {
          this.showMessage('Failed to load employees list', 'error');
        }
      },
      error: (error) => {
        this.isLoadingEmployees = false;
        this.showMessage('Error loading employees: ' + error.message, 'error');
        console.error('Load employees error:', error);
      }
    });
  }

  onCreateEmployee() {
    // Validation
    if (!this.employeeData.employee_id || !this.employeeData.employee_amount) {
      this.showMessage('Please select an employee and enter amount', 'error');
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

    console.log('Sending employee data:', formattedData);

    // Call the employee service to create employee record
    this.authService.createEmployee(formattedData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.showMessage(`Employee record created successfully! Record ID: ${response.emp_details_id}`, 'success');
          this.resetForm();
        } else {
          this.showMessage(response.message || 'Failed to create employee record', 'error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.showMessage('Error creating employee record: ' + error.message, 'error');
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
    // Reset form but keep the employees list loaded
    this.employeeData = {
      employee_id: null,
      employee_amount: null,
      employee_descripation: '',
      insert_date: new Date()
    };
  }

  // Get selected employee name for display
  getSelectedEmployeeName(): string {
    if (!this.employeeData.employee_id) return '';
    const selectedEmployee = this.employeesList.find(emp => emp.employee_id === this.employeeData.employee_id);
    return selectedEmployee ? selectedEmployee.employee_name : '';
  }
}