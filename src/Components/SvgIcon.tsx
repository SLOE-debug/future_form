import { Component, Prop, Vue } from "vue-facing-decorator";

@Component
export default class SvgIcon extends Vue {
  @Prop
  name: string;
  @Prop({ default: 18 })
  size: number;
  @Prop({ default: "#e6e6e6" })
  color: string;
  @Prop
  title: string;

  render() {
    try {
      return (
        <div
          style={{ width: this.size + "px", height: this.size + "px", fill: this.color }}
          class={css.svgIcon}
          v-html={require(`!!raw-loader!@/Assets/Icons/Svg/${this.name}.svg`).default}
          title={this.title}
        ></div>
      );
    } catch (error) {
      return (
        <div
          style={{ width: this.size + "px", height: this.size + "px", fill: this.color }}
          class={css.svgIcon}
          v-html={require(`!!raw-loader!@/Assets/Icons/Svg/unknownFileSuffix.svg`).default}
          title={"未知文件"}
        ></div>
      );
    }
  }
}
