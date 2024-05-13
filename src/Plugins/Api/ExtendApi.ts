import store from "@/Vuex/Store";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { App } from "vue";

type ApiConfigItem = {
  url: string;
  method: "GET" | "DELETE" | "HEAD" | "OPTIONS" | "POST" | "PUT" | "PATCH" | "PURGE" | "LINK" | "UNLINK";
  baseURL?: string;
  responseType?: "arraybuffer" | "blob" | "document" | "json" | "text" | "stream";
  headers?: any;
  preParams?: any;
  ciphertext?: boolean;
  cache?: boolean;
};

type Response = {
  code: number;
  data: any;
};

export type Api<T> = {
  [K in keyof T]: (data?: any, extraData?: any) => Promise<Response>;
};

export const GlobalApi: Api<any> = {};

/**
 * 将url中的 :id 替换为 data 中的 id
 */
function RouterParamsHandler(url: string, data: any) {
  if (data) {
    for (const k in data) {
      url = url.replace(`:${k}`, data[k]);
    }
  }
  return url;
}

function InstallAxiosConfig(name: string, apiConfig: ApiConfigItem, AxiosConfig: AxiosRequestConfig) {
  GlobalApi[name] = function (data?: any, extraData?: any): Promise<Response> {
    const newConfig = {
      ...AxiosConfig,
      ...apiConfig,
      url: process.env.VUE_APP_API_BASE_URL + RouterParamsHandler(apiConfig.url, data),
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        ...(apiConfig.headers || {}),
        // Authorization: "Bearer " + store.get.Token,
        // 每次请求携带客户端的唯一ID
        "X-Client-Id": store.get.Window.ClientId,
      },
    };

    switch (apiConfig.method) {
      case "POST":
        newConfig.data = data;
        break;
      case "PUT":
        newConfig.data = extraData;
        newConfig.url += `/${data}`;
        break;
      default:
        newConfig.params = data;

        break;
    }

    return axios(newConfig).then((res) => {
      return res.data;
    });
  };
}

const ExtendAxios = {
  install(app: App<Element>) {
    let apis = require.context("@/Apis", true, /\.ts$/);
    apis.keys().forEach((key) => {
      let apiConfig = apis(key).default;
      for (let name in apiConfig) {
        InstallAxiosConfig(name, apiConfig[name], {});
      }
    });

    app.config.globalProperties.$Api = GlobalApi;
  },
};

export default ExtendAxios;
