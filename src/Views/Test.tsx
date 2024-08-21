import { Component, Vue } from "vue-facing-decorator";

@Component
export default class Test extends Vue {
  path = "";
  toPath = "";

  render() {
    return (
      <>
        <button
          onClick={async (e) => {
            let res = await window.electronAPI.CteateWordByTemplate(
              "C:\\Users\\c0375.LINDAPATENT1009\\Desktop\\补正书（全）.doc",
              {
              }
            );
            console.log(res);
          }}
        >
          打开 Word 模板
        </button>
      </>
    );
  }
}
