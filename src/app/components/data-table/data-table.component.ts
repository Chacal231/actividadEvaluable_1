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
  IonSpinner,
  IonBadge,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  pauseCircleOutline,
  playCircle,
  shieldOutline,
  trashOutline,
} from 'ionicons/icons';

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
    IonSpinner,
    IonBadge,
  ],
})
export class DataTableComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() columns: string[] = [];
  @Input() filterableFields: { key: string; label: string; options: string[] }[] = [];
  @Input() rowActions: { key: string; label: string; icon: string; color: string }[] = [];
  @Input() actionLoadingKey: string | null = null;
  @Output() rowSelected = new EventEmitter<any>();
  @Output() actionSelected = new EventEmitter<{ action: string; row: any }>();

  searchTerm: string = '';
  filteredData: any[] = [];
  filters: { [key: string]: string } = {};
  currentPage: number = 1;
  pageSize: number = 5;

  constructor() {
    addIcons({
      'shield-outline': shieldOutline,
      'pause-circle-outline': pauseCircleOutline,
      'play-circle': playCircle,
      'trash-outline': trashOutline,
    });
  }

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

  onActionClick(event: Event, action: string, item: any): void {
    event.stopPropagation();
    if (this.actionLoadingKey) {
      return;
    }
    this.actionSelected.emit({ action, row: item });
  }

  isActionLoading(action: string, item: any): boolean {
    return this.actionLoadingKey === `${item.id}:${action}`;
  }

  getActionIcon(action: string, item: any): string {
    if (action === 'status') {
      return item.estado === 'Activo' ? 'pause-circle-outline' : 'play-circle';
    }

    return action === 'role' ? 'shield-outline' : 'trash-outline';
  }

  getActionColor(action: string, item: any, defaultColor: string): string {
    if (action === 'status') {
      return item.estado === 'Activo' ? 'warning' : 'success';
    }

    return defaultColor;
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
