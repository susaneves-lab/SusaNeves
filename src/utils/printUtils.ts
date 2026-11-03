/**
 * Utilitário nativo de impressão hospitalar (RadForm · ULSAR).
 * Associa qualquer botão de "Imprimir" diretamente ao diálogo da impressora
 * configurada no dispositivo do utilizador através de uma iframe oculta da mesma origem,
 * garantindo foco correto, orientação A4 adequada e fidelidade total de estilos/gráficos SVG
 * sem depender de popups (window.open).
 */

export interface DevicePrintOptions {
  title?: string;
  orientation?: 'portrait' | 'landscape';
}

const PRINT_IFRAME_ID = 'radform-device-printer-iframe';

function getOrCreatePrintIframe(): HTMLIFrameElement {
  let iframe = document.getElementById(PRINT_IFRAME_ID) as HTMLIFrameElement | null;
  if (iframe && iframe.parentNode) {
    iframe.parentNode.removeChild(iframe);
  }
  iframe = document.createElement('iframe');
  iframe.id = PRINT_IFRAME_ID;
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-1';
  document.body.appendChild(iframe);
  return iframe;
}

function collectHeadStylesHtml(): string {
  const nodes = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"], link[rel="preconnect"]'));
  return nodes.map((node) => node.outerHTML).join('\n');
}

function buildPrintOverrideCss(orientation: 'portrait' | 'landscape'): string {
  return `
    @page {
      size: A4 ${orientation};
      margin: ${orientation === 'landscape' ? '8mm 8mm' : '10mm 10mm'};
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #0f172a !important;
      width: 100% !important;
      height: auto !important;
      overflow: visible !important;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .no-print {
      display: none !important;
    }
    .print-only, .print\\:block {
      display: block !important;
    }
    .hidden.print\\:block {
      display: block !important;
    }
    .print-document-container {
      position: static !important;
      left: auto !important;
      top: auto !important;
      z-index: auto !important;
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      overflow: visible !important;
    }
    .pdf-page-container {
      box-shadow: none !important;
      border: none !important;
      margin: 0 !important;
      padding: 4mm 2mm !important;
      min-height: 0 !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .pdf-page-container:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }
    .print-break-inside-avoid {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    table {
      border-collapse: collapse !important;
      width: 100% !important;
    }
    thead {
      display: table-header-group !important;
    }
    tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
  `;
}

function triggerIframeWindowPrint(iframe: HTMLIFrameElement): void {
  const iframeWin = iframe.contentWindow;
  if (!iframeWin) {
    window.focus();
    window.print();
    return;
  }

  let hasPrinted = false;
  const executePrint = () => {
    if (hasPrinted) return;
    hasPrinted = true;
    try {
      iframeWin.focus();
      iframeWin.print();
    } catch (err) {
      console.error('Erro ao invocar impressora via iframe, a usar fallback:', err);
      window.focus();
      window.print();
    }
  };

  const links = Array.from(iframe.contentDocument?.querySelectorAll('link[rel="stylesheet"]') || []) as HTMLLinkElement[];
  if (links.length === 0) {
    setTimeout(executePrint, 120);
    return;
  }

  let pending = links.length;
  const onAssetSettled = () => {
    pending -= 1;
    if (pending <= 0) {
      setTimeout(executePrint, 120);
    }
  };

  links.forEach((link) => {
    if (link.sheet) {
      onAssetSettled();
    } else {
      link.addEventListener('load', onAssetSettled, { once: true });
      link.addEventListener('error', onAssetSettled, { once: true });
    }
  });

  // Garantia de disparo rápido mesmo se algum stylesheet externo demorar
  setTimeout(executePrint, 450);
}

/**
 * Imprime diretamente um elemento DOM na impressora configurada do dispositivo.
 */
export function printElementOnDevicePrinter(
  element: HTMLElement | null | undefined,
  options: DevicePrintOptions = {}
): void {
  const orientation = options.orientation || 'portrait';
  const docTitle = options.title || document.title || 'ULSAR - Serviço de Radioterapia';

  if (!element) {
    window.focus();
    window.print();
    return;
  }

  try {
    const iframe = getOrCreatePrintIframe();
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      window.focus();
      window.print();
      return;
    }

    const clonedElement = element.cloneNode(true) as HTMLElement;
    // Garantir que contentores off-screen ou com scroll interno ficam 100% visíveis na impressão
    clonedElement.style.position = 'static';
    clonedElement.style.left = 'auto';
    clonedElement.style.top = 'auto';
    clonedElement.style.maxHeight = 'none';
    clonedElement.style.overflow = 'visible';
    clonedElement.classList.remove('fixed', '-left-[9999px]', '-top-[9999px]', 'overflow-y-auto', 'max-h-[94vh]');

    // Copiar conteúdo de eventuais elementos <canvas>
    const origCanvases = element.querySelectorAll('canvas');
    const clonedCanvases = clonedElement.querySelectorAll('canvas');
    origCanvases.forEach((origCanvas, index) => {
      const targetCanvas = clonedCanvases[index];
      if (targetCanvas) {
        targetCanvas.width = origCanvas.width;
        targetCanvas.height = origCanvas.height;
        const ctx = targetCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(origCanvas, 0, 0);
        }
      }
    });

    const headStyles = collectHeadStylesHtml();
    const overrideCss = buildPrintOverrideCss(orientation);

    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html>
<html lang="pt-PT">
  <head>
    <meta charset="utf-8" />
    <title>${docTitle}</title>
    ${headStyles}
    <style>${overrideCss}</style>
  </head>
  <body>
    <div id="radform-print-root"></div>
  </body>
</html>`);
    iframeDoc.close();

    const mountRoot = iframeDoc.getElementById('radform-print-root');
    if (mountRoot) {
      mountRoot.appendChild(clonedElement);
    }

    triggerIframeWindowPrint(iframe);
  } catch (err) {
    console.error('Erro ao preparar impressão no dispositivo:', err);
    window.focus();
    window.print();
  }
}

/**
 * Imprime um documento HTML autónomo na impressora configurada do dispositivo (sem window.open).
 */
export function printHtmlOnDevicePrinter(
  htmlBodyContent: string,
  options: DevicePrintOptions & { customCss?: string } = {}
): void {
  const orientation = options.orientation || 'portrait';
  const docTitle = options.title || 'ULSAR - Serviço de Radioterapia';

  try {
    const iframe = getOrCreatePrintIframe();
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      window.focus();
      window.print();
      return;
    }

    const overrideCss = buildPrintOverrideCss(orientation);
    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html>
<html lang="pt-PT">
  <head>
    <meta charset="utf-8" />
    <title>${docTitle}</title>
    <style>
      ${overrideCss}
      ${options.customCss || ''}
    </style>
  </head>
  <body>
    ${htmlBodyContent}
  </body>
</html>`);
    iframeDoc.close();

    triggerIframeWindowPrint(iframe);
  } catch (err) {
    console.error('Erro ao imprimir HTML no dispositivo:', err);
    window.focus();
    window.print();
  }
}
