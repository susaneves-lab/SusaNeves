import { Formacao, FormacaoCategoria } from '../types';

/**
 * Regra de Atribuição Automática do Código de Formação:
 * Estrutura: [AA][MM][DD]-[CATEGORIA][SEQUENCIAL]
 * 
 * Exemplos:
 * - 2026-01-04, Externa -> 260104-E01
 * - 2026-01-05, Interna -> 260105-I01
 * - 2026-02-10, Enfermagem -> 260210-ENF01
 * - 2026-03-22, ACAF -> 260322-A01
 */

export function obterSufixoCategoria(categoria: FormacaoCategoria): string {
  switch (categoria) {
    case 'Externa':
      return 'E';
    case 'Interna':
      return 'I';
    case 'Enfermagem':
      return 'ENF';
    case 'ACAF':
      return 'A';
    default:
      return 'E';
  }
}

export function gerarCodigoFormacaoAutomatico(
  data: string,
  categoria: FormacaoCategoria,
  formacoesExistentes: Formacao[] = []
): {
  codigo: string;
  ano2Digitos: string;
  mes2Digitos: string;
  dia2Digitos: string;
  sufixoCat: string;
  sequencial: string;
  explicacao: string;
} {
  // Data fallback
  const d = data && data.length >= 10 ? data : new Date().toISOString().slice(0, 10);
  const partes = d.split('-');
  const anoStr = partes[0] || '2026';
  const mesStr = partes[1] || '01';
  const diaStr = partes[2] || '01';

  const ano2Digitos = anoStr.slice(-2);
  const mes2Digitos = mesStr.padStart(2, '0');
  const dia2Digitos = diaStr.padStart(2, '0');
  const prefixoData = `${ano2Digitos}${mes2Digitos}${dia2Digitos}`;

  const sufixoCat = obterSufixoCategoria(categoria);
  const basePrefixo = `${prefixoData}-${sufixoCat}`;

  // Verificar quantas formações com este mesmo prefixo já existem para calcular o sequencial correto
  const ocorrencias = formacoesExistentes.filter(f => 
    f.codigo && f.codigo.startsWith(basePrefixo)
  ).length;

  const proxSeqNum = ocorrencias + 1;
  const sequencial = proxSeqNum < 10 ? `0${proxSeqNum}` : `${proxSeqNum}`;

  const codigo = `${basePrefixo}${sequencial}`;

  const explicacao = `O código [${codigo}] foi calculado automaticamente com base em:
1. Ano: "${anoStr}" → [${ano2Digitos}] (dois últimos dígitos)
2. Mês: "${mesStr}" → [${mes2Digitos}] (dois dígitos)
3. Dia: "${diaStr}" → [${dia2Digitos}] (dois dígitos)
4. Categoria: "${categoria}" → [${sufixoCat}] (${categoria === 'Externa' ? 'Externa = E' : categoria === 'Interna' ? 'Interna = I' : categoria === 'Enfermagem' ? 'Enfermagem = ENF' : 'ACAF = A'})
5. Sequencial: [${sequencial}] (ordem da ação nesta data e categoria)`;

  return {
    codigo,
    ano2Digitos,
    mes2Digitos,
    dia2Digitos,
    sufixoCat,
    sequencial,
    explicacao
  };
}
