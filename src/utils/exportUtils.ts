import * as XLSX from 'xlsx';
import { Formacao, Colaborador, FormacaoCategoria, DestinatarioGrupo, DESTINATARIOS_INFO } from '../types';

export const exportFormacoesToExcel = (
  formacoes: Formacao[],
  colaboradores: Colaborador[],
  ano: number,
  tituloPersonalizado?: string
) => {
  const wb = XLSX.utils.book_new();

  // 1. Tabela Principal de Formações (Estrutura idêntica à imagem 1 e 2)
  const rowsFormacoes = formacoes.map((f) => ({
    'Burocracia': f.burocracia ? 'SIM' : 'NÃO',
    'Realizada': f.realizada ? 'SIM' : 'NÃO',
    'Nome da Formação': f.nome,
    'Tipo': f.categoria,
    'Prioridade': f.prioridade || 'Média',
    'Destinatários': f.destinatarios.join(', '),
    'Data da Realização': f.data + (f.dataFim ? ` a ${f.dataFim}` : ''),
    'Frequentada Colaborador RAD': f.frequentadaColaboradorRad ? 'Sim' : 'Não',
    'Colaboradores Participantes': f.colaboradores.join(', '),
    'Horas de Formação': f.horas,
    'Código': f.codigo,
    'Relevância': f.relevancia,
    'Incluída no Plano de Necessidades': f.incluidaPlanoNecessidades,
    'Certificado': f.certificado ? f.certificado.nomeFicheiro : 'Pendente',
    'Observações': f.observacoes || ''
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
  const grupos: DestinatarioGrupo[] = ['MR', 'ENF', 'TSDT', 'FIS', 'AT', 'AO'];
  const rowsGrupos = grupos.map((grp) => {
    const grupoFormacoes = formacoes.filter(f => f.destinatarios.includes(grp));
    const totalHoras = grupoFormacoes.reduce((acc, curr) => acc + curr.horas, 0);
    const colabsDoGrupo = colaboradores.filter(c => c.categoriaProfissional === grp);
    
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
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

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

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Radar Futuro - Eventos Ordenados por Data Cronológica · RadForm ULSAR</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 20px; color: #1e293b; font-size: 11px; }
          .header { border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
          h1 { margin: 0; font-size: 16px; color: #0f172a; }
          p { margin: 2px 0; color: #64748b; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
          th { background-color: #f1f5f9; color: #334155; font-weight: 700; padding: 7px 8px; border: 1px solid #cbd5e1; text-align: center; }
          .footer { margin-top: 20px; text-align: right; font-size: 10px; color: #94a3b8; }
          @media print {
            body { margin: 10mm; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
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
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
