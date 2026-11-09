import { FormControl, FormGroup } from '@angular/forms';
import { periodoValido } from './periodo.validator';

describe('periodoValido', () => {
  const g = (i: string, f: string) => new FormGroup({ inicio: new FormControl(i), fim: new FormControl(f) });

  it('rejeita término antes do início', () => {
    expect(periodoValido(g('2026-01-01T10:00', '2026-01-01T09:00'))).toEqual({ fimAntesDoInicio: true });
  });
  it('rejeita término igual ao início', () => {
    expect(periodoValido(g('2026-01-01T10:00', '2026-01-01T10:00'))).toEqual({ fimAntesDoInicio: true });
  });
  it('aceita período válido', () => {
    expect(periodoValido(g('2026-01-01T10:00', '2026-01-01T11:00'))).toBeNull();
  });
});
