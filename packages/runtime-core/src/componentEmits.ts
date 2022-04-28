/*
 * @Author: Zhouqi
 * @Date: 2022-03-30 09:49:57
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-28 22:37:01
 */

import {
  camelize,
  toHandlerKey,
  isArray,
  extend,
  isOn,
  hasOwn,
} from "@simplify-vue/shared";

/**
 * @author: Zhouqi
 * @description: 事件触发函数
 * @param instance 组件实例
 * @param event 事件名
 */
export function emit(instance, event, ...rawArg) {
  // 这里需要从instance的vnode上获取事件，在instance上的是找不到注册的事件，因为在initProps的时候
  // instance上面的props对象中的数据必须是通过props选项定义过的
  const { props } = instance.vnode;

  // 校验参数合法性
  const { emitsOptions } = instance;
  if (emitsOptions) {
    const validator = emitsOptions[event];
    if (validator) {
      const isValid = validator(...rawArg);
      if (!isValid) {
        console.warn("参数不合法");
      }
    }
  }

  /**
   * 针对两种事件名做处理
   * add-name 烤肉串命名
   * addName 驼峰命名
   * 如果是烤肉串命名，先转换为驼峰命名，再转化为AddName这种名称类型
   */
  const handler =
    props[toHandlerKey(event)] || props[toHandlerKey(camelize(event))];

  if (handler) {
    handler(...rawArg);
  }
}

/**
 * @author: Zhouqi
 * @description: 解析emits选项
 * @param component 组件实例
 * @return 解析后的结果
 */
export function normalizeEmitsOptions(component) {
  // TODO 缓存emits的解析结果，如果组件的emits被解析过了，就不再次解析
  const emits = component.emits;
  const normalizeResult = {};
  if (isArray(emits)) {
    // 数组形式直接遍历赋值为null
    emits.forEach((key) => {
      normalizeResult[key] = null;
    });
  } else {
    // 如果是对象，则可能有校验函数，直接合并到结果中即可
    extend(normalizeResult, emits);
  }
  return normalizeResult;
}

/**
 * @author: Zhouqi
 * @description: 判断是否是emits选项中定义的事件，如果是的话，不需要添加到attrs中，避免组件根节点被绑定上事件
 * @param emitsOptions emits序列化后的选项
 * @param key 事件名
 * @return 是否应该继续被attrs处理
 */
export function isEmitListener(emitsOptions, key) {
  if (!emitsOptions || !isOn(key)) {
    return false;
  }
  key = key.slice(2).toLowerCase();
  return hasOwn(emitsOptions, key);
}
