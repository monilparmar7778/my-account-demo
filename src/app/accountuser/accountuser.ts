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
  GridComponent,
  GridModule,
  RowClassArgs,
  PageChangeEvent,
} from "@progress/kendo-angular-grid";
import { DialogModule } from "@progress/kendo-angular-dialog";
import { Subscription } from "rxjs";
import { Authservice } from '../authservice';
import { CommonModule } from "@angular/common";
import { InputsModule } from "@progress/kendo-angular-inputs";
import { LabelModule } from "@progress/kendo-angular-label";
import { DateInputsModule } from "@progress/kendo-angular-dateinputs";
import { NotificationService } from "@progress/kendo-angular-notification";
import { FormsModule } from "@angular/forms";

interface User {
  user_id: number;
  username: string;
}

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
  ismoney?: boolean;
  charterDescription?: string;
  giveCharterDescription?: string;
}

interface GridState {
  skip: number;
  pageSize: number;
}

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
    FormsModule,
    DialogModule
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
  public isNew: boolean = false;
  public isLoading: boolean = false;
  public isSaving: boolean = false;
  public selectedAccount: Account | null = null;
  public searchTerm: string = '';
  public totalAccounts: number = 0;
  public totalGetMoney: number = 0;
  public totalGiveMoney: number = 0;
  public showModal: boolean = false;

  public usersList: User[] = [];
  public isUsersLoading: boolean = false;

  public canEditGetFields: boolean = false;
  public canEditGiveFields: boolean = false;

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
    this.loadUsers();
    this.loadAccounts();
  }

  public ngOnDestroy(): void {}

  private loadUsers(): void {
    this.isUsersLoading = true;
    this.accountService.getUsersBasicInfo().subscribe({
      next: (response: any) => {
        this.isUsersLoading = false;
        if (response.success && response.data) {
          this.usersList = response.data;
          console.log('Users loaded:', this.usersList);
        } else {
          console.error('Failed to load users:', response.message);
          this.showNotification('Failed to load customer list', 'error');
        }
      },
      error: (error) => {
        this.isUsersLoading = false;
        console.error('Error loading users:', error);
        this.showNotification('Error loading customer list', 'error');
      }
    });
  }

  public getCustomerName(userId: string): string {
    if (!userId || userId === '') return 'N/A';
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
    const user = this.usersList.find(u => u.user_id === userIdNum);
    return user ? user.username : `User ${userId}`;
  }

  private loadAccounts(): void {
    this.isLoading = true;
    this.accountService.getAccounts().subscribe({
      next: (response: any) => {
        this.isLoading = false;
        console.log('API Response:', response);
        
        if (response.success && response.data && Array.isArray(response.data)) {
          this.view = response.data.map((account: any) => {
            const getDate = account.date ? this.parseDateWithoutTimezone(account.date) : new Date();
            const giveDate = account.givedate ? this.parseDateWithoutTimezone(account.givedate) : new Date();
            
            return {
              ...account,
              date: getDate,
              givedate: giveDate,
              created_at: account.created_at ? new Date(account.created_at) : undefined,
              modified_at: account.modified_at ? new Date(account.modified_at) : undefined,
              start_date: account.start_date ? new Date(account.start_date) : undefined,
              end_date: account.end_date ? new Date(account.end_date) : undefined,
              status: account.givemoney > 0 ? 'Completed' : 'Pending',
              ismoney: account.ismoney
            };
          });
          this.applyFilter();
          this.calculateTotals();
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

  private parseDateWithoutTimezone(dateString: any): Date {
    if (!dateString) return new Date();
    
    try {
      if (typeof dateString === 'string') {
        const date = new Date(dateString);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      } else if (dateString instanceof Date) {
        return new Date(dateString.getFullYear(), dateString.getMonth(), dateString.getDate());
      }
      return new Date();
    } catch (e) {
      console.error('Error parsing date:', e);
      return new Date();
    }
  }

  private formatDateForDisplay(date: Date): Date {
    if (!date) return new Date();
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private formatDateForAPI(date: Date): string {
    if (!date) return new Date().toISOString().split('T')[0];
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private calculateTotals(): void {
    this.totalAccounts = this.filteredView.length;
    this.totalGetMoney = this.filteredView.reduce((sum, account) => sum + (account.getmoney || 0), 0);
    this.totalGiveMoney = this.filteredView.reduce((sum, account) => sum + (account.givemoney || 0), 0);
  }

  public applyFilter(): void {
    if (!this.searchTerm.trim()) {
      this.filteredView = [...this.view];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredView = this.view.filter(account =>
        this.getCustomerName(account.name).toLowerCase().includes(term) ||
        this.getCustomerName(account.givename || '').toLowerCase().includes(term) ||
        account.agent?.toLowerCase().includes(term) ||
        account.giveagent?.toLowerCase().includes(term) ||
        account.remark?.toLowerCase().includes(term) ||
        account.giveremark?.toLowerCase().includes(term) ||
        account.acid.toString().includes(term)
      );
    }
    this.calculateTotals();
    this.state.skip = 0;
  }

  public clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  public onSearchInput(event: any): void {
    this.searchTerm = event.target.value;
    this.applyFilter();
  }

  public pageChange(event: PageChangeEvent): void {
    this.state.skip = event.skip;
  }

  // REMOVED: No auto-calculation of give money

  // SIMPLIFIED: Editing permissions logic
  private setEditingPermissions(dataItem: Account): void {
    console.log('Setting permissions for:', {
      acid: dataItem.acid,
      ismoney: dataItem.ismoney,
      isNew: this.isNew
    });

    if (this.isNew) {
      // New record - can edit everything
      this.canEditGetFields = true;
      this.canEditGiveFields = true;
    } else {
      // Existing record - strict permissions based on ismoney
      if (dataItem.ismoney === true) {
        // Get Money transaction - ONLY edit get fields
        this.canEditGetFields = true;
        this.canEditGiveFields = false;
      } else if (dataItem.ismoney === false) {
        // Give Money transaction - ONLY edit give fields
        this.canEditGetFields = false;
        this.canEditGiveFields = true;
      } else {
        // Fallback - allow editing both
        this.canEditGetFields = true;
        this.canEditGiveFields = true;
        console.warn('No ismoney flag found, allowing full edit');
      }
    }

    console.log('Final permissions:', {
      canEditGetFields: this.canEditGetFields,
      canEditGiveFields: this.canEditGiveFields
    });
  }

  private createFormGroup(dataItem: Account): FormGroup {
    this.setEditingPermissions(dataItem);

    // Convert string IDs to numbers for dropdowns
    const nameValue = dataItem.name ? (typeof dataItem.name === 'string' ? parseInt(dataItem.name) : dataItem.name) : null;
    const givenameValue = dataItem.givename ? (typeof dataItem.givename === 'string' ? parseInt(dataItem.givename) : dataItem.givename) : null;

    // Use formatted dates for display
    const displayDate = dataItem.date ? this.formatDateForDisplay(dataItem.date) : new Date();
    const displayGiveDate = dataItem.givedate ? this.formatDateForDisplay(dataItem.givedate) : new Date();

    const formGroup = new FormGroup({
      acid: new FormControl(dataItem.acid),
      
      // Get Money Fields
      name: new FormControl(
        { value: nameValue, disabled: !this.canEditGetFields }, 
        this.canEditGetFields ? [Validators.required] : []
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
        { value: displayDate, disabled: !this.canEditGetFields }
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
      charterDescription: new FormControl(
        { value: dataItem.charterDescription || '', disabled: !this.canEditGetFields }
      ),
      
      // Give Money Fields
      givename: new FormControl(
        { value: givenameValue, disabled: !this.canEditGiveFields },
        this.canEditGiveFields ? [Validators.required] : []
      ),
      giveremark: new FormControl(
        { value: dataItem.giveremark || '', disabled: !this.canEditGiveFields }
      ),
      giveutino: new FormControl(
        { value: dataItem.giveutino || 0, disabled: !this.canEditGiveFields }
      ),
      givedate: new FormControl(
        { value: displayGiveDate, disabled: !this.canEditGiveFields }
      ),
      giveagent: new FormControl(
        { value: dataItem.giveagent || '', disabled: !this.canEditGiveFields }
      ),
      giveCharterDescription: new FormControl(
        { value: dataItem.giveCharterDescription || '', disabled: !this.canEditGiveFields }
      ),
      
      // Give Money is always manually entered - NO AUTO-CALCULATION
      givemoney: new FormControl(
        { value: dataItem.givemoney || 0, disabled: !this.canEditGiveFields }
      ),

      // Include ismoney in form data
      ismoney: new FormControl(dataItem.ismoney !== undefined ? dataItem.ismoney : true)
    });

    // REMOVED: No value change listeners for auto-calculation

    console.log('Form group created with permissions:', {
      canEditGetFields: this.canEditGetFields,
      canEditGiveFields: this.canEditGiveFields,
      ismoney: formGroup.get('ismoney')?.value
    });

    return formGroup;
  }

  public openAddModal(): void {
    this.isNew = true;
    this.selectedAccount = null;
    
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
      charterDescription: '',
      giveCharterDescription: '',
      ismoney: true
    });
    
    this.showModal = true;
  }

  public openEditModal(dataItem: Account): void {
    this.isNew = false;
    this.selectedAccount = dataItem;
    
    console.log('Editing account:', {
      acid: dataItem.acid,
      ismoney: dataItem.ismoney,
      originalDate: dataItem.date,
      originalGiveDate: dataItem.givedate,
      getmoney: dataItem.getmoney,
      givemoney: dataItem.givemoney
    });
    
    this.formGroup = this.createFormGroup(dataItem);
    this.showModal = true;
  }

  public closeModal(): void {
    this.showModal = false;
    this.formGroup = undefined!;
    this.selectedAccount = null;
    this.isNew = false;
    this.canEditGetFields = false;
    this.canEditGiveFields = false;
  }

  // SIMPLIFIED: No calculation logic in save
  public saveAccount(): void {
    if (this.formGroup && this.formGroup.valid && !this.isSaving) {
      const formData = this.formGroup.getRawValue();
      
      // Prepare data for API - NO CALCULATION, use entered values directly
      const accountData: any = {
        ...formData,
        // Ensure string values for name fields
        name: formData.name ? formData.name.toString() : '',
        givename: formData.givename ? formData.givename.toString() : '',
        // Use proper date formatting for API
        date: this.formatDateForAPI(formData.date),
        givedate: this.formatDateForAPI(formData.givedate),
        charterDescription: formData.charterDescription || '',
        giveCharterDescription: formData.giveCharterDescription || '',
        // Use the manually entered give money value - NO CALCULATION
        givemoney: formData.givemoney || 0,
        // Always include ismoney field
        ismoney: formData.ismoney !== undefined ? formData.ismoney : true
      };

      console.log('Saving account data:', accountData);
      console.log('Using manually entered give money:', accountData.givemoney);

      if (this.isNew) {
        this.createAccount(accountData);
      } else {
        this.updateAccount(accountData);
      }
    } else if (this.formGroup && this.formGroup.invalid) {
      this.showNotification('Please fix validation errors before saving', 'warning');
      Object.keys(this.formGroup.controls).forEach(key => {
        this.formGroup.get(key)?.markAsTouched();
      });
    }
  }

  private createAccount(accountData: any): void {
    this.isSaving = true;
    this.accountService.createAccount(accountData).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        if (response.success) {
          this.showNotification('Account created successfully!', 'success');
          this.closeModal();
          this.loadAccounts();
        } else {
          this.showNotification(response.message || 'Error creating account', 'error');
        }
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error creating account:', error);
        this.showNotification('Error creating account: ' + error.message, 'error');
      }
    });
  }

  private updateAccount(accountData: any): void {
    this.isSaving = true;
    this.accountService.updateAccount(accountData.acid, accountData).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        if (response.success) {
          this.showNotification('Account updated successfully!', 'success');
          this.closeModal();
          this.loadAccounts();
        } else {
          this.showNotification(response.message || 'Error updating account', 'error');
        }
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error updating account:', error);
        this.showNotification('Error updating account: ' + error.message, 'error');
      }
    });
  }

  public refreshTable(): void {
    this.loadAccounts();
    this.showNotification('Data refreshed successfully', 'info');
  }

  public deleteAccount(account: Account): void {
    const accountName = this.getCustomerName(account.name) || this.getCustomerName(account.givename || '');
    if (confirm(`Are you sure you want to delete account: ${accountName} (ID: ${account.acid})? This action cannot be undone.`)) {
      this.isLoading = true;
      this.accountService.deleteAccount(account.acid).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.success) {
            this.showNotification('Account deleted successfully!', 'success');
            this.loadAccounts();
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

  public rowCallback(context: RowClassArgs): any {
    return {
      'edited-row': context.dataItem === this.selectedAccount,
      'completed-row': context.dataItem.givemoney > 0,
      'get-money-row': context.dataItem.ismoney === true,
      'give-money-row': context.dataItem.ismoney === false
    };
  }
}