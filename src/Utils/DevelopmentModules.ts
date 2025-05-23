import { MemoizeResult } from ".";

export default class DevelopmentModules {
  @MemoizeResult
  static async Load() {
    let [UtilDesigner, DesignerDeclare, UtilVFS, CoreUndoStack, UtilControl, CorePath, ts, monaco, EditorPage] =
      await Promise.all([
        import("@/Utils/Designer/Designer"),
        import("@/Types/DesignerDeclare"),
        import("@/Utils/VirtualFileSystem/Index"),
        import("@/Core/Designer/UndoStack/Stack"),
        import("@/Utils/Designer/Controls"),
        import("@/Utils/VirtualFileSystem/Path"),
        import("typescript"),
        import("monaco-editor"),
        import("@/CoreUI/Editor/EditorPage"),
      ]);
    return {
      ...UtilDesigner,
      ...DesignerDeclare.DesignerDeclare,
      ...UtilVFS,
      ...CoreUndoStack,
      ...UtilControl,
      ...CorePath,
      ts,
      monaco,
      ...EditorPage,
    };
  }
}
