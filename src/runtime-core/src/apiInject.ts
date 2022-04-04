/*
 * @Author: Zhouqi
 * @Date: 2022-04-02 14:43:10
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-02 17:20:23
 */
import { isFunction } from "../../shared/src/index";
import { currentInstance } from "./component";

/**
 * @description: 依赖提供
 * @param key 键
 * @param value 值
 */
export function provide(key: string, value: unknown) {
  if (!currentInstance) {
    return;
  }
  const instance: any = currentInstance;
  let provides = instance.provides;
  const parentProvides = instance.parent && instance.parent.provides;
  /**
   * 默认情况下，当前组件实例的provides继承父组件的provides
   * 如果当前组件需要定义provides，则需要实现原型链的方式，避免当前组件实例在创建provides的时候
   * 影响到父组件的provides。
   * 当通过inject注入的时候，也是按照原型链的方式去查找
   */
  if (provides === parentProvides) {
    // 如果当前组件实例的provides等于父组件的provides，则表示初始化的状态，此时设置当前组件provides的原型为父组件的provides
    provides = instance.provides = Object.create(parentProvides);
  }
  provides[key] = value;
}

/**
 * @description: 依赖注入
 * @param key 键
 * @param defaultValue 默认值
 * @param treatDefaultAsFactory 如果默认值是一个函数，是否执行函数得到返回结果
 */
export function inject(
  key: string,
  defaultValue,
  treatDefaultAsFactory: boolean = false
) {
  const instance: any = currentInstance;
  if (instance) {
    const provides = instance.parent?.provides;
    // 如果要注入的key存在于父组件的provides中则返回值
    if (key in provides) {
      return provides[key];
    }
    // 如果要注册的key不存在于父组件的provides中，则有默认值时返回默认值
    if (defaultValue) {
      return treatDefaultAsFactory && isFunction(defaultValue)
        ? defaultValue.call(instance.proxy)
        : defaultValue;
    }
  }
}
