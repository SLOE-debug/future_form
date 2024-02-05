import { Component, Vue } from "vue-facing-decorator";

@Component
export default class ControlLibray extends Vue {
  render() {
    return (
      <div class={css.toolkit}>
        <ul>
          {this.$Controls
            .filter((m) => m != "FormControl")
            .map((m) => {
              return (
                <li
                  onDragstart={(e) => {
                    e.dataTransfer.setData("type", m);
                  }}
                  draggable={true}
                >
                  {m.replace("Control", "")}
                </li>
              );
            })}
        </ul>
      </div>
    );
  }
}
