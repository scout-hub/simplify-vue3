/*
 * @Author: Zhouqi
 * @Date: 2022-03-30 20:59:56
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-01 20:47:47
 */
import { isFunction } from "../../../shared/src/index";
import { createVnode, Fragment } from "../vnode";

// 将slot children转化为虚拟节点
export function renderSlot(slots, name, props) {
  // 取对应名称的插槽————具名插槽
  const slot = slots[name];
  if (slot) {
    if (isFunction(slot)) {
      return createVnode(Fragment, null, slot(props));
    }
  }
}
