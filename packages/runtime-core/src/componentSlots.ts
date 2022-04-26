/*
 * @Author: Zhouqi
 * @Date: 2022-03-30 21:16:45
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-26 09:42:53
 */

import { isArray, ShapeFlags } from "@simplify-vue/shared";

/**
 * 插槽的vnode结构
 */

/**
 * @author: Zhouqi
 * @description: 初始化插槽
 * @param instance 组件实例
 * @param children 插槽节点
 */
export function initSlots(instance, children) {
  // 判断是不是插槽节点
  if (ShapeFlags.SLOTS_CHILDREN & instance.vnode.shapeFlag) {
    normalizeObjectSlots(children, (instance.slots = {}));
  }
}

/**
 * @author: Zhouqi
 * @description: 将children中的插槽节点赋值到组件实例的slots对象上
 * @param children 插槽节点
 * @param slots 插槽数据存储目标
 */
function normalizeObjectSlots(children, slots) {
  // slots是一个对象，用于实现具名插槽
  for (const key in children) {
    const slot = children[key];
    // 将插件转换为函数实现作用于插槽
    slots[key] = (props) => normalizeSlotValue(slot(props));
  }
}

/**
 * @author: Zhouqi
 * @description: 对插槽值对处理，转换成数组类型的子节点
 * @param slot 插槽数据
 */
function normalizeSlotValue(slot) {
  return isArray(slot) ? slot : [slot];
}

/**
 * @author: Zhouqi
 * @description: 更新插槽节点
 * @param instance 组件实例
 * @param children 子节点
 */
export function updateSlots(instance, children) {
  const { slots } = instance;
  let needDeletionCheck = true;
  // 判断是不是插槽节点
  if (ShapeFlags.SLOTS_CHILDREN & instance.vnode.shapeFlag) {
    normalizeObjectSlots(children, slots);
  }
  // 删除不存在slot key
  if (needDeletionCheck) {
    for (const key in slots) {
      if (!(key in children)) {
        delete slots[key];
      }
    }
  }
}
