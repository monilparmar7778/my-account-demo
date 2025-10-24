import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Authservice } from '../authservice';

@Component({
  selector: 'app-insert-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './insert-account.html',
  styleUrl: './insert-account.css'
})
export class InsertAccount {
  getMoneyForm: FormGroup;
  netAmount: number = 0;
  isLoading: boolean = false;
  transactionId: number | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  apiResponse: any = null;

  constructor(
    private fb: FormBuilder,
    private accountService: Authservice
  ) {
    // Initialize Get Money Form
    this.getMoneyForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      getmoney: ['', [Validators.required, Validators.min(0)]],
      intrest: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      utiNo: [''],
      getAgent: [''],
      getDate: [this.getCurrentDate()],
      getRemark: ['']
    });

    // Calculate net amount when getmoney or intrest changes
    this.getMoneyForm.get('getmoney')?.valueChanges.subscribe(() => this.calculateNetAmount());
    this.getMoneyForm.get('intrest')?.valueChanges.subscribe(() => this.calculateNetAmount());
  }

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  calculateNetAmount() {
    const getmoney = parseFloat(this.getMoneyForm.get('getmoney')?.value) || 0;
    const intrest = parseFloat(this.getMoneyForm.get('intrest')?.value) || 0;
    
    if (getmoney > 0 && intrest > 0) {
      this.netAmount = getmoney - (getmoney * intrest / 100);
    } else {
      this.netAmount = 0;
    }
  }

  // Clear messages and response
  clearMessages() {
    this.errorMessage = null;
    this.successMessage = null;
    this.apiResponse = null;
  }

  // Submit Get Money Only
  onSubmit() {
    this.clearMessages();
    
    if (this.getMoneyForm.valid) {
      this.isLoading = true;
      
      const getMoneyData = this.getMoneyForm.value;
      
      // Map form data to Account model for Get Money only
      const accountData = {
        name: getMoneyData.name,
        getmoney: getMoneyData.getmoney,
        intrest: getMoneyData.intrest,
        date: getMoneyData.getDate ? new Date(getMoneyData.getDate) : undefined,
        agent: getMoneyData.getAgent || undefined,
        remark: getMoneyData.getRemark || undefined,
        utino: getMoneyData.utiNo ? parseFloat(getMoneyData.utiNo) : undefined
      };

      console.log('Submitting Get Money Data:', accountData);

      // Call service to create Get Money transaction
      this.accountService.createGetMoneyTransaction(accountData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          console.log('Complete API Response:', response);
          
          // Store the complete API response
          this.apiResponse = response;
          
          if (response && response.success) {
            const accountId = response.acid;
            this.transactionId = accountId;
            
            // Show success message
            this.successMessage = `Get Money transaction created successfully! Transaction ID: ${accountId}`;
            
            this.resetForm();
          } else {
            // Show error message from backend
            this.errorMessage = response?.message || 'Failed to create Get Money transaction.';
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          console.error('Complete Error Response:', error);
          
          // Store the complete error response
          this.apiResponse = error.error || error;
          
          // Use the backend error message directly
          if (error.error && error.error.message) {
            this.errorMessage = error.error.message;
          } else if (error.status === 400) {
            this.errorMessage = 'Bad request. Please check your input data.';
          } else if (error.status === 500) {
            this.errorMessage = 'Server error. Please try again later.';
          } else {
            this.errorMessage = 'Error creating Get Money transaction. Please try again.';
          }
        }
      });
    } else {
      this.errorMessage = 'Please fill all required fields correctly.';
      Object.keys(this.getMoneyForm.controls).forEach(key => {
        this.getMoneyForm.get(key)?.markAsTouched();
      });
    }
  }

  resetForm() {
    this.getMoneyForm.reset({
      getDate: this.getCurrentDate()
    });
    this.netAmount = 0;
    this.transactionId = null;
    this.clearMessages();
  }

  // Format JSON for display
  formatJson(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }
}