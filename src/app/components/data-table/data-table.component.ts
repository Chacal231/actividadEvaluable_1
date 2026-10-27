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
  ],
})
export class DataTableComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() columns: string[] = [];
  @Output() rowSelected = new EventEmitter<any>();

  searchTerm: string = '';
  filteredData: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.filteredData = [...this.data];
    }
  }

  onSearchChange(event: any): void {
    const term = event.detail.value?.toLowerCase() || '';
    this.searchTerm = term;
    if (!term) {
      this.filteredData = [...this.data];
      return;
    }
    this.filteredData = this.data.filter((item) => {
      return this.columns.some((column) => {
        const value = item[column];
        if (value === null || value === undefined) {
          return false;
        }
        return value.toString().toLowerCase().includes(term);
      });
    });
  }

  onRowClick(item: any): void {
    this.rowSelected.emit(item);
  }

  getColumnValue(item: any, column: string): any {
    return item[column];
  }
}

