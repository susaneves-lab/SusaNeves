import React, { useState, useEffect } from 'react';
import { Formacao, Colaborador, DESTINATARIOS_INFO } from '../types';
import { 
  Mail, 
  Send, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  Calendar, 
  Clock, 
  User, 
  AlertCircle,
  FileCheck
} from 'lucide-react';

interface OutlookEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  formacao: Formacao | null;
  colaboradores: Colaborador[];
  onMarcarEmailEnviado: (formacaoId: string) => void;
}

export const OutlookEmailModal: React.FC<OutlookEmailModalProps> = ({
  isOpen,
  onClose,
  formacao,
  colaboradores,
  onMarcarEmailEnviado
}) => {
  // Obter colaboradores participantes e respetivos emails
  const participantes = colaboradores.filter(c => formacao?.colaboradores?.includes(c.sigla));
  const emailsDestinatarios = participantes.map(p => p.email).filter(Boolean);
  
  // Destinatários padrão para CC (Direção / Chefia de Radioterapia)
  const [destinatarioPrincipal, setDestinatarioPrincipal] = useState(
    emailsDestinatarios.length > 0 ? emailsDestinatarios.join('; ') : 'formacao.radioterapia@ulsar.min-saude.pt'
  );
  const [emailCc, setEmailCc] = useState('chefia.radioterapia@ulsar.min-saude.pt; coordenacao.qualidade@ulsar.min-saude.pt');

  // Assunto formal do Outlook sem qualquer código da formação
  const [assunto, setAssunto] = useState(
    `[RadForm · ULSAR] Avaliação da Eficácia aos 6 Meses · Formação: ${formacao?.nome || ''}`
  );

  // Função para gerar o corpo profissional do email sem qualquer código de formação (Requisito 4)
  const gerarCorpoSemCodigo = (f: Formacao | null, partics: Colaborador[]) => `Exmo(a). Colaborador(a),

No âmbito do Sistema de Gestão da Qualidade e Avaliação Contínua do Serviço de Radioterapia da Unidade Local de Saúde (ULSAR, EPE), solicitamos o preenchimento da Avaliação da Eficácia decorridos 6 meses após a realização da seguinte ação formativa:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DADOS DA FORMAÇÃO REALIZADA:
• Ação Formativa: ${f?.nome || ''}
• Categoria / Âmbito: ${f?.categoria || ''}
• Data de Realização: ${f?.data || ''}${f?.dataFim ? ` a ${f.dataFim}` : ''}
• Carga Horária: ${f?.horas || 0} Horas
• Participante(s): ${partics.length > 0 ? partics.map(p => `${p.nome} (${DESTINATARIOS_INFO[p.categoriaProfissional]?.nomeCompleto || p.categoriaProfissional})`).join(', ') : 'Colaboradores Participantes do Serviço'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJETIVO DA AVALIAÇÃO DE EFICÁCIA (6 MESES):
Aferir o impacto prático dos conhecimentos adquiridos no exercício clínico diário e na melhoria contínua da prestação de cuidados aos doentes oncológicos.

Agradecemos o envio da Ficha de Avaliação da Eficácia preenchida (Modelo A6) ou a confirmação de impacto clínico até ao final da corrente semana.

Com os melhores cumprimentos,

Coordenação de Formação Contínua e Qualidade
Serviço de Radioterapia · ULSAR, EPE
Email: radioterapia.formacao@ulsar.min-saude.pt`;

  const [corpoEmail, setCorpoEmail] = useState(() => gerarCorpoSemCodigo(formacao, participantes));
  const [copiado, setCopiado] = useState(false);

  // Sincronizar dados sempre que uma nova formação for aberta no modal
  useEffect(() => {
    if (formacao) {
      const partics = colaboradores.filter(c => formacao.colaboradores?.includes(c.sigla));
      const emails = partics.map(p => p.email).filter(Boolean);
      setDestinatarioPrincipal(
        emails.length > 0 ? emails.join('; ') : 'formacao.radioterapia@ulsar.min-saude.pt'
      );
      setAssunto(`[RadForm · ULSAR] Avaliação da Eficácia aos 6 Meses · Formação: ${formacao.nome}`);
      setCorpoEmail(gerarCorpoSemCodigo(formacao, partics));
    }
  }, [formacao, colaboradores]);

  if (!isOpen || !formacao) return null;

  // Gera o link para abrir diretamente no Outlook Web (Office 365)
  const outlookWebUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(destinatarioPrincipal)}&cc=${encodeURIComponent(emailCc)}&subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpoEmail)}`;

  // Gera o link mailto clássico (abre aplicação Outlook de secretária)
  const mailtoUrl = `mailto:${encodeURIComponent(destinatarioPrincipal)}?cc=${encodeURIComponent(emailCc)}&subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpoEmail)}`;

  const handleCopiarTexto = () => {
    navigator.clipboard.writeText(corpoEmail);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleConfirmarEnvio = () => {
    onMarcarEmailEnviado(formacao.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Header do Modal com Identidade Outlook / Hospitalar */}
        <div className="px-6 py-4 bg-[#0078D4] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Mail className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Envio de Avaliação de 6 Meses via Outlook</span>
                <span className="text-[10px] uppercase font-bold bg-white/20 text-white px-2 py-0.5 rounded">
                  Office 365
                </span>
              </h2>
              <p className="text-xs text-blue-100">
                Notificação automática de eficácia formativa pós-6 meses para colaboradores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-100 hover:text-white rounded-md cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          
          {/* Informações da Formação */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row justify-between gap-3 text-slate-700">
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-400">Ação Formativa</span>
              <h4 className="font-bold text-slate-900 text-sm">{formacao.nome}</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Categoria: {formacao.categoria} · Carga: {formacao.horas}h
              </p>
            </div>
            <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
              <span className="text-[11px] font-bold uppercase text-slate-400">Data Realização</span>
              <div className="font-mono font-bold text-slate-900">{formacao.data}</div>
              <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 inline-block mt-1 font-semibold">
                Janela de 6 meses ativa
              </span>
            </div>
          </div>

          {/* Campos do Email */}
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Para (Colaborador / Participantes):
              </label>
              <input
                type="text"
                value={destinatarioPrincipal}
                onChange={(e) => setDestinatarioPrincipal(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md font-mono text-xs focus:ring-2 focus:ring-[#0078D4]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Cc (Chefia / Qualidade):
              </label>
              <input
                type="text"
                value={emailCc}
                onChange={(e) => setEmailCc(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md font-mono text-xs focus:ring-2 focus:ring-[#0078D4]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Assunto:
              </label>
              <input
                type="text"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs font-semibold focus:ring-2 focus:ring-[#0078D4]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Corpo da Mensagem (Formato Institucional):
                </label>
                <button
                  type="button"
                  onClick={handleCopiarTexto}
                  className="text-[11px] text-[#0078D4] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiado ? 'Copiado para a Área de Transferência' : 'Copiar Texto'}</span>
                </button>
              </div>
              <textarea
                rows={9}
                value={corpoEmail}
                onChange={(e) => setCorpoEmail(e.target.value)}
                className="w-full p-3 bg-white border border-slate-300 rounded-md font-mono text-xs leading-relaxed focus:ring-2 focus:ring-[#0078D4]"
              />
            </div>
          </div>

          {/* Botões de Ação para Outlook */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-slate-700 text-xs">
              <span className="font-bold text-slate-900 block">Enviar através da sua conta Outlook:</span>
              <span className="text-[11px] text-slate-500">
                Escolha o Outlook Web (Office 365) ou a aplicação de secretária instalada no computador.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={outlookWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleConfirmarEnvio}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0078D4] hover:bg-[#0060A8] text-white font-bold rounded-lg shadow-sm cursor-pointer transition-colors whitespace-nowrap active:scale-98"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir no Outlook Web</span>
              </a>

              <a
                href={mailtoUrl}
                onClick={handleConfirmarEnvio}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-[#0078D4] border border-[#0078D4] font-semibold rounded-lg shadow-2xs cursor-pointer transition-colors whitespace-nowrap"
              >
                <Mail className="w-4 h-4" />
                <span>Outlook Desktop (mailto)</span>
              </a>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleConfirmarEnvio}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5 cursor-pointer"
          >
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>Registar como Email Enviado na Burocracia</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-md cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
