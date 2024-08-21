import { Component, Vue } from "vue-facing-decorator";

@Component
export default class ControlLibray extends Vue {
  render() {
    return (
      <div class="w-full h-full">
        <ul class="w-full h-full">
          {this.$Controls
            .filter((m) => m != "FormControl")
            .map((m) => {
              return (
                <li
                  class="text-[13px] h-[25px] cursor-pointer text-white flex items-center justify-center hover:bg-[#2d2d2d] border-[#3e3e40]"
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
