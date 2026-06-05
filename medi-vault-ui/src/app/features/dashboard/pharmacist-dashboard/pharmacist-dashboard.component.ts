import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pharmacist-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pharmacist-dashboard.component.html',
  styleUrls: ['./pharmacist-dashboard.component.css']
})
export class PharmacistDashboardComponent implements OnInit {
  inventoryList: any[] = [];
  alertsList: any[] = [];
  newItem: any = {
    itemName: '',
    itemType: 'Medicine',
    quantityInStock: 0,
    unitPrice: 0.0,
    reorderLevel: 10
  };
  showAddItemForm = false;

  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadInventory();
    this.loadAlerts();
  }

  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  loadInventory() {
    this.http.get<any[]>(`${this.apiUrl}/inventory`, this.getHeaders()).subscribe({
      next: (data) => this.inventoryList = data,
      error: (err) => console.error('Failed to load inventory', err)
    });
  }

  loadAlerts() {
    this.http.get<any[]>(`${this.apiUrl}/inventory/alerts`, this.getHeaders()).subscribe({
      next: (data) => this.alertsList = data,
      error: (err) => console.error('Failed to load alerts', err)
    });
  }

  addItem() {
    this.http.post(`${this.apiUrl}/inventory`, this.newItem, this.getHeaders()).subscribe({
      next: () => {
        this.loadInventory();
        this.loadAlerts();
        this.showAddItemForm = false;
        this.newItem = { itemName: '', itemType: 'Medicine', quantityInStock: 0, unitPrice: 0.0, reorderLevel: 10 };
      },
      error: (err) => console.error('Failed to add item', err)
    });
  }

  reduceStock(id: number) {
    const qty = prompt("Enter quantity to reduce:");
    if (qty && !isNaN(Number(qty))) {
      this.http.put(`${this.apiUrl}/inventory/${id}/reduce`, { quantityUsed: Number(qty) }, this.getHeaders()).subscribe({
        next: () => {
          this.loadInventory();
          this.loadAlerts();
        },
        error: (err) => alert('Failed to reduce stock, make sure you have enough quantity in stock.')
      });
    }
  }

  deleteItem(id: number) {
    if (confirm('Are you sure you want to delete this item?')) {
      this.http.delete(`${this.apiUrl}/inventory/${id}`, this.getHeaders()).subscribe({
        next: () => {
          this.loadInventory();
          this.loadAlerts();
        },
        error: (err) => console.error('Failed to delete item', err)
      });
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    this.router.navigate(['/login']);
  }
}
