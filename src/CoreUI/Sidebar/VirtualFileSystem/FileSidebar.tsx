import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { Component, Provide, Vue, Watch } from "vue-facing-decorator";
import Folder from "./Folder";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import ContextMenu from "./ContextMenu";
import Compiler from "@/Core/Compile/Compiler";
import { BackupRoot, FlatRoot } from "@/Utils/VirtualFileSystem/Index";
import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElRadioGroup,
  ElRadio,
  ElSelectV2,
  ElPopover,
  ElPopconfirm,
  ElMessageBox,
  ElCheckbox,
} from "element-plus";
import Directory from "@/Core/VirtualFileSystem/Directory";
import Basic from "@/Core/VirtualFileSystem/Basic";
import File from "@/Core/VirtualFileSystem/File";
import { Path } from "@/Utils/VirtualFileSystem/Path";
import Search from "./Search";
import { editor } from "@/CoreUI/Editor/EditorPage";

type IDirectory = VritualFileSystemDeclare.IDirectory;

@Component
export default class FileSidebar extends Vue {
  declare $refs: any;

  get topTools() {
    return [
      {
        icon: "folder",
        active: true,
        title: "文件夹",
        tiggerEventName: "ShowDirectory",
      },
      {
        icon: "magnifying-glass",
        active: false,
        title: "搜索",
        tiggerEventName: "ShowSearch",
      },
      {
        icon: this.isRun ? "stop" : "play",
        active: false,
        title: "运行（F5）",
        color: this.isRun ? "#C85961" : "#9AE69A",
        tiggerEventName: "Preview",
      },
      {
        icon: "cloud-arrow-up",
        title: "保存到云端（Ctrl + Shift + Alt + S）",
        color: "#409eff",
        tiggerEventName: "SaveToCloud",
      },
      {
        icon: "rocket",
        title: "发布（Ctrl + Shift + Alt + P）",
        color: "rgb(65 209 178)",
        tiggerEventName: "Publish",
      },
    ];
  }

  projectTools = [
    {
      icon: "file-circle-plus",
      title: "新建文件",
    },
    {
      icon: "folder-plus",
      title: "新建文件夹",
    },
  ];

  @Provide("directory")
  directory: IDirectory = new Directory("");
  created() {
    this.directory = this.$Store.get.VirtualFileSystem.Root;
    this.selectedRootVersion = this.$Store.get.VirtualFileSystem.CurrentVersion;
  }

  // 初始化文件侧边栏
  async Load() {
    let res = await this.$Api.GetRootByVersion();
    let { files, versionNumbers } = res.data;
    let root = this.Files2Root(files);
    this.$Store.dispatch("VirtualFileSystem/SetRoot", root);

    // 打开第一个 fromDesigner 文件
    // let file = root.files.find((f) => f.suffix == VritualFileSystemDeclare.FileType.FormDesigner);
    // if (file) {
    //   this.$Store.dispatch("VirtualFileSystem/SelectFile", file);
    // }

    this.directory = this.$Store.get.VirtualFileSystem.Root;

    for (let version of versionNumbers) {
      version.label = version.versionNumber;
      version.value = version.versionNumber;
    }

    this.$Store.dispatch("VirtualFileSystem/SetRootVersions", versionNumbers);
  }

  // 选择的root版本
  selectedRootVersion = "";
  @Watch("selectedRootVersion")
  async OnSelectedRootVersionChange(nv, ov) {
    // 如果是从created中调用的，不需要执行
    if (!ov) return;
    this.$Store.dispatch("VirtualFileSystem/SetCurrentVersion", nv);
    await this.GetRootByVersion(nv);
    ElMessage.success("切换版本成功！");
  }

  /**
   * 通过版本号获取root
   */
  async GetRootByVersion(versionNumber: string = "last") {
    let res = await this.$Api.GetRootByVersion({ versionNumber });
    let { files } = res.data;
    let root = this.Files2Root(files);
    this.$Store.dispatch("VirtualFileSystem/SetRoot", root);
    this.directory = this.$Store.get.VirtualFileSystem.Root;
  }

  // 文件夹map
  dirMap = new Map<string, Basic>();
  /**
   * 将平铺的文件数组转为root
   */
  Files2Root(files: any[]) {
    files.sort((a, b) => {
      return a.fullPath.localeCompare(b.fullPath);
    });

    let root = new Directory("");
    // 文件夹map
    this.dirMap.set("", root);
    for (let i = 0; i < files.length; i++) {
      const fileInDb = files[i];

      let file = new File(fileInDb.name, fileInDb.isProtected, false);
      file.id = fileInDb.fileId;
      file.suffix = fileInDb.suffix;
      file.specialFile = fileInDb.specialFile;
      if (!("_csharpnull" in fileInDb.extraData)) file.extraData = fileInDb.extraData;

      file.versionDescription = fileInDb.versionDescription;
      file.content = fileInDb.content;

      let path = Path.GetPathByFullPath(fileInDb.fullPath);
      if (path) {
        let dir = this.CreateDirByPath(path) as Directory;
        dir.AddFile(file);
      } else {
        root.AddFile(file);
      }
      if (file.suffix == VritualFileSystemDeclare.FileType.FormDesigner) {
        let fillPath = file.GetFullName();
        this.dirMap.set(fillPath, file);
      }
    }
    return root;
  }

  /**
   * 通过文件/文件夹的路径递归创建文件夹
   * @param filePath 文件夹全路径
   * @param files 文件数组
   * @returns 文件夹
   */
  CreateDirByPath(filePath: string) {
    let dir = this.dirMap.get(filePath) as Directory;
    if (dir) {
      return dir;
    }
    let paths = filePath.split("/");
    let root = this.dirMap.get("") as Directory;
    let currentPath = "";
    for (let i = 0; i < paths.length; i++) {
      currentPath += paths[i];
      dir = this.dirMap.get(currentPath) as Directory;
      if (!dir) {
        dir = new Directory(paths[i]);
        this.dirMap.set(currentPath, dir);
        if (i == 0) {
          root.AddDirectory(dir);
        } else {
          let parentPath = currentPath.split("/");
          parentPath.pop();
          let parent = this.dirMap.get(parentPath.join("/")) as Directory;
          if (parent) {
            parent.AddDirectory(dir);
          }
        }
      }
      currentPath += "/";
    }
    return dir;
  }

  /**
   * 项目工具点击
   */
  ProjectToolItemClick(m: any) {
    switch (m.title) {
      case "新建文件":
        this.$Store.dispatch("VirtualFileSystem/CreateFile");
        break;
      case "新建文件夹":
        this.$Store.dispatch("VirtualFileSystem/CreateDirectory");
        break;
    }
  }

  OpenContextMenu(e: MouseEvent) {
    this.$Store.dispatch("VirtualFileSystem/SetContextMenuPosition", { x: e.clientX, y: e.clientY });
    e.preventDefault();
  }

  async Preview() {
    editor.SaveAll();
    this.isRun = true;
    await Compiler.Compile();
    await this.$Store.dispatch("Designer/SetPreview", true);
    // 获取启动文件
    let file = await Compiler.GetStartupFile();
    Compiler.Install(file);
    this.isRun = false;
  }

  isSearch = false;
  //搜索按钮点击事件
  async ShowSearch() {
    this.isSearch = true;
  }
  //文件夹按钮点击事件
  async ShowDirectory() {
    this.isSearch = false;
  }

  // 是否发布全部
  isPublishAll = false;
  // 是否提示用户更新
  isNotifyUser = false;
  async Publish() {
    try {
      await ElMessageBox(
        {
          title: "是否发布？",
          message: () => (
            <div>
              <p>请检查当前版本是否是要发布的版本！</p>
              <p>
                当前版本：<strong>{this.selectedRootVersion}</strong>
              </p>

              <ElCheckbox v-model={this.isPublishAll} label="发布全部" tabindex={-1} v-focus></ElCheckbox>
              <ElCheckbox v-model={this.isNotifyUser} label="提示用户更新" tabindex={0}></ElCheckbox>
            </div>
          ),
          confirmButtonText: "发布",
          center: true,
          draggable: true,
          closeOnClickModal: false,
        },
        this.$.appContext
      );

      editor.SaveAll();

      await Compiler.Compile(false, this.isPublishAll);

      console.log(Compiler.CompiledFiles);

      if (!this.isPublishAll && Compiler.CompiledFiles.length === 0) {
        ElMessage.warning("没有要发布的文件，请查看是否有修改的文件！");
        return;
      }

      console.log(Compiler.CompiledFiles);

      await this.$Api.Publish({
        isNotifyUser: this.isNotifyUser,
        files: Compiler.CompiledFiles,
      });

      ElMessage.success("发布成功！");
      BackupRoot(this.$Store.get.VirtualFileSystem.Root);
    } catch (err) {
      if (err !== "cancel") ElMessage.error("发布失败！");
    }
  }

  /**
   * 文件工具点击
   */
  FileToolItemClick(m: any) {
    if ("active" in m) {
      this.topTools.forEach((t) => (t.active = false));
      m.active = true;
    }
    let eventName = m.tiggerEventName as any;
    let type = typeof eventName;
    if (type == "string") {
      this[eventName]();
    } else {
      eventName && eventName();
    }
  }

  // 版本描述
  versionDescription = "";
  // 是否需要创建新版本
  isCreateNewVersion = false;

  async SaveToCloud() {
    try {
      // 填补versionDescription为上次的描述
      this.versionDescription = this.$Store.get.VirtualFileSystem.RootVersions[1]?.versionDescription;

      await ElMessageBox(
        {
          title: "保存到云端",
          message: () => (
            <>
              <div
                style={{
                  height: "24px",
                }}
              >
                版本描述：
              </div>
              <ElInput
                v-model={this.versionDescription}
                {...{ rows: 12 }}
                style={{ width: "45vw" }}
                type="textarea"
                placeholder="请输入版本描述"
                resize="none"
                v-focus
                tabindex={-1}
              />
              <ElCheckbox v-model={this.isCreateNewVersion} label="创建新版本" tabindex={0}></ElCheckbox>
            </>
          ),
          confirmButtonText: "保存",
          center: true,
          draggable: true,
          customClass: css.saveToCloud,
          closeOnClickModal: false,
        },
        this.$.appContext
      );

      let files = FlatRoot(this.$Store.get.VirtualFileSystem.Root);

      console.log(files);

      await this.$Api.SaveRoot({
        isCreateNewVersion: this.isCreateNewVersion,
        Description: this.versionDescription,
        Files: files,
      });
      ElMessage.success("保存成功！");
    } catch (err) {
      // 如果 err 不等于 cancel，则提示保存失败
      if (err !== "cancel") ElMessage.error("保存失败！");
    }
  }

  isRun = false;

  render() {
    return (
      <div
        class={css.sidebar}
        onMousedown={() => {
          this.$Store.dispatch("VirtualFileSystem/SelectDirectory", this.$Store.get.VirtualFileSystem.Root);
          this.$Store.dispatch("VirtualFileSystem/ClearContextMenuPosition");
        }}
      >
        <div class={css.topTools}>
          {this.topTools.map((tool) => (
            <FontAwesomeIcon
              icon={tool.icon}
              class={tool.active ? css.active : ""}
              title={tool.title}
              style={{
                color: tool.color || "auto",
              }}
              {...{
                onClick: (e: MouseEvent) => {
                  this.FileToolItemClick(tool);
                  e.stopPropagation();
                },
              }}
            />
          ))}
        </div>

        <Search v-show={this.isSearch}></Search>

        {!this.isSearch && (
          <div class={css.versionSelector}>
            <div>版本：</div>
            <ElSelectV2
              options={this.$Store.get.VirtualFileSystem.RootVersions}
              popper-class={css.versionDropDown}
              v-model={this.selectedRootVersion}
            >
              {({ item }) => {
                return (
                  <ElPopover
                    placement="right"
                    width={400}
                    effect="dark"
                    title="版本描述"
                    hideAfter={0}
                    ref={item.versionNumber}
                    offset={-12}
                    persistent={false}
                  >
                    {{
                      reference: () => <div onClick={(e) => e.stopPropagation()}>{item.versionNumber}</div>,
                      default: () => (
                        <div class={css.versionDescription}>
                          {item.versionDescription}
                          <br />
                          <ElPopconfirm
                            title="此操作将会覆盖您的文件且不会保存，请谨慎操作！"
                            width={250}
                            hideAfter={0}
                            {...{
                              trigger: "hover",
                              offset: 0,
                              effect: "dark",
                            }}
                            teleported={false}
                            persistent={false}
                            onCancel={(e) => {
                              this.$refs[item.versionNumber].hide();
                            }}
                            onConfirm={(e) => {
                              this.$refs[item.versionNumber].hide();
                              this.selectedRootVersion = item.versionNumber;
                            }}
                          >
                            {{
                              reference: () => (
                                <ElButton
                                  type="primary"
                                  size="small"
                                  style={{
                                    marginTop: "10px",
                                  }}
                                >
                                  拉取
                                </ElButton>
                              ),
                            }}
                          </ElPopconfirm>
                        </div>
                      ),
                    }}
                  </ElPopover>
                );
              }}
            </ElSelectV2>
          </div>
        )}
        {!this.isSearch && (
          <div class={css.content}>
            <div class={css.projectTitle}>
              项目名称
              <div class={css.projectTools}>
                {this.projectTools.map((tool) => (
                  <FontAwesomeIcon
                    icon={tool.icon}
                    title={tool.title}
                    {...{
                      onMousedown: (e: MouseEvent) => {
                        this.ProjectToolItemClick(tool);
                        e.stopPropagation();
                      },
                    }}
                  />
                ))}
              </div>
            </div>
            <div onContextmenu={this.OpenContextMenu}>
              <Folder />
            </div>
          </div>
        )}
        <ContextMenu
          {...{ onClose: () => this.$Store.dispatch("VirtualFileSystem/ClearContextMenuPosition") }}
        ></ContextMenu>
      </div>
    );
  }
}
