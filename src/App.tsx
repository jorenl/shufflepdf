import React, { useRef, useState } from "react";
import "./App.css";

import {
  Import,
  Download,
  LongArrowLeftDown,
  LongArrowRightDown,
  ZoomIn,
  ZoomOut,
  Trash,
} from "iconoir-react";
import { cn, range, setWith, setWithout, useMapById } from "./util";
import Loader from "./Loader";
import { exportPdf } from "./export";
import { State } from "./types";
import { importPdf } from "./import";

const MIN_THUMB_SIZE = 64;
const INITIAL_THUMB_SIZE = 256;
const MAX_THUMB_SIZE = 1024;

const DRAG_THRESHOLD = 5;

const INITIAL_STATE: State = {
  files: [],
  pages: [],
};

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<State>(INITIAL_STATE);
  const [thumbSize, setThumbSize] = useState<number>(INITIAL_THUMB_SIZE);
  const [selection, setSelection] = useState<Set<number>>(() => new Set());
  const selectionAnchor = useRef<number>(0);
  const [dragging, setDragging] = useState<boolean>(false);
  const [working, setWorking] = useState<boolean>(false);

  const filesById = useMapById(state.files, "id");

  const onClickImport = () => {
    if (!fileInputRef.current) {
      return;
    }
    fileInputRef.current.click();
  };

  const onFileInputChange = async () => {
    if (!fileInputRef.current || !fileInputRef.current.files) {
      return;
    }
    setWorking(true);

    const file0 = fileInputRef.current.files[0];
    const result = await importPdf({ file: file0 });

    setState((s) => ({
      ...s,
      files: [...s.files, result.file],
      pages: [...s.pages, ...result.pages],
    }));
    setWorking(false);
  };

  const onClickSave = async () => {
    setWorking(true);
    const url = await exportPdf({
      filesById,
      pages: state.pages,
      log: (s) => console.log(s),
    });
    setWorking(false);
    window.open(url, "_blank");
  };

  const onClickDelete = () => {
    setState((s) => ({
      ...s,
      pages: s.pages.filter((p, i) => !selection.has(i)),
    }));
    setSelection(new Set());
  };

  const onClickTurnLeft = () => {
    setState((s) => ({
      ...s,
      pages: s.pages.map((p, i) =>
        selection.has(i) ? { ...p, rotation: p.rotation - 90 } : p
      ),
    }));
  };

  const onClickTurnRight = () => {
    setState((s) => ({
      ...s,
      pages: s.pages.map((p, i) =>
        selection.has(i) ? { ...p, rotation: p.rotation + 90 } : p
      ),
    }));
  };

  const onClickZoomIn = () => {
    setThumbSize((s) => Math.min(MAX_THUMB_SIZE, s * Math.sqrt(2)));
  };

  const onClickZoomOut = () => {
    setThumbSize((s) => Math.max(MIN_THUMB_SIZE, s / Math.sqrt(2)));
  };

  return (
    <div
      className={cn("App", ["is-dragging", dragging], ["is-working", working])}
    >
      <div className="App-toolbar">
        <button className="App-toolbar-button" onClick={onClickImport}>
          <Import />
          Import
        </button>
        <input
          className="App-toolbar-fileInput"
          type="file"
          accept=".pdf"
          ref={fileInputRef}
          onChange={onFileInputChange}
        />

        <button className="App-toolbar-button" onClick={onClickSave}>
          <Download />
          Save
        </button>

        <button className="App-toolbar-button" onClick={onClickDelete}>
          <Trash />
          Delete
        </button>

        <button className="App-toolbar-button" onClick={onClickTurnLeft}>
          <LongArrowLeftDown />
          Turn Left
        </button>

        <button className="App-toolbar-button" onClick={onClickTurnRight}>
          <LongArrowRightDown />
          Turn Right
        </button>

        <button className="App-toolbar-button" onClick={onClickZoomIn}>
          <ZoomIn />
          Zoom In
        </button>

        <button className="App-toolbar-button" onClick={onClickZoomOut}>
          <ZoomOut />
          Zoom Out
        </button>

        <Loader working={working} />
      </div>
      <div className="App-main">
        {state.pages.map((page, i) => {
          const sourceFile = filesById[page.sourceFile];
          const sourcePage = sourceFile.pages[page.sourcePage];

          const isSelected = selection.has(i);

          return (
            <div
              key={`p-${page.sourceFile}-${page.sourcePage}-${i}`}
              className={cn("App-page", ["is-selected", isSelected])}
              onMouseDown={(mouseDownEvent) => {
                mouseDownEvent.preventDefault();
                if (mouseDownEvent.ctrlKey) {
                  if (isSelected) {
                    setSelection((s) => setWithout(s, [i]));
                  } else {
                    setSelection((s) => setWith(s, [i]));
                  }
                } else if (mouseDownEvent.shiftKey) {
                  const range: number[] = [];
                  const from = Math.min(selectionAnchor.current, i);
                  const to = Math.max(selectionAnchor.current, i);
                  for (let ri = from; ri <= to; ri++) {
                    range.push(ri);
                  }
                  if (isSelected) {
                    setSelection((s) => setWithout(s, range));
                  } else {
                    setSelection((s) => setWith(s, range));
                  }
                } else {
                  // no modifier keys

                  // start drag
                  let dragging = false;
                  const onMouseMove = (mouseMoveEvent: MouseEvent) => {
                    const dx = Math.abs(
                      mouseMoveEvent.clientX - mouseDownEvent.clientX
                    );
                    const dy = Math.abs(
                      mouseMoveEvent.clientY - mouseDownEvent.clientY
                    );
                    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
                      if (!dragging) {
                        dragging = true;
                        setDragging(true);
                      }
                    }
                  };
                  const onMouseUp = () => {
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);
                    setDragging(false);
                  };
                  document.addEventListener("mousemove", onMouseMove);
                  document.addEventListener("mouseup", onMouseUp);

                  if (!isSelected) {
                    setSelection(new Set([i]));
                  }
                }
                selectionAnchor.current = i;
              }}
              onMouseUp={(e) => {
                if (dragging) {
                  const toInsert = state.pages.filter((p, pi) =>
                    selection.has(pi)
                  );
                  const rest = state.pages.filter(
                    (p, pi) => !selection.has(pi)
                  );

                  let insertAfterIndex = i - 1;
                  while (
                    insertAfterIndex >= 0 &&
                    selection.has(insertAfterIndex)
                  ) {
                    insertAfterIndex--;
                  }
                  if (insertAfterIndex == -1) {
                    setState((s) => ({ ...s, pages: [...toInsert, ...rest] }));
                    setSelection(new Set(range(0, toInsert.length)));
                  } else {
                    const insertAfterPage = state.pages[insertAfterIndex];
                    const insertAfterRestIndex = rest.indexOf(insertAfterPage);
                    const newPages = [...rest];
                    newPages.splice(insertAfterRestIndex + 1, 0, ...toInsert);
                    setState((s) => ({ ...s, pages: newPages }));
                    setSelection(
                      new Set(
                        range(
                          insertAfterRestIndex + 1,
                          insertAfterRestIndex + 1 + toInsert.length
                        )
                      )
                    );
                  }
                } else if (!e.ctrlKey && !e.shiftKey && isSelected) {
                  setSelection(new Set([i]));
                }
              }}
            >
              <div
                className="App-page-thumbnail"
                style={{
                  backgroundImage: `url(${sourcePage.thumbnail})`,
                  width: thumbSize,
                  height: thumbSize,
                  transform: `rotate(${page.rotation}deg)`,
                }}
              />
              <div className="App-page-fileName">{sourceFile.name}</div>
              <div className="App-page-pageNr">Page {page.sourcePage + 1}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
