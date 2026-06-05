import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nurse-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nurse-dashboard.component.html',
  styleUrls: ['./nurse-dashboard.component.css']
})
export class NurseDashboardComponent implements OnInit {
  bedsList: any[] = [];
  patientsList: any[] = [];
  
  newBed: any = {
    ward: '',
    roomNumber: '',
    bedNumber: ''
  };
  showAddBedForm = false;

  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadBeds();
    this.loadPatients();
  }

  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  loadBeds() {
    this.http.get<any[]>(`${this.apiUrl}/beds`, this.getHeaders()).subscribe({
      next: (data) => this.bedsList = data,
      error: (err) => console.error('Failed to load beds', err)
    });
  }

  loadPatients() {
    this.http.get<any[]>(`${this.apiUrl}/patients`, this.getHeaders()).subscribe({
      next: (data) => this.patientsList = data,
      error: (err) => console.error('Failed to load patients', err)
    });
  }

  addBed() {
    this.http.post(`${this.apiUrl}/beds`, this.newBed, this.getHeaders()).subscribe({
      next: () => {
        this.loadBeds();
        this.showAddBedForm = false;
        this.newBed = { ward: '', roomNumber: '', bedNumber: '' };
      },
      error: (err) => console.error('Failed to add bed', err)
    });
  }

  assignBed(bedId: number, patientId: string) {
    if (!patientId) {
        alert("Please select a patient.");
        return;
    }
    this.http.post(`${this.apiUrl}/beds/${bedId}/assign/${patientId}`, {}, this.getHeaders()).subscribe({
      next: () => this.loadBeds(),
      error: (err) => {
        console.error('Failed to assign bed', err);
        alert('Failed to assign bed. Patient may already be assigned or not found.');
      }
    });
  }

  releaseBed(bedId: number) {
    if (confirm('Are you sure you want to release this bed?')) {
      this.http.post(`${this.apiUrl}/beds/${bedId}/release`, {}, this.getHeaders()).subscribe({
        next: () => this.loadBeds(),
        error: (err) => console.error('Failed to release bed', err)
      });
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    this.router.navigate(['/login']);
  }
}
