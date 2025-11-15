import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Authservice } from '../authservice';

@Component({
  selector: 'app-createemployee',
  imports: [FormsModule, CommonModule],
  templateUrl: './createemployee.html',
  styleUrl: './createemployee.css'
})
export class Createemployee {
  employeeData = {
    employee_name: '',
    email: '',
    phoneno: ''
  };

  isLoading = false;
  message = '';
  messageType = ''; // 'success' or 'error'

  constructor(private authService: Authservice) { }

  onCreateEmployee() {
    // Validation - Only employee_name is required
    if (!this.employeeData.employee_name) {
      this.showMessage('Employee name is required', 'error');
      return;
    }

    this.isLoading = true;
    this.message = '';

    // Prepare data - ensure optional fields are properly handled
    const employeePayload = {
      employee_name: this.employeeData.employee_name,
      email: this.employeeData.email || null, // Send null if empty
      phoneno: this.employeeData.phoneno || null // Send null if empty
    };

    this.authService.createDetailsEmployee(employeePayload).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.showMessage(`Employee created successfully! Employee ID: ${response.employee_id}`, 'success');
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
      email: '',
      phoneno: ''
    };
  }
}