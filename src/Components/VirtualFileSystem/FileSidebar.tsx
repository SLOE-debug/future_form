import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { Component, Provide, Vue } from "vue-facing-decorator";
import Folder from "./Folder";
import { VritualFileSytem } from "@/Types/VirtualFileSystem";

type IDirectory = VritualFileSytem.IDirectory;

@Component
export default class FileSidebar extends Vue {
  topTools = [
    {
      icon: "folder",
      active: true,
    },
    {
      icon: "magnifying-glass",
      active: false,
    },
  ];

  @Provide("subDirectorys")
  subDirectorys: IDirectory[];

  created() {
    this.subDirectorys = [this.$Store.get.Root];
  }

  render() {
    return (
      <div class={css.sidebar}>
        <div class={css.topTools}>
          {this.topTools.map((tool) => (
            <FontAwesomeIcon icon={tool.icon} class={tool.active ? css.active : ""} />
          ))}
        </div>
        <div class={css.content}>
          <div class={css.projectName}>项目名称</div>
          <Folder {...{ root: true }} />
        </div>
      </div>
    );
  }
}
