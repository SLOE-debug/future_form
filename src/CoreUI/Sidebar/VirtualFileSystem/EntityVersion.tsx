import CompareFile from "@/Core/VirtualFileSystem/CompareFile";
import { useVirtualFileSystemStore } from "@/Stores/VirtualFileSystemStore";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import { editor } from "@/Utils/Designer";
import { ElDialog, ElTable, ElTableColumn, ElPagination, ElLink, ElTag } from "element-plus";
import { Component, Vue } from "vue-facing-decorator";

type IFile = VritualFileSystemDeclare.IFile;

@Component
export default class EntityVersion extends Vue {
  // 是否显示
  visible: boolean;

  // 版本列表
  versions: IFile[];

  // 分页
  page = 1;
  // 每页数量
  pageSize = 10;
  // 总数
  total = 0;

  get pageCount() {
    return Math.ceil(this.total / this.pageSize);
  }

  get virtualFileSystemStore() {
    return useVirtualFileSystemStore();
  }

  // 文件id
  fileId: string;

  // 通过文件ID获取版本列表
  async GetVersions(id?: string) {
    !!id && (this.fileId = id);
    editor.SaveAll();
    let res = await this.$Api.GetVersions({ fileId: this.fileId, page: this.page, pageSize: this.pageSize });
    this.versions = res.data.versions;
    this.total = res.data.total;
    this.visible = true;
  }

  // 对比文件
  CompareFile(file: IFile) {
    let currentFile = this.virtualFileSystemStore.currentFile;
    let compareFile = new CompareFile(
      file.name + "@" + (file as any).versionDate,
      file.suffix,
      file.content,
      currentFile.content,
      file.extraData,
      currentFile.extraData
    );
    this.virtualFileSystemStore.OpenCompareFile(compareFile);
    editor.CompareFile(compareFile);
    this.visible = false;
  }

  render() {
    return (
      <ElDialog
        v-model={this.visible}
        appendToBody
        onClose={() => (this.visible = false)}
        title="历史版本"
        width={"70%"}
        class="[&>div]:w-full"
      >
        <ElTable data={this.versions} v-loading={!this.versions} emptyText="暂无数据" stripe highlight-current-row>
          <ElTableColumn prop="versionNumbers" label="版本号">
            {({ row }) => {
              if (row.versionNumbers.length)
                return row.versionNumbers.map((m) => (
                  <ElTag effect="dark" round type="primary" style={{ margin: "0 2px" }}>
                    {m}
                  </ElTag>
                ));
              return (
                <ElTag effect="dark" round type="danger">
                  最新
                </ElTag>
              );
            }}
          </ElTableColumn>
          <ElTableColumn prop="versionDescription" label="版本描述"></ElTableColumn>
          <ElTableColumn prop="versionDate" label="版本发布日期"></ElTableColumn>
          <ElTableColumn label="操作">
            {({ row }) => {
              return (
                <div>
                  <ElLink
                    type="primary"
                    onClick={() => {
                      this.CompareFile(row);
                    }}
                  >
                    对比版本
                  </ElLink>
                </div>
              );
            }}
          </ElTableColumn>
        </ElTable>
        <ElPagination
          v-model:current-page={this.page}
          v-model:page-size={this.pageSize}
          page-count={this.pageCount}
          page-sizes={[10, 20, 50]}
          onChange={() => this.GetVersions()}
          layout="sizes, prev, pager, next"
          class="m-[0_auto] w-min mt-[20px]"
          hide-on-single-page
        ></ElPagination>
      </ElDialog>
    );
  }
}
