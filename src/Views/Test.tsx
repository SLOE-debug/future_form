import { ElSelectV2 } from "element-plus";
import { Component, Prop, Vue } from "vue-facing-decorator";

interface Item {
  loading: boolean;
  value: string;
}

@Component
class SubA extends Vue {
  @Prop({ type: Object, required: true })
  item: Item;

  created() {
    console.log("SubA 创建");
  }

  mounted() {
    console.log("SubA 挂载");
  }

  render() {
    return (
      <ElSelectV2
        filterable={true}
        v-model={this.item.value}
        loading={this.item.loading}
        options={[]}
        placeholder="请选择"
        remote={true}
        remoteMethod={(query) => {
          console.log(query);
        }}
      ></ElSelectV2>
    );
  }
}

@Component
export default class Test extends Vue {
  item: Item = {
    loading: false,
    value: "",
  };

  left = 0;

  get style() {
    return {
      marginLeft: this.left + "px",
    };
  }

  render() {
    console.log("Test 渲染");

    return (
      <SubA
        {...{
          item: this.item,
        }}
      ></SubA>
    );
  }
}
