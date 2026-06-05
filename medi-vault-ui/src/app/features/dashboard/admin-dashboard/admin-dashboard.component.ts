import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  staffList: any[] = [];
  newStaff: any = {
    fullName: '',
    specialization: '',
    contactNumber: '',
    salary: 0,
    scheduleDetails: '',
    email: '',
    password: '',
    role: 'DOCTOR'
  };
  showAddStaffForm = false;
  bedReport: any = null;
  appointmentReport: any = null;

  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadStaff();
    this.loadReports();
  }

  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  loadStaff() {
    this.http.get<any[]>(`${this.apiUrl}/staff`, this.getHeaders()).subscribe({
      next: (data) => this.staffList = data,
      error: (err) => console.error('Failed to load staff', err)
    });
  }

  loadReports() {
    this.http.get<any>(`${this.apiUrl}/reports/beds/occupancy`, this.getHeaders()).subscribe({
      next: (data) => this.bedReport = data,
      error: (err) => console.error('Failed to load bed report', err)
    });

    const start = new Date(new Date().setHours(0,0,0,0)).toISOString();
    const end = new Date(new Date().setHours(23,59,59,999)).toISOString();
    this.http.get<any>(`${this.apiUrl}/reports/appointments?start=${start}&end=${end}`, this.getHeaders()).subscribe({
      next: (data) => this.appointmentReport = data,
      error: (err) => console.error('Failed to load appointment report', err)
    });
  }

  addStaff() {
    this.http.post(`${this.apiUrl}/staff`, this.newStaff, this.getHeaders()).subscribe({
      next: () => {
        this.loadStaff();
        this.showAddStaffForm = false;
        this.newStaff = { fullName: '', specialization: '', contactNumber: '', salary: 0, scheduleDetails: '', email: '', password: '', role: 'DOCTOR' };
      },
      error: (err) => console.error('Failed to add staff', err)
    });
  }

  deleteStaff(id: number) {
    if (confirm('Are you sure you want to delete this staff member?')) {
      this.http.delete(`${this.apiUrl}/staff/${id}`, this.getHeaders()).subscribe({
        next: () => this.loadStaff(),
        error: (err) => console.error('Failed to delete staff', err)
      });
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    this.router.navigate(['/login']);
  }
}
