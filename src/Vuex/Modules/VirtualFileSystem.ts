import { Module, ActionTree, GetterTree } from "vuex";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import Directory from "@/Core/VirtualFileSystem/Directory";
import File from "@/Core/VirtualFileSystem/File";
import { UtilsDeclare } from "@/Types/UtilsDeclare";
import { Guid } from "@/Utils/Index";

type IDirectory = VritualFileSystemDeclare.IDirectory;
type IFile = VritualFileSystemDeclare.IFile;
type MenuItem = VritualFileSystemDeclare.MenuItem;
type Coord = UtilsDeclare.Coord;

const root = new Directory("");
let src = new Directory("src");
root.AddDirectory(src);
src.spread = true;

let sql = new File("a.sql");
sql.content = `select a,b,c from a where b = :a`;
src.AddFile(sql);

let test = new File("");
src.AddFile(test);
test.name = "test.form.ts";
test.content = `export default class Page extends BaseWindow {
  constructor() {
    super('${test.id}');
  }
  Show(): void;
  btn_1: ButtonConfig;
}`;
test.extraData = {
  name: "test",
  width: 700,
  height: 500,
  type: "Form",
  title: "测试",
  bgColor: "#F1F1F1",
  enterBtn: "",
  $children: [
    {
      width: 100,
      height: 25,
      left: 100,
      top: 100,
      type: "Button",
      text: "向左移动10px",
      fontSize: 14,
      style: "",
      loading: false,
      visible: true,
      name: "btn_1",
      onClick: "btn_1_OnClick",
      id: Guid.NewGuid(),
    },
    {
      width: 120,
      height: 25,
      left: 150,
      top: 150,
      type: "Button",
      text: "打开login窗体",
      fontSize: 14,
      style: "",
      loading: false,
      visible: true,
      name: "btn_2",
      id: Guid.NewGuid(),
    },
    {
      width: 200,
      height: 25,
      left: 200,
      top: 200,
      type: "Button",
      text: "以对话框形式打开login窗体",
      fontSize: 14,
      style: "",
      loading: false,
      visible: true,
      name: "btn_3",
      id: Guid.NewGuid(),
    },
  ],
};
test.children[0].content = `import Page from "../test.form";
export default class test extends Page {
  btn_1_OnClick(sender: any, e: MouseEvent) {
    this.btn_1.left -= 10;
  }
}`;

test.specialFile = true;

let login = new File("");
src.AddFile(login);
login.name = "login.form.ts";
login.specialFile = true;
login.extraData = {
  name: "login",
  width: 300,
  height: 200,
  type: "Form",
  title: "登录",
  bgColor: "#F1F1F1",
  enterBtn: "",
  $children: [
    {
      width: 100,
      height: 25,
      left: 100,
      top: 100,
      type: "Button",
      text: "登录",
      fontSize: 14,
      style: "",
      loading: false,
      visible: true,
      name: "btn_1",
      id: Guid.NewGuid(),
    },
  ],
};

let Startup = new File("Startup.ts", true);
Startup.content = `import test from './src/test.form/test'
new test().Show()`;
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
