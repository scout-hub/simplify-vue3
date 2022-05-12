/*
 * @Author: Zhouqi
 * @Date: 2022-04-29 20:33:41
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-12 21:50:54
 */
import { reactive } from "@simplify-vue/reactivity";
import { isFunction, isObject } from "@simplify-vue/shared";

/**
 * @author: Zhouqi
 * @description: 合并vue2的options api
 * @param instance 组件实例
 */
export function applyOptions(instance) {
  const { data: dataOptions, components } = instance.type;
  const proxy = instance.proxy;

  if (dataOptions) {
    if (!isFunction(dataOptions)) return;
    const data = dataOptions.call(proxy, proxy);
    if (!isObject(data)) return;
    instance.data = reactive(data);
  }

  if (components) instance.components = components;
}
