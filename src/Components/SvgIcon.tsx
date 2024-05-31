import { Component, Prop, Vue } from "vue-facing-decorator";

@Component
export default class SvgIcon extends Vue {
  @Prop
  name: string;
  @Prop({ default: 18 })
  size: number;
  @Prop
  color: string;
  @Prop
  title: string;

  svgContent = "";
  async created() {
    await this.LoadSvg();
  }

  async LoadSvg() {
    try {
      const response = await fetch(require(`@/Assets/Icons/Svg/${this.name}.svg`));
      if (response.ok) {
        this.svgContent = await response.text();
      }
    } catch (error) {
      const fallbackResponse = await fetch(require(`@/Assets/Icons/Svg/FileSuffix_unknown.svg`));
      this.svgContent = await fallbackResponse.text();
    }
  }

  async updated() {
    await this.LoadSvg();
  }

  render() {
    return (
      <div
        style={{ width: this.size + "px", height: this.size + "px", fill: this.color || "inherit" }}
        class={css.svgIcon}
        v-html={this.svgContent}
        title={this.title}
      ></div>
    );
  }
}
