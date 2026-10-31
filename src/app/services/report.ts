import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import type { SupabaseClient } from '@supabase/supabase-js';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth';
import { DataService } from './data';
import { SupabaseService } from './supabase';

export interface BusinessMetric {
  label: string;
  value: number;
}

export interface Profile {
  id: string;
  email: string;
  role?: string;
  full_name?: string;
  created_at?: string;
}

export type ReportValue = string | number | boolean | null | undefined;
export type ReportRow = Readonly<Record<string, ReportValue>>;

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private supabase: SupabaseClient;

  constructor(
    private toastController: ToastController,
    supabaseService: SupabaseService,
    private readonly authService: AuthService,
    private readonly dataService: DataService
  ) {
    this.supabase = supabaseService.client;
  }

  getMetrics(): Observable<BusinessMetric[]> {
    if (this.authService.isDemoMode()) {
      return this.dataService.getStatsMetrics().pipe(
        map((metrics) =>
          metrics.map((metric) => ({
            label: metric.label || metric.title || 'Métrica',
            value: metric.value,
          }))
        )
      );
    }

    return from(
      this.supabase
        .from('reports')
        .select('*')
        .then(({ data, error }) => {
          if (error) {
            throw error;
          }

          return ((data || []) as unknown[]).map((item) => this.toBusinessMetric(item));
        })
    );
  }

  getProfiles(): Observable<Profile[]> {
    if (this.authService.isDemoMode()) {
      return this.dataService.getProfiles();
    }

    return from(
      this.supabase
        .from('profiles')
        .select('*')
        .then(({ data, error }) => {
          if (error) {
            throw error;
          }

          return (data || []) as Profile[];
        })
    );
  }

  async exportToCSV(data: readonly ReportRow[], fileName = 'informe.csv'): Promise<void> {
    if (data.length === 0) {
      await this.showToast('No hay datos para exportar', 'warning');
      return;
    }

    await this.showToast('Generando informe...', 'medium', 1000);
    try {
      const headers = Object.keys(data[0]);
      if (headers.length === 0) {
        await this.showToast('Los datos no contienen columnas exportables', 'warning');
        return;
      }

      const rows = [
        headers.map((header) => this.escapeCsvValue(header)).join(','),
        ...data.map((row) =>
          headers.map((header) => this.escapeCsvValue(row[header])).join(',')
        ),
      ];
      const content = `\uFEFF${rows.join('\r\n')}`;
      this.downloadBlob(content, 'text/csv;charset=utf-8;', fileName);
      await this.showToast('Descargado con éxito', 'success');
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      await this.showToast('Error al exportar el informe CSV', 'danger');
    }
  }

  async exportToPDF(
    data: readonly ReportRow[],
    fileName = 'informe.pdf',
    title = 'Informe de actividad'
  ): Promise<void> {
    if (data.length === 0) {
      await this.showToast('No hay datos para exportar', 'warning');
      return;
    }

    await this.showToast('Generando informe...', 'medium', 1000);
    try {
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const tableWidth = pageWidth - margin * 2;
      const headers = Object.keys(data[0]);
      if (headers.length === 0) {
        await this.showToast('Los datos no contienen columnas exportables', 'warning');
        return;
      }

      const columnWidth = tableWidth / headers.length;
      const lineHeight = 4.5;
      let y = margin;

      const drawTitle = () => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.text(title, margin, y);
        y += 7;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(`Generado: ${new Date().toLocaleString('es-ES')}`, margin, y);
        y += 8;
      };

      const drawRow = (values: readonly string[], isHeader: boolean) => {
        const cells = values.map((value) =>
          pdf.splitTextToSize(value, columnWidth - 4)
        );
        const rowHeight = Math.max(...cells.map((cell) => cell.length)) * lineHeight + 4;

        if (y + rowHeight > pageHeight - margin) {
          pdf.addPage();
          y = margin;
          drawTitle();
          if (!isHeader) {
            drawRow(headers, true);
          }
        }

        cells.forEach((lines, index) => {
          const x = margin + index * columnWidth;
          if (isHeader) {
            pdf.setFillColor(37, 99, 235);
            pdf.setTextColor(255, 255, 255);
          } else {
            pdf.setFillColor(255, 255, 255);
            pdf.setTextColor(31, 41, 55);
          }
          pdf.rect(x, y, columnWidth, rowHeight, 'FD');
          pdf.setFont('helvetica', isHeader ? 'bold' : 'normal');
          pdf.setFontSize(8);
          pdf.text(lines, x + 2, y + 3.5);
        });

        y += rowHeight;
      };

      drawTitle();
      drawRow(headers, true);
      data.forEach((row) =>
        drawRow(headers.map((header) => this.formatReportValue(row[header])), false)
      );

      pdf.save(fileName);
      await this.showToast('Descargado con éxito', 'success');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      await this.showToast('Error al generar el informe PDF', 'danger');
    }
  }

  private toBusinessMetric(value: unknown): BusinessMetric {
    if (typeof value !== 'object' || value === null) {
      throw new Error('El informe contiene una métrica no válida');
    }

    const record = value as Record<string, unknown>;
    const label = record['title'] ?? record['label'] ?? record['name'];
    const rawValue = record['value'] ?? record['count'];
    const numericValue = Number(rawValue);

    if (typeof label !== 'string' || !Number.isFinite(numericValue)) {
      throw new Error('El informe contiene una métrica sin título o valor numérico');
    }

    return { label, value: numericValue };
  }

  private formatReportValue(value: ReportValue): string {
    return value === null || value === undefined ? '' : String(value);
  }

  private escapeCsvValue(value: ReportValue): string {
    let text = this.formatReportValue(value);
    if (typeof value === 'string' && /^[\t\r ]*[=+\-@]/.test(text)) {
      text = `'${text}`;
    }
    return `"${text.replace(/"/g, '""')}"`;
  }

  private downloadBlob(content: string, type: string, fileName: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    try {
      link.click();
    } finally {
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  private async showToast(
    message: string,
    color: 'success' | 'danger' | 'warning' | 'medium',
    duration = 2000
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
