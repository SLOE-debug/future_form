import { Module, ActionTree, GetterTree } from "vuex";
import { VritualFileSystem as VritualFileSystem } from "@/Types/VirtualFileSystem";
import Directory from "@/Core/VirtualFileSystem/Directory";
import File from "@/Core/VirtualFileSystem/File";

type IDirectory = VritualFileSystem.IDirectory;
type IFile = VritualFileSystem.IFile;
type MenuItem = VritualFileSystem.MenuItem;
type Coord = VritualFileSystem.Coord;

const root = new Directory("");
root.AddDirectory(new Directory("Src"));

let Startup = new File("Startup.ts", true);
Startup.content = ``;
root.AddFile(Startup);

export type VirtualFileSystemState = {
  Root: IDirectory;
  CurrentDirectory: IDirectory;
  CurrentFile: IFile;
  ContextMenus: MenuItem[];
  ContextMenuPosition: Coord;
  OpenFiles: IFile[];
};

const state: VirtualFileSystemState = {
  Root: root,
  CurrentDirectory: root,
  CurrentFile: null,
  ContextMenus: [],
  ContextMenuPosition: null,
  OpenFiles: [],
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
  // 创建文件夹
  CreateDirectory({ state, dispatch }) {
    const directory = new Directory("");
    directory.isRename = true;
    state.CurrentDirectory.directories.push(directory);
  },
  // 选择文件夹
  SelectDirectory({ state, dispatch }, directory: IDirectory) {
    state.CurrentDirectory && (state.CurrentDirectory.selected = false);
    state.CurrentFile && (state.CurrentFile.selected = false);
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
    state.CurrentDirectory.files.push(file);
  },
  // 选择文件
  SelectFile({ state, dispatch }, file: IFile) {
    state.CurrentDirectory && (state.CurrentDirectory.selected = false);
    state.CurrentFile && (state.CurrentFile.selected = false);
    if (state.CurrentFile && !state.CurrentFile.children?.includes(file)) {
      state.CurrentFile && state.CurrentFile.specialFile && (state.CurrentFile.spread = false);
    }
    if (file) {
      file.selected = true;
      if (file.specialFile) file.spread = true;
      state.CurrentFile = file;
      // 更换完文件后设置右键菜单
      dispatch("SetMenus");
      if (!file.specialFile) dispatch("OpenFile", file);
    } else {
      state.CurrentFile = null;
    }
  },
  // 删除文件
  async DeleteFile({ state, dispatch }, file: IFile) {
    const parent = (await dispatch("FindParent", file)) as IDirectory;
    parent.files.splice(parent.files.indexOf(file), 1);
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
  // 关闭文件
  CloseFile({ state, dispatch }, file: IFile) {
    if (file.isUnsaved) state.CurrentFile.content = file.content;

    state.OpenFiles.splice(state.OpenFiles.indexOf(file), 1);

    let newFile = state.OpenFiles.length ? state.OpenFiles[state.OpenFiles.length - 1] : null;
    dispatch("SelectFile", newFile);
  },
  SaveRoot({ state }) {
    localStorage.setItem("root", JSON.stringify(state.Root));
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
};

const VirtualFileSystemModule: Module<VirtualFileSystemState, any> = {
  namespaced: true,
  state,
  actions,
  getters,
};

export default VirtualFileSystemModule;
