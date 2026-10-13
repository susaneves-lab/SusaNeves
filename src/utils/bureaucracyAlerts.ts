import { Formacao, Colaborador, MATRIZ_BUROCRACIA } from '../types';

export interface FormacaoPendenteAlerta {
  formacao: Formacao;
  diasAtraso: number;
  dataRealizacao: string;
  documentosEmFalta: string[];
}

/**
 * Calcula as formações que foram realizadas há mais de X dias (padrão 30 dias)
 * e cuja burocracia ainda se encontra pendente (burocracia === false).
 */
export function getFormacoesBurocraciaPendente(
  formacoes: Formacao[],
  diasLimite = 30
): FormacaoPendenteAlerta[] {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const pendentes: FormacaoPendenteAlerta[] = [];

  formacoes.forEach(f => {
    // Apenas formações cuja burocracia não foi validada
    if (!f.burocracia && f.data) {
      const dataF = new Date(f.data);
      if (!isNaN(dataF.getTime())) {
        const diffMs = hoje.getTime() - dataF.getTime();
        const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDias >= diasLimite) {
          // Identificar documentos em falta com base na matriz regulamentar
          const subtipo = f.subtipoBurocracia || 
            (f.categoria === 'Externa' ? 'Externa (inclui Enfermagem Externas)' : 
             f.categoria === 'Enfermagem' ? 'Enfermagem (só Internas)' :
             f.categoria === 'ACAF' ? 'ACAF - Obrigatória' : 'Interna - Formador Interno (i.e. só TSDT)');
          
          const requisitos = MATRIZ_BUROCRACIA[subtipo] || {};
          const docsAtuais = f.documentosBurocracia || {};

          const emFalta: string[] = [];
          if (requisitos.certificadosCR === 'sim' && !docsAtuais.certificadosCR) emFalta.push('Certificado');
          if (requisitos.registoPresencaRPF === 'sim' && !docsAtuais.registoPresencaRPF) emFalta.push('Registo de Presença (RPF)');
          if (requisitos.propostaPAF === 'sim' && !docsAtuais.propostaPAF) emFalta.push('Proposta PAF');
          if (requisitos.avaliacaoEficaciaA6 === 'sim' && !docsAtuais.avaliacaoEficaciaA6) emFalta.push('Avaliação de Eficácia (A6)');

          pendentes.push({
            formacao: f,
            diasAtraso: diffDias,
            dataRealizacao: f.data,
            documentosEmFalta: emFalta.length > 0 ? emFalta : ['Validação formal no sistema']
          });
        }
      }
    }
  });

  return pendentes.sort((a, b) => b.diasAtraso - a.diasAtraso);
}

/**
 * Gera links de envio de email para o Outlook com o relatório formal
 * de pendências documentais há mais de 30 dias.
 */
export function gerarLinksOutlookBurocracia(
  pendentes: FormacaoPendenteAlerta[],
  destinatario = 'chefia.radioterapia@ulsar.min-saude.pt; radform@ulsar.min-saude.pt'
) {
  const assunto = `[RadForm · ULSAR] ALERTA DE CONFORMIDADE: ${pendentes.length} Formações com Burocracia Pendente (+30 Dias)`;

  const linhas = pendentes.map((p, idx) => {
    return `${idx + 1}. [${p.formacao.codigo || 'S/ CÓDIGO'}] ${p.formacao.nome}
   • Categoria: ${p.formacao.categoria} | Data: ${p.dataRealizacao} (${p.diasAtraso} dias decorridos)
   • Participante(s): ${p.formacao.colaboradores.join(', ') || 'Não especificado'}
   • Documentos em Falta: ${p.documentosEmFalta.join(', ')}
   • Observações: ${p.formacao.observacoes || 'N/A'}`;
  }).join('\n\n');

  const corpo = `Exma. Direção / Coordenação do Serviço de Radioterapia,

No âmbito do controlo de qualidade e auditoria regulamentar do Serviço de Radioterapia da ULSAR, EPE, informamos que foram detetadas ${pendentes.length} ações formativas cuja realização decorreu há mais de 30 dias e que mantêm documentação burocrática pendente de validação:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LISTA DE AÇÕES COM BUROCRACIA PENDENTE (>30 DIAS):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${linhas}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Solicita-se a regularização dos processos documentais e arquivamento dos respetivos certificados / comprovativos no sistema RadForm para efeitos de auditoria hospitalar.

Com os melhores cumprimentos,
Sistema de Gestão de Formação Contínua · RadForm
Serviço de Radioterapia · ULSAR, EPE`;

  const webUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(destinatario)}&subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
  const mailtoUrl = `mailto:${encodeURIComponent(destinatario)}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;

  return {
    assunto,
    corpo,
    webUrl,
    mailtoUrl
  };
}

/**
 * Ativa notificação do browser se a permissão estiver concedida
 */
export async function dispararNotificacaoBrowser(titulo: string, mensagem: string) {
  if (!('Notification' in window)) return false;

  if (Notification.permission === 'granted') {
    new Notification(titulo, {
      body: mensagem,
      icon: '/vite.svg'
    });
    return true;
  } else if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      new Notification(titulo, {
        body: mensagem,
        icon: '/vite.svg'
      });
      return true;
    }
  }
  return false;
}
