import { ControlDeclare } from "@/Types/ControlDeclare";
import {  DesignerDeclare} from "@/Types/DesignerDeclare";
import { UtilsDeclare} from "@/Types/UtilsDeclare";
import { Component, Emit, Prop, Vue } from "vue-facing-decorator";

type ControlConfig = ControlDeclare.ControlConfig;
type MenuItem = DesignerDeclare.MenuItem;
type Coord = UtilsDeclare.Coord;

@Component
export default class ContextMenu extends Vue {
  @Prop
  position: Coord;

  get style() {
    let { x, y } = this.position;
    let { left: l, top: t } = this.$Store.get.Designer.$DesignerSpace?.$el?.getBoundingClientRect() || { left: 0, top: 0 };

    t -= (this.$Store.get.Designer.$DesignerSpace?.$el as HTMLDivElement)?.scrollTop || 0;

    return {
      top: y - t + "px",
      left: x - l + "px",
    };
  }

  async ViewCode() {
    await this.$Store.dispatch("SetCoding", true);
  }

  BringFront() {
    let controls = this.$Store.get.Designer.SelectedControls.map((c) => c.Delete());
    controls.forEach((c) => c.children.push(c.del));
  }

  UnderFloor() {
    let controls = this.$Store.get.Designer.SelectedControls.map((c) => c.Delete());
    controls.forEach((c) => c.children.unshift(c.del));
  }

  Copy() {
    this.$Store.get.Designer.$DesignerSpace.CtrlKeyCControl(null);
  }

  Paste() {
    this.$Store.get.Designer.$DesignerSpace.CtrlKeyVControl(null);
  }

  Delete() {
    this.$Store.get.Designer.$DesignerSpace.DeleteControl(null);
  }

  MoveUpLevel() {
    let { i, children } = this.GetCurrentControlArray(
      this.$Store.get.Designer.FormConfig,
      this.$Store.get.Designer.SelectedControls[0].config.id
    );
    if (i < children.length - 1) {
      [children[i], children[i + 1]] = [children[i + 1], children[i]];
    }
  }

  MoveDownLevel() {
    let { i, children } = this.GetCurrentControlArray(
      this.$Store.get.Designer.FormConfig,
      this.$Store.get.Designer.SelectedControls[0].config.id
    );
    if (i > 0) {
      [children[i - 1], children[i]] = [children[i], children[i - 1]];
    }
  }

  @Emit("selected")
  Selected(m: MenuItem) {
    this[m.code] && this[m.code]();
  }

  GetCurrentControlArray(config: ControlConfig, id: string) {
    if (config.$children && config.$children.length) {
      let i = config.$children.findIndex((c) => c.id == id);
      if (i != -1) {
        return { i, children: config.$children };
      } else {
        for (let i = 0; i < config.$children.length; i++) {
          let obj = this.GetCurrentControlArray(config.$children[i], id);
          if (obj) return obj;
        }
      }
    }
  }

  render() {
    return (
      <div class={css.contextmenu} style={this.style}>
        <ul>
          {this.$Store.get.Designer.Menus.map((m) => {
            return (
              <li
                onMousedown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  if (e.button == 0) this.Selected(m);
                }}
              >
                <span>{m.text}</span>
                <span>{m.shortcutKey}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}
