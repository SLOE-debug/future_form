import { Component, Inject, Prop, Provide, Vue } from "vue-facing-decorator";
import Entity from "./Entity";
import { VritualFileSytem } from "@/Types/VirtualFileSystem";

type IDirectory = VritualFileSytem.IDirectory;

@Component
export default class Folder extends Vue {
  @Prop({ default: 0 })
  level: number;

  @Inject
  directory: IDirectory;

  render() {
    let dirs = this.directory.directories.map((dir, i) => {
      return <Entity {...{ name: dir.name, isDirectory: true, index: i, level: this.level }}></Entity>;
    });
    let files = this.directory.files.map((file) => {
      return <Entity {...{ name: file.name, suffix: file.suffix, level: this.level }}></Entity>;
    });
    return (
      <>
        {dirs}
        {files}
      </>
    );
  }
}
