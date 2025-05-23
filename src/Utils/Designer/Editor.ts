import type Editor from "@/Core/Editor/Editor";

export let editor: Editor | null = null;

export async function createEditor(): Promise<Editor> {
  if (editor) return editor;
  const EditorModule = await import("@/Core/Editor/Editor");
  const EditorClass = EditorModule.default;
  editor = new EditorClass();
  return editor;
}

export function disposeEditor(): void {
  if (editor) {
    editor.Dispose();
    editor = null;
  }
}
