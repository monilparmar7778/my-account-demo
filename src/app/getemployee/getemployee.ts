import { Component, OnDestroy, OnInit, ViewChild, TemplateRef, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GridComponent, GridModule, PageChangeEvent } from '@progress/kendo-angular-grid';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { InputsModule } from '@progress/kendo-angular-inputs';
import { NotificationService } from '@progress/kendo-angular-notification';
import { DialogModule, DialogRef, DialogService } from '@progress/kendo-angular-dialog';
import { LabelModule } from '@progress/kendo-angular-label';
import { DateInputsModule } from '@progress/kendo-angular-dateinputs';
import { Authservice } from '../authservice';

// Employee interface
interface Employee {
  emp_details_id: number;
  employee_name: string;
  employee_amount: number;
  employee_descripation?: string;
  insert_date?: Date;
}

// Grid state interface
interface GridState {
  skip: number;
  pageSize: number;
}

@Component({
  selector: 'app-getemployee',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    GridModule,
    ButtonsModule,
    InputsModule,
    DialogModule,
    LabelModule,
    DateInputsModule
  ],
  templateUrl: './getemployee.html',
  styleUrl: './getemployee.css'
})
export class Getemployee implements OnInit, OnDestroy {
  @ViewChild(GridComponent)
  private grid!: GridComponent;

  @ViewChild('editModalTemplate') editModalTemplate!: TemplateRef<any>;

  public view: Employee[] = [];
  public filteredView: Employee[] = [];
  public isLoading: boolean = false;
  public isSaving: boolean = false;
  public searchTerm: string = '';
  public totalEmployees: number = 0;
  public totalAmount: number = 0;
  public averageAmount: number = 0;

  // Modal properties
  public editForm!: FormGroup;
  public selectedEmployee: Employee | null = null;
  public isEditMode: boolean = false;
  private dialogRef: DialogRef | null = null;

  // Grid state management
  public state: GridState = {
    skip: 0,
    pageSize: 10
  };

  constructor(
    private authService: Authservice,
    private notificationService: NotificationService,
    private dialogService: DialogService,
    private viewContainerRef: ViewContainerRef
  ) {}

  public ngOnInit(): void {
    this.loadEmployees();
    this.initializeForm();
  }

  public ngOnDestroy(): void {
    this.closeModal();
  }

  // Initialize the edit form
  private initializeForm(): void {
    this.editForm = new FormGroup({
      employee_name: new FormControl('', [Validators.required, Validators.minLength(2)]),
      employee_amount: new FormControl(0, [Validators.required, Validators.min(0.01)]),
      employee_descripation: new FormControl(''),
      insert_date: new FormControl(new Date())
    });
  }

  // Load all employees
  private loadEmployees(): void {
    this.isLoading = true;
    this.authService.getEmployees().subscribe({
      next: (response: any) => {
        this.isLoading = false;
        console.log('Employees API Response:', response);
        
        if (response.success && response.data && Array.isArray(response.data)) {
          this.view = response.data.map((employee: any) => ({
            ...employee,
            insert_date: employee.insert_date ? new Date(employee.insert_date) : undefined
          }));
          this.applyFilter();
          this.calculateTotals();
          this.showNotification(`Successfully loaded ${this.view.length} employees`, 'success');
        } else {
          this.view = [];
          this.filteredView = [];
          this.calculateTotals();
          this.showNotification('No employees found or invalid response format', 'info');
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading employees:', error);
        this.showNotification('Error loading employees: ' + error.message, 'error');
      }
    });
  }

  // Calculate totals for display
  private calculateTotals(): void {
    this.totalEmployees = this.filteredView.length;
    this.totalAmount = this.filteredView.reduce((sum, employee) => sum + (employee.employee_amount || 0), 0);
    this.averageAmount = this.totalEmployees > 0 ? this.totalAmount / this.totalEmployees : 0;
  }

  // Apply search filter
  public applyFilter(): void {
    if (!this.searchTerm.trim()) {
      this.filteredView = [...this.view];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredView = this.view.filter(employee =>
        employee.employee_name?.toLowerCase().includes(term) ||
        employee.employee_descripation?.toLowerCase().includes(term) ||
        employee.emp_details_id.toString().includes(term) ||
        employee.employee_amount.toString().includes(term)
      );
    }
    this.calculateTotals();
    this.state.skip = 0; // Reset to first page when filtering
  }

  // Clear search method
  public clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  // Search input handler
  public onSearchInput(event: any): void {
    this.searchTerm = event.target.value;
    this.applyFilter();
  }

  // Grid pagination
  public pageChange(event: PageChangeEvent): void {
    this.state.skip = event.skip;
  }

  // Refresh table
  public refreshTable(): void {
    this.loadEmployees();
    this.showNotification('Data refreshed successfully', 'info');
  }

  // Open edit modal
  public editEmployee(employee: Employee): void {
    this.selectedEmployee = employee;
    this.isEditMode = true;
    
    // Populate form with employee data
    this.editForm.patchValue({
      employee_name: employee.employee_name,
      employee_amount: employee.employee_amount,
      employee_descripation: employee.employee_descripation || '',
      insert_date: employee.insert_date ? new Date(employee.insert_date) : new Date()
    });

    this.openModal();
  }

  // Open modal dialog - FIXED VERSION
  private openModal(): void {
    this.dialogRef = this.dialogService.open({
      title: this.isEditMode ? `Edit Employee: ${this.selectedEmployee?.employee_name}` : 'Add New Employee',
      content: this.editModalTemplate,
      width: 600,
      height: 500,
      appendTo: this.viewContainerRef, // FIX: Added appendTo property
      actions: [
        { text: 'Cancel' },
        { text: this.isEditMode ? 'Update Employee' : 'Create Employee', themeColor: 'primary', disabled: this.editForm.invalid }
      ]
    });

    // Handle modal actions
    this.dialogRef.result.subscribe((result: any) => {
      if (result && result.text === (this.isEditMode ? 'Update Employee' : 'Create Employee')) {
        this.saveEmployee();
      } else {
        this.closeModal();
      }
    });

    // Update button disabled state based on form validity
    this.editForm.statusChanges.subscribe(() => {
      if (this.dialogRef) {
        const updateButton = this.dialogRef.dialog.instance.actions?.find(action => 
          action.text === (this.isEditMode ? 'Update Employee' : 'Create Employee')
        );
        if (updateButton) {
          updateButton.disabled = this.editForm.invalid || this.isSaving;
        }
      }
    });
  }

  // Close modal
  private closeModal(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = null;
    }
    this.selectedEmployee = null;
    this.isEditMode = false;
    this.editForm.reset();
  }

  // Save employee data
  public saveEmployee(): void {
    if (this.editForm.valid && !this.isSaving) {
      this.isSaving = true;
      
      const formData = this.editForm.value;
      const employeeData: Employee = {
        emp_details_id: this.selectedEmployee?.emp_details_id || 0,
        employee_name: formData.employee_name,
        employee_amount: formData.employee_amount,
        employee_descripation: formData.employee_descripation,
        insert_date: formData.insert_date
      };

      if (this.isEditMode && this.selectedEmployee) {
        this.updateEmployee(employeeData);
      } else {
        this.createEmployee(employeeData);
      }
    } else {
      this.markFormGroupTouched();
      this.showNotification('Please fix validation errors before saving', 'warning');
    }
  }

  // Create new employee
  private createEmployee(employeeData: Employee): void {
    this.authService.createEmployee(employeeData).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        console.log('Create response:', response);
        
        if (response.success) {
          this.showNotification('Employee created successfully!', 'success');
          this.closeModal();
          this.loadEmployees(); // Reload to get latest data
        } else {
          this.showNotification(response.message || 'Error creating employee', 'error');
        }
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error creating employee:', error);
        this.showNotification('Error creating employee: ' + error.message, 'error');
      }
    });
  }

  // Update existing employee
  private updateEmployee(employeeData: Employee): void {
    this.authService.updateEmployee(employeeData.emp_details_id, employeeData).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        console.log('Update response:', response);
        
        if (response.success) {
          this.showNotification('Employee updated successfully!', 'success');
          this.closeModal();
          this.loadEmployees(); // Reload to get latest data
        } else {
          this.showNotification(response.message || 'Error updating employee', 'error');
        }
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error updating employee:', error);
        this.showNotification('Error updating employee: ' + error.message, 'error');
      }
    });
  }

  // Delete employee with confirmation
  public deleteEmployee(employee: Employee): void {
    const dialog = this.dialogService.open({
      title: 'Confirm Delete',
      content: `Are you sure you want to delete employee: ${employee.employee_name} (ID: ${employee.emp_details_id})? This action cannot be undone.`,
      actions: [
        { text: 'No' },
        { text: 'Yes, Delete', themeColor: 'error' }
      ],
      appendTo: this.viewContainerRef // FIX: Added appendTo for delete confirmation dialog too
    });

    dialog.result.subscribe((result: any) => {
      if (result && result.text === 'Yes, Delete') {
        this.isLoading = true;
        this.authService.deleteEmployee(employee.emp_details_id).subscribe({
          next: (response: any) => {
            this.isLoading = false;
            if (response.success) {
              this.showNotification('Employee deleted successfully!', 'success');
              this.loadEmployees(); // Reload all data
            } else {
              this.showNotification(response.message || 'Error deleting employee', 'error');
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error deleting employee:', error);
            this.showNotification('Error deleting employee: ' + error.message, 'error');
          }
        });
      }
    });
  }

  // Mark all form fields as touched to show validation errors
  private markFormGroupTouched(): void {
    Object.keys(this.editForm.controls).forEach(key => {
      this.editForm.get(key)?.markAsTouched();
    });
  }

  // Show notification
  private showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.notificationService.show({
      content: message,
      cssClass: `k-notification-${type}`,
      animation: { type: 'slide', duration: 400 },
      position: { horizontal: 'center', vertical: 'top' },
      type: { style: type, icon: true },
      hideAfter: 3000
    });
  }

  // Row class for styling
  public rowCallback(context: any): any {
    return {
      'high-salary-row': context.dataItem.employee_amount > 50000,
      'medium-salary-row': context.dataItem.employee_amount >= 25000 && context.dataItem.employee_amount <= 50000,
      'low-salary-row': context.dataItem.employee_amount < 25000
    };
  }
}