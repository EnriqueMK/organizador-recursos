import { acoesPermitidas } from './transicoes-reserva';

describe('acoesPermitidas', () => {
  const nomes = (l: { acao: string }[]) => l.map(x => x.acao);

  it('Solicitante não aprova a própria reserva, mas pode cancelar', () => {
    const a = nomes(acoesPermitidas('SOLICITADA', 'SOLICITANTE', true));
    expect(a).not.toContain('aprovar');
    expect(a).toContain('cancelar');
  });
  it('Responsável não aprova a própria reserva', () => {
    expect(nomes(acoesPermitidas('SOLICITADA', 'RESPONSAVEL', true))).not.toContain('aprovar');
  });
  it('recurso restrito só é aprovado por Responsável', () => {
    expect(nomes(acoesPermitidas('SOLICITADA', 'ADMINISTRADOR', false, true))).not.toContain('aprovar');
    expect(nomes(acoesPermitidas('SOLICITADA', 'RESPONSAVEL', false, true))).toContain('aprovar');
  });
  it('Solicitante de outra pessoa não cancela', () => {
    expect(nomes(acoesPermitidas('SOLICITADA', 'SOLICITANTE', false))).toEqual([]);
  });
  it('estados finais não têm ações', () => {
    for (const e of ['CONCLUIDA', 'REJEITADA', 'CANCELADA', 'NAO_COMPARECEU'] as const) {
      expect(acoesPermitidas(e, 'ADMINISTRADOR', false)).toEqual([]);
    }
  });
  it('EM_USO só pode ser concluída', () => {
    expect(nomes(acoesPermitidas('EM_USO', 'RESPONSAVEL', false))).toEqual(['concluir']);
  });
});
