import SvgIcon from "@/Components/SvgIcon";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import { suffix2Color } from "@/Utils/VirtualFileSystem/Index";
import { SearchTree } from "@/Vuex/Modules/VirtualFileSystem";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { ElInput } from "element-plus";
import { Component, Vue } from "vue-facing-decorator";
type IFile = VritualFileSystemDeclare.IFile;
type IDirectory = VritualFileSystemDeclare.IDirectory;

@Component
export default class Search extends Vue {
  created() {}

  searchText = "";
  searchRes: SearchTree[] = [];

  //搜索框触发事件
  async SearchChange() {
    if (this.searchText) {
      this.searchRes = await this.SearchContent(this.searchText);
      //console.log(this.searchRes);
    }
  }

  //树状结果单击事件
  async HandleNodeClick(node) {
    //console.log(node);
    if ("expand" in node) {
      node.expand = !node.expand;
    }

    this.searchRes.forEach((s) => {
      s.selected = false;
      s.children.forEach((c) => {
        c.selected = false;
      });
    });

    node.selected = !node.selected;
  }

  //搜索方法
  async SearchContent(text) {
    // debugger;
    var Root = this.$Store.get.VirtualFileSystem.Root;
    if (!Root.files && !Root.directories) return null;

    var treeArr: SearchTree[] = [];
    await this.SearchFile(text, Root.files, treeArr);
    await this.SearchDirectories(text, Root.directories, treeArr);

    return treeArr;
  }
  //搜索文件夹方法
  async SearchDirectories(text: string, dirArr: IDirectory[], treeArr: SearchTree[]) {
    if (dirArr) {
      dirArr.forEach(async (dir) => {
        if (dir.files) {
          await this.SearchFile(text, dir.files, treeArr);
        }

        if (dir.directories) {
          await this.SearchDirectories(text, dir.directories, treeArr);
        }
      });
    }
  }
  //搜索文件方法
  async SearchFile(text: string, fileArr: IFile[], treeArr: SearchTree[]) {
    if (fileArr) {
      fileArr = fileArr.filter((e) => e.content.includes(text));
      fileArr.forEach(async (file) => {
        var children = [];
        // 通过 split('\n') 将代码字符串拆分成每一行
        const lines = file.content.split("\n");
        // 遍历每一行
        lines.forEach(async (line, index) => {
          // 判断当前行是否包含目标字符
          if (line.includes(text)) {
            const lastOccurrence = line.lastIndexOf(text); // 获取最后一次出现的位置
            const content_a = line.substring(0, lastOccurrence); // 从开头截取到最后一次出现的位置
            const content_b = line.substring(lastOccurrence + text.length); // 从最后一次出现的位置截取到结尾

            children.push({
              label: text,
              path: index + 1 + "",
              content_a,
              content_b,
              selected: false,
            });
          }
        });

        treeArr.push({
          label: file.name,
          suffix: file.suffix,
          expand: true,
          selected: false,
          path: file.path,
          content: file.content,
          children,
        });

        await this.SearchFile(text, file.children, treeArr);
      });
    }
  }

  render() {
    return (
      <div>
        <div class={css.searchSelector}>
          <ElInput
            v-model={this.searchText}
            style={{ width: "95%" }}
            placeholder="请输入搜索词"
            class={css.searchInput}
            onChange={this.SearchChange}
            clearable
            onClear={() => {
              this.searchRes = [];
            }}
          />
        </div>
        <div class={css.searchDiv}>
          {this.searchRes.map((m) => {
            return (
              <>
                <div
                  onClick={() => {
                    this.HandleNodeClick(m);
                  }}
                  class={[css.searchFileDiv, m.selected ? css.searchActive : ""]}
                >
                  <div class={css.searchFileInfo}>
                    {m.expand && (
                      <span class={css.iconSpan}>
                        <FontAwesomeIcon icon={"chevron-down"} />
                      </span>
                    )}
                    {!m.expand && (
                      <span class={css.iconSpan}>
                        <FontAwesomeIcon icon={"chevron-right"} />
                      </span>
                    )}
                    <SvgIcon {...{ name: `FileSuffix_${m.suffix}`, color: suffix2Color[m.suffix] }}></SvgIcon>
                    <span class={css.labSpan}>{m.label}</span>
                    <span class={css.pathSpan}>{m.path}</span>
                  </div>
                </div>
                {m.expand &&
                  m.children.map((c) => {
                    return (
                      <div
                        title={c.content_a + c.label + c.content_b}
                        onClick={() => {
                          this.HandleNodeClick(c);
                        }}
                        class={[css.searchContentDiv, c.selected ? css.searchActive : ""]}
                      >
                        <span class={css.contentFirstSpan}>{c.content_a} </span>
                        <span class={css.highlight}>&nbsp;{c.label}&nbsp;</span>
                        <span class={css.contentLastSpan}>{c.content_b}</span>
                      </div>
                    );
                  })}
              </>
            );
          })}
        </div>
      </div>
    );
  }
}
