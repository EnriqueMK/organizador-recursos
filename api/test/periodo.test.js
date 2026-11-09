import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { horasNoPeriodo, janelasLivres, sobrepoe, validarPeriodo } from '../src/domain/periodo.js';

const h = (hora, min = 0, seg = 0) => new Date(Date.UTC(2030, 0, 1, hora, min, seg));

describe('sobreposição de períodos [início, fim)', () => {
  it('terminar exatamente quando outro começa NÃO sobrepõe', () => {
    assert.equal(sobrepoe(h(13), h(14), h(14), h(16)), false);
  });
  it('começar exatamente quando outro termina NÃO sobrepõe', () => {
    assert.equal(sobrepoe(h(16), h(17), h(14), h(16)), false);
  });
  it('cruzar a fronteira por um segundo sobrepõe', () => {
    assert.equal(sobrepoe(h(13), h(14, 0, 1), h(14), h(16)), true);
    assert.equal(sobrepoe(h(15, 59, 59), h(17), h(14), h(16)), true);
  });
  it('um período contido em outro sobrepõe', () => {
    assert.equal(sobrepoe(h(14, 30), h(15), h(14), h(16)), true);
  });
});

describe('validarPeriodo', () => {
  it('rejeita término antes do início e término igual ao início', () => {
    assert.throws(() => validarPeriodo(h(10), h(9)), (e) => e.status === 400);
    assert.throws(() => validarPeriodo(h(10), h(10)), (e) => e.status === 400);
  });
  it('aceita período válido', () => {
    assert.doesNotThrow(() => validarPeriodo(h(10), h(11)));
  });
});

describe('janelasLivres', () => {
  it('desconta reservas e manutenções e junta intervalos ocupados que se tocam', () => {
    const livres = janelasLivres(h(8), h(18), [
      { inicio: h(10), fim: h(11) },
      { inicio: h(11), fim: h(12) },
      { inicio: h(14), fim: h(15) },
    ]);
    assert.deepEqual(livres.map((j) => [j.inicio.getUTCHours(), j.fim.getUTCHours()]), [[8, 10], [12, 14], [15, 18]]);
  });
  it('sem nada ocupado, a janela é o período inteiro', () => {
    const livres = janelasLivres(h(8), h(9), []);
    assert.equal(livres.length, 1);
  });
  it('tudo ocupado não deixa janela', () => {
    assert.deepEqual(janelasLivres(h(8), h(9), [{ inicio: h(7), fim: h(10) }]), []);
  });
});

describe('horasNoPeriodo', () => {
  it('recorta o que passa da borda do período', () => {
    assert.equal(horasNoPeriodo(h(23), new Date(Date.UTC(2030, 0, 2, 2)), h(0), new Date(Date.UTC(2030, 0, 2, 0))), 1);
  });
  it('fora do período dá zero', () => {
    assert.equal(horasNoPeriodo(h(1), h(2), h(5), h(6)), 0);
  });
});
