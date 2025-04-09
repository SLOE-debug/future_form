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
  @Prop
  className: string;

  svgContent = "";
  async created() {
    await this.LoadSvg();
  }

  // 是否是未知文件
  isUnknownFile = false;

  async LoadSvg() {
    const svgModule = import.meta.glob("@/Assets/Icons/Svg/*.svg", { eager: true });
    try {
      // 先从 svgCache 中查找是否有缓存
      let cache = globalCache.svgCache.get(this.name);
      if (cache) {
        this.svgContent = await cache;
        return;
      }

      const svgPath = Object.keys(svgModule).find((key) => key.includes(`Assets/Icons/Svg/${this.name}.svg`));
      if (svgPath) {
        const svgContent = await fetch(svgPath).then((res) => res.text());
        this.svgContent = svgContent;
        // 缓存 svg 内容
        globalCache.svgCache.set(this.name, new Promise((resolve) => resolve(svgContent)));
      }
    } catch (error) {
      this.isUnknownFile = true;

      // 获取缓存
      let cache = globalCache.svgCache.get(FileSuffix_unknown);
      if (cache) {
        this.svgContent = await cache;
        return;
      }

      const svgPath = Object.keys(svgModule).find((key) => key.includes(`Assets/Icons/Svg/${this.name}.svg`));
      if (svgPath) {
        const svgContent = await fetch(svgPath).then((res) => res.text());
        this.svgContent = svgContent;
        // 缓存 svg 内容
        globalCache.svgCache.set(this.name, new Promise((resolve) => resolve(svgContent)));
      }
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
        class={[
          this.className,
          "flex items-center justify-center [&>svg]:w-[inherit] [&>svg]:h-[inherit] [&>svg]:fill-[inherit] [&>svg]:pointer-events-none",
        ].join(" ")}
        v-html={this.svgContent}
        title={this.title}
      ></div>
    );
  }
}
