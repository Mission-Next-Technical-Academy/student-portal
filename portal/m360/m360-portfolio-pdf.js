(() => {
  'use strict';

  const PAGE_W = 612;
  const PAGE_H = 792;
  const MARGIN = 54;
  const BODY_W = PAGE_W - (MARGIN * 2);
  const COLORS = {
    navy: [0.071, 0.216, 0.329],
    mission: [0.122, 0.306, 0.475],
    orange: [0.949, 0.416, 0.180],
    steel: [0.349, 0.388, 0.427],
    light: [0.945, 0.965, 0.980],
    line: [0.855, 0.898, 0.929],
    green: [0.196, 0.380, 0.239],
    white: [1, 1, 1],
    black: [0.10, 0.12, 0.14]
  };

  function normalizeText(value) {
    return String(value == null ? '' : value)
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u2026/g, '...')
      .replace(/\u2192/g, '->')
      .replace(/\u2190/g, '<-')
      .replace(/\u00A0/g, ' ')
      .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
      .replace(/[\t ]+/g, ' ')
      .trim();
  }

  function pdfEscape(value) {
    return normalizeText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  function widthFactor(ch) {
    if ('ilI.,:;!|\'`'.includes(ch)) return 0.25;
    if ('mwMW@%&'.includes(ch)) return 0.84;
    if ('ABCDEFGHJKLMNOPQRSTUVWXYZ'.includes(ch)) return 0.62;
    if ('0123456789'.includes(ch)) return 0.56;
    if (ch === ' ') return 0.28;
    return 0.50;
  }

  function measure(text, size) {
    return Array.from(normalizeText(text)).reduce((sum, ch) => sum + widthFactor(ch) * size, 0);
  }

  function wrapText(text, maxWidth, size) {
    const normalized = normalizeText(text);
    if (!normalized) return [];
    const sourceLines = normalized.split(/\r?\n/);
    const output = [];
    for (const source of sourceLines) {
      const words = source.split(/\s+/).filter(Boolean);
      if (!words.length) { output.push(''); continue; }
      let line = '';
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (measure(candidate, size) <= maxWidth) {
          line = candidate;
          continue;
        }
        if (line) output.push(line);
        if (measure(word, size) <= maxWidth) {
          line = word;
          continue;
        }
        let chunk = '';
        for (const ch of word) {
          const next = chunk + ch;
          if (measure(next, size) <= maxWidth) chunk = next;
          else { if (chunk) output.push(chunk); chunk = ch; }
        }
        line = chunk;
      }
      if (line) output.push(line);
    }
    return output;
  }

  function rgb(color) { return `${color[0]} ${color[1]} ${color[2]}`; }
  function fmt(n) { return Number(n.toFixed(2)); }

  class PdfDoc {
    constructor(model) {
      this.model = model || {};
      this.pages = [];
      this.page = null;
      this.y = PAGE_H - MARGIN;
      this.pageNumber = 0;
      this.addPage();
    }

    addPage() {
      this.pageNumber += 1;
      const page = { commands: [] };
      this.pages.push(page);
      this.page = page;
      this.y = PAGE_H - MARGIN;
      if (this.pageNumber > 1) this.drawPageHeader();
    }

    cmd(s) { this.page.commands.push(s); }
    setFill(color) { this.cmd(`${rgb(color)} rg`); }
    setStroke(color) { this.cmd(`${rgb(color)} RG`); }
    rect(x, y, w, h, fill = true, stroke = false) {
      this.cmd(`${fmt(x)} ${fmt(y)} ${fmt(w)} ${fmt(h)} re ${fill && stroke ? 'B' : fill ? 'f' : 'S'}`);
    }
    line(x1, y1, x2, y2, width = 1) {
      this.cmd(`${fmt(width)} w ${fmt(x1)} ${fmt(y1)} m ${fmt(x2)} ${fmt(y2)} l S`);
    }
    text(x, y, text, size = 10, font = 'F1', color = COLORS.black) {
      const safe = pdfEscape(text);
      if (!safe) return;
      this.cmd(`BT /${font} ${fmt(size)} Tf ${rgb(color)} rg ${fmt(x)} ${fmt(y)} Td (${safe}) Tj ET`);
    }

    ensure(height, afterPageHeader = 18) {
      if (this.y - height >= 58) return;
      this.addPage();
      this.y -= afterPageHeader;
    }

    drawPageHeader() {
      this.text(MARGIN, PAGE_H - 38, 'MISSION NEXT TECHNICAL ACADEMY', 8.5, 'F2', COLORS.mission);
      this.text(PAGE_W - MARGIN - 175, PAGE_H - 38, 'M360 101 PROFESSIONAL PORTFOLIO', 8, 'F1', COLORS.steel);
      this.setStroke(COLORS.line);
      this.line(MARGIN, PAGE_H - 47, PAGE_W - MARGIN, PAGE_H - 47, 0.7);
      this.y = PAGE_H - 70;
    }

    drawCover() {
      const accepted = Number(this.model.readyCount || 0);
      const grade = this.model.finalGrade == null ? null : Number(this.model.finalGrade);
      this.setFill(COLORS.navy);
      this.rect(0, PAGE_H - 330, PAGE_W, 330, true, false);
      this.setFill(COLORS.orange);
      this.rect(MARGIN, PAGE_H - 64, 92, 5, true, false);
      this.text(MARGIN, PAGE_H - 92, 'MISSION NEXT TECHNICAL ACADEMY', 10, 'F2', COLORS.white);
      this.text(MARGIN, PAGE_H - 110, 'M360 101 / PROFESSIONAL READINESS', 9, 'F1', [0.76, 0.86, 0.92]);
      this.text(MARGIN, PAGE_H - 165, 'PROFESSIONAL', 30, 'F2', COLORS.white);
      this.text(MARGIN, PAGE_H - 202, 'PORTFOLIO', 30, 'F2', COLORS.orange);
      const direction = normalizeText(this.model.direction || 'Direction to Proof');
      const directionLines = wrapText(direction, 410, 15);
      let y = PAGE_H - 240;
      directionLines.slice(0, 2).forEach(line => { this.text(MARGIN, y, line, 15, 'F2', COLORS.white); y -= 20; });
      const brand = normalizeText(this.model.brandStatement || 'Reviewer-approved professional-readiness evidence.');
      wrapText(brand, 440, 10.5).slice(0, 4).forEach(line => { this.text(MARGIN, y, line, 10.5, 'F1', [0.88, 0.93, 0.96]); y -= 15; });

      const cardY = PAGE_H - 430;
      this.setFill(COLORS.light);
      this.rect(MARGIN, cardY, BODY_W, 72, true, false);
      this.text(MARGIN + 18, cardY + 47, 'PORTFOLIO READY', 8.5, 'F2', COLORS.mission);
      this.text(MARGIN + 18, cardY + 20, `${accepted} / 6`, 20, 'F2', COLORS.navy);
      this.text(MARGIN + 170, cardY + 47, 'FINAL GRADE', 8.5, 'F2', COLORS.mission);
      this.text(MARGIN + 170, cardY + 20, grade == null ? '-' : `${grade.toFixed(1)}%`, 20, 'F2', COLORS.navy);
      this.text(MARGIN + 310, cardY + 47, 'COURSE STATUS', 8.5, 'F2', COLORS.mission);
      this.text(MARGIN + 310, cardY + 20, this.model.courseComplete ? 'M360 COMPLETE' : 'IN PROGRESS', 12, 'F2', this.model.courseComplete ? COLORS.green : COLORS.navy);

      let metaY = cardY - 38;
      if (this.model.studentId) { this.text(MARGIN, metaY, `Student ID: ${this.model.studentId}`, 9.5, 'F1', COLORS.steel); metaY -= 16; }
      if (this.model.trackLabel) { this.text(MARGIN, metaY, `Technical pathway: ${this.model.trackLabel}`, 9.5, 'F1', COLORS.steel); metaY -= 16; }
      this.text(MARGIN, metaY, `Generated: ${this.model.generatedDate || new Date().toLocaleDateString()}`, 9.5, 'F1', COLORS.steel);

      this.setStroke(COLORS.line);
      this.line(MARGIN, 86, PAGE_W - MARGIN, 86, 0.8);
      this.text(MARGIN, 66, 'This portfolio contains reviewer-approved M360 evidence and excludes private drafts, instructor feedback,', 8.5, 'F1', COLORS.steel);
      this.text(MARGIN, 52, 'raw networking details, and technical-course records.', 8.5, 'F1', COLORS.steel);
    }

    sectionHeading(section) {
      this.ensure(66);
      this.text(MARGIN, this.y, `WEEK ${section.week} / ${section.kicker || ''}`, 8.5, 'F2', COLORS.orange);
      this.y -= 18;
      const titleLines = wrapText(section.title || '', BODY_W, 18);
      titleLines.forEach(line => { this.text(MARGIN, this.y, line, 18, 'F2', COLORS.navy); this.y -= 23; });
      this.setStroke(COLORS.line);
      this.line(MARGIN, this.y + 5, PAGE_W - MARGIN, this.y + 5, 0.8);
      this.y -= 15;
    }

    field(field) {
      const label = normalizeText(field.label || '');
      const bullets = Array.isArray(field.bullets) ? field.bullets.map(normalizeText).filter(Boolean) : [];
      const value = normalizeText(field.value || '');
      const url = normalizeText(field.url || '');
      if (!value && !bullets.length && !url) return;
      const labelLines = wrapText(label.toUpperCase(), 150, 8.2);
      let bodyLines = [];
      if (value) bodyLines = wrapText(value, 330, 10.2);
      if (url) bodyLines.push(...wrapText(url, 330, 8.7));
      bullets.forEach(item => {
        const wrapped = wrapText(item, 318, 10.2);
        wrapped.forEach((line, idx) => bodyLines.push(`${idx === 0 ? '- ' : '  '}${line}`));
      });
      const lineCount = Math.max(labelLines.length, bodyLines.length, 1);
      const height = 14 + lineCount * 13;
      this.ensure(height + 8);
      this.text(MARGIN, this.y, labelLines[0] || label.toUpperCase(), 8.2, 'F2', COLORS.mission);
      for (let i = 1; i < labelLines.length; i++) this.text(MARGIN, this.y - i * 11, labelLines[i], 8.2, 'F2', COLORS.mission);
      bodyLines.forEach((line, idx) => this.text(MARGIN + 165, this.y - idx * 13, line, idx > 0 && line.startsWith('  ') ? 9.8 : 10.2, 'F1', COLORS.steel));
      this.y -= height;
      this.setStroke(COLORS.line);
      this.line(MARGIN, this.y + 6, PAGE_W - MARGIN, this.y + 6, 0.45);
      this.y -= 6;
    }

    drawSections() {
      const sections = Array.isArray(this.model.sections) ? this.model.sections : [];
      for (const section of sections) {
        if (!Array.isArray(section.fields) || !section.fields.some(f => normalizeText(f.value || f.url || '') || (Array.isArray(f.bullets) && f.bullets.some(normalizeText)))) continue;
        if (this.pageNumber === 1) this.addPage();
        else if (this.y < 240) this.addPage();
        this.sectionHeading(section);
        section.fields.forEach(field => this.field(field));
        this.y -= 18;
      }
    }

    drawFinalSummary() {
      this.ensure(160);
      this.text(MARGIN, this.y, 'PORTFOLIO SUMMARY', 8.5, 'F2', COLORS.orange);
      this.y -= 20;
      this.text(MARGIN, this.y, 'Direction to Proof', 18, 'F2', COLORS.navy);
      this.y -= 28;
      const summary = this.model.courseComplete
        ? 'This M360 portfolio reflects six reviewer-approved professional-readiness artifacts. The course completion record indicates that the final grade standard, Career Spotlight presentation requirement, and attendance verification requirement were met.'
        : 'This PDF reflects the reviewer-approved M360 artifacts available at the time of download. Course completion may still require additional accepted work, the final grade standard, Career Spotlight presentation completion, and attendance verification.';
      wrapText(summary, BODY_W, 10.2).forEach(line => { this.text(MARGIN, this.y, line, 10.2, 'F1', COLORS.steel); this.y -= 14; });
    }

    footerCommands(pageNumber, totalPages) {
      const page = this.pages[pageNumber - 1];
      page.commands.push(`${rgb(COLORS.line)} RG 0.6 w ${MARGIN} 38 m ${PAGE_W - MARGIN} 38 l S`);
      page.commands.push(`BT /F1 7.5 Tf ${rgb(COLORS.steel)} rg ${MARGIN} 23 Td (MISSION NEXT TECHNICAL ACADEMY / M360 101 PROFESSIONAL PORTFOLIO) Tj ET`);
      const pageText = `Page ${pageNumber} of ${totalPages}`;
      page.commands.push(`BT /F1 7.5 Tf ${rgb(COLORS.steel)} rg ${PAGE_W - MARGIN - measure(pageText, 7.5)} 23 Td (${pdfEscape(pageText)}) Tj ET`);
    }

    build() {
      this.drawCover();
      this.drawSections();
      if (this.pageNumber === 1) this.addPage();
      this.drawFinalSummary();
      const totalPages = this.pages.length;
      for (let i = 1; i <= totalPages; i++) this.footerCommands(i, totalPages);
      return buildPdfBytes(this.pages);
    }
  }

  function buildPdfBytes(pages) {
    const objects = [null];
    const addObject = content => { objects.push(content); return objects.length - 1; };
    const fontRegular = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    const fontBold = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const pagesObject = addObject('');
    const pageRefs = [];
    for (const page of pages) {
      const stream = page.commands.join('\n');
      const contentObject = addObject(`<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`);
      const pageObject = addObject(`<< /Type /Page /Parent ${pagesObject} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${contentObject} 0 R >>`);
      pageRefs.push(pageObject);
    }
    objects[pagesObject] = `<< /Type /Pages /Kids [${pageRefs.map(ref => `${ref} 0 R`).join(' ')}] /Count ${pageRefs.length} >>`;
    const catalogObject = addObject(`<< /Type /Catalog /Pages ${pagesObject} 0 R >>`);

    const parts = ['%PDF-1.4\n%M360\n'];
    const offsets = [0];
    let byteLength = new TextEncoder().encode(parts[0]).length;
    for (let i = 1; i < objects.length; i++) {
      offsets[i] = byteLength;
      const part = `${i} 0 obj\n${objects[i]}\nendobj\n`;
      parts.push(part);
      byteLength += new TextEncoder().encode(part).length;
    }
    const xrefOffset = byteLength;
    let xref = `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let i = 1; i < objects.length; i++) xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    const trailer = `${xref}trailer\n<< /Size ${objects.length} /Root ${catalogObject} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    parts.push(trailer);
    return new TextEncoder().encode(parts.join(''));
  }

  function build(model) {
    return new PdfDoc(model).build();
  }

  function download(model, fileName) {
    const bytes = build(model);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName || 'Mission-Next-M360-Professional-Portfolio.pdf';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  const api = { build, download, normalizeText };
  if (typeof window !== 'undefined') window.M360PortfolioPDF = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
