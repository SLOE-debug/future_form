import { createApp } from "vue";
import App from "@/App";
import { ElLoading } from "element-plus";
import { vuex } from "./Vuex/Store";
import "element-plus/dist/index.css";
import router from "./Router/Index";
import { Instruction } from "./Utils/Instruction";

import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
library.add(fas);

let app = createApp(App);
app.use(ElLoading).use(Instruction).component("font-awesome-icon", FontAwesomeIcon).use(router).use(vuex).mount("#app");
