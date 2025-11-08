import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from '@progress/kendo-angular-dateinputs';

interface BankAccount {
  bank: string;
  accountNo: string;
  balancePlus: string;
  balanceMinus: string;
  status: string;
}

interface BankDetail {
  no: number;
  partyName: string;
  accounts: BankAccount[];
}

@Component({
  selector: 'app-bankdetailspage',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerModule],
  templateUrl: './bankdetailspage.html',
  styleUrls: ['./bankdetailspage.css']
})
export class Bankdetailspage {
  selectedDate: Date = new Date('2023-10-31');
  
  bankData: BankDetail[] = [
    {
      no: 1,
      partyName: "PRINCE ENTERPRISE",
      accounts: [
        {
          bank: "INDUSTRIE BANK SAVING",
          accountNo: "100276251189",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        },
        {
          bank: "UTRARSH BANK",
          accountNo: "*168402000000007",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        },
        {
          bank: "UNITYBANK",
          accountNo: "*051611991000029",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        }
      ]
    },
    {
      no: 2,
      partyName: "MAYA ENTERPRISE",
      accounts: [
        {
          bank: "IDFC BANK SAVING",
          accountNo: "*10246789942",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        },
        {
          bank: "UTRARSH BANK",
          accountNo: "*16840200000000404",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        },
        {
          bank: "UNITYBANK",
          accountNo: "051611991000084",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        }
      ]
    },
    {
      no: 3,
      partyName: "ANSH ENTERPRISE",
      accounts: [
        {
          bank: "A-U SMALL BANK",
          accountNo: "*2502214679387617",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        },
        {
          bank: "UNITY BANK",
          accountNo: "*051611991000169",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        },
        {
          bank: "UTRARSH BANK",
          accountNo: "*1684020000000400",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        }
      ]
    },
    {
      no: 4,
      partyName: "BHAVANI TRADERS",
      accounts: [
        {
          bank: "IDFC BANK SAVING",
          accountNo: "*10246783699",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        },
        {
          bank: "UTRARSH BANK",
          accountNo: "*16840200000000399",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        },
        {
          bank: "SBI BANK",
          accountNo: "44533085992",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        }
      ]
    },
    {
      no: 5,
      partyName: "MEHTA TRADELINK AHMEDABAD",
      accounts: [
        {
          bank: "UNITY BANK",
          accountNo: "*051611991000235",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        },
        {
          bank: "PNB BANK",
          accountNo: "*4452002100009461",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        },
        {
          bank: "TEXTILE BANK",
          accountNo: "*004110079000002",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        }
      ]
    },
    {
      no: 6,
      partyName: "SHUBH ENTERPRISE",
      accounts: [
        {
          bank: "UTKARSH SAVING",
          accountNo: "*1724019619682285",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        }
      ]
    },
    {
      no: 7,
      partyName: "MEHTA TRADELINK MUMBAI",
      accounts: [
        {
          bank: "IDFC SAVING",
          accountNo: "10218264952",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        },
        {
          bank: "MEHSANA BANK",
          accountNo: "*055110100051542",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        },
        {
          bank: "UTKARSH BANK",
          accountNo: "172402000000097",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        }
      ]
    },
    {
      no: 8,
      partyName: "DECENT MULTITRADE MUMBAI",
      accounts: [
        {
          bank: "UTKARSH BANK",
          accountNo: "172402000000098",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        }
      ]
    },
    {
      no: 9,
      partyName: "MEHTA CORPORATION MUMBAI",
      accounts: [
        {
          bank: "UTKARSH BANK",
          accountNo: "172402000000095",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        }
      ]
    }
  ];

  editingCell: { partyIndex: number, accountIndex: number, field: string } | null = null;
  editValue: string = '';

  // EXISTING METHODS
  getDayName(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  startEditing(partyIndex: number, accountIndex: number, field: string, value: string) {
    if (field === 'no') return;
    
    this.editingCell = { partyIndex, accountIndex, field };
    this.editValue = value;
  }

  saveEdit() {
    if (this.editingCell) {
      const { partyIndex, accountIndex, field } = this.editingCell;
      
      if (field === 'partyName') {
        this.bankData[partyIndex].partyName = this.editValue;
      } else {
        (this.bankData[partyIndex].accounts[accountIndex] as any)[field] = this.editValue;
      }
      
      this.cancelEdit();
      // Force change detection
      this.bankData = [...this.bankData];
    }
  }

  cancelEdit() {
    this.editingCell = null;
    this.editValue = '';
  }

  deleteParty(index: number) {
    if (confirm('Are you sure you want to delete this party and all its accounts?')) {
      this.bankData.splice(index, 1);
      this.updateNumbering();
    }
  }

  deleteAccount(partyIndex: number, accountIndex: number) {
    if (confirm('Are you sure you want to delete this account?')) {
      this.bankData[partyIndex].accounts.splice(accountIndex, 1);
      
      // If no accounts left, remove the party
      if (this.bankData[partyIndex].accounts.length === 0) {
        this.bankData.splice(partyIndex, 1);
        this.updateNumbering();
      }
    }
  }

  updateNumbering() {
    this.bankData.forEach((item, index) => {
      item.no = index + 1;
    });
  }

  addNewParty() {
    const newParty: BankDetail = {
      no: this.bankData.length + 1,
      partyName: "NEW ENTERPRISE",
      accounts: [
        {
          bank: "NEW BANK",
          accountNo: "NEW ACCOUNT NUMBER",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        }
      ]
    };
    
    this.bankData.push(newParty);
  }

  addNewAccount(partyIndex: number) {
    const newAccount: BankAccount = {
      bank: "NEW BANK",
      accountNo: "NEW ACCOUNT NUMBER",
      balancePlus: "",
      balanceMinus: "",
      status: "ACTIVE"
    };
    
    this.bankData[partyIndex].accounts.push(newAccount);
  }

  saveChanges() {
    alert('Changes saved successfully!');
    console.log('Updated data:', this.bankData);
  }

  printReport() {
    window.print();
  }

  isEditing(partyIndex: number, accountIndex: number, field: string): boolean {
    return this.editingCell?.partyIndex === partyIndex && 
           this.editingCell?.accountIndex === accountIndex && 
           this.editingCell?.field === field;
  }

  isPartyNameEditing(partyIndex: number): boolean {
    return this.editingCell?.partyIndex === partyIndex && 
           this.editingCell?.field === 'partyName';
  }

  getTotalPlus(): number {
    return this.bankData.reduce((partySum, party) => {
      return partySum + party.accounts.reduce((accountSum, account) => {
        const value = parseFloat(account.balancePlus) || 0;
        return accountSum + value;
      }, 0);
    }, 0);
  }

  getTotalMinus(): number {
    return this.bankData.reduce((partySum, party) => {
      return partySum + party.accounts.reduce((accountSum, account) => {
        const value = parseFloat(account.balanceMinus) || 0;
        return accountSum + value;
      }, 0);
    }, 0);
  }

  getFormattedDate(): string {
    const day = this.selectedDate.getDate().toString().padStart(2, '0');
    const month = (this.selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const year = this.selectedDate.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // NEW METHODS FOR BALANCE AND STATUS FUNCTIONALITY

  /**
   * Handle balance plus changes
   */
  onBalancePlusChange(partyIndex: number, accountIndex: number, value: string) {
    this.bankData[partyIndex].accounts[accountIndex].balancePlus = value;
    // Force change detection
    this.bankData = [...this.bankData];
  }

  /**
   * Handle balance minus changes
   */
  onBalanceMinusChange(partyIndex: number, accountIndex: number, value: string) {
    this.bankData[partyIndex].accounts[accountIndex].balanceMinus = value;
    // Force change detection
    this.bankData = [...this.bankData];
  }

  /**
   * Handle status changes
   */
  onStatusChange(partyIndex: number, accountIndex: number, value: string) {
    this.bankData[partyIndex].accounts[accountIndex].status = value;
    // Force change detection
    this.bankData = [...this.bankData];
  }

  /**
   * Formats balance values with proper number formatting
   */
  formatBalance(value: string): string {
    // Allow zero values
    if (value === '0' || value === '0.00') {
      return '0.00';
    }
    
    if (!value || value.trim() === '' || value === '-') {
      return '-';
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return '-';
    }
    
    return numValue.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Calculates total number of accounts across all parties
   */
  getTotalAccounts(): number {
    return this.bankData.reduce((total, party) => total + party.accounts.length, 0);
  }

  /**
   * Calculates net balance (Total Plus - Total Minus)
   */
  getNetBalance(): number {
    return this.getTotalPlus() - this.getTotalMinus();
  }

  /**
   * Returns current date and time in formatted string
   */
  getCurrentDateTime(): string {
    const now = new Date();
    return now.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Get formatted currency value for display
   */
  getFormattedCurrency(value: number): string {
    return value.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Get status class for styling
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'status-active';
      case 'INACTIVE': return 'status-inactive';
      case 'DEBIT FREEZE': return 'status-freeze';
      default: return 'status-active';
    }
  }
}