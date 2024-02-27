import WindowCollection from "@/Components/WindowCollection";
import { Component, Vue } from "vue-facing-decorator";

@Component
export default class Preview extends Vue {
  render() {
    return (
      <div class={css.preview}>
        <WindowCollection></WindowCollection>
      </div>
    );
  }
}
