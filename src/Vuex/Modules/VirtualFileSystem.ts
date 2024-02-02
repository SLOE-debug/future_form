import { Module, ActionTree, GetterTree } from "vuex";
import { VritualFileSytem } from "@/Types/VirtualFileSystem";
import Directory from "@/Core/VirtualFileSystem/Directory";
import File from "@/Core/VirtualFileSystem/File";

type IDirectory = VritualFileSytem.IDirectory;
type IFile = VritualFileSytem.IFile;
type MenuItem = VritualFileSytem.MenuItem;

export type VirtualFileSytemState = {
  Root: IDirectory;
  CurrentDirectory: IDirectory;
  CurrentFile: IFile;
  ContextMenus: MenuItem[];
  OpenFiles: IFile[];
};

const root = new Directory("");
const home = new Directory("home");
root.AddDirectory(home);
home.AddDirectory(new Directory("user"));

let file = new File("file1.ts");
file.content = `export default class File {
  constructor(){
    
  }
}`;

home.AddFile(file, new File("file2.txt"), new File("file3.txt"));

let Main = new File("Main.ts", true);
Main.content = `export default class Main {
  constructor(){
    console.log('Main 被创建')
  }
}`;
let Index = new File("Index.ts");
Index.content = `import Main from './Main'

class Index {
  constructor(){
    console.log('Index 被创建')
    console.log(new Main())
  }
}
new Index()`;

root.AddFile(Main, Index);

const state: VirtualFileSytemState = {
  Root: root,
  CurrentDirectory: root,
  CurrentFile: null,
  ContextMenus: [],
  OpenFiles: [],
};

const actions: ActionTree<VirtualFileSytemState, any> = {
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
    state.CurrentDirectory.files.push(file);
  },
  // 选择文件
  SelectFile({ state, dispatch }, file: IFile) {
    state.CurrentDirectory && (state.CurrentDirectory.selected = false);
    state.CurrentFile && (state.CurrentFile.selected = false);
    file.selected = true;
    state.CurrentFile = file;
    dispatch("SetMenus");
    dispatch("OpenFile", file);
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
  // 打开文件
  OpenFile({ state }, file: IFile) {
    if (state.OpenFiles.includes(file)) return;
    state.OpenFiles.push(file);
  },
  // 关闭文件
  CloseFile({ state }, file: IFile) {
    state.OpenFiles.splice(state.OpenFiles.indexOf(file), 1);
    console.log(state.OpenFiles);
  },
};

const getters: GetterTree<VirtualFileSytemState, any> = {
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
};

const VirtualFileSytemModule: Module<VirtualFileSytemState, any> = {
  namespaced: true,
  state,
  actions,
  getters,
};

export default VirtualFileSytemModule;
