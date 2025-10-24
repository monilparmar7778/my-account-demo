import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Authservice } from '../authservice';

@Component({
  selector: 'app-createuser',
  imports: [FormsModule, CommonModule],
  templateUrl: './createuser.html',
  styleUrl: './createuser.css'
})
export class Createuser {
  userData = {
    username: '',
    email: '',
    mobile_no: '',
    full_name: '',
    password: ''
  };

  isLoading = false;
  message = '';
  messageType = ''; // 'success' or 'error'

  constructor(private authService: Authservice) { }

  onCreateUser() {
    // Validation - Only username and email are required
    if (!this.userData.username || !this.userData.email) {
      this.showMessage('Username and email are required', 'error');
      return;
    }

    this.isLoading = true;
    this.message = '';

    // Set password to null
    this.userData.password = 'default123';

    this.authService.createUser(this.userData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.showMessage(`User created successfully! User ID: ${response.user_id}`, 'success');
          this.resetForm();
        } else {
          this.showMessage(response.message || 'Failed to create user', 'error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.showMessage('Error creating user: ' + error.message, 'error');
        console.error('Create user error:', error);
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
    this.userData = {
      username: '',
      email: '',
      mobile_no: '',
      full_name: '',
      password: ''
    };
  }
}