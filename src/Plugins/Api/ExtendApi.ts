import store from "@/Vuex/Store";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { App } from "vue";
import pako from "pako";
import VirtualFileSystem from "@/Apis/VirtualFileSystem";
import DataSource from "@/Apis/DataSource";
import Expression from "@/Apis/Expression";
import CryptoJS from "crypto-js";

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

export const GlobalApi: Api<typeof VirtualFileSystem & typeof DataSource & typeof Expression> = {} as any;

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

/**
 * 创建密钥
 */
function CreateSecretKey() {
  const system = store.get.Index.System;
  const hash = CryptoJS.SHA256(system).toString(CryptoJS.enc.Hex);
  const secretKey = hash.slice(0, 24);
  const iv = hash.slice(0, 8);
  // 组合密钥
  const Key = {
    hash,
    secretKey,
    iv,
  };
  return Key;
}

/**
 * 加密请求参数
 */
function EncryptRequest(data: any) {
  // 创建密钥
  const { secretKey, iv } = CreateSecretKey();
  // 加密
  for (const k in data) {
    // 如果是对象，则跳过
    if (typeof data[k] === "object") continue;
    // 使用 TripleDES 加密
    let ciphertext = CryptoJS.TripleDES.encrypt(data[k], CryptoJS.enc.Utf8.parse(secretKey), {
      iv: CryptoJS.enc.Utf8.parse(iv),
    }).toString();

    data[k] = encodeURIComponent(ciphertext);
  }
}

function InstallAxiosConfig(name: string, apiConfig: ApiConfigItem, AxiosConfig: AxiosRequestConfig) {
  GlobalApi[name] = function (data?: any, extraData?: any): Promise<Response> {
    const newConfig = {
      ...AxiosConfig,
      ...apiConfig,
      url: import.meta.env.VITE_API_BASE_URL + RouterParamsHandler(apiConfig.url, data),
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        ...(apiConfig.headers || {}),
        // Authorization: "Bearer " + store.get.Token,
        // gzip 压缩
        "Content-Encoding": "gzip",
      },
    };

    // 是否是加密请求
    if (apiConfig.ciphertext) {
      EncryptRequest(data);
    }

    switch (apiConfig.method) {
      case "POST":
        newConfig.data = pako.gzip(JSON.stringify(data));
        break;
      case "PUT":
        newConfig.data = pako.gzip(JSON.stringify(extraData));
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

/**
 * 初始化所有 API 配置，并将 GlobalApi 挂载到 app.config.globalProperties.$Api
 * @param app Vue app 实例
 */
export async function registerApis(app: App<Element>) {
  let apis = import.meta.glob("@/Apis/**/*.ts");
  for (const path in apis) {
    let file = (await apis[path]()) as any;
    let apiConfig = file.default;
    for (let name in apiConfig) {
      InstallAxiosConfig(name, apiConfig[name], {});
    }
  }
  app.config.globalProperties.$Api = GlobalApi;
}
