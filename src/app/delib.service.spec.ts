import { TestBed } from '@angular/core/testing';

import { DelibService } from './delib.service';

describe('DelibService', () => {
  let service: DelibService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DelibService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
