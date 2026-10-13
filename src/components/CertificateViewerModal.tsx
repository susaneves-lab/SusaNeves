import React from 'react';
import { Formacao } from '../types';
import { X, Download, FileText, Calendar, Paperclip } from 'lucide-react';

interface CertificateViewerModalProps {
  formacao: Formacao | null;
  onClose: () => void;
}

export const CertificateViewerModal: React.FC<CertificateViewerModalProps> = ({
  formacao,
  onClose
}) => {
  if (!formacao || !formacao.certificado) return null;

  const cert = formacao.certificado;
  const isImage = cert.tipoMime?.startsWith('image/') || cert.nomeFicheiro.match(/\.(jpg|jpeg|png|webp)$/i);
  const isPdf = cert.tipoMime === 'application/pdf' || cert.nomeFicheiro.endsWith('.pdf');

  const handleDownload = () => {
    if (cert.conteudoBase64) {
      const a = document.createElement('a');
      a.href = cert.conteudoBase64;
      a.download = cert.nomeFicheiro;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Paperclip className="w-5 h-5 text-teal-700" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                Certificado: {cert.nomeFicheiro}
              </h3>
              <p className="text-xs text-slate-500">
                Formação: {formacao.nome} ({formacao.codigo})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Viewer */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {cert.conteudoBase64 ? (
            isImage ? (
              <div className="flex justify-center bg-slate-100 p-3 rounded-lg border border-slate-200">
                <img
                  src={cert.conteudoBase64}
                  alt={cert.nomeFicheiro}
                  className="max-h-[50vh] object-contain rounded"
                />
              </div>
            ) : isPdf ? (
              <div className="space-y-4 text-center py-6 bg-slate-50 rounded-lg border border-slate-200">
                <FileText className="w-16 h-16 text-teal-700 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{cert.nomeFicheiro}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Documento PDF ({cert.tamanhoKb} KB) anexado ao registo hospitalar
                  </p>
                </div>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descarregar Certificado em PDF</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                <p className="text-xs font-medium text-slate-700">{cert.nomeFicheiro}</p>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descarregar Ficheiro</span>
                </button>
              </div>
            )
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p>Ficheiro de certificado arquivado no processo documental do colaborador.</p>
            </div>
          )}

          {/* Detalhes do Documento */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">Tamanho:</span>
              <strong className="text-slate-800 font-mono">{cert.tamanhoKb || '240'} KB</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Data de Upload:</span>
              <strong className="text-slate-800 font-mono">
                {new Date(cert.dataUpload).toLocaleDateString('pt-PT')}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Horas Validadas:</span>
              <strong className="text-teal-700 font-mono">{formacao.horas} h</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Burocracia:</span>
              <strong className={formacao.burocracia ? 'text-emerald-700' : 'text-amber-700'}>
                {formacao.burocracia ? 'Validada' : 'Pendente'}
              </strong>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Registo em conformidade com o Serviço de Radioterapia
          </span>
          <div className="flex items-center gap-2">
            {cert.conteudoBase64 && (
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-md border border-teal-200 cursor-pointer inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descarregar</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-md cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
