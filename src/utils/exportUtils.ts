import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Formacao, Colaborador, FormacaoCategoria, DestinatarioGrupo, DESTINATARIOS_INFO } from '../types';
import { printHtmlOnDevicePrinter } from './printUtils';

export const exportFormacoesToExcel = (
  formacoes: Formacao[],
  colaboradores: Colaborador[],
  ano: number,
  tituloPersonalizado?: string
) => {
  const wb = XLSX.utils.book_new();

  // 1. Tabela Principal de Formações (Ordem exata das colunas da tabela de formação)
  const rowsFormacoes = formacoes.map((f) => ({
    'Realiz.': f.realizada ? 'Sim' : 'Não',
    'Nome da Formação': f.nome,
    'Tipo / Categoria': f.categoria,
    'Destinatários': f.destinatarios.join(', '),
    'Data da Realização': f.data + (f.dataFim ? ` a ${f.dataFim}` : ''),
    'Freq. RAD': f.frequentadaColaboradorRad ? 'Sim' : 'Não',
    'Horas (h)': f.horasTexto || `${f.horas}h`,
    'Código Formação': f.codigo || '-',
    'Relevância': f.relevancia || '-',
    'No PNF': f.incluidaPlanoNecessidades || '-',
    'Certificado': f.certificado ? f.certificado.nomeFicheiro : 'Pendente',
    'Observações & Colaboradores': (f.colaboradores && f.colaboradores.length > 0)
      ? `Colaboradores: ${f.colaboradores.join(', ')}${f.observacoes ? ` | ${f.observacoes}` : ''}`
      : (f.observacoes || '-')
  }));

  const wsFormacoes = XLSX.utils.json_to_sheet(rowsFormacoes);
  XLSX.utils.book_append_sheet(wb, wsFormacoes, `Formações ${ano}`);

  // 2. Resumo por Colaborador
  const rowsColabs = colaboradores.map((c) => {
    const colabFormacoes = formacoes.filter(f => f.colaboradores.includes(c.sigla));
    const totalHoras = colabFormacoes.reduce((acc, curr) => acc + curr.horas, 0);
    const meta = c.metaHorasAnual || 35;
    const percMeta = Math.min(100, Math.round((totalHoras / meta) * 100));

    return {
      'Sigla': c.sigla,
      'Nome': c.nome,
      'Grupo Profissional': `${c.categoriaProfissional} - ${DESTINATARIOS_INFO[c.categoriaProfissional]?.nomeCompleto || ''}`,
      'Total Formações': colabFormacoes.length,
      'Horas Realizadas': totalHoras,
      'Meta Anual (Horas)': meta,
      '% Cumprimento da Meta': `${percMeta}%`,
      'Estado': totalHoras >= meta ? 'Meta Cumprida' : 'Em Progresso'
    };
  });

  const wsColabs = XLSX.utils.json_to_sheet(rowsColabs);
  XLSX.utils.book_append_sheet(wb, wsColabs, 'Resumo por Colaborador');

  // 3. Resumo por Categoria de Formação
  const categorias: FormacaoCategoria[] = ['Externa', 'Interna', 'Enfermagem', 'ACAF'];
  const rowsCategorias = categorias.map((cat) => {
    const catFormacoes = formacoes.filter(f => f.categoria === cat);
    const totalHoras = catFormacoes.reduce((acc, curr) => acc + curr.horas, 0);
    return {
      'Categoria de Formação': cat,
      'Número de Formações': catFormacoes.length,
      'Total de Horas': totalHoras,
      'Média de Horas / Formação': catFormacoes.length > 0 ? (totalHoras / catFormacoes.length).toFixed(1) : '0'
    };
  });

  const wsCategorias = XLSX.utils.json_to_sheet(rowsCategorias);
  XLSX.utils.book_append_sheet(wb, wsCategorias, 'Resumo por Categoria');

  // 4. Resumo por Tipo de Colaborador (Destinatários)
  const grupos: DestinatarioGrupo[] = ['AT', 'ENF', 'FIS', 'MR', 'TAS', 'TSDT'];
  const rowsGrupos = grupos.map((grp) => {
    const grupoFormacoes = formacoes.filter(f => f.destinatarios.includes(grp) || (grp === 'TAS' && f.destinatarios.includes('AO' as any)));
    const totalHoras = grupoFormacoes.reduce((acc, curr) => acc + curr.horas, 0);
    const colabsDoGrupo = colaboradores.filter(c => c.categoriaProfissional === grp || (grp === 'TAS' && c.categoriaProfissional === 'AO'));
    
    // Contabilização de horas dos colaboradores desse grupo
    const totalHorasIndividualGrupo = colabsDoGrupo.reduce((acc, colab) => {
      const horasColab = formacoes
        .filter(f => f.colaboradores.includes(colab.sigla))
        .reduce((sum, f) => sum + f.horas, 0);
      return acc + horasColab;
    }, 0);

    return {
      'Código Grupo': grp,
      'Designação do Grupo': DESTINATARIOS_INFO[grp]?.nomeCompleto || grp,
      'Colaboradores Ativos': colabsDoGrupo.length,
      'Formações Destinadas ao Grupo': grupoFormacoes.length,
      'Total de Horas Ofertadas': totalHoras,
      'Horas Efetivamente Freq. pela Equipa': totalHorasIndividualGrupo
    };
  });

  const wsGrupos = XLSX.utils.json_to_sheet(rowsGrupos);
  XLSX.utils.book_append_sheet(wb, wsGrupos, 'Resumo Grupos Profissionais');

  // Gravação do ficheiro
  const fileName = tituloPersonalizado 
    ? `${tituloPersonalizado}.xlsx` 
    : `Relatorio_Formacao_RAD_${ano}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(wb, fileName);
};

export const exportRelatorioTrimestralToExcel = (
  formacoes: Formacao[],
  colaboradores: Colaborador[],
  ano: number,
  trimestre: 1 | 2 | 3 | 4
) => {
  const trimestresMeses: Record<number, number[]> = {
    1: [1, 2, 3],
    2: [4, 5, 6],
    3: [7, 8, 9],
    4: [10, 11, 12]
  };

  const mesesAlvo = trimestresMeses[trimestre];
  const formacoesTrimestre = formacoes.filter(f => {
    const parts = f.data.split('-');
    if (parts.length >= 2) {
      const mes = parseInt(parts[1], 10);
      return mesesAlvo.includes(mes);
    }
    return false;
  });

  const nomesTrimestres: Record<number, string> = {
    1: '1º Trimestre (Janeiro - Março)',
    2: '2º Trimestre (Abril - Junho)',
    3: '3º Trimestre (Julho - Setembro)',
    4: '4º Trimestre (Outubro - Dezembro)'
  };

  exportFormacoesToExcel(
    formacoesTrimestre,
    colaboradores,
    ano,
    `Relatorio_Trimestral_Q${trimestre}_${ano}_${nomesTrimestres[trimestre].replace(/[^a-zA-Z0-9]/g, '_')}`
  );
};

export const exportRelatorioMensalToExcel = (
  formacoes: Formacao[],
  colaboradores: Colaborador[],
  ano: number,
  mes: number // 1 a 12
) => {
  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const formacoesMes = formacoes.filter(f => {
    const parts = f.data.split('-');
    if (parts.length >= 2) {
      const m = parseInt(parts[1], 10);
      return m === mes;
    }
    return false;
  });

  exportFormacoesToExcel(
    formacoesMes,
    colaboradores,
    ano,
    `Relatorio_Mensal_${nomesMeses[mes - 1]}_${ano}`
  );
};

// Requisito 13: Exportar Excel e Imprimir / Exportar PDF dos eventos futuros cronológicos
export const exportRadarEventosToExcel = (eventos: any[]) => {
  const wb = XLSX.utils.book_new();
  const rows = eventos.map((ev, idx) => ({
    'Nº': idx + 1,
    'Título da Formação / Evento': ev.titulo,
    'Entidade Promotora': ev.entidade,
    'Data de Início': ev.dataInicio,
    'Data de Fim': ev.dataFim || '-',
    'Formato': ev.formato,
    'Local': ev.local,
    'Âmbito': ev.ambito,
    'Tema Principal': ev.temaPrincipal,
    'Custo': ev.gratis ? 'Gratuito' : 'Pago',
    'Custo Detalhado': ev.custoTexto || (ev.gratis ? 'Gratuito' : 'Sob Inscrição'),
    'Carga Horária Estimada (h)': ev.horasEstimadas || '-',
    'Destinatários Recomendados': Array.isArray(ev.destinatariosSugeridos) ? ev.destinatariosSugeridos.join(', ') : '',
    'Descrição / Programa': ev.descricao,
    'Link / Website Oficial': ev.url
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Eventos Cronológicos');
  XLSX.writeFile(wb, `RadForm_Radar_Futuro_Cronologico_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const printRadarEventosPDF = (eventos: any[]) => {
  const linhasHtml = eventos.map((ev, idx) => `
    <tr>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${idx + 1}</td>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: 600; color: #0f172a;">${ev.titulo}</td>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; color: #334155;">${ev.entidade}</td>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace;">${ev.dataInicio}${ev.dataFim ? ` a ${ev.dataFim}` : ''}</td>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">${ev.formato} (${ev.local})</td>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">${ev.temaPrincipal}</td>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: ${ev.gratis ? '#059669' : '#b45309'};">${ev.gratis ? 'Gratuito' : (ev.custoTexto || 'Pago')}</td>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace;">${ev.horasEstimadas ? `${ev.horasEstimadas}h` : '-'}</td>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">${Array.isArray(ev.destinatariosSugeridos) ? ev.destinatariosSugeridos.join(', ') : '-'}</td>
    </tr>
  `).join('');

  const bodyHtml = `
    <div class="header">
      <div>
        <h1>Serviço de Radioterapia · ULSAR, EPE</h1>
        <p><strong>Radar Futuro:</strong> Lista de Eventos Formativos Externos Ordenados Cronologicamente</p>
        <p>Extraído em ${new Date().toLocaleDateString('pt-PT')} às ${new Date().toLocaleTimeString('pt-PT')} | Total de eventos: ${eventos.length}</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 30px;">#</th>
          <th>Título da Ação Formativa</th>
          <th>Entidade Promotora</th>
          <th>Data Prevista</th>
          <th>Formato / Local</th>
          <th>Tema</th>
          <th>Custo</th>
          <th>Horas</th>
          <th>Destinatários</th>
        </tr>
      </thead>
      <tbody>
        ${linhasHtml}
      </tbody>
    </table>
    <div class="footer">
      RadForm · Sistema Hospitalar de Gestão de Formação Contínua em Radioterapia
    </div>
  `;

  const customCss = `
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; font-size: 11px; }
    .header { border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
    h1 { margin: 0; font-size: 16px; color: #0f172a; }
    p { margin: 2px 0; color: #64748b; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
    th { background-color: #f1f5f9; color: #334155; font-weight: 700; padding: 7px 8px; border: 1px solid #cbd5e1; text-align: center; }
    .footer { margin-top: 20px; text-align: right; font-size: 10px; color: #94a3b8; }
  `;

  printHtmlOnDevicePrinter(bodyHtml, {
    title: 'Radar Futuro - Eventos Ordenados por Data Cronológica · RadForm ULSAR',
    orientation: 'landscape',
    customCss
  });
};

export interface MetricasPerfilExport {
  totalHoras: number;
  metaHoras: number;
  percentagemHoras: number;
  saldoHoras: number;
  totalAcoes: number;
  metaAcoes: number;
  percentagemAcoes: number;
  saldoAcoes: number;
  taxaBurocracia: number;
  acoesBurocraciaOk: number;
  taxaPnf: number;
  acoesPnfOk: number;
  horasPorCategoria: {
    Externa: number;
    Interna: number;
    Enfermagem: number;
    ACAF: number;
  };
}

export const exportColaboradorPerfilToPdf = (
  colaborador: Colaborador,
  formacoesColaborador: Formacao[],
  metricas: MetricasPerfilExport,
  ano: number
): void => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const emissaoData = new Date().toLocaleDateString('pt-PT');
  const emissaoHora = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

  // Barra superior institucional
  pdf.setDrawColor(15, 118, 110);
  pdf.setLineWidth(1.4);
  pdf.line(12, 10, 198, 10);

  // Cabeçalho Institucional
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(15, 23, 42);
  pdf.text('ULSAR - Serviço de Radioterapia', 12, 18.5);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  pdf.setTextColor(15, 118, 110);
  pdf.text(`Dossiê e Perfil Formativo Individual do Colaborador · Exercício ${ano}`, 12, 24.5);

  // Caixa de emissão à direita
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(142, 12.5, 56, 15, 1.5, 1.5, 'FD');

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Emissão: ${emissaoData} ${emissaoHora}`, 145, 18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 118, 110);
  pdf.text(`Ano Analisado: ${ano}`, 145, 23.5);

  // Cartão de Identificação do Colaborador
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(12, 31, 186, 26, 2, 2, 'FD');

  // Círculo / Badge da Sigla
  pdf.setFillColor(17, 94, 89);
  pdf.roundedRect(16, 35, 16, 16, 2, 2, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.text(colaborador.sigla || '-', 24, 44.5, { align: 'center' });

  // Dados principais
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`${colaborador.nome}`, 36, 40);

  const grupoNome = DESTINATARIOS_INFO[colaborador.categoriaProfissional as DestinatarioGrupo]?.nomeCompleto || colaborador.categoriaProfissional;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(51, 65, 85);
  pdf.text(`Cargo: ${colaborador.cargo}  |  Grupo: ${colaborador.categoriaProfissional} (${grupoNome})`, 36, 46);

  pdf.setFontSize(8.5);
  pdf.setTextColor(100, 116, 139);
  const numMec = colaborador.numMecanografico || '-';
  const email = colaborador.email || '-';
  const estado = colaborador.estadoProfissional || 'Activo';
  pdf.text(`Nº Mecanográfico: ${numMec}  |  Email: ${email}  |  Estado: ${estado}`, 36, 52);

  // 4 Cartões de Metas Anuais Individuais
  const cardW = (186 - 6) / 4; // 45mm cada
  const kpiCards = [
    {
      label: 'META ANUAL HORAS',
      main: `${metricas.totalHoras} / ${metricas.metaHoras} h`,
      sub: `${metricas.percentagemHoras}% cumprido`,
      bg: [240, 253, 250],
      color: [15, 118, 110]
    },
    {
      label: 'META FORMAÇÕES (QTD)',
      main: `${metricas.totalAcoes} / ${metricas.metaAcoes} ações`,
      sub: `${metricas.percentagemAcoes}% cumprido`,
      bg: [239, 246, 255],
      color: [29, 78, 216]
    },
    {
      label: 'BUROCRACIA VALIDADA',
      main: `${metricas.taxaBurocracia}%`,
      sub: `${metricas.acoesBurocraciaOk} de ${metricas.totalAcoes} ações`,
      bg: [255, 251, 235],
      color: [180, 83, 9]
    },
    {
      label: 'INCLUSÃO NO PNF',
      main: `${metricas.taxaPnf}%`,
      sub: `${metricas.acoesPnfOk} de ${metricas.totalAcoes} no plano`,
      bg: [236, 253, 245],
      color: [4, 120, 87]
    }
  ];

  kpiCards.forEach((card, i) => {
    const x = 12 + i * (cardW + 2);
    pdf.setFillColor(card.bg[0], card.bg[1], card.bg[2]);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(x, 62, cardW, 20, 1.5, 1.5, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(card.label, x + 3, 67.5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(card.color[0], card.color[1], card.color[2]);
    pdf.text(card.main, x + 3, 74);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(card.sub, x + 3, 79.5);
  });

  // Distribuição de Horas por Categoria de Formação
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(30, 41, 59);
  pdf.text(`Distribuição de Horas por Categoria (${colaborador.sigla})`, 12, 89);

  const cats = [
    { nome: 'Formação Externa', val: `${metricas.horasPorCategoria.Externa} h`, bg: [239, 246, 255], txt: [30, 64, 175] },
    { nome: 'Formação Interna', val: `${metricas.horasPorCategoria.Interna} h`, bg: [240, 253, 250], txt: [17, 94, 89] },
    { nome: 'Enfermagem', val: `${metricas.horasPorCategoria.Enfermagem} h`, bg: [250, 245, 255], txt: [107, 33, 168] },
    { nome: 'ACAF', val: `${metricas.horasPorCategoria.ACAF} h`, bg: [255, 251, 235], txt: [146, 64, 14] }
  ];

  cats.forEach((cat, i) => {
    const x = 12 + i * (cardW + 2);
    pdf.setFillColor(cat.bg[0], cat.bg[1], cat.bg[2]);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(x, 92, cardW, 13, 1.5, 1.5, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(cat.nome, x + 3, 97);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.setTextColor(cat.txt[0], cat.txt[1], cat.txt[2]);
    pdf.text(cat.val, x + 3, 102.5);
  });

  // Tabela de Formações Frequentadas pelo Colaborador
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`Formações Frequentadas em ${ano} (${formacoesColaborador.length} ações registadas)`, 12, 113);

  const rows = formacoesColaborador.length > 0
    ? formacoesColaborador.map((f) => [
        f.codigo || '-',
        f.nome || '-',
        f.categoria || '-',
        `${f.data || '-'}${f.dataFim ? ` a ${f.dataFim}` : ''}`,
        f.horasTexto || `${f.horas} h`,
        f.realizada ? 'Sim' : 'Não',
        f.burocracia ? 'Validada' : 'Pendente',
        f.incluidaPlanoNecessidades || '-'
      ])
    : [['-', `Nenhuma formação registada para ${colaborador.nome} em ${ano}.`, '-', '-', '-', '-', '-', '-']];

  autoTable(pdf, {
    startY: 116.5,
    margin: { left: 12, right: 12, top: 18, bottom: 16 },
    head: [[
      'Código',
      'Nome da Formação',
      'Tipo',
      'Data Realiz.',
      'Horas',
      'Realiz.',
      'Burocracia',
      'No PNF'
    ]],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
      valign: 'middle',
      cellPadding: 2.8
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 2.6,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.15,
      valign: 'middle',
      overflow: 'linebreak'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 66, halign: 'left', fontStyle: 'bold' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 15, halign: 'center' },
      7: { cellWidth: 11, halign: 'center' }
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(19, 78, 74);
        pdf.text(`ULSAR - Serviço de Radioterapia · Perfil Individual: ${colaborador.nome} (${colaborador.sigla})`, 12, 11);
        pdf.setDrawColor(15, 118, 110);
        pdf.setLineWidth(0.4);
        pdf.line(12, 13.5, 198, 13.5);
      }
    }
  });

  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text('ULSAR, EPE · Serviço de Radioterapia · RadForm Hospitalar', 12, 290);
    pdf.text(`Página ${i} de ${totalPages}`, 198, 290, { align: 'right' });
  }

  const dataIso = new Date().toISOString().slice(0, 10);
  pdf.save(`Perfil_Individual_${colaborador.sigla}_${ano}_${dataIso}.pdf`);
};

