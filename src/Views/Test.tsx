import { ElSelectV2 } from "element-plus";
import { Component, Vue } from "vue-facing-decorator";

@Component
export default class Test extends Vue {
  val = "";

  render() {
    return (
      <ElSelectV2
        v-model={this.val}
        v-el-select-copy
        filterable={true}
        options={[]}
        {...{
          onClick: (e) => {
            console.log(e);
            e.stopPropagation();
          },
        }}
      ></ElSelectV2>
    );
  }
}
