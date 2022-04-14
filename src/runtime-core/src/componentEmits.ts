/*
 * @Author: Zhouqi
 * @Date: 2022-03-30 09:49:57
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-14 22:07:32
 */

import { camelize, toHandlerKey } from "../../shared/src";

/**
 * @author: Zhouqi
 * @description: 事件触发函数
 * @param instance 组件实例
 * @param event 事件名
 */
export function emit(instance, event, ...rawArg) {
  const { props } = instance;

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
