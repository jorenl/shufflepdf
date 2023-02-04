export interface State {
  files: SourceFile[];
  pages: Page[];
}

export interface SourceFile {
  id: string;
  name: string;
  file: File;
  pages: SourcePage[];
}

export interface SourcePage {
  thumbnail: string;
  width: number;
  height: number;
}

export interface Page {
  sourceFile: string;
  sourcePage: number;
  rotation: number;
}
