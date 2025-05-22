import { dataSourceParamPrefix } from "@/Utils/BasicUtils";
import { globalCache } from "@/Utils/Caches";
import DevelopmentModules from "@/Utils/DevelopmentModules";
import { ComponentBase } from "vue-facing-decorator";
import Control from "./Control";

type SourceParams = Record<string, any>;

@ComponentBase
export default class DataSourceControl extends Control {
  async created() {
    if (this.isDesignerMode) return;
    // 如果有绑定的数据源，则获取数据源
    if (this.config.dataSource) {
      this.parentFormControl.$nextTick(async () => {
        let sourceParams = this.extractSourceParams();
        await this.GetInnerSource(sourceParams);
      });
    }
  }

  private extractSourceParams(): SourceParams {
    const sourceParams: SourceParams = {};

    for (const key in this.config) {
      if (!key.startsWith(dataSourceParamPrefix)) continue;

      const [, paramName] = key.split(dataSourceParamPrefix);
      const refKey = this.config[key];
      const refComponent = this.parentFormControl.instance.$refs[refKey];

      if (refComponent?.config?.value !== undefined) {
        sourceParams[paramName] = refComponent.config.value;
      }
    }

    return sourceParams;
  }

  async GetInnerSource(params: SourceParams) {
    const cacheKey = this.config.dataSource;
    // 使用缓存或创建新的请求
    return globalCache.dataSourceCache.get(cacheKey) || this.createAndCacheSourceRequest(cacheKey, params);
  }

  private async createAndCacheSourceRequest(cacheKey: string, params: SourceParams) {
    const promise = new Promise<any>(async (resolve) => {
      const isPreview = this.$Store.get.Designer.Preview;

      if (!isPreview) {
        // 常规模式请求
        const response = await this.$Api.GetSource({
          id: cacheKey,
          args: params,
        });
        resolve(response.data);
      } else {
        // 预览模式请求
        const { GetFileById } = await DevelopmentModules.Load();
        const file = GetFileById(cacheKey);

        const response = await this.$Api.GetSourceInDebug({
          sql: file.content,
          param: file.extraData.params,
          args: params,
        });
        resolve(response.data);
      }
    });

    // 缓存并返回结果
    globalCache.dataSourceCache.set(cacheKey, promise);
    return promise;
  }
}
