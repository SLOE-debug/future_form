import { Module, ActionTree, GetterTree } from "vuex";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import Directory from "@/Core/VirtualFileSystem/Directory";
import File from "@/Core/VirtualFileSystem/File";
import { UtilsDeclare } from "@/Types/UtilsDeclare";
import CompareFile from "@/Core/VirtualFileSystem/CompareFile";
import { editor } from "@/CoreUI/Editor/EditorPage";

type IDirectory = VritualFileSystemDeclare.IDirectory;
type IFile = VritualFileSystemDeclare.IFile;
type ICompareFile = VritualFileSystemDeclare.ICompareFile;
type MenuItem = VritualFileSystemDeclare.MenuItem;
type Coord = UtilsDeclare.Coord;

const root = new Directory("");
// src 文件夹
// let src = new Directory("src");
// src.id = "614ee488-c450-4e5c-870a-8a072c986495";
// root.AddDirectory(src);

// Startup.ts文件
let Startup = new File("Startup.ts", true);
Startup.id = "0f254a1f-70d4-4a40-bf2d-32043638d62d";
root.AddFile(Startup);

export type VirtualFileSystemState = {
  Root: IDirectory;
  CurrentDirectory: IDirectory;
  CurrentFile: IFile;
  ContextMenus: MenuItem[];
  ContextMenuPosition: Coord;
  OpenFiles: IFile[];
  RootVersions: any[];
  // 当前版本
  CurrentVersion: string;
};

const state: VirtualFileSystemState = {
  Root: root,
  CurrentDirectory: root,
  CurrentFile: null,
  ContextMenus: [],
  ContextMenuPosition: null,
  OpenFiles: [],
  RootVersions: [],
  CurrentVersion: "last",
};

const actions: ActionTree<VirtualFileSystemState, any> = {
  // 寻找文件/文件夹父级
  FindParent({ state }, entity: IDirectory | IFile) {
    if (state.Root === entity) return null;
    let parent: IDirectory = null;
    const find = (dir: IDirectory) => {
      if (dir.directories.includes(entity as IDirectory) || dir.files.includes(entity as IFile)) {
        parent = dir;
        return;
      }

      dir.directories.forEach((d) => find(d));
    };
    find(state.Root);
    return parent;
  },
  // 取消选择所有文件/文件夹
  UnSelectAll({ state }) {
    state.CurrentDirectory && (state.CurrentDirectory.selected = false);
    state.CurrentFile && (state.CurrentFile.selected = false);
  },
  // 创建文件夹
  CreateDirectory({ state }) {
    const directory = new Directory("");
    directory.isRename = true;
    state.CurrentDirectory.AddDirectory(directory);
  },
  // 选择文件夹
  async SelectDirectory({ state, dispatch }, directory: IDirectory) {
    await dispatch("UnSelectAll");
    directory.selected = true;
    state.CurrentDirectory = directory;
    dispatch("SetMenus");
  },
  // 删除文件夹
  async DeleteDirectory({ state, dispatch }, directory: IDirectory) {
    const parent = (await dispatch("FindParent", directory)) as IDirectory;
    parent.directories.splice(parent.directories.indexOf(directory), 1);
    state.CurrentDirectory = parent;
  },
  // 创建文件
  CreateFile({ state, dispatch }) {
    const file: IFile = new File("");
    file.isRename = true;
    if (!state.CurrentDirectory.spread) state.CurrentDirectory.spread = true;
    state.CurrentDirectory.AddFile(file);
  },
  // 选择文件
  async SelectFile({ state, dispatch }, file: IFile) {
    // 如果文件是比较文件，关闭比较文件
    if (state.CurrentFile instanceof CompareFile) {
      editor.DisposeCompareFile();
      state.OpenFiles.splice(state.OpenFiles.indexOf(state.CurrentFile), 1);
    }

    await dispatch("UnSelectAll");
    if (file) {
      file.selected = true;
      state.CurrentFile = file;
      // 更换完文件后设置右键菜单
      dispatch("SetMenus");
      dispatch("OpenFile", file);
    } else {
      state.CurrentFile = null;
    }
  },
  // 删除文件
  async DeleteFile({ state, dispatch }, file: IFile) {
    //debugger;
    let parent = (await dispatch("FindParent", file)) as IDirectory;
    if(parent==null){
      var fileParent = state.Root.files.filter(e=>e.children.includes(file as IFile))[0];
      if(fileParent!=undefined){
        state.Root.files.splice(state.Root.files.indexOf(fileParent), 1);
      }
      parent = state.Root;
    }else{
      parent.files.splice(parent.files.indexOf(file), 1);
    }
    
    state.CurrentDirectory = parent;
  },
  // 获取当前选中的文件/文件夹
  GetCurrentEntity({ state }) {
    return state.CurrentDirectory.selected ? state.CurrentDirectory : state.CurrentFile;
  },
  // 设置右键菜单
  async SetMenus({ state, dispatch }) {
    let entity = (await dispatch("GetCurrentEntity")) as IDirectory | IFile;
    let menus = [];

    if (!entity.isProtected) {
      menus.push({ text: "重命名", code: "rename", shortcutKey: "F2" });
      menus.push({ text: "删除", code: "delete", shortcutKey: "F5" });
    }
    state.ContextMenus = menus;
  },
  // 设置右键菜单位置
  SetContextMenuPosition({ state }, position: Coord) {
    state.ContextMenuPosition = position;
  },
  // 清空右键菜单位置
  ClearContextMenuPosition({ state }) {
    state.ContextMenuPosition = null;
  },
  // 打开文件
  OpenFile({ state }, file: IFile) {
    if (state.OpenFiles.includes(file)) return;
    state.OpenFiles.push(file);
  },
  // 打开对比文件
  async OpenCompareFile({ state, dispatch }, file: ICompareFile) {
    await dispatch("UnSelectAll");
    state.CurrentFile = file;
    state.OpenFiles.push(file);
  },
  // 关闭文件
  async CloseFile({ state, dispatch }, file: IFile) {
    if (file.isUnsaved) state.CurrentFile.content = file.content;

    if (file instanceof CompareFile) {
      editor.DisposeCompareFile();
    }

    state.OpenFiles.splice(state.OpenFiles.indexOf(file), 1);

    let newFile = state.OpenFiles.length ? state.OpenFiles[state.OpenFiles.length - 1] : null;
    if (!newFile) {
      editor.editor?.dispose();
      editor.isConfigured = false;
      editor.editor = null;
    }

    await dispatch("SelectFile", newFile);
  },
  SaveRoot({ state }) {
    localStorage.setItem("root", JSON.stringify(state.Root));
  },
  // 切换版本设置Root
  async SetRoot({ state, dispatch }, root) {
    // 清空打开文件
    state.OpenFiles = [];
    // 释放编辑器
    editor.editor?.dispose();
    editor.isConfigured = false;
    editor.editor = null;

    state.CurrentFile = null;

    state.Root = root;
    state.CurrentDirectory = root;

    // 切换 editor 版本
    editor.SwitchVersion();
  },
  // 设置Root版本列表
  SetRootVersions({ state }, versions) {
    state.RootVersions = versions;
  },
  // 设置当前版本
  SetCurrentVersion({ state }, version) {
    state.CurrentVersion = version;
  },
};

const getters: GetterTree<VirtualFileSystemState, any> = {
  Root: (state) => state.Root,
  CurrentDirectory(state) {
    return state.CurrentDirectory;
  },
  CurrentFile(state) {
    return state.CurrentFile;
  },
  ContextMenus(state) {
    return state.ContextMenus;
  },
  OpenFiles(state) {
    return state.OpenFiles;
  },
  ContextMenuPosition: (state) => state.ContextMenuPosition,
  RootVersions: (state) => state.RootVersions,
  CurrentVersion: (state) => state.CurrentVersion,
};

const VirtualFileSystemModule: Module<VirtualFileSystemState, any> = {
  namespaced: true,
  state,
  actions,
  getters,
};

export default VirtualFileSystemModule;
