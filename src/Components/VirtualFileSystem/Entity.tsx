import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { Component, Inject, Prop, Provide, Vue } from "vue-facing-decorator";
import Folder from "./Folder";
import { VritualFileSytem } from "@/Types/VirtualFileSystem";

type IDirectory = VritualFileSytem.IDirectory;

@Component
export default class Entity extends Vue {
  @Prop({ default: false })
  isDirectory: boolean;
  @Prop
  name: string;
  @Prop({ default: 1 })
  level: number;
  @Prop
  index: number;

  offset = 5;
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
  parentDirectory: IDirectory;

  @Provide("subDirectorys")
  subDirectorys: IDirectory[];
  created() {
    if (this.isDirectory) {
      this.subDirectorys = this.parentDirectory.directories;
    }
  }

  RenderIcon() {
    if (this.isDirectory) {
      return <FontAwesomeIcon icon={"chevron-right"}></FontAwesomeIcon>;
    } else {
      return <FontAwesomeIcon icon={"file"}></FontAwesomeIcon>;
    }
  }

  render() {
    return (
      <div class={css.entity} style={{ paddingLeft: this.PaddingLeft }} onClick={this.Open}>
        {this.RenderIcon()}
        <div class={css.name}>{this.name}</div>
        {this.spread && this.subDirectorys.map((_, i) => <Folder {...{ index: i }} />)}
      </div>
    );
  }
}
