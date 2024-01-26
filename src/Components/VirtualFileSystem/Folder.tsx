import { Component, Inject, Prop, Provide, Vue } from "vue-facing-decorator";
import Entity from "./Entity";
import { VritualFileSytem } from "@/Types/VirtualFileSystem";

type IDirectory = VritualFileSytem.IDirectory;

@Component
export default class Folder extends Vue {
  @Prop({ default: false })
  root: boolean;
  @Prop
  index: number;

  @Inject({ from: "subDirectorys" })
  subDirectorys: IDirectory[];

  @Provide("directory")
  directory: IDirectory;

  created() {
    if (this.root) {
      this.directory = this.subDirectorys[0];
    } else {
      this.directory = this.subDirectorys[this.index];
    }
  }

  render() {
    let dirs = this.directory.directories.map((dir, i) => {
      return <Entity {...{ name: dir.name, isDirectory: true, index: i }}></Entity>;
    });
    let files = this.directory.files.map((file) => {
      return <Entity {...{ name: file.name }}></Entity>;
    });
    return (
      <>
        {dirs}
        {files}
      </>
    );
  }
}
