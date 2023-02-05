import * as pdfjs from "pdfjs-dist";
import PdfJsWorker from "pdfjs-dist/build/pdf.worker?url";
import { Page, SourceFile, SourcePage } from "./types";

const THUMB_WIDTH = 720;

let fileIdx = 0;

interface ImportPdfArgs {
  file: File;
}

interface ImportPdfResult {
  file: SourceFile;
  pages: Page[];
}

export async function importPdf({
  file,
}: ImportPdfArgs): Promise<ImportPdfResult> {
  const buf = await file.arrayBuffer();
  pdfjs.GlobalWorkerOptions.workerSrc = PdfJsWorker;
  const task = pdfjs.getDocument(buf);
  const doc = await task.promise;

  const sourcePages: SourcePage[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);

    const s1viewport = page.getViewport({ scale: 1 });
    const scale = THUMB_WIDTH / s1viewport.width;

    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const canvasContext = canvas.getContext("2d");

    if (!canvasContext) {
      throw new Error("No canvas context to render to");
    }

    const renderTask = page.render({ canvasContext, viewport });
    await renderTask.promise;

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve);
    });

    if (!blob) {
      throw new Error("Couln't createf blob from canvas");
    }

    const thumbnail = URL.createObjectURL(blob);
    sourcePages.push({
      thumbnail,
      width: s1viewport.width,
      height: s1viewport.height,
    });
  }

  const fileId = `f${++fileIdx}`;

  return {
    file: {
      id: fileId,
      name: file.name,
      file: file,
      pages: sourcePages,
    },
    pages: sourcePages.map((page, p) => ({
      sourceFile: fileId,
      sourcePage: p,
      rotation: 0,
    })),
  };
}
