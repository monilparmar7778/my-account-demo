import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-getmoney',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './getmoney.html',
  styleUrl: './getmoney.css'
})
export class Getmoney {
  @Output() getMoneyData = new EventEmitter<any>();
  @Output() nextStep = new EventEmitter<void>();

  getMoneyForm: FormGroup;
  netAmount: number = 0;

  constructor(private fb: FormBuilder) {
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

  onSubmit() {
    if (this.getMoneyForm.valid) {
      const formData = this.getMoneyForm.value;
      const getMoneyData = {
        ...formData,
        netAmount: this.netAmount
      };
      
      // Emit data to parent and move to next step
      this.getMoneyData.emit(getMoneyData);
      this.nextStep.emit();
    } else {
      alert('⚠️ Please fill all required fields correctly!');
      Object.keys(this.getMoneyForm.controls).forEach(key => {
        this.getMoneyForm.get(key)?.markAsTouched();
      });
    }
  }

  onReset() {
    this.getMoneyForm.reset({
      getDate: this.getCurrentDate()
    });
    this.netAmount = 0;
  }
}