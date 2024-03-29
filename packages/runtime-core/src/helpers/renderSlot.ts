/*
 * @Author: Zhouqi
 * @Date: 2022-03-30 20:59:56
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-26 09:41:45
 */
import { isFunction } from "@simplify-vue/shared";
import { createVNode, Fragment } from "../vnode";

/**
 * @author: Zhouqi
 * @description: 将slot children转化为虚拟节点
 * @param slots 插槽数据
 * @param name 具名插槽名称
 * @param props 作用域插槽要传入的props数据
 */
export function renderSlot(slots, name, props) {
  // 取对应名称的插槽————具名插槽
  const slot = slots[name];
  if (slot) {
    if (isFunction(slot)) {
      return createVNode(Fragment, null, slot(props));
    }
  }
  return createVNode(Fragment, null, []);
}
