import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { ElButton, ElDialog, ElInput, ElPopconfirm, ElTable, ElTableColumn } from "element-plus";
import { Component, Prop, Vue } from "vue-facing-decorator";

@Component
export default class OptionsConfigurator extends Vue {
  @Prop
  options = [];

  visible = false;

  Del(i: number) {
    this.options.splice(i, 1);
  }

  render() {
    return (
      <>
        <ElDialog
          v-model={this.visible}
          title="设置选项"
          onClose={() => {
            this.$Store.dispatch("Designer/RenderControlConfigurator");
          }}
        >
          <ElButton
            type="primary"
            icon="Plus"
            style={{ float: "right", marginBottom: "10px" }}
            onClick={(e) => {
              let option = { label: "选项", value: "值" };
              this.options.push(option);
            }}
          >
            新建
          </ElButton>
          <ElTable data={this.options}>
            <ElTableColumn property="label" label="显示文本">
              {(scope) => {
                return <ElInput v-model={scope.row.label}></ElInput>;
              }}
            </ElTableColumn>

            <ElTableColumn property="value" label="选中值">
              {(scope) => {
                return <ElInput v-model={scope.row.value}></ElInput>;
              }}
            </ElTableColumn>

            <ElTableColumn label="操作">
              {(scope) => {
                return (
                  <ElPopconfirm
                    confirm-button-text="确认"
                    cancel-button-text="取消"
                    title="确认要删除该选项嘛？"
                    onConfirm={(_) => this.Del(scope.$index)}
                  >
                    {{
                      reference: () => {
                        return <ElButton type="danger">删除</ElButton>;
                      },
                    }}
                  </ElPopconfirm>
                );
              }}
            </ElTableColumn>
          </ElTable>
        </ElDialog>
        <ElButton circle onClick={(_) => (this.visible = true)}>
          {{ icon: () => <FontAwesomeIcon icon="gear"></FontAwesomeIcon> }}
        </ElButton>
      </>
    );
  }
}
