/*
 * @Author: Zhouqi
 * @Date: 2022-05-12 21:26:53
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-12 22:00:29
 */
import { currentRenderInstance } from "../componentRenderContext";

const COMPONENTS = "components";

export function resolveComponent(name: string) {
  return resolveAsset(COMPONENTS, name);
}

/**
 * @author: Zhouqi
 * @description: 解析资源，例如组件/指令/过滤器
 * @param type
 * @param name
 * @return
 */
function resolveAsset(type, name: string) {
  // 这里先处理组件
  const instance: any = currentRenderInstance;
  if (instance) {
    const Component = instance.type;
    const selfName = instance.name;
    if (selfName === name) return Component;
    const result = instance[type][name];
    if (!result) {
      const extra =
        `\nIf this is a native custom element, make sure to exclude it from ` +
        `component resolution via compilerOptions.isCustomElement.`;
      console.warn(`Failed to resolve ${type.slice(0, -1)}: ${name}${extra}`);
    }
    return result;
  }
}
