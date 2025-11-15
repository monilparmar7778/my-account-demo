import { Component, OnDestroy, OnInit, ViewChild, TemplateRef, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GridComponent, GridModule, PageChangeEvent } from '@progress/kendo-angular-grid';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { InputsModule } from '@progress/kendo-angular-inputs';
import { DropDownListModule } from '@progress/kendo-angular-dropdowns';
import { NotificationService } from '@progress/kendo-angular-notification';
import { DialogModule, DialogRef, DialogService } from '@progress/kendo-angular-dialog';
import { LabelModule } from '@progress/kendo-angular-label';
import { DateInputsModule } from '@progress/kendo-angular-dateinputs';
import { Authservice } from '../authservice';

// Employee interface (for salary records)
interface EmployeeRecord {
  emp_details_id: number;
  employee_id: number;
  employee_amount: number;
  employee_descripation?: string;
  insert_date?: Date;
}

// Employee Details interface (for dropdown - from tbl_employee_info)
interface EmployeeDetails {
  employee_id: number;
  employee_name: string;
  email?: string;
  phoneno?: string;
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
    DropDownListModule,
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

  public view: EmployeeRecord[] = [];
  public filteredView: EmployeeRecord[] = [];
  public employeesList: EmployeeDetails[] = [];
  public isLoading: boolean = false;
  public isSaving: boolean = false;
  public searchTerm: string = '';
  public totalEmployees: number = 0;
  public totalAmount: number = 0;
  public averageAmount: number = 0;

  // Modal properties
  public editForm!: FormGroup;
  public selectedEmployee: EmployeeRecord | null = null;
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
    this.loadEmployeesList();
    this.initializeForm();
  }

  public ngOnDestroy(): void {
    this.closeModal();
  }

  // Initialize the edit form
  private initializeForm(): void {
    this.editForm = new FormGroup({
      employee_id: new FormControl(null, [Validators.required]),
      employee_amount: new FormControl(0, [Validators.required, Validators.min(0.01)]),
      employee_descripation: new FormControl(''),
      insert_date: new FormControl(this.getLocalDate(new Date()), [Validators.required]) // Use local date without time
    });
  }

  // Handle date change from Kendo DatePicker - FIXED TIMEZONE ISSUE
  public onDateChange(date: Date): void {
    console.log('Original date from picker:', date);
    
    // Convert to local date without time and timezone
    const localDate = this.getLocalDate(date);
    console.log('Converted local date:', localDate);
    
    this.editForm.patchValue({
      insert_date: localDate
    });
  }

  // Get local date without time and timezone information
  private getLocalDate(date: Date): Date {
    if (!date) return new Date();
    
    // Create a new date using local time components only
    const localDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0, 0, 0, 0  // Set time to 00:00:00.000
    );
    
    return localDate;
  }

  // Format date for API (YYYY-MM-DD format)
  private formatDateForAPI(date: Date): string {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    
    return `${year}-${month}-${day}`;
  }

  // Load all employee salary records
  private loadEmployees(): void {
    this.isLoading = true;
    this.authService.getEmployees().subscribe({
      next: (response: any) => {
        this.isLoading = false;
        console.log('Employee Records API Response:', response);
        
        if (response.success && response.data && Array.isArray(response.data)) {
          this.view = response.data.map((employee: any) => ({
            emp_details_id: employee.emp_details_id,
            employee_id: employee.employee_id,
            employee_amount: employee.employee_amount,
            employee_descripation: employee.employee_descripation,
            insert_date: this.parseDateFromAPI(employee.insert_date)
          }));
          this.applyFilter();
          this.calculateTotals();
          this.showNotification(`Successfully loaded ${this.view.length} salary records`, 'success');
        } else {
          this.view = [];
          this.filteredView = [];
          this.calculateTotals();
          this.showNotification('No salary records found or invalid response format', 'info');
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading salary records:', error);
        this.showNotification('Error loading salary records: ' + error.message, 'error');
      }
    });
  }

  // Parse date from API response (handle timezone issues)
  private parseDateFromAPI(dateString: any): Date {
    if (!dateString) return this.getLocalDate(new Date());
    
    try {
      // If it's already a Date object
      if (dateString instanceof Date) {
        return this.getLocalDate(dateString);
      }
      
      // If it's a string, parse it as local date
      if (typeof dateString === 'string') {
        // Handle ISO format with timezone
        if (dateString.includes('T')) {
          // Extract just the date part (YYYY-MM-DD)
          const datePart = dateString.split('T')[0];
          const parts = datePart.split('-');
          
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
            const day = parseInt(parts[2], 10);
            
            // Create date in local timezone without time
            return new Date(year, month, day, 0, 0, 0, 0);
          }
        } else {
          // Handle simple date format (YYYY-MM-DD)
          const parts = dateString.split('-');
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            
            return new Date(year, month, day, 0, 0, 0, 0);
          }
        }
        
        // Try direct parsing as fallback
        const parsedDate = new Date(dateString);
        if (!isNaN(parsedDate.getTime())) {
          return this.getLocalDate(parsedDate);
        }
      }
      
      console.warn('Could not parse date from API:', dateString);
      return this.getLocalDate(new Date());
    } catch (error) {
      console.error('Error parsing date from API:', error, dateString);
      return this.getLocalDate(new Date());
    }
  }

  // Load employees list for dropdown
  private loadEmployeesList(): void {
    this.authService.getEmployeesDetails().subscribe({
      next: (response: any) => {
        if (response.success && response.data && Array.isArray(response.data)) {
          this.employeesList = response.data;
          console.log('Loaded employees for dropdown:', this.employeesList);
        } else {
          this.employeesList = [];
          console.warn('No employees found for dropdown');
        }
      },
      error: (error) => {
        console.error('Error loading employees list:', error);
        this.employeesList = [];
      }
    });
  }

  // Get employee name by ID
  public getEmployeeName(employeeId: number): string {
    const employee = this.employeesList.find(emp => emp.employee_id === employeeId);
    return employee ? employee.employee_name : 'Unknown';
  }

  // Get selected employee info for modal display
  public getSelectedEmployeeInfo(): EmployeeDetails | null {
    const employeeId = this.editForm.get('employee_id')?.value;
    if (employeeId) {
      return this.employeesList.find(emp => emp.employee_id === employeeId) || null;
    }
    return null;
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
        employee.employee_id.toString().includes(term) ||
        this.getEmployeeName(employee.employee_id).toLowerCase().includes(term) ||
        employee.employee_descripation?.toLowerCase().includes(term) ||
        employee.emp_details_id.toString().includes(term) ||
        employee.employee_amount.toString().includes(term)
      );
    }
    this.calculateTotals();
    this.state.skip = 0;
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
    this.loadEmployeesList();
    this.showNotification('Data refreshed successfully', 'info');
  }

  // Add new employee record
  public addNewEmployee(): void {
    this.selectedEmployee = null;
    this.isEditMode = false;
    this.editForm.reset({
      employee_id: null,
      employee_amount: 0,
      employee_descripation: '',
      insert_date: this.getLocalDate(new Date()) // Use local date without time
    });
    this.openModal();
  }

  // Open edit modal - FIXED TIMEZONE ISSUE
  public editEmployee(employee: EmployeeRecord): void {
    this.selectedEmployee = employee;
    this.isEditMode = true;
    
    console.log('=== EDIT MODE START ===');
    console.log('Original employee data:', employee);
    console.log('Original insert_date:', employee.insert_date);
    
    // Parse the date and convert to local date without time
    const originalDate = this.parseDateFromAPI(employee.insert_date);
    console.log('Parsed local date:', originalDate);
    console.log('Formatted date for display:', this.formatDateForAPI(originalDate));
    
    // Reset form first
    this.editForm.reset();
    
    // Use setTimeout to ensure the form is ready
    setTimeout(() => {
      this.editForm.patchValue({
        employee_id: employee.employee_id,
        employee_amount: employee.employee_amount,
        employee_descripation: employee.employee_descripation || '',
        insert_date: originalDate
      });
      
      console.log('Form values after patch:', this.editForm.value);
      console.log('Form insert_date after patch:', this.editForm.get('insert_date')?.value);
      console.log('=== EDIT MODE END ===');
    }, 0);

    this.openModal();
  }

  // Open modal dialog
  private openModal(): void {
    this.dialogRef = this.dialogService.open({
      title: this.isEditMode ? 
        `Edit Salary Record - Employee #${this.selectedEmployee?.employee_id}` : 
        'Add New Salary Record',
      content: this.editModalTemplate,
      width: 650,
      height: 600,
      appendTo: this.viewContainerRef,
      actions: [
        { text: 'Cancel' },
        { text: this.isEditMode ? 'Update Record' : 'Create Record', themeColor: 'primary', disabled: this.editForm.invalid }
      ]
    });

    // Handle modal actions
    this.dialogRef.result.subscribe((result: any) => {
      if (result && result.text === (this.isEditMode ? 'Update Record' : 'Create Record')) {
        this.saveEmployee();
      } else {
        this.closeModal();
      }
    });

    // Update button disabled state
    this.editForm.statusChanges.subscribe(() => {
      if (this.dialogRef) {
        const updateButton = this.dialogRef.dialog.instance.actions?.find(action => 
          action.text === (this.isEditMode ? 'Update Record' : 'Create Record')
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

  // Save employee data - FIXED DATE FORMATTING
  public saveEmployee(): void {
    if (this.editForm.valid && !this.isSaving) {
      this.isSaving = true;
      
      const formData = this.editForm.value;
      
      console.log('=== SAVING DATA ===');
      console.log('Form insert_date:', formData.insert_date);
      console.log('Form insert_date formatted:', this.formatDateForAPI(formData.insert_date));
      
      // Format the date properly for API (YYYY-MM-DD)
      const formattedDate = this.formatDateForAPI(formData.insert_date);
      
      const employeeData: any = {
        emp_details_id: this.selectedEmployee?.emp_details_id || 0,
        employee_id: formData.employee_id,
        employee_amount: formData.employee_amount,
        employee_descripation: formData.employee_descripation,
        insert_date: formattedDate // Send formatted date string instead of Date object
      };

      console.log('Final data to API:', employeeData);

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

  // Create new employee record
  private createEmployee(employeeData: any): void {
    this.authService.createEmployee(employeeData).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        console.log('Create response:', response);
        
        if (response.success) {
          this.showNotification('Salary record created successfully!', 'success');
          this.closeModal();
          this.loadEmployees();
        } else {
          this.showNotification(response.message || 'Error creating salary record', 'error');
        }
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error creating salary record:', error);
        this.showNotification('Error creating salary record: ' + error.message, 'error');
      }
    });
  }

  // Update existing employee record
  private updateEmployee(employeeData: any): void {
    this.authService.updateEmployee(employeeData.emp_details_id, employeeData).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        console.log('Update response:', response);
        
        if (response.success) {
          this.showNotification('Salary record updated successfully!', 'success');
          this.closeModal();
          this.loadEmployees();
        } else {
          this.showNotification(response.message || 'Error updating salary record', 'error');
        }
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error updating salary record:', error);
        this.showNotification('Error updating salary record: ' + error.message, 'error');
      }
    });
  }

  // Delete employee with confirmation
  public deleteEmployee(employee: EmployeeRecord): void {
    const employeeName = this.getEmployeeName(employee.employee_id);
    
    const dialog = this.dialogService.open({
      title: 'Confirm Delete',
      content: `Are you sure you want to delete salary record for Employee #${employee.employee_id} (${employeeName})? This action cannot be undone.`,
      actions: [
        { text: 'No' },
        { text: 'Yes, Delete', themeColor: 'error' }
      ],
      appendTo: this.viewContainerRef
    });

    dialog.result.subscribe((result: any) => {
      if (result && result.text === 'Yes, Delete') {
        this.isLoading = true;
        this.authService.deleteEmployee(employee.emp_details_id).subscribe({
          next: (response: any) => {
            this.isLoading = false;
            if (response.success) {
              this.showNotification('Salary record deleted successfully!', 'success');
              this.loadEmployees();
            } else {
              this.showNotification(response.message || 'Error deleting salary record', 'error');
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error deleting salary record:', error);
            this.showNotification('Error deleting salary record: ' + error.message, 'error');
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