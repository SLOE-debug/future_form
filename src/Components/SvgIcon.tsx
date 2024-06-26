import { Component, Prop, Vue } from "vue-facing-decorator";
import { globalCache } from "@/Utils/Caches";

// 未知文件名称
const FileSuffix_unknown = "FileSuffix_unknown";

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

  // 是否是未知文件
  isUnknownFile = false;

  async LoadSvg() {
    try {
      // 先从 svgCache 中查找是否有缓存
      let cache = globalCache.svgCache.get(this.name);
      if (cache) {
        this.svgContent = await cache;
        return;
      }

      const response = await fetch(require(`@/Assets/Icons/Svg/${this.name}.svg`));
      if (response.ok) {
        let content = await response.text();
        this.svgContent = content;
        // 缓存 svg
        globalCache.svgCache.set(this.name, new Promise((resolve) => resolve(content)));
      }
    } catch (error) {
      this.isUnknownFile = true;

      // 获取缓存
      let cache = globalCache.svgCache.get(FileSuffix_unknown);
      if (cache) {
        this.svgContent = await cache;
        return;
      }

      const fallbackResponse = await fetch(require(`@/Assets/Icons/Svg/${FileSuffix_unknown}.svg`));
      let content = await fallbackResponse.text();
      this.svgContent = content;
      // 缓存 svg
      globalCache.svgCache.set(FileSuffix_unknown, new Promise((resolve) => resolve(content)));
    }
  }

  async updated() {
    await this.LoadSvg();
  }

  render() {
    return (
      <div
        style={{
          width: this.size + "px",
          height: this.size + "px",
          // 如果是未知文件，且未设置颜色，则使用白色
          fill: this.isUnknownFile && !this.color ? "white" : this.color || "inherit",
        }}
        class={css.svgIcon}
        v-html={this.svgContent}
        title={this.title}
      ></div>
    );
  }
}
