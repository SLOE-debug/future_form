import { Module, ActionTree, GetterTree } from "vuex";
import { VritualFileSytem } from "@/Types/VirtualFileSystem";
import Directory from "@/Core/VirtualFileSystem/Directory";
import File from "@/Core/VirtualFileSystem/File";

type IDirectory = VritualFileSytem.IDirectory;
type IFile = VritualFileSytem.IFile;

export type FileSytemState = {
  Root: IDirectory;
  CurrentDirectory: IDirectory;
};

const root = new Directory("root");
const home = new Directory("home");
home.directories = [new Directory("user")];

home.files = [new File("file1.txt"), new File("main.ts"), new File("file3.txt")];

root.directories = [
  home,
  new Directory("bin"),
  new Directory("etc"),
  new Directory("var"),
  new Directory("tmp"),
  new Directory("usr"),
];
root.files = [new File("file1.txt"), new File("main.ts"), new File("file3.txt")];

const state: FileSytemState = {
  Root: root,
  CurrentDirectory: root,
};

const actions: ActionTree<FileSytemState, any> = {
  CreateDirectory({ state }, directoryName: string) {
    const directory = new Directory(directoryName);
    state.CurrentDirectory.directories.push(directory);
    return directory;
  },
  CreateFile({ state }, fileName: string) {
    const file: IFile = new File(fileName);
    state.CurrentDirectory.files.push(file);
    return file;
  },
};

const getters: GetterTree<FileSytemState, any> = {
  CurrentDirectory(state) {
    return state.CurrentDirectory;
  },
  Root(state) {
    return state.Root;
  },
};

const FileSytemModule: Module<FileSytemState, any> = {
  state,
  actions,
  getters,
};

export default FileSytemModule;
