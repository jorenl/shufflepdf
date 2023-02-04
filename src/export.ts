import { degrees, PDFDocument } from "pdf-lib";
import { Page, SourceFile } from "./types";

interface ExportPdfArgs {
  filesById: { [fileId: string]: SourceFile };
  pages: Page[];
  log: (s: string) => void;
}

export async function exportPdf({ filesById, pages, log }: ExportPdfArgs) {
  log("Initiating new pdf document");
  const pdf = await PDFDocument.create();

  const sourceDocuments: { [fileId: string]: PDFDocument } = {};

  let pageNum = 0;
  for (const page of pages) {
    log(`Generating page ${pageNum}`);
    const sourceFile = filesById[page.sourceFile];

    if (!sourceDocuments[page.sourceFile]) {
      log(`Loading file ${page.sourceFile} (${sourceFile.name}) with pdf-lib`);
      const buf = await sourceFile.file.arrayBuffer();
      const doc = await PDFDocument.load(buf);
      sourceDocuments[page.sourceFile] = doc;
    }

    const sourcePdfDoc = sourceDocuments[page.sourceFile];

    log(`Copying ${page.sourceFile}/p${page.sourcePage} to new pdf`);
    const [newPage] = await pdf.copyPages(sourcePdfDoc, [page.sourcePage]);

    if (page.rotation !== 0) {
      log(`Applying rotation`);
      const existing = newPage.getRotation().angle;
      newPage.setRotation(degrees(existing + (page.rotation % 360)));
    }

    pdf.addPage(newPage);
    pageNum++;
  }

  log(`Generate pdf bytes`);
  const pdfBytes = await pdf.save();

  const pdfUrl = URL.createObjectURL(
    new Blob([pdfBytes], { type: "application/pdf" })
  );

  return pdfUrl;
}
