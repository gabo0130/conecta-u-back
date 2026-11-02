// Utilidades comunes para generar los documentos de la tesis (PGCS01) en .docx con `docx`.
// Carta, márgenes de 2,5 cm, Arial 11, encabezado con el código del documento y pie con página.
const fs = require('fs');
const path = require('path');
const {
  AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, LevelFormat, Packer, PageBreak,
  PageNumber, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, VerticalAlign, WidthType,
  TableOfContents, PageOrientation,
} = require('docx');

const PAGE = { width: 12240, height: 15840 };
const MARGIN = 1418; // 2,5 cm
let CONTENT = PAGE.width - 2 * MARGIN; // 9404 DXA; en horizontal, 13004
/** Llamar antes de armar el contenido de un documento horizontal. */
const useLandscape = () => { CONTENT = PAGE.height - 2 * MARGIN; };
const RED = 'AA1916';
const GRAY = 'F2F2F2';
const SOFT = 'FBE9E8';
const OUT = path.join(__dirname, '..', 'documentos');

/** Texto con **negrita** e _itálica_ simples → runs. */
function runs(text, base = {}) {
  const parts = [];
  // **negrita**, _itálica_ (solo entre espacios: `MATCH_TOP_N` no es itálica) y `código`.
  const re = /(\*\*[^*]+\*\*|(?<![\w`])_[^_\s][^_]*_(?![\w])|`[^`]+`)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const token = m[0];
    if (token.startsWith('**')) parts.push(new TextRun({ text: token.slice(2, -2), bold: true, ...base }));
    else if (token.startsWith('`')) parts.push(new TextRun({ text: token.slice(1, -1), font: 'Consolas', ...base, size: base.size ? base.size - 1 : 20 }));
    else parts.push(new TextRun({ text: token.slice(1, -1), italics: true, ...base }));
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(new TextRun({ text: text.slice(last), ...base }));
  return parts;
}

const p = (text, opts = {}) =>
  new Paragraph({ children: runs(text, opts.run), spacing: { after: 120, line: 300 }, alignment: opts.align ?? AlignmentType.JUSTIFIED, ...opts.paragraph });
const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const h3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
const bullets = (items, level = 0) =>
  items.map((t) => new Paragraph({ numbering: { reference: 'bullets', level }, children: runs(t), spacing: { after: 60, line: 280 } }));
let numberingInstance = 0;
/** Lista numerada que reinicia en 1 cada vez. */
const numbered = (items) => {
  const instance = ++numberingInstance;
  return items.map((t) => new Paragraph({ numbering: { reference: 'numbers', level: 0, instance }, children: runs(t), spacing: { after: 80, line: 280 } }));
};
/** Índice (Word lo completa al abrir el documento; pedir «Actualizar campos» si no aparece). */
const toc = () => [new TableOfContents('Contenido', { hyperlink: true, headingStyleRange: '1-2' })];
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });
const spacer = (after = 120) => new Paragraph({ children: [], spacing: { after } });

/** Recuadro sombreado (avisos: SIMULACIÓN, instrucciones). */
const note = (text, fill = SOFT) =>
  new Paragraph({
    children: runs(text),
    shading: { type: ShadingType.CLEAR, fill, color: 'auto' },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: RED, space: 8 } },
    spacing: { before: 120, after: 160, line: 280 },
    indent: { left: 120, right: 120 },
  });

const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

/**
 * Tabla con anchos en DXA (proporcionales; se escalan al ancho útil). `rows` son arreglos de textos.
 * `opts.minHeight` deja filas en blanco altas para diligenciar a mano.
 */
function table(headers, rows, widths, opts = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  const scaled = widths.map((w) => Math.floor((w / total) * CONTENT));
  scaled[scaled.length - 1] += CONTENT - scaled.reduce((a, b) => a + b, 0);
  const size = opts.size ?? 18;
  const cell = (text, i, header) =>
    new TableCell({
      borders,
      width: { size: scaled[i], type: WidthType.DXA },
      shading: header ? { type: ShadingType.CLEAR, fill: RED, color: 'auto' } : opts.zebra && opts._zebra ? { type: ShadingType.CLEAR, fill: GRAY, color: 'auto' } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      verticalAlign: VerticalAlign.CENTER,
      children: String(text ?? '')
        .split('\n')
        .map((line) => new Paragraph({ children: runs(line, { size, color: header ? 'FFFFFF' : undefined, bold: header || undefined }), spacing: { after: 20 } })),
    });
  const tableRows = [];
  if (headers) tableRows.push(new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, i, true)) }));
  rows.forEach((r, index) => {
    opts._zebra = index % 2 === 1;
    tableRows.push(new TableRow({ height: opts.minHeight ? { value: opts.minHeight, rule: 'atLeast' } : undefined, children: r.map((c, i) => cell(c, i, false)) }));
  });
  return new Table({ width: { size: CONTENT, type: WidthType.DXA }, columnWidths: scaled, rows: tableRows });
}

/** Bloque de datos del documento (ficha). */
const ficha = (pairs) => table(null, pairs.map(([k, v]) => [`**${k}**`, v]), [3, 7], { size: 19 });

function cover({ code, title, subtitle, phase, version = '1.0', date = '2 de noviembre de 2026', extra = [] }) {
  return [
    new Paragraph({ children: [new TextRun({ text: 'UNIVERSIDAD FRANCISCO DE PAULA SANTANDER', bold: true, size: 22, color: RED })], alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
    new Paragraph({ children: [new TextRun({ text: 'Programa de Ingeniería de Sistemas · Trabajo de grado PGCS01', size: 20 })], alignment: AlignmentType.CENTER, spacing: { after: 240 } }),
    new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 34 })], alignment: AlignmentType.CENTER, spacing: { after: 120 } }),
    subtitle ? new Paragraph({ children: [new TextRun({ text: subtitle, size: 22, italics: true })], alignment: AlignmentType.CENTER, spacing: { after: 240 } }) : spacer(),
    ficha([
      ['Proyecto', 'Conecta U: Sistema web inteligente para la articulación de necesidades, capacidades y proyectos colaborativos en la UFPS'],
      ['Autores', 'Jhony Gabriel Quintero Gómez · Walter Steven Casadiegos Quintero'],
      ['Directora', 'Dra. Judith del Pilar Rodríguez Tenjo'],
      ['Código del documento', code],
      ['Fase DSR', phase],
      ['Versión y fecha', `${version} · ${date}`],
      ...extra,
    ]),
    spacer(200),
  ];
}

function build(fileName, code, nested, { landscape = false, toc = false } = {}) {
  // Las listas devuelven arreglos de párrafos: se aplanan aquí.
  const children = nested.flat(Infinity);
  const header = new Header({
    children: [new Paragraph({ children: [new TextRun({ text: `Conecta U · Trabajo de grado PGCS01 · ${code}`, size: 16, color: '808080' })], alignment: AlignmentType.RIGHT })],
  });
  const footer = new Footer({
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ['Página ', PageNumber.CURRENT, ' de ', PageNumber.TOTAL_PAGES], size: 16, color: '808080' })] })],
  });
  const body = children;
  const doc = new Document({
    creator: 'Conecta U',
    title: fileName.replace(/\.docx$/, ''),
    features: { updateFields: toc },
    styles: {
      default: { document: { run: { font: 'Arial', size: 22 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, color: RED, font: 'Arial' }, paragraph: { spacing: { before: 300, after: 160 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, font: 'Arial' }, paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 22, bold: true, italics: true, font: 'Arial' }, paragraph: { spacing: { before: 160, after: 100 }, outlineLevel: 2 } },
      ],
    },
    numbering: {
      config: [
        { reference: 'bullets', levels: [0, 1].map((level) => ({ level, format: LevelFormat.BULLET, text: level === 0 ? '•' : '◦', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540 + level * 360, hanging: 260 } } } })) },
        { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 320 } } } }] },
      ],
    },
    sections: [
      {
        properties: { page: { size: landscape ? { width: PAGE.width, height: PAGE.height, orientation: PageOrientation.LANDSCAPE } : PAGE, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
        headers: { default: header },
        footers: { default: footer },
        children: body,
      },
    ],
  });
  return Packer.toBuffer(doc).then((buffer) => {
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, fileName), buffer);
    console.log('escrito', fileName);
  });
}

module.exports = { toc, useLandscape, p, h1, h2, h3, bullets, numbered, pageBreak, spacer, note, table, ficha, cover, build, runs, get CONTENT() { return CONTENT; } };
