import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular';
import { firstValueFrom, of } from 'rxjs';
import { AuthService } from './auth';
import { DataService } from './data';
import { ReportService } from './report';
import { SupabaseService } from './supabase';

const pdfMock = vi.hoisted(() => ({
  texts: [] as string[],
  save: vi.fn(),
}));

vi.mock('jspdf', () => ({
  default: class {
    internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };

    setFont() {}
    setFontSize() {}
    setFillColor() {}
    setTextColor() {}
    rect() {}
    addPage() {}
    splitTextToSize(value: string) {
      return [value];
    }
    text(value: string | string[]) {
      pdfMock.texts.push(...(Array.isArray(value) ? value : [value]));
    }
    save(fileName: string) {
      pdfMock.save(fileName);
    }
  },
}));

describe('ReportService', () => {
  let service: ReportService;
  let authService: { isDemoMode: ReturnType<typeof vi.fn> };
  let dataService: {
    getStatsMetrics: ReturnType<typeof vi.fn>;
    getProfiles: ReturnType<typeof vi.fn>;
  };
  let toastPresent: ReturnType<typeof vi.fn>;
  let supabaseSelect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    pdfMock.texts.length = 0;
    pdfMock.save.mockClear();
    authService = { isDemoMode: vi.fn(() => false) };
    dataService = {
      getStatsMetrics: vi.fn(() => of([{ label: 'Usuarios registrados', value: 128 }])),
      getProfiles: vi.fn(() => of([{ id: 'demo-user', email: 'demo@example.test' }])),
    };
    toastPresent = vi.fn();
    supabaseSelect = vi.fn(() => Promise.resolve({ data: [], error: null }));

    TestBed.configureTestingModule({
      providers: [
        ReportService,
        { provide: AuthService, useValue: authService },
        { provide: DataService, useValue: dataService },
        {
          provide: SupabaseService,
          useValue: {
            client: {
              from: vi.fn(() => ({ select: supabaseSelect })),
            },
          },
        },
        {
          provide: ToastController,
          useValue: {
            create: vi.fn(async () => ({ present: toastPresent })),
          },
        },
      ],
    });
    service = TestBed.inject(ReportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should propagate Supabase report errors instead of returning empty metrics', async () => {
    const backendError = new Error('No se pudo consultar la tabla reports');
    supabaseSelect.mockResolvedValue({ data: null, error: backendError });

    await expect(firstValueFrom(service.getMetrics())).rejects.toBe(backendError);
  });

  it('should propagate Supabase profile errors', async () => {
    const backendError = new Error('No se pudieron consultar perfiles');
    supabaseSelect.mockResolvedValue({ data: null, error: backendError });

    await expect(firstValueFrom(service.getProfiles())).rejects.toBe(backendError);
  });

  it('should return demo metrics and profiles without querying Supabase', async () => {
    authService.isDemoMode.mockReturnValue(true);

    await expect(firstValueFrom(service.getMetrics())).resolves.toEqual([
      { label: 'Usuarios registrados', value: 128 },
    ]);
    await expect(firstValueFrom(service.getProfiles())).resolves.toEqual([
      { id: 'demo-user', email: 'demo@example.test' },
    ]);
    expect(dataService.getStatsMetrics).toHaveBeenCalledOnce();
    expect(dataService.getProfiles).toHaveBeenCalledOnce();
    expect(supabaseSelect).not.toHaveBeenCalled();
  });

  it('should show a warning when asked to export an empty report', async () => {
    await service.exportToPDF([], 'empty.pdf');

    expect(toastPresent).toHaveBeenCalledOnce();
  });

  it('should generate a PDF with a tabular title, headers and data', async () => {
    await service.exportToPDF(
      [{ nombre: 'Usuario Demo', email: 'demo@example.test', rol: 'user' }],
      'usuarios.pdf',
      'Informe de usuarios'
    );

    expect(pdfMock.texts).toEqual(expect.arrayContaining([
      'Informe de usuarios',
      'nombre',
      'email',
      'rol',
      'Usuario Demo',
      'demo@example.test',
      'user',
    ]));
    expect(pdfMock.save).toHaveBeenCalledWith('usuarios.pdf');
  });
});
