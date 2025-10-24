import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Authservice } from '../authservice';

@Component({
  selector: 'app-givemoney',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './givemoney.html',
  styleUrl: './givemoney.css'
})
export class Givemoney {
  giveMoneyForm: FormGroup;
  isLoading: boolean = false;
  transactionId: number | null = null;
  errorMessage: string | null = null; // Add error message variable
  successMessage: string | null = null; // Add success message variable

  constructor(
    private fb: FormBuilder,
    private accountService: Authservice
  ) {
    // Initialize Give Money Form
    this.giveMoneyForm = this.fb.group({
      giveCustomerName: ['', [Validators.required, Validators.minLength(3)]],
      giveUtiNo: [''],
      givemoney: ['', [Validators.required, Validators.min(0)]],
      giveDate: [this.getCurrentDate()],
      giveAgent: [''],
      giveRemark: ['']
    });
  }

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Clear messages
  clearMessages() {
    this.errorMessage = null;
    this.successMessage = null;
  }

  // Submit Give Money Only
  onSubmit() {
    this.clearMessages(); // Clear previous messages
    
    if (this.giveMoneyForm.valid) {
      this.isLoading = true;
      
      const giveMoneyData = this.giveMoneyForm.value;
      
      // Map form data for Give Money only
      const accountData = {
        givename: giveMoneyData.giveCustomerName,
        givemoney: giveMoneyData.givemoney,
        givedate: giveMoneyData.giveDate ? new Date(giveMoneyData.giveDate) : undefined,
        giveagent: giveMoneyData.giveAgent || undefined,
        giveremark: giveMoneyData.giveRemark || undefined,
        giveutino: giveMoneyData.giveUtiNo ? parseFloat(giveMoneyData.giveUtiNo) : undefined
      };

      console.log('Submitting Give Money Data:', accountData);

      // Call service to create Give Money transaction
      this.accountService.createGiveMoneyTransaction(accountData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          console.log('Give Money API Response:', response);
          
          if (response && response.success) {
            const accountId = response.acid;
            this.transactionId = accountId;
            
            // Show success message
            this.successMessage = `Give Money transaction created successfully! Transaction ID: ${accountId}`;
            
            this.resetForm();
          } else {
            // Show error message from backend
            this.errorMessage = response?.message || 'Failed to create Give Money transaction. Please try again.';
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          console.error('Error creating Give Money transaction:', error);
          
          // Use the backend error message directly
          if (error.error && error.error.message) {
            this.errorMessage = error.error.message;
          } else if (error.status === 400) {
            this.errorMessage = 'Bad request. Please check your input data.';
          } else if (error.status === 500) {
            this.errorMessage = 'Server error. Please try again later.';
          } else {
            this.errorMessage = 'Error creating Give Money transaction. Please try again.';
          }
        }
      });
    } else {
      this.errorMessage = 'Please fill all required fields correctly.';
      Object.keys(this.giveMoneyForm.controls).forEach(key => {
        this.giveMoneyForm.get(key)?.markAsTouched();
      });
    }
  }

  resetForm() {
    this.giveMoneyForm.reset({
      giveDate: this.getCurrentDate()
    });
    this.transactionId = null;
    this.clearMessages(); // Clear messages when resetting form
  }
}