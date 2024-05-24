import { Module, ActionTree, GetterTree } from "vuex";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import Directory from "@/Core/VirtualFileSystem/Directory";
import File from "@/Core/VirtualFileSystem/File";
import { UtilsDeclare } from "@/Types/UtilsDeclare";
import CompareFile from "@/Core/VirtualFileSystem/CompareFile";
import { editor } from "@/CoreUI/Editor/EditorPage";
import {
  BackupRoot,
  FlatRoot,
  GetParentByDirectory,
  GetParentByFile,
  IsDirectory,
} from "@/Utils/VirtualFileSystem/Index";

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

export type SearchTree = {
  label: string;
  expand: boolean;
  path: string;
  content: string;
  suffix: string;
  selected: boolean;
  children: { label: string; path: string; content_a: string; content_b: string; selected: boolean }[];
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
    const parent = GetParentByDirectory(directory);
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
    const parent = GetParentByFile(file) as IDirectory;
    parent.files.splice(parent.files.indexOf(file), 1);
    state.CurrentDirectory = parent;
  },
  //搜索方法
  async SearchContent({ state, dispatch }, text) {
    if (!state.Root.files) return null;

    var fileArr = state.Root.files.filter((e) => e.content.includes(text)) as IFile[];
    var treeArr = fileArr.map((e) => {
      return {
        label: e.name,
        suffix: e.suffix,
        expand: true,
        selected: false,
        path: e.path,
        content: e.content,
        children: [],
      };
    }) as SearchTree[];

    fileArr.forEach(async (e) => {
      if (e.children) {
        await dispatch("SearchChildrenFun", { text, fileArr: e.children, treeArr });
      }
    });

    treeArr.forEach((t) => {
      // 通过 split('\n') 将代码字符串拆分成每一行
      const lines = t.content.split("\n");
      // 遍历每一行
      lines.forEach(async (line, index) => {
        // 判断当前行是否包含目标字符
        if (line.includes(text)) {
          const lastOccurrence = line.lastIndexOf(text); // 获取最后一次出现的位置
          const content_a = line.substring(0, lastOccurrence); // 从开头截取到最后一次出现的位置
          const content_b = line.substring(lastOccurrence + text.length); // 从最后一次出现的位置截取到结尾

          t.children.push({
            label: text,
            path: index + 1 + "",
            content_a,
            content_b,
            selected: false,
          });
        }
      });
    });

    return treeArr;
  },
  //搜索子项方法
  async SearchChildrenFun({ state, dispatch }, { text, fileArr, treeArr }) {
    if (fileArr) {
      fileArr = fileArr.filter((e) => e.content.includes(text)) as IFile[];
      fileArr.forEach((f) => {
        treeArr.push({
          label: f.name,
          suffix: f.suffix,
          expand: true,
          selected: false,
          path: f.path,
          content: f.content,
          children: [],
        });
      });

      fileArr.forEach(async (e) => {
        await dispatch("SearchChildrenFun", { text, fileArr: e.children, treeArr });
      });
    }
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
      menus.push({ text: "删除", code: "delete", shortcutKey: "Delete" });
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
    localStorage.setItem("root", JSON.stringify(FlatRoot(state.Root)));
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

    // 备份Root
    BackupRoot(root);

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
