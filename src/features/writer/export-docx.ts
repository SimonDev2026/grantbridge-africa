// Turns a draft into a Word file (github.com/dolanmiu/docx, MIT). For PDF, send the .docx to a
// self-hosted Gotenberg container (github.com/gotenberg/gotenberg, MIT): POST /forms/libreoffice/convert
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

export async function draftToDocx(orgName: string, grantTitle: string, sections: { title: string; body: string }[]) {
  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    sections: [{
      children: [
        new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(grantTitle)] }),
        new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: `Applicant: ${orgName}`, italics: true })] }),
        ...sections.flatMap((s) => [
          new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240 }, children: [new TextRun(s.title)] }),
          ...s.body.split(/\n{2,}/).map((para) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 120 }, children: [new TextRun(para)] })),
        ]),
      ],
    }],
  });
  return Packer.toBuffer(doc);
}

export async function docxToPdf(docx: Buffer): Promise<Buffer> {
  const form = new FormData();
  form.append('files', new Blob([new Uint8Array(docx)]), 'application.docx');
  const res = await fetch(`${process.env.GOTENBERG_URL}/forms/libreoffice/convert`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`PDF conversion failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
