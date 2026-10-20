import { Formacao, Colaborador, CertificadoAnexo, DestinatarioGrupo, FormacaoCategoria } from '../types';
import { gerarCodigoFormacaoAutomatico } from './codeGenerator';

export interface ExtracaoCertificadoResultado {
  formacao: Formacao;
  certificado: CertificadoAnexo;
  colaboradorDetectado?: Colaborador;
  mensagem: string;
}

/**
 * Lê o ficheiro de certificado e extrai automaticamente os dados conhecidos para criar
 * um novo registo completo de Formação com o certificado anexado.
 */
export async function extrairDadosECriarFormacaoDeCertificado(
  file: File,
  colaboradores: Colaborador[],
  anoAtual: number
): Promise<ExtracaoCertificadoResultado> {
  // 1. Converter ficheiro para Base64 de modo a anexar e persistir no registo
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });

  const certificado: CertificadoAnexo = {
    id: `cert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nomeFicheiro: file.name,
    tamanhoKb: Math.max(1, Math.round(file.size / 1024)),
    dataUpload: new Date().toISOString(),
    conteudoBase64: base64Data,
    tipoMime: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
  };

  // 2. Análise inteligente do nome do ficheiro para extrair título e metadados
  const nomeSemExtensao = file.name.replace(/\.[^/.]+$/, '');
  let textoBase = nomeSemExtensao;

  // Remover termos de prefixo de certificados comuns
  const prefixos = [
    /^certificado[\s_.-]*(?:de[\s_.-]*(?:formação|formacao|participação|participacao|frequência|frequencia)?)?[\s_.-]*/i,
    /^diploma[\s_.-]*/i,
    /^comprovativo[\s_.-]*/i,
    /^declaração[\s_.-]*/i,
    /^declaracao[\s_.-]*/i,
    /^certificate[\s_.-]*/i
  ];
  for (const p of prefixos) {
    textoBase = textoBase.replace(p, '');
  }

  // 3. Detetar Colaborador através da sigla ou nome no ficheiro
  let colaboradorEncontrado: Colaborador | undefined;
  const textoMinusculo = nomeSemExtensao.toLowerCase();

  // Pesquisa por Sigla (como palavra inteira ou delimitada por _ - .)
  for (const c of colaboradores) {
    const siglaRegex = new RegExp(`(^|[\\s_.-])${c.sigla}([\\s_.-]|$)`, 'i');
    if (siglaRegex.test(nomeSemExtensao)) {
      colaboradorEncontrado = c;
      textoBase = textoBase.replace(siglaRegex, ' ');
      break;
    }
  }

  // Se não encontrou por sigla, tenta pelo nome ou apelido
  if (!colaboradorEncontrado) {
    for (const c of colaboradores) {
      const partesNome = c.nome.toLowerCase().split(' ').filter(p => p.length > 3);
      const primeiro = partesNome[0];
      const ultimo = partesNome[partesNome.length - 1];
      if (primeiro && ultimo && textoMinusculo.includes(primeiro) && textoMinusculo.includes(ultimo)) {
        colaboradorEncontrado = c;
        textoBase = textoBase.replace(new RegExp(primeiro, 'gi'), ' ').replace(new RegExp(ultimo, 'gi'), ' ');
        break;
      }
    }
  }

  // 4. Detetar Horas (ex: 12h, 20_horas, 8hrs)
  let horasDetectadas = 1;
  const matchHoras = nomeSemExtensao.match(/(?:^|[_\s.-])(\d{1,3})\s*(?:h|horas|hrs|hora)(?:[_\s.-]|$)/i);
  if (matchHoras && matchHoras[1]) {
    const val = parseInt(matchHoras[1], 10);
    if (!isNaN(val) && val > 0 && val <= 500) {
      horasDetectadas = val;
      textoBase = textoBase.replace(matchHoras[0], ' ');
    }
  }

  // 5. Detetar Data ou Ano
  let dataFinal = '';
  // Padrão ISO YYYY-MM-DD
  const matchIso = nomeSemExtensao.match(/(\d{4})[-_](\d{2})[-_](\d{2})/);
  if (matchIso) {
    dataFinal = `${matchIso[1]}-${matchIso[2]}-${matchIso[3]}`;
  } else {
    // Padrão DD-MM-YYYY
    const matchPt = nomeSemExtensao.match(/(\d{2})[-_](\d{2})[-_](\d{4})/);
    if (matchPt) {
      dataFinal = `${matchPt[3]}-${matchPt[2]}-${matchPt[1]}`;
    } else {
      // Padrão de 4 dígitos (ano)
      const matchAno = nomeSemExtensao.match(/(202[0-9])/);
      const anoDetectado = matchAno ? parseInt(matchAno[1], 10) : anoAtual;
      const hoje = new Date().toISOString().slice(0, 10);
      dataFinal = hoje.startsWith(anoDetectado.toString()) ? hoje : `${anoDetectado}-03-15`;
    }
  }

  // 6. Detetar Categoria Formativa
  let categoria: FormacaoCategoria = 'Externa';
  if (/enfermagem/i.test(nomeSemExtensao)) {
    categoria = 'Enfermagem';
  } else if (/acaf/i.test(nomeSemExtensao)) {
    categoria = 'ACAF';
  } else if (/interna/i.test(nomeSemExtensao)) {
    categoria = 'Interna';
  }

  // 7. Limpar e capitalizar o título da formação
  let tituloLimpo = textoBase
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Se o título ficou demasiado curto ou vazio, recorrer ao nome do ficheiro sem extensão
  if (tituloLimpo.length < 3) {
    tituloLimpo = nomeSemExtensao.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Capitalização suave
  tituloLimpo = tituloLimpo
    .split(' ')
    .map(palavra => {
      if (['de', 'da', 'do', 'das', 'dos', 'em', 'e', 'na', 'no', 'para', 'com'].includes(palavra.toLowerCase())) {
        return palavra.toLowerCase();
      }
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(' ');

  // 8. Determinar destinatários e colaboradores
  const colaboradoresFinais = colaboradorEncontrado ? [colaboradorEncontrado.sigla] : [];
  const grupoDestinatario: DestinatarioGrupo = colaboradorEncontrado?.categoriaProfissional === 'AO'
    ? 'TAS'
    : (colaboradorEncontrado?.categoriaProfissional || (categoria === 'Enfermagem' ? 'ENF' : 'TSDT'));
  const destinatariosFinais: DestinatarioGrupo[] = [grupoDestinatario];

  // 9. Gerar código sequencial / automático
  const resCodigo = gerarCodigoFormacaoAutomatico(dataFinal, categoria);

  const anoRegisto = parseInt(dataFinal.slice(0, 4), 10) || anoAtual;

  // 10. Construir objeto Formacao completo
  const novaFormacao: Formacao = {
    id: `form-cert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ano: anoRegisto,
    nome: tituloLimpo,
    categoria,
    destinatarios: destinatariosFinais,
    data: dataFinal,
    frequentadaColaboradorRad: true,
    colaboradores: colaboradoresFinais,
    horas: horasDetectadas,
    horasTexto: `${horasDetectadas}h`,
    codigo: resCodigo.codigo,
    relevancia: 'Sim',
    incluidaPlanoNecessidades: 'Não',
    realizada: true,
    burocracia: true,
    observacoes: `Registo criado automaticamente a partir do certificado «${file.name}».`,
    subtipoBurocracia: categoria === 'Externa' ? 'Externa (inclui Enfermagem Externas)' : undefined,
    certificado,
    dataRegisto: new Date().toISOString().slice(0, 10)
  };

  const msg = colaboradorEncontrado 
    ? `Certificado processado. Colaborador associado: ${colaboradorEncontrado.nome} (${colaboradorEncontrado.sigla}).`
    : `Certificado processado e nova formação criada com sucesso.`;

  return {
    formacao: novaFormacao,
    certificado,
    colaboradorDetectado: colaboradorEncontrado,
    mensagem: msg
  };
}
