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
          accountNo: "168402000000007",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        },
        {
          bank: "UNITYBANK",
          accountNo: "051611991000029",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        }
      ]
    },
    {
      no: 2,
      partyName: "AMSHE ENTERPRISE",
      accounts: [
        {
          bank: "IDE: BANK SAVING",
          accountNo: "15024778942",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        },
        {
          bank: "UTRARSH BANK",
          accountNo: "18840200000000404",
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
          accountNo: "2502214679387617",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        },
        {
          bank: "UNITY BANK",
          accountNo: "051611991000169",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        },
        {
          bank: "UTRARSH BANK",
          accountNo: "16840200000000400",
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
          bank: "IDE: BANK SAVING",
          accountNo: "110244781699",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        },
        {
          bank: "UTRARSH BANK",
          accountNo: "16840200000000399",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        },
        {
          bank: "UNITY BANK",
          accountNo: "44535085992",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        }
      ]
    },
    {
      no: 5,
      partyName: "MENTA TRADEUME ANMEDABA",
      accounts: [
        {
          bank: "UNITY BANK",
          accountNo: "051611991000235",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        },
        {
          bank: "PNB BANK",
          accountNo: "4452002100009461",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        },
        {
          bank: "TEXTILE BANK",
          accountNo: "061110079000002",
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
          bank: "UTRARSH SAVING",
          accountNo: "1724013818882283",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        }
      ]
    },
    {
      no: 7,
      partyName: "MENTA TRADEUNK MUMSAI",
      accounts: [
        {
          bank: "IDE: SAVING",
          accountNo: "052110100051542",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        },
        {
          bank: "MFHSANA BANK",
          accountNo: "172402000000097",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        }
      ]
    },
    {
      no: 8,
      partyName: "DECENT MULTITRADE MUMSAI",
      accounts: [
        {
          bank: "UTRARSH BANK",
          accountNo: "172402000000098",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        }
      ]
    },
    {
      no: 9,
      partyName: "UTRARSH BANK",
      accounts: [
        {
          bank: "UTRARSH BANK",
          accountNo: "172402000000095",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        }
      ]
    },
    {
      no: 10,
      partyName: "MENTA COMPOSATION MUMSAI",
      accounts: [
        {
          bank: "UTRARSH BANK",
          accountNo: "172402000000096",
          balancePlus: "",
          balanceMinus: "",
          status: "ACTIVE"
        }
      ]
    }
  ];

  editingCell: { partyIndex: number, accountIndex: number, field: string } | null = null;
  editValue: string = '';

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
}