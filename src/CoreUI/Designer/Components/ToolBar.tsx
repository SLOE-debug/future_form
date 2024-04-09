import SvgIcon from "@/Components/SvgIcon";
import { Component, Vue } from "vue-facing-decorator";

@Component
export default class ToolBar extends Vue {
  Justifys = [
    {
      name: "LeftJustify",
      title: "左对齐",
    },
    {
      name: "VCJustify",
      title: "垂直居中对齐",
    },
    {
      name: "RightJustify",
      title: "右对齐",
    },
    {
      name: "TopJustify",
      title: "上对齐",
    },
    {
      name: "HCJustify",
      title: "水平居中对齐",
    },
    {
      name: "BottomJustify",
      title: "下对齐",
    },
    {
      name: "SameHeight",
      title: "同高",
    },
    {
      name: "SameWidth",
      title: "同宽",
    },
    {
      name: "SameSize",
      title: "大小相同",
    },
    {
      name: "VDJustify",
      title: "水平分布",
    },
    {
      name: "HDJustify",
      title: "垂直分布",
    },
  ];
  Justify(type: string) {
    let feild = type.replace("Justify", "").replace("Same", "").toLowerCase();
    let controls = this.$Store.get.Designer.SelectedControls.filter((c) => !c.bigShot);
    let bigShot = this.$Store.get.Designer.BigShotControl;
    let field = "";
    switch (type) {
      case "RightJustify":
      case "VCJustify":
        let { left: l, width: w } = bigShot.config;
        controls.forEach((c) => {
          if (c.config.fromContainer != bigShot.config.fromContainer) return;
          let { left: cl, width: cw } = c.config;
          let offset = cl + cw - (l + w);
          if (type == "VCJustify") offset += w / 2 - cw / 2;

          c.config.left -= offset;
        });
        break;
      case "BottomJustify":
      case "HCJustify":
        let { top: t, height: h } = bigShot.config;
        controls.forEach((c) => {
          if (c.config.fromContainer != bigShot.config.fromContainer) return;
          let { top: ct, height: ch } = c.config;
          let offset = ct + ch - (t + h);
          if (type == "HCJustify") offset += h / 2 - ch / 2;

          c.config.top -= offset;
        });
        break;
      case "SameSize":
        controls.forEach((c) => {
          if (c.config.fromContainer != bigShot.config.fromContainer) return;
          c.config.width = bigShot.config.width;
          c.config.height = bigShot.config.height;
        });
        break;
      case "VDJustify":
        field = "left";
      case "HDJustify":
        if (!field) field = "top";
        let allControls = controls.concat(bigShot);
        allControls.sort((a, b) => a.config[field] - b.config[field]);
        let startControl = allControls[0];
        let endControl = allControls[allControls.length - 1];

        let insideControls = allControls.slice(1, -1);
        if (insideControls.length) {
          let totalLength = endControl.config[field] - startControl.config[field];
          let n = totalLength / (insideControls.length + 1);
          insideControls.forEach((c, i) => {
            c.config[field] = startControl.config[field] + (i + 1) * n;
          });
        }
        break;
      default:
        controls.forEach((c) => {
          if (c.config.fromContainer != bigShot.config.fromContainer) return;
          c.config[feild] = bigShot.config[feild];
        });
        break;
    }
  }

  render() {
    return (
      <div class={css.toolbar}>
        <div class={css.justify}>
          {this.Justifys.map((m) => {
            return (
              <div>
                <SvgIcon
                  {...{
                    ...m,
                    size: 20,
                    onClick: () => {
                      if (this.$Store.get.Designer.SelectedControls.length > 1) this.Justify(m.name);
                    },
                  }}
                ></SvgIcon>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
