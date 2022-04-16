/*
 * @Author: Zhouqi
 * @Date: 2022-04-05 20:00:07
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-16 14:04:02
 */

import { ShapeFlags } from "../../shared/src";
import { cloneVNode, normalizeVNode } from "./vnode";

/**
 * @author: Zhouqi
 * @description: 生成组件的vnode
 * @param instance 组件实例
 */
export function renderComponentRoot(instance) {
  const {
    attrs,
    props,
    render,
    proxy,
    vnode,
    inheritAttrs,
    type: Component,
    emit,
    slots,
  } = instance;

  let fallthroughAttrs;
  let result;

  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    // 处理有状态组件
    result = normalizeVNode(render.call(proxy, proxy));
    fallthroughAttrs = attrs;
  } else {
    // 函数式组件就是一个render函数
    const render = Component;
    // 如果函数式组件定义了1一个以上的参数，则第二个参数为context对象，否则为null
    result = normalizeVNode(
      render(props, render.length > 1 ? { attrs, slots, emit } : null)
    );
    fallthroughAttrs = attrs;
  }

  // attrs存在且可以继承attrs属性的情况下
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
 * @author: Zhouqi
 * @description: 是否需要更新组件
 * @param n1 旧的虚拟节点
 * @param n2 新的虚拟节点
 */
export function shouldUpdateComponent(n1, n2) {
  const { props: prevProps, children: prevChildren } = n1;
  const { props: nextProps, children: nextChildren } = n2;

  if (prevChildren || nextChildren) {
    if (!nextChildren || !(nextChildren as any).$stable) {
      return true;
    }
  }

  if (prevProps === nextProps) {
    return false;
  }
  if (!prevProps) {
    return !!nextProps;
  }
  if (!nextProps) {
    return true;
  }

  return hasPropsChanged(prevProps, nextProps);
}

/**
 * @author: Zhouqi
 * @description: 比较新旧props是否变化
 * @param prevProps
 * @param nextProps
 */
function hasPropsChanged(prevProps, nextProps) {
  if (Object.keys(prevProps) !== Object.keys(prevProps)) {
    return false;
  }
  for (const key in nextProps) {
    if (nextProps[key] !== prevProps[key]) {
      return true;
    }
  }
  return false;
}
