import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
} from '@ionic/angular';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonGrid,
    IonRow,
    IonCol,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
  ],
})
export class DataTableComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() columns: string[] = [];
  @Input() filterableFields: { key: string; label: string; options: string[] }[] = [];
  @Output() rowSelected = new EventEmitter<any>();

  searchTerm: string = '';
  filteredData: any[] = [];
  filters: { [key: string]: string } = {};
  currentPage: number = 1;
  pageSize: number = 5;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.applyFilters();
    }
  }

  applyFilters(): void {
    let result = [...this.data];

    if (this.searchTerm) {
      result = result.filter((item) => {
        return this.columns.some((column) => {
          const value = item[column];
          if (value === null || value === undefined) {
            return false;
          }
          return value.toString().toLowerCase().includes(this.searchTerm.toLowerCase());
        });
      });
    }

    Object.keys(this.filters).forEach((key) => {
      if (this.filters[key] && this.filters[key] !== 'all') {
        result = result.filter((item) => item[key] === this.filters[key]);
      }
    });

    this.filteredData = result;
    this.currentPage = 1;
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.detail.value || '';
    this.applyFilters();
  }

  onFilterChange(field: string, value: string): void {
    this.filters[field] = value;
    this.applyFilters();
  }

  onRowClick(item: any): void {
    this.rowSelected.emit(item);
  }

  getColumnValue(item: any, column: string): any {
    return item[column];
  }

  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredData.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
}


