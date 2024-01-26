import { Component, Vue } from "vue-facing-decorator";

@Component
export default class App extends Vue {
  render() {
    return <router-view />;
  }
}
