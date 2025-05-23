import { createApp } from "vue";
import App from "@/App";
import { ElLoading } from "element-plus";
import { vuex } from "./Vuex/Store";
import { createPinia } from "pinia";
import "element-plus/dist/index.css";
import "./tailwind.css";
import router from "./Router/Index";
import { Instruction } from "./Utils/Instruction";
import RegisterControls from "@/Plugins/RegisterControls";

import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { registerApis } from "./Plugins/Api/ExtendApi";
library.add(fas);
library.add(far);

async function bootstrap() {
  const app = createApp(App);
  const pinia = createPinia();

  app
    .use(pinia)
    .use(Instruction)
    .use(ElLoading)
    .use(RegisterControls)
    .component("font-awesome-icon", FontAwesomeIcon)
    .use(router)
    .use(vuex);
  await registerApis(app);
  app.mount("#app");
}

bootstrap();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register(import.meta.env.MODE === "production" ? "./serviceWorker.js" : "/serviceWorker.js")
    .then((registration) => {})
    .catch((registrationError) => {
      console.log("Pwa 注册失败！", registrationError);
    });
}
