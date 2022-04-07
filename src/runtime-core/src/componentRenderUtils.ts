/*
 * @Author: Zhouqi
 * @Date: 2022-04-05 20:00:07
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-07 11:51:30
 */

import { ShapeFlags } from "../../shared/src";
import { cloneVNode, normalizeVNode } from "./vnode";

/**
 * @description: 生成组件的vnode
 * @param instance 组件实例
 */
export function renderComponentRoot(instance) {
  const { attrs, render, proxy, vnode, inheritAttrs } = instance;
  let fallthroughAttrs;
  let result;

  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    // 处理有状态组件
    result = normalizeVNode(render.call(proxy));
    fallthroughAttrs = attrs;
  }

  // fallthroughAttrs存在且可以继承attrs属性的情况下
  if (fallthroughAttrs && inheritAttrs !== false) {
    const attrsKeys = Object.keys(fallthroughAttrs);
    const { shapeFlag } = result;
    if (
      attrsKeys.length &&
      shapeFlag & (ShapeFlags.ELEMENT | ShapeFlags.COMPONENT)
    ) {
      result = cloneVNode(result, fallthroughAttrs);
    }
  }
  return result;
}

/**
 * @description: 是否需要更新组件
 * @param n1 旧的虚拟节点
 * @param n2 新的虚拟节点
 */
export function shouldUpdateComponent(n1, n2) {
  const { props: prevProps } = n1;
  const { props: nextProps } = n2;
  for (const key in nextProps) {
    if (nextProps[key] !== prevProps[key]) {
      return true;
    }
  }
  return false;
}
