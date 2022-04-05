/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:57:02
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-05 15:49:08
 */

import {
  isArray,
  isObject,
  isString,
  normalizeClass,
  ShapeFlags,
} from "./../../shared/src/index";

export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");

/**
 * @description: 是否是同一类型的vnode
 * @param n1 旧的虚拟节点
 * @param n2 新的虚拟节点
 */
export function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}

// 创建虚拟节点函数
export function createVnode(type, props: any = null, children = null) {
  if (props) {
    /**
     * 规范化class的值
     * vue3中有多种class props的处理，针对不同类型需要进行统一
     *
     * 1、<div class="app"></div>  对应的虚拟dom为 {props:{class:'app'}}
     * 2、<div :class="classObj"></div> classObj = {app:true, app1:true} 对应的虚拟dom为 {props:{class:{app:true, app1:true} }}
     * 2、<div :class="classArr"></div> classObj = ['app app1','app2',{app3:true}] 对应的虚拟dom为 {props:{class: ['app app1','app2',{app3:true}] }}
     */
    const { class: kclass } = props;
    if (kclass && !isString(kclass)) {
      props.class = normalizeClass(kclass);
    }
  }

  let shapeFlag = 0;

  // 处理虚拟节点的shapeFlag
  if (isString(type)) {
    shapeFlag = ShapeFlags.ELEMENT;
  } else if (isObject(type)) {
    shapeFlag = ShapeFlags.STATEFUL_COMPONENT;
  }

  return createBaseVNode(type, props, children, shapeFlag, true);
}

// 创建基础vnode
function createBaseVNode(
  type,
  props,
  children,
  shapeFlag,
  needFullChildrenNormalization = false
) {
  const vnode = {
    type,
    props,
    children,
    el: null,
    shapeFlag,
    key: props && props.key,
  };

  if (needFullChildrenNormalization) {
    // 规范化子节点处理，子节点的类型有很多，比如数组，对象，函数等等
    normalizeChildren(vnode, children);
  } else {
    // 能走到这里说明children一定是string或者array类型的
    vnode.shapeFlag |= isString(children)
      ? ShapeFlags.TEXT_CHILDREN
      : ShapeFlags.ARRAY_CHILDREN;
  }
  return vnode;
}

// 创建文本节点的vnode
export function createTextVnode(text) {
  return createVnode(Text, null, text);
}

// 规范化子节点，子节点的类型有多种，比如string、function、object等等
export function normalizeChildren(vnode, children) {
  let type = 0;
  const { shapeFlag } = vnode;

  if (!children) {
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN;
  } else if (isObject(children)) {
    if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      // 子节点是对象表示插槽节点
      type = ShapeFlags.SLOTS_CHILDREN;
    }
  } else {
    children = String(children);
    type = ShapeFlags.TEXT_CHILDREN;
  }
  vnode.shapeFlag |= type;
}
