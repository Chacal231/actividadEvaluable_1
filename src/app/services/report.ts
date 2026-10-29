import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ToastController } from '@ionic/angular';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface BusinessMetric {
  label: string;
  value: number;
}

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private supabase: SupabaseClient;

  // eslint-disable-next-line @angular-eslint/prefer-inject
  constructor(private toastController: ToastController) {
    // Inicializamos el cliente de Supabase con tus credenciales
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // MÉTODO CONECTADO A SUPABASE: Obtiene los datos reales de la tabla 'reports'
  getMetrics(): Observable<BusinessMetric[]> {
    const promise = this.supabase
      .from('reports')
      .select('*')
      .then(({ data, error }) => {
        if (error) {
          console.error('Error al cargar métricas desde Supabase:', error);
          return [];
        }
        // Mapeamos los campos de la BD (title y value) a la interfaz BusinessMetric (label y value)
        return (data || []).map((item: any) => ({
          label: item.title,
          value: Number(item.value)
        })) as BusinessMetric[];
      });

    // Convertimos la promesa de Supabase a un Observable de RxJS
    return from(promise);
  }

  async exportToCSV(data: any[], fileName: string = 'informe.csv'): Promise<void> {
    if (!data || data.length === 0) {
      const toast = await this.toastController.create({
        message: 'No hay datos para exportar',
        duration: 2000,
        color: 'warning',
        position: 'bottom',
      });
      await toast.present();
      return;
    }

    const loadingToast = await this.toastController.create({
      message: 'Generando informe...',
      duration: 1000,
      position: 'bottom',
    });
    await loadingToast.present();

    setTimeout(() => {
      const headers = Object.keys(data[0]);
      let csvContent = headers.join(',') + '\n';

      data.forEach((row) => {
        const values = headers.map((header) => {
          const value = row[header];
          if (value === null || value === undefined) {
            return '';
          }
          const stringValue = value.toString().replace(/"/g, '""');
          return `"${stringValue}"`;
        });
        csvContent += values.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 500);

    setTimeout(async () => {
      const successToast = await this.toastController.create({
        message: 'Descargado con éxito',
        duration: 2000,
        color: 'success',
        position: 'bottom',
      });
      await successToast.present();
    }, 1500);
  }

  async exportToPDF(elementId: string, fileName: string = 'informe.pdf'): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      const toast = await this.toastController.create({
        message: 'No se pudo generar el informe',
        duration: 2000,
        color: 'danger',
        position: 'bottom',
      });
      await toast.present();
      return;
    }

    const loadingToast = await this.toastController.create({
      message: 'Generando informe...',
      duration: 1000,
      position: 'bottom',
    });
    await loadingToast.present();

    try {
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(fileName);

      const successToast = await this.toastController.create({
        message: 'Descargado con éxito',
        duration: 2000,
        color: 'success',
        position: 'bottom',
      });
      await successToast.present();
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'Error al generar el informe',
        duration: 2000,
        color: 'danger',
        position: 'bottom',
      });
      await toast.present();
    }
  }
}