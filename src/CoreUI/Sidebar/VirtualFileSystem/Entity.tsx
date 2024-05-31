import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { Component, Inject, Prop, Provide, Vue, Watch } from "vue-facing-decorator";
import Folder from "./Folder";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import SvgIcon from "../../../Components/SvgIcon";
import { GetParentByDirectory, GetParentByFile, IsDirectory, suffix2Color } from "@/Utils/VirtualFileSystem/Index";
import { Guid } from "@/Utils/Index";
import EntityVersion from "./EntityVersion";

type IDirectory = VritualFileSystemDeclare.IDirectory;
type IFile = VritualFileSystemDeclare.IFile;

@Component
export default class Entity extends Vue {
  declare $refs: any;

  /**
   * 是否是文件夹
   */
  @Prop({ default: false })
  isDirectory: boolean;
  /**
   * 文件夹在父文件夹中的索引
   */
  @Prop
  index: number;
  /**
   * 文件夹或文件的层级
   */
  @Prop
  level: number;

  offset = 15;
  get PaddingLeft() {
    return this.offset * (this.level + 1) + "px";
  }

  Open() {
    if (this.isDirectory) {
      this.directory.spread = !this.directory.spread;
    }
  }

  @Inject({ from: "directory" })
  Parentdirectory: IDirectory;
  @Provide("directory")
  directory: IDirectory;

  /**
   * 文件夹或文件实体
   */
  entity: IDirectory | IFile;

  @Watch("entity.isRename")
  async OnIsRenamingChange() {
    if (this.entity.isRename) {
      this.newName = this.entity.name;
    }
  }

  created() {
    if (this.isDirectory) {
      this.directory = this.Parentdirectory.directories[this.index];
      this.entity = this.Parentdirectory.directories[this.index];
    } else {
      this.entity = this.Parentdirectory.files[this.index];
      this.FillSpecialFileChildren();
    }
  }

  RenderIcon() {
    if (this.isDirectory) {
      return (
        <FontAwesomeIcon
          icon={"chevron-right"}
          style={{
            transform: this.directory.spread ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
        />
      );
    } else {
      let entity = this.entity as IFile;
      return <SvgIcon {...{ name: `FileSuffix_${entity.suffix}`, color: suffix2Color[entity.suffix] }}></SvgIcon>;
    }
  }

  // 特殊文件赋值子文件夹
  FillSpecialFileChildren() {
    let entity = this.entity as IFile;
    if (entity.specialFile) {
      this.directory = {
        directories: [],
        files: entity.children,
      } as IDirectory;
    }
  }

  /**
   * 重命名
   * @param newName 新名称
   */
  async Rename(newName: string) {
    if (!newName && !this.entity.name) {
      if (this.isDirectory) {
        this.$Store.dispatch("VirtualFileSystem/DeleteDirectory", this.entity);
      } else {
        this.$Store.dispatch("VirtualFileSystem/DeleteFile", this.entity);
      }
      return;
    }

    this.entity.name = newName;
    // 如果是 sql 文件
    if (!this.isDirectory && (this.entity as IFile).suffix == VritualFileSystemDeclare.FileType.Sql) {
      let file = this.entity as IFile;

      file.extraData = file.extraData || {
        table: "",
        fields: [],
        primaryFields: [],
        params: [],
      };
    }

    this.entity.isRename = false;
    // 如果是特殊文件，则需要填充它的子文件夹
    this.FillSpecialFileChildren();

    // 集合
    let collection = this.isDirectory ? this.Parentdirectory.directories : this.Parentdirectory.files;

    if (this.isDirectory) {
      this.$Store.dispatch("VirtualFileSystem/SelectDirectory", this.entity);
    } else {
      this.$Store.dispatch("VirtualFileSystem/SelectFile", this.entity);
    }

    // 按名称排序 collection
    collection.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * 验证新名称
   */
  ValidateNewName() {
    if (!this.newName) {
      this.errorMessage = "必须提供文件或文件夹名称";
      return false;
    }
    if (this.isDirectory) {
      if (this.Parentdirectory.directories.some((d) => d.name == this.newName)) {
        this.errorMessage = "文件夹名称已存在";
        return false;
      }
    } else {
      if (this.Parentdirectory.files.some((f) => f.name == this.newName)) {
        this.errorMessage = "文件名称已存在";
        return false;
      }
    }
    this.errorMessage = "";
    return true;
  }

  /**
   * Blur时重命名
   */
  RenameBlur() {
    if (this.newName == "") {
      this.errorMessage = "";
      this.Rename(this.entity.name);
    } else {
      this.Rename(this.newName);
    }
  }

  newName = "";
  RenderReanme() {
    return (
      <input
        v-model={this.newName}
        type="text"
        v-focus
        key={this.entity.id}
        onKeydown={(e) => {
          if (e.key == "Enter") {
            this.RenameBlur();
          }
        }}
        {...{
          type: "text",
          onClick: (e: MouseEvent) => e.stopPropagation(),
          onInput: this.ValidateNewName.bind(this),
          onBlur: this.RenameBlur.bind(this),
        }}
      />
    );
  }

  RenderSubDirectory() {
    if (this.directory?.spread) {
      return <Folder {...{ level: this.level + 1 }} />;
    }
    if ((this.entity as IFile).specialFile) {
      return <Folder {...{ level: this.level + 1 }}></Folder>;
    }
  }

  errorMessage = "";

  render() {
    return (
      <div class={css.entity}>
        <div
          class={[css.fileInfo, this.entity.selected && !this.entity.isRename ? css.active : ""].join(" ")}
          style={{ paddingLeft: this.PaddingLeft }}
          onClick={this.Open}
        >
          {this.RenderIcon()}
          <div class={css.name}>
            {this.entity.isRename ? this.RenderReanme() : this.entity.name}
            {this.errorMessage && <div class={css.error}>{this.errorMessage}</div>}
          </div>
          <div class={css.rightIcon}>
            {!this.isDirectory && (
              <FontAwesomeIcon
                icon="code-branch"
                class={css.branch}
                title="历史版本"
                {...{
                  onClick: () => {
                    this.$refs.version.GetVersions(this.entity.id);
                  },
                }}
              />
            )}
            {this.entity.isProtected && <FontAwesomeIcon icon={"lock"} class={css.lock} title="不可删除和重命名的" />}
          </div>
        </div>
        {this.RenderSubDirectory()}
        <EntityVersion ref={"version"}></EntityVersion>
      </div>
    );
  }
}
