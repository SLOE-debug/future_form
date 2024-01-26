import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { Component, Inject, Prop, Provide, Vue } from "vue-facing-decorator";
import Folder from "./Folder";
import { VritualFileSytem } from "@/Types/VirtualFileSystem";
import SvgIcon from "../SvgIcon";

type IDirectory = VritualFileSytem.IDirectory;

@Component
export default class Entity extends Vue {
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
   * 文件夹或文件名字
   */
  @Prop
  name: string;
  /**
   * 文件夹或文件的层级
   */
  @Prop
  level: number;

  /**
   * 文件的后缀
   */
  @Prop
  suffix: string;

  /**
   * 文件后缀对应的颜色
   */
  suffix2Color = {
    ts: "#007acc",
    vue: "#41b883",
    scss: "#c6538c",
    html: "#e34c26",
    css: "#563d7c",
    js: "#f1e05a",
    json: "#f1e05a",
    md: "#f1e05a",
    txt: "#f1e05a",
  };

  offset = 15;
  get PaddingLeft() {
    return this.offset * (this.level + 1) + "px";
  }

  spread = false;
  Open() {
    if (this.isDirectory) {
      this.spread = !this.spread;
    } else {
    }
  }

  @Inject({ from: "directory" })
  directory: IDirectory;
  @Provide("directory")
  subDirectory: IDirectory;
  created() {
    if (this.isDirectory) {
      this.subDirectory = this.directory.directories[this.index];
    }
  }

  RenderIcon() {
    if (this.isDirectory) {
      return <FontAwesomeIcon icon={this.spread ? "chevron-down" : "chevron-right"}></FontAwesomeIcon>;
    } else {
      return <SvgIcon {...{ name: `${this.suffix}FileSuffix`, color: this.suffix2Color[this.suffix] }}></SvgIcon>;
    }
  }

  render() {
    return (
      <div class={css.entity}>
        <div class={css.fileInfo} style={{ paddingLeft: this.PaddingLeft }} onClick={this.Open}>
          {this.RenderIcon()}
          <div class={css.name}>{this.name}</div>
        </div>
        {this.spread && <Folder {...{ level: this.level + 1 }} />}
      </div>
    );
  }
}
