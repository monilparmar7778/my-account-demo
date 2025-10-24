import {
  Component,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ButtonsModule } from "@progress/kendo-angular-buttons";
import { DropDownsModule } from "@progress/kendo-angular-dropdowns";
import {
  CellClickEvent,
  GridComponent,
  GridModule,
  RowClassArgs,
  PageChangeEvent,
} from "@progress/kendo-angular-grid";
import { Subscription } from "rxjs";
import { Authservice } from '../authservice';
import { CommonModule } from "@angular/common";
import { InputsModule } from "@progress/kendo-angular-inputs";
import { LabelModule } from "@progress/kendo-angular-label";
import { DateInputsModule } from "@progress/kendo-angular-dateinputs";
import { NotificationService } from "@progress/kendo-angular-notification";
import { FormsModule } from "@angular/forms";

// Complete interface for account data
interface Account {
  acid: number;
  name: string;
  getmoney: number;
  intrest: number;
  givemoney?: number;
  date?: Date;
  agent?: string;
  remark?: string;
  givename?: string;
  giveremark?: string;
  utino?: number;
  giveutino?: number;
  givedate?: Date;
  giveagent?: string;
  created_at?: Date;
  modified_at?: Date;
  start_date?: Date;
  end_date?: Date;
  status?: string;
  ismoney?: boolean; // true for Get Money, false for Give Money
}

// Simple grid state interface without SortDescriptor
interface GridState {
  skip: number;
  pageSize: number;
}

const matches = (el: any, selector: string) =>
  (el.matches || el.msMatchesSelector).call(el, selector);

@Component({
  selector: 'app-accountuser',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GridModule,
    DropDownsModule,
    ButtonsModule,
    InputsModule,
    LabelModule,
    DateInputsModule,
    FormsModule
  ],
  templateUrl: './accountuser.html',
  styleUrl: './accountuser.css'
})
export class Accountuser implements OnInit, OnDestroy {
  @ViewChild(GridComponent)
  private grid!: GridComponent;

  public view: Account[] = [];
  public filteredView: Account[] = [];
  public formGroup!: FormGroup;
  private editedRowIndex!: number;
  private docClickSubscription: Subscription = new Subscription();
  public isNew: boolean = false;
  public isLoading: boolean = false;
  public isSaving: boolean = false;
  public selectedAccount: Account | null = null;
  public searchTerm: string = '';
  public totalAccounts: number = 0;
  public totalGetMoney: number = 0;
  public totalGiveMoney: number = 0;

  // Track editing permissions
  public canEditGetFields: boolean = false;
  public canEditGiveFields: boolean = false;

  // Grid state management
  public state: GridState = {
    skip: 0,
    pageSize: 10
  };

  constructor(
    private accountService: Authservice, 
    private renderer: Renderer2,
    private notificationService: NotificationService
  ) {}

  public ngOnInit(): void {
    this.loadAccounts();
    this.docClickSubscription.add(
      this.renderer.listen("document", "click", this.onDocumentClick.bind(this))
    );
  }

  public ngOnDestroy(): void {
    this.docClickSubscription.unsubscribe();
  }

  // Load all accounts with proper data extraction
  private loadAccounts(): void {
    this.isLoading = true;
    this.accountService.getAccounts().subscribe({
      next: (response: any) => {
        this.isLoading = false;
        console.log('API Response:', response);
        
        if (response.success && response.data && Array.isArray(response.data)) {
          this.view = response.data.map((account: any) => ({
            ...account,
            date: account.date ? new Date(account.date) : undefined,
            givedate: account.givedate ? new Date(account.givedate) : undefined,
            created_at: account.created_at ? new Date(account.created_at) : undefined,
            modified_at: account.modified_at ? new Date(account.modified_at) : undefined,
            start_date: account.start_date ? new Date(account.start_date) : undefined,
            end_date: account.end_date ? new Date(account.end_date) : undefined,
            status: account.givemoney > 0 ? 'Completed' : 'Pending',
            ismoney: account.ismoney // Include ismoney field
          }));
          this.applyFilter();
          this.calculateTotals();
          this.showNotification(`Successfully loaded ${this.view.length} accounts`, 'success');
        } else {
          this.view = [];
          this.filteredView = [];
          this.calculateTotals();
          this.showNotification('No accounts found or invalid response format', 'info');
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading accounts:', error);
        this.showNotification('Error loading accounts: ' + error.message, 'error');
      }
    });
  }

  // Calculate totals for display
  private calculateTotals(): void {
    this.totalAccounts = this.filteredView.length;
    this.totalGetMoney = this.filteredView.reduce((sum, account) => sum + (account.getmoney || 0), 0);
    this.totalGiveMoney = this.filteredView.reduce((sum, account) => sum + (account.givemoney || 0), 0);
  }

  // Apply search filter
  public applyFilter(): void {
    if (!this.searchTerm.trim()) {
      this.filteredView = [...this.view];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredView = this.view.filter(account =>
        account.name?.toLowerCase().includes(term) ||
        account.agent?.toLowerCase().includes(term) ||
        account.givename?.toLowerCase().includes(term) ||
        account.giveagent?.toLowerCase().includes(term) ||
        account.remark?.toLowerCase().includes(term) ||
        account.giveremark?.toLowerCase().includes(term) ||
        account.acid.toString().includes(term)
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

  // Calculate Give Money automatically
  private calculateGiveMoney(getMoney: number, interest: number): number {
    if (!getMoney || !interest) return 0;
    
    const interestAmount = (getMoney * interest) / 100;
    const giveMoney = getMoney - interestAmount;
    
    return Math.round(giveMoney * 100) / 100;
  }

  // Update Give Money calculation when Get Money or Interest changes
  private updateGiveMoneyCalculation(formGroup: FormGroup): void {
    // Only calculate if get fields are editable (ismoney = true)
    if (this.canEditGetFields) {
      const getMoney = formGroup.get('getmoney')?.value || 0;
      const interest = formGroup.get('intrest')?.value || 0;
      
      if (getMoney > 0 && interest > 0) {
        const giveMoney = this.calculateGiveMoney(getMoney, interest);
        formGroup.patchValue({ givemoney: giveMoney }, { emitEvent: false });
      }
    }
    // If ismoney = false, givemoney is manually entered and not calculated
  }

  // Determine editing permissions based on ismoney field
  private setEditingPermissions(dataItem: Account): void {
    if (this.isNew) {
      // New record - can edit everything
      this.canEditGetFields = true;
      this.canEditGiveFields = true;
    } else if (dataItem.ismoney === true) {
      // Get Money transaction - can only edit get fields
      this.canEditGetFields = true;
      this.canEditGiveFields = false;
    } else if (dataItem.ismoney === false) {
      // Give Money transaction - can only edit give fields
      this.canEditGetFields = false;
      this.canEditGiveFields = true;
    } else {
      // Fallback - can edit everything
      this.canEditGetFields = true;
      this.canEditGiveFields = true;
    }

    console.log('Editing permissions based on ismoney:', {
      acid: dataItem.acid,
      ismoney: dataItem.ismoney,
      canEditGetFields: this.canEditGetFields,
      canEditGiveFields: this.canEditGiveFields
    });
  }

  // Create form group with conditional validation
  private createFormGroup(dataItem: Account): FormGroup {
    this.setEditingPermissions(dataItem);

    const formGroup = new FormGroup({
      acid: new FormControl(dataItem.acid),
      
      // Get Money Fields - editable only when ismoney = true
      name: new FormControl(
        { value: dataItem.name || '', disabled: !this.canEditGetFields }, 
        this.canEditGetFields ? [Validators.required, Validators.minLength(2)] : []
      ),
      getmoney: new FormControl(
        { value: dataItem.getmoney || 0, disabled: !this.canEditGetFields }, 
        this.canEditGetFields ? [Validators.required, Validators.min(0.01)] : []
      ),
      intrest: new FormControl(
        { value: dataItem.intrest || 0, disabled: !this.canEditGetFields }, 
        this.canEditGetFields ? [Validators.required, Validators.min(0), Validators.max(100)] : []
      ),
      date: new FormControl(
        { value: dataItem.date || new Date(), disabled: !this.canEditGetFields }
      ),
      agent: new FormControl(
        { value: dataItem.agent || '', disabled: !this.canEditGetFields }
      ),
      remark: new FormControl(
        { value: dataItem.remark || '', disabled: !this.canEditGetFields }
      ),
      utino: new FormControl(
        { value: dataItem.utino || 0, disabled: !this.canEditGetFields }
      ),
      
      // Give Money Fields - editable only when ismoney = false
      givename: new FormControl(
        { value: dataItem.givename || '', disabled: !this.canEditGiveFields }
      ),
      giveremark: new FormControl(
        { value: dataItem.giveremark || '', disabled: !this.canEditGiveFields }
      ),
      giveutino: new FormControl(
        { value: dataItem.giveutino || 0, disabled: !this.canEditGiveFields }
      ),
      givedate: new FormControl(
        { value: dataItem.givedate || new Date(), disabled: !this.canEditGiveFields }
      ),
      giveagent: new FormControl(
        { value: dataItem.giveagent || '', disabled: !this.canEditGiveFields }
      ),
      
      // GIVEMONEY FIELD - Make it conditionally editable
      givemoney: new FormControl(
        { value: dataItem.givemoney || 0, disabled: !this.canEditGiveFields }
      ),
    });

    // Add value changes listeners only if get fields are editable
    if (this.canEditGetFields) {
      formGroup.get('getmoney')?.valueChanges.subscribe(() => {
        this.updateGiveMoneyCalculation(formGroup);
      });

      formGroup.get('intrest')?.valueChanges.subscribe(() => {
        this.updateGiveMoneyCalculation(formGroup);
      });

      // Initial calculation
      this.updateGiveMoneyCalculation(formGroup);
    }

    return formGroup;
  }

  // Add new account handler
  public addHandler(): void {
    this.closeEditor();

    this.formGroup = this.createFormGroup({
      acid: 0,
      name: '',
      getmoney: 0,
      intrest: 0,
      givemoney: 0,
      date: new Date(),
      agent: '',
      remark: '',
      utino: 0,
      givename: '',
      giveremark: '',
      giveutino: 0,
      givedate: new Date(),
      giveagent: '',
      ismoney: true // Default to Get Money for new records
    });
    this.isNew = true;

    this.grid.addRow(this.formGroup);
    this.showNotification('Creating new account...', 'info');
  }

  // Edit specific account
  public editAccount(dataItem: Account): void {
    this.closeEditor();
    this.selectedAccount = dataItem;
    
    const rowIndex = this.filteredView.findIndex(account => account.acid === dataItem.acid);
    
    if (rowIndex !== -1) {
      this.formGroup = this.createFormGroup(dataItem);
      this.editedRowIndex = rowIndex;
      this.isNew = false;
      
      // DEBUG: Check the actual disabled state
      console.log('🔍 DEBUG - Field States:', {
        acid: dataItem.acid,
        ismoney: dataItem.ismoney,
        canEditGetFields: this.canEditGetFields,
        canEditGiveFields: this.canEditGiveFields,
        givemoneyDisabled: this.formGroup.get('givemoney')?.disabled,
        getmoneyDisabled: this.formGroup.get('getmoney')?.disabled,
        givenameDisabled: this.formGroup.get('givename')?.disabled
      });
      
      this.grid.editRow(rowIndex, this.formGroup);
      
      // Show appropriate message based on permissions
      if (this.canEditGetFields && !this.canEditGiveFields) {
        this.showNotification(`Editing Get Money details for: ${dataItem.name}`, 'info');
      } else if (!this.canEditGetFields && this.canEditGiveFields) {
        this.showNotification(`Editing Give Money details for: ${dataItem.givename}`, 'info');
      } else {
        this.showNotification(`Editing account: ${dataItem.name || dataItem.givename}`, 'info');
      }
    }
  }

  public saveRow(): void {
    if (this.formGroup && this.formGroup.valid) {
      this.saveCurrent();
    } else {
      this.showNotification('Please fill all required fields correctly', 'warning');
      // Mark all fields as touched to show validation errors
      Object.keys(this.formGroup.controls).forEach(key => {
        this.formGroup.get(key)?.markAsTouched();
      });
    }
  }

  public cellClickHandler({ isEdited, dataItem, rowIndex }: CellClickEvent): void {
    if (isEdited || (this.formGroup && !this.formGroup.valid)) {
      return;
    }

    this.saveCurrent();

    this.formGroup = this.createFormGroup(dataItem);
    this.editedRowIndex = rowIndex;
    this.isNew = false;

    this.grid.editRow(rowIndex, this.formGroup);
  }

  // Cancel editing
  public cancelHandler(): void {
    this.closeEditor();
    this.showNotification('Edit cancelled', 'info');
  }

  // Close editor and reset states
  private closeEditor(): void {
    this.grid.closeRow(this.editedRowIndex);
    this.isNew = false;
    this.editedRowIndex = undefined!;
    this.formGroup = undefined!;
    this.selectedAccount = null;
    this.isSaving = false;
    this.canEditGetFields = false;
    this.canEditGiveFields = false;
  }

  // Document click handler
  private onDocumentClick(e: Event): void {
    if (
      this.formGroup &&
      this.formGroup.valid &&
      !matches(
        e.target,
        "#accountsGrid tbody *, #accountsGrid .k-grid-toolbar .k-button"
      )
    ) {
      this.saveCurrent();
    }
  }

  // Save current form data
  private saveCurrent(): void {
    if (this.formGroup && this.formGroup.valid && !this.isSaving) {
      const formData = this.formGroup.getRawValue(); // Get all values including disabled fields
      
      const accountData: Account = {
        ...formData,
        // Only calculate givemoney automatically if get fields are editable
        // Otherwise, use the manually entered givemoney value
        givemoney: this.canEditGetFields ? 
          this.calculateGiveMoney(formData.getmoney || 0, formData.intrest || 0) : 
          formData.givemoney
      };

      console.log('Saving account data:', accountData);
      console.log('Editing permissions:', {
        canEditGetFields: this.canEditGetFields,
        canEditGiveFields: this.canEditGiveFields,
        calculatedGiveMoney: this.canEditGetFields ? this.calculateGiveMoney(formData.getmoney || 0, formData.intrest || 0) : 'manual'
      });

      if (this.isNew) {
        this.createAccount(accountData);
      } else {
        this.updateAccount(accountData);
      }
    } else if (this.formGroup && this.formGroup.invalid) {
      this.showNotification('Please fix validation errors before saving', 'warning');
    }
  }

  // Create new account
  private createAccount(accountData: Account): void {
    this.isSaving = true;
    this.accountService.createAccount(accountData).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        console.log('Create response:', response);
        
        if (response.success) {
          this.showNotification('Account created successfully!', 'success');
          this.loadAccounts(); // Reload all data
        } else {
          this.showNotification(response.message || 'Error creating account', 'error');
        }
        this.closeEditor();
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error creating account:', error);
        this.showNotification('Error creating account: ' + error.message, 'error');
        this.closeEditor();
      }
    });
  }

  // Update specific account
  private updateAccount(accountData: Account): void {
    this.isSaving = true;
    this.accountService.updateAccount(accountData.acid, accountData).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        console.log('Update response:', response);
        
        if (response.success) {
          this.showNotification('Account updated successfully!', 'success');
          this.loadAccounts(); // Reload all data to reflect changes
        } else {
          this.showNotification(response.message || 'Error updating account', 'error');
        }
        this.closeEditor();
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error updating account:', error);
        this.showNotification('Error updating account: ' + error.message, 'error');
        this.closeEditor();
      }
    });
  }

  // Refresh entire table
  public refreshTable(): void {
    this.loadAccounts();
    this.showNotification('Data refreshed successfully', 'info');
  }

  // Delete account with confirmation
  public deleteAccount(account: Account): void {
    if (confirm(`Are you sure you want to delete account: ${account.name || account.givename} (ID: ${account.acid})? This action cannot be undone.`)) {
      this.isLoading = true;
      this.accountService.deleteAccount(account.acid).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.success) {
            this.showNotification('Account deleted successfully!', 'success');
            this.loadAccounts(); // Reload all data
          } else {
            this.showNotification(response.message || 'Error deleting account', 'error');
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error deleting account:', error);
          this.showNotification('Error deleting account: ' + error.message, 'error');
        }
      });
    }
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
  public rowCallback(context: RowClassArgs): any {
    return {
      'edited-row': context.dataItem === this.selectedAccount,
      'new-row': this.isNew && context.index === this.editedRowIndex,
      'completed-row': context.dataItem.givemoney > 0,
      'get-money-row': context.dataItem.ismoney === true,
      'give-money-row': context.dataItem.ismoney === false
    };
  }
}