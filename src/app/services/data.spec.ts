import { TestBed } from '@angular/core/testing';
import { DataService } from './data';
import { SupabaseService } from './supabase';

describe('DataService', () => {
  let service: DataService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [SupabaseService],
    }).compileComponents();
    service = TestBed.inject(DataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
