import { Cache } from "./Index";

export default class DevelopmentModules {
  @Cache
  static async Load() {
    let [UtilDesigner, UtilVFS, CoreUndoStack, UtilControl, CorePath, ts, monaco, EditorPage] = await Promise.all([
      import("@/Utils/Designer/Designer"),
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
