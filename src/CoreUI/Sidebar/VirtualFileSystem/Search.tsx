import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import { Debounce } from "@/Utils";
import { IsDirectory } from "@/Utils/VirtualFileSystem/Index";
import { Component, Vue } from "vue-facing-decorator";

type IDirectory = VritualFileSystemDeclare.IDirectory;
type IFile = VritualFileSystemDeclare.IFile;
type Basic = VritualFileSystemDeclare.Basic;

@Component
export default class Search extends Vue {
  // 搜索内容
  SearchKey: string = "";

  /**
   * 递归 Root 搜索
   */
  @Debounce(300)
  SearchRoot() {
    if (!!this.SearchKey) {
      // 待搜索的文件
      let files = [this.$Store.get.VirtualFileSystem.Root] as Basic[];
      let result: Basic[] = [];
      while (files.length > 0) {
        let file = files.pop();
        // 如果 file 是文件夹
        if (IsDirectory(file)) {
          files.push(...(file as IDirectory).files);
        } else {
          // 如果 file 是特殊文件
          if ((file as IFile).specialFile) {
            files.push(...(file as IFile).children);
          }
          // 如果 file 的 content 包含搜索内容
          if ((file as IFile).content.indexOf(this.SearchKey) != -1) {
            result.push(file);
          }
        }
      }
      this.SearchResult = result;
    } else {
      this.SearchResult = [];
    }
  }

  // 搜索结果
  SearchResult: Basic[] = [];

  render() {
    return (
      <div class="w-full p-2">
        <input
          class="bg-[#0d0d0d] rounded outline-none w-full pl-2 h-[24px] text-[14px] placeholder:text-[#999] leading-[20px] text-[#fff] focus:shadow-[0_0_0_1px_#ad9cff_inset]"
          type="text"
          v-model={this.SearchKey}
          placeholder="搜索"
          onChange={() => {
            this.SearchRoot();
          }}
        />
        <div class="mt-2 text-[#fff]">
          {this.SearchResult.map((file) => {
            return <div class="flex">
              
            </div>;
          })}
        </div>
      </div>
    );
  }
}
