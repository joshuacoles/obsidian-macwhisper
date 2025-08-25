import {
  EditorView,
  Decoration,
  DecorationSet,
  ViewUpdate,
  ViewPlugin,
  WidgetType,
} from "@codemirror/view";
import { RangeSet } from "@codemirror/state";

class WhisperWidget extends WidgetType {
  toDOM(): HTMLElement {
    const div = document.createElement("div");
    div.style.cssText = `
      display: inline-block;
      padding: 4px 8px;
      margin: 0 2px;
      background-color: var(--background-secondary);
      border: 1px solid var(--background-modifier-border);
      border-radius: 4px;
      font-weight: bold;
      color: var(--text-normal);
      font-size: 0.9em;
    `;
    div.textContent = "FOUND";
    return div;
  }
}

function findWhisperEmbeds(view: EditorView): DecorationSet {
  const decorations: Array<any> = [];
  const doc = view.state.doc;

  // Regex to find whisper file embeds: ![[filename.whisper]] or ![[filename.whisper|alt]]
  const whisperEmbedRegex = /!\[\[([^|\]]+\.whisper)(?:\|[^\]]*)?\]\]/g;

  for (let lineNo = 1; lineNo <= doc.lines; lineNo++) {
    const line = doc.line(lineNo);
    const lineText = line.text;
    let match;

    while ((match = whisperEmbedRegex.exec(lineText)) !== null) {
      const from = line.from + match.index;
      const to = from + match[0].length;

      // Create a replacing decoration that replaces the embed with our widget
      const decoration = Decoration.replace({
        widget: new WhisperWidget(),
        inclusive: true,
        block: false,
      });

      decorations.push(decoration.range(from, to));
    }
  }

  return RangeSet.of(decorations);
}

class WhisperViewPlugin {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = findWhisperEmbeds(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = findWhisperEmbeds(update.view);
    }
  }
}

export const whisperEditorExtension = ViewPlugin.fromClass(WhisperViewPlugin, {
  decorations: (v) => v.decorations,
});
