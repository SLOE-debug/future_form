import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import Directory from "@/Core/VirtualFileSystem/Directory";
import File from "@/Core/VirtualFileSystem/File";
import { UtilsDeclare } from "@/Types/UtilsDeclare";
import CompareFile from "@/Core/VirtualFileSystem/CompareFile";
import { BackupRoot, FlatRoot, GetParentByDirectory, GetParentByFile } from "@/Utils/VirtualFileSystem/Index";
import { editor } from "@/Utils/Designer";

type IDirectory = VritualFileSystemDeclare.IDirectory;
type IFile = VritualFileSystemDeclare.IFile;
type ICompareFile = VritualFileSystemDeclare.ICompareFile;
type MenuItem = VritualFileSystemDeclare.MenuItem;
type Coord = UtilsDeclare.Coord;

const defaultRoot = new Directory("");
// Startup.ts文件
let Startup = new File("Startup.ts", true);
Startup.id = "0f254a1f-70d4-4a40-bf2d-32043638d62d";
defaultRoot.AddFile(Startup);

export const useVirtualFileSystemStore = defineStore("virtualFileSystem", () => {
  // state
  const root = ref<IDirectory>(defaultRoot);
  const currentDirectory = ref<IDirectory>(root.value);
  const currentFile = ref<IFile | null>(null);
  const contextMenus = ref<MenuItem[]>([]);
  const contextMenuPosition = ref<Coord | null>(null);
  const openFiles = ref<IFile[]>([]);
  const rootVersions = ref<any[]>([]);
  const currentVersion = ref<string>("last");
  const autoSelectNearFile = ref<boolean>(true);

  // getters
  const rootGetter = computed(() => root.value);
  const currentDirectoryGetter = computed(() => currentDirectory.value);
  const currentFileGetter = computed(() => currentFile.value);
  const contextMenusGetter = computed(() => contextMenus.value);
  const openFilesGetter = computed(() => openFiles.value);
  const contextMenuPositionGetter = computed(() => contextMenuPosition.value);
  const rootVersionsGetter = computed(() => rootVersions.value);
  const currentVersionGetter = computed(() => currentVersion.value);
  // actions
  // 取消选择所有文件/文件夹
  function UnSelectAll() {
    if (currentDirectory.value) currentDirectory.value.selected = false;
    if (currentFile.value) currentFile.value.selected = false;
  }

  // 创建文件夹
  function CreateDirectory() {
    const directory = new Directory("");
    directory.isRename = true;
    currentDirectory.value.AddDirectory(directory);
  }

  // 选择文件夹
  async function SelectDirectory(directory: IDirectory) {
    await UnSelectAll();
    directory.selected = true;
    currentDirectory.value = directory;
    SetMenus();
  }

  // 删除文件夹
  async function DeleteDirectory(directory: IDirectory) {
    const parent = GetParentByDirectory(root.value, directory);
    parent.directories.splice(parent.directories.indexOf(directory), 1);
    currentDirectory.value = parent;
  }

  // 创建文件
  function CreateFile() {
    const file: IFile = new File("");
    file.isRename = true;
    if (!currentDirectory.value.spread) currentDirectory.value.spread = true;
    currentDirectory.value.AddFile(file);
  }

  // 选择文件
  async function SelectFile(file: IFile | null) {
    // 如果文件是比较文件，关闭比较文件
    if (currentFile.value instanceof CompareFile) {
      editor.DisposeCompareFile();
      openFiles.value.splice(openFiles.value.indexOf(currentFile.value), 1);
    }

    await UnSelectAll();
    if (file) {
      file.selected = true;
      currentFile.value = file;
      // 更换完文件后设置右键菜单
      SetMenus();
      OpenFile(file);
    } else {
      currentFile.value = null;
    }
  }

  // 删除文件
  async function DeleteFile(file: IFile) {
    const parent = GetParentByFile(root.value, file) as IDirectory;
    parent.files.splice(parent.files.indexOf(file), 1);
    currentDirectory.value = parent;
  }

  // 获取当前选中的文件/文件夹
  function GetCurrentEntity() {
    return currentDirectory.value.selected ? currentDirectory.value : currentFile.value;
  }

  // 设置右键菜单
  function SetMenus() {
    const entity = GetCurrentEntity() as IDirectory | IFile;
    if (!entity) return;

    let menus: MenuItem[] = [];
    if (!entity.isProtected) {
      menus.push({ text: "重命名", code: "rename", shortcutKey: "F2" });
      menus.push({ text: "删除", code: "delete", shortcutKey: "Delete" });
    }
    contextMenus.value = menus;
  }

  // 设置右键菜单位置
  function SetContextMenuPosition(position: Coord) {
    contextMenuPosition.value = position;
  }

  // 清空右键菜单位置
  function ClearContextMenuPosition() {
    contextMenuPosition.value = null;
  }

  // 打开文件
  function OpenFile(file: IFile) {
    if (openFiles.value.includes(file)) return;
    openFiles.value.push(file);
  }

  // 打开对比文件
  async function OpenCompareFile(file: ICompareFile) {
    await UnSelectAll();
    currentFile.value = file;
    openFiles.value.push(file);
  }

  // 设置是否自动选择临近的文件
  function SetAutoSelectNearFile(value: boolean) {
    autoSelectNearFile.value = value;
  }

  // 关闭文件
  async function CloseFile(file: IFile) {
    if (file.isUnsaved && currentFile.value) currentFile.value.content = file.content;

    if (file instanceof CompareFile) {
      editor.DisposeCompareFile();
    }

    openFiles.value.splice(openFiles.value.indexOf(file), 1);

    if (!autoSelectNearFile.value) return;

    let newFile = openFiles.value.length ? openFiles.value[openFiles.value.length - 1] : null;
    if (!newFile) {
      editor.editor?.dispose();
      editor.isConfigured = false;
      editor.editor = null;
    }

    await SelectFile(newFile);
  }

  // 保存Root到本地
  function SaveRoot() {
    localStorage.setItem("root", JSON.stringify(FlatRoot(root.value)));
  }

  // 切换版本设置Root
  async function SetRoot(newRoot: IDirectory) {
    // 清空打开文件
    openFiles.value = [];
    // 释放编辑器
    editor.editor?.dispose();
    editor.isConfigured = false;
    editor.editor = null;

    currentFile.value = null;

    root.value = newRoot;
    currentDirectory.value = newRoot;

    // 备份Root
    BackupRoot(newRoot);

    // 切换 editor 版本
    editor.SwitchVersion();
  }

  // 设置Root版本列表
  function SetRootVersions(versions: any[]) {
    rootVersions.value = versions;
  }

  // 设置当前版本
  function SetCurrentVersion(version: string) {
    currentVersion.value = version;
  }
  return {
    // state
    root,
    currentDirectory,
    currentFile,
    contextMenus,
    contextMenuPosition,
    openFiles,
    rootVersions,
    currentVersion,
    autoSelectNearFile,

    // getters
    rootGetter,
    currentDirectoryGetter,
    currentFileGetter,
    contextMenusGetter,
    openFilesGetter,
    contextMenuPositionGetter,
    rootVersionsGetter,
    currentVersionGetter,

    // actions
    UnSelectAll,
    CreateDirectory,
    SelectDirectory,
    DeleteDirectory,
    CreateFile,
    SelectFile,
    DeleteFile,
    GetCurrentEntity,
    SetMenus,
    SetContextMenuPosition,
    ClearContextMenuPosition,
    OpenFile,
    OpenCompareFile,
    SetAutoSelectNearFile,
    CloseFile,
    SaveRoot,
    SetRoot,
    SetRootVersions,
    SetCurrentVersion,
  };
});
