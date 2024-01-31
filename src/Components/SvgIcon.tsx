import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { Component, Prop, Vue } from "vue-facing-decorator";

@Component
export default class SvgIcon extends Vue {
  @Prop
  name: string;
  @Prop({ default: 18 })
  size: number;
  @Prop({ default: "#e6e6e6" })
  color: string;

  render() {
    try {
      return (
        <div
          style={{ width: this.size + "px", height: this.size + "px", fill: this.color }}
          class={css.svgIcon}
          v-html={require(`!!raw-loader!@/Assets/Icon/SVG/${this.name}.svg`).default}
        ></div>
      );
    } catch (error) {
      return (
        <div
          style={{ width: this.size + "px", height: this.size + "px", fill: this.color }}
          class={css.svgIcon}
          v-html={require(`!!raw-loader!@/Assets/Icon/SVG/unknownFileSuffix.svg`).default}
        ></div>
      );
    }
  }
}
