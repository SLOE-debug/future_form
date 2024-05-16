import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { Component, Provide, Vue, Watch } from "vue-facing-decorator";
import Folder from "./Folder";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import ContextMenu from "./ContextMenu";
import Compiler from "@/Core/Compile/Compiler";
import { FlatRoot, suffix2Color } from "@/Utils/VirtualFileSystem/Index";
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
  ElTree
} from "element-plus";
import Directory from "@/Core/VirtualFileSystem/Directory";
import Basic from "@/Core/VirtualFileSystem/Basic";
import File from "@/Core/VirtualFileSystem/File";
import Search from "./Search";


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
        tiggerEventName: "DirectoryFun",
      },
      {
        icon: "magnifying-glass",
        active: false,
        title: "搜索",
        tiggerEventName: "SearchFun",
      },
      {
        icon: this.isRun ? "stop" : "play",
        active: false,
        title: "运行",
        color: this.isRun ? "#C85961" : "#9AE69A",
        tiggerEventName: "Preview",
      },
      {
        icon: "cloud-arrow-up",
        title: "保存到云端",
        color: "#409eff",
        tiggerEventName: () => {
          this.saveVisible = true;
          this.versionDescription = this.$Store.get.VirtualFileSystem.RootVersions[1]?.versionDescription;
        },
      },
      {
        icon: "upload",
        title: "发布",
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
  Files2Root(files: File[]) {
    let root = new Directory("");
    // 文件夹map
    this.dirMap.set("", root);
    for (let i = 0; i < files.length; i++) {
      const fileInDb = files[i] as any;

      let file = new File(fileInDb.name, fileInDb.isProtected, false);
      file.id = fileInDb.fileId;
      file.suffix = fileInDb.suffix;
      file.specialFile = fileInDb.specialFile;
      if (!("_csharpnull" in fileInDb.extraData)) file.extraData = fileInDb.extraData;

      file.versionDescription = fileInDb.versionDescription;
      file.content = fileInDb.content;

      let path = fileInDb.path;
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
   * 通过fullpath递归创建文件夹
   * @param filePath 文件夹全路径
   * @param files 文件数组
   * @returns 文件夹
   */
  CreateDirByPath(filePath: string) {
    let dir = this.dirMap.get(filePath) as Directory;
    if (!dir) dir = this.dirMap.get(filePath + ".ts") as Directory; // 尝试读取form设计文件
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
  async SearchFun(){
    this.isSearch = true;
  }
  //文件夹按钮点击事件
  async DirectoryFun(){
    this.isSearch = false;
  }

  async Publish() {
    // 询问
    try {
      await ElMessageBox.confirm(
        <div>
          是否发布？
          <br />
          请检查当前版本是否是要发布的版本！
          <br />
          当前版本：<strong>{this.selectedRootVersion}</strong>
        </div>,
        "提示",
        {
          confirmButtonText: "发布",
          cancelButtonText: "取消",
          type: "warning",
        }
      );

      await Compiler.Compile(false);
      this.$Api
        .Publish(Compiler.CompiledFiles)
        .then(() => ElMessage.success("发布成功！"))
        .catch(() => ElMessage.error("发布失败！"));
    } catch {}
  }

  // 保存弹窗
  saveVisible = false;

  // 是否保存
  isSave = false;
  // 版本描述
  versionDescription = "";
  // 是否需要创建新版本
  isCreateNewVersion = false;

  async SaveToCloud() {
    if (!this.isSave) return;
    let files = FlatRoot(this.$Store.get.VirtualFileSystem.Root);
    try {
      await this.$Api.SaveRoot({
        isCreateNewVersion: this.isCreateNewVersion,
        Description: this.versionDescription,
        Files: files,
      });
    } catch {}
    ElMessage.success("保存成功！");
  }

  isRun = false;

  render() {
    return (
      <>
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
                  onMousedown: (e: MouseEvent) => {
                    if ("active" in tool) {
                      this.topTools.forEach((t) => (t.active = false));
                      tool.active = true;
                    }
                    let eventName = tool.tiggerEventName as any;
                    let type = typeof eventName;
                    if (type == "string") {
                      this[eventName]();
                    } else {
                      eventName();
                    }

                    e.stopPropagation();
                  },
                }}
              />
            ))}
            {/* {this.RenderRunTool()} */}
          </div>
          
          <Search v-show={this.isSearch}></Search>

          {!this.isSearch && (<div class={css.versionSelector}>
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
          </div>)}
          {!this.isSearch && (<div class={css.content}>
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
          </div>)}
          <ContextMenu
            {...{ onClose: () => this.$Store.dispatch("VirtualFileSystem/ClearContextMenuPosition") }}
          ></ContextMenu>
        </div>
        <ElDialog
          v-model={this.saveVisible}
          appendToBody
          title="保存到云端"
          center
          close-on-click-modal={false}
          close-on-press-escape={false}
          onClose={() => {
            this.SaveToCloud();
            this.isSave = false;
            this.versionDescription = "";
          }}
        >
          {{
            default: () => (
              <ElForm labelWidth={"130px"}>
                <ElFormItem label="是否创建新版本：">
                  <ElRadioGroup v-model={this.isCreateNewVersion}>
                    <ElRadio value={true}>是</ElRadio>
                    <ElRadio value={false}>否</ElRadio>
                  </ElRadioGroup>
                </ElFormItem>
                <ElFormItem label="版本描述：">
                  <ElInput
                    v-model={this.versionDescription}
                    {...{ rows: 6 }}
                    style={{ width: "100%" }}
                    type="textarea"
                    placeholder="请输入版本描述"
                  />
                </ElFormItem>
              </ElForm>
            ),
            footer: () => (
              <div class="dialog-footer">
                <ElButton
                  onClick={(e) => {
                    this.saveVisible = false;
                  }}
                >
                  取消
                </ElButton>
                <ElButton
                  type="primary"
                  onClick={(e) => {
                    this.saveVisible = false;
                    this.isSave = true;
                  }}
                >
                  保存
                </ElButton>
              </div>
            ),
          }}
        </ElDialog>
      </>
    );
  }
}
