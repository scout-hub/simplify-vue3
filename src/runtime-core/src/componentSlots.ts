/*
 * @Author: Zhouqi
 * @Date: 2022-03-30 21:16:45
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-07 21:22:43
 */

import { isArray, ShapeFlags } from "../../shared/src/index";

/**
 * 插槽的vnode结构
 */

// 初始化插槽
export function initSlots(instance, children) {
  // 判断是不是插槽节点
  if (ShapeFlags.SLOTS_CHILDREN & instance.vnode.shapeFlag) {
    normalizeObjectSlots(children, (instance.slots = {}));
  }
}

// 将children中的插槽节点赋值到组件实例的slots对象上
function normalizeObjectSlots(children, slots) {
  // slots是一个对象，用于实现具名插槽
  for (const key in children) {
    const slot = children[key];
    // 将插件转换为函数实现作用于插槽
    slots[key] = (props) => normalizeSlotValue(slot(props));
  }
}

// 对插槽值对处理，转换成数组类型的子节点
function normalizeSlotValue(slot) {
  return isArray(slot) ? slot : [slot];
}
