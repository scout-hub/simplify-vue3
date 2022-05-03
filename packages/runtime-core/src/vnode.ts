/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:57:02
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-03 21:43:51
 */

import {
  EMPTY_ARR,
  extend,
  isArray,
  isFunction,
  isObject,
  isOn,
  isString,
  normalizeClass,
  ShapeFlags,
} from "@simplify-vue/shared";
import { isTeleport } from "./component/Teleport";

// 片段type
export const Fragment = Symbol("Fragment");
// 文本节点type
export const Text = Symbol("Text");
// 注释节点type
export const Comment = Symbol("Comment");

/**
 * @author: Zhouqi
 * @description: 是否是同一类型的vnode
 * @param n1 旧的虚拟节点
 * @param n2 新的虚拟节点
 */
export function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}

// 创建虚拟节点函数
export function createVnode(
  type,
  props: any = null,
  children: unknown = null,
  patchFlag: number = 0
) {
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
  } else if (isTeleport(type)) {
    // teleport要在object判断之前，不然会走到object里面
    shapeFlag = ShapeFlags.TELEPORT;
  } else if (isObject(type)) {
    shapeFlag = ShapeFlags.STATEFUL_COMPONENT;
  } else if (isFunction(type)) {
    shapeFlag = ShapeFlags.FUNCTIONAL_COMPONENT;
  }

  return createBaseVNode(type, props, children, shapeFlag, true, patchFlag);
}

// 创建基础vnode
function createBaseVNode(
  type,
  props,
  children,
  shapeFlag = type === Fragment ? 0 : ShapeFlags.ELEMENT,
  needFullChildrenNormalization = false,
  patchFlag = 0,
  isBlockNode = false
) {
  // shapeFlag == null && (shapeFlag = ShapeFlags.ELEMENT);
  const vnode = {
    type,
    props,
    children,
    el: null,
    shapeFlag,
    component: null,
    key: props && props.key,
    patchFlag,
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

  // isBlockNode为false，即自身不是一个block节点的时候（避免自身触发自身）
  // currentBlock存在并且patchFlag大于0说明是动态节点需要收集
  if (!isBlockNode && currentBlock && vnode.patchFlag > 0) {
    currentBlock.push(vnode);
  }

  return vnode;
}

// 创建文本节点的vnode
export function createTextVNode(text: string) {
  return createVnode(Text, null, text);
}

// 创建注释节点的vnode
export function createCommentVNode(text: string) {
  return createVnode(Comment, null, text);
}

// 规范化子节点，子节点的类型有多种，比如string、function、object等等
export function normalizeChildren(vnode, children) {
  let type = 0;
  const { shapeFlag } = vnode;

  if (children == null) {
    children = null;
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN;
  } else if (isObject(children)) {
    if (shapeFlag & ShapeFlags.COMPONENT) {
      // 子节点是对象表示插槽节点
      type = ShapeFlags.SLOTS_CHILDREN;
    }
  } else if (isFunction(children)) {
    // 如果子节点是一个函数，则表示默认插槽
    type = ShapeFlags.SLOTS_CHILDREN;
    children = { default: children };
  } else {
    children = String(children);
    type = ShapeFlags.TEXT_CHILDREN;
  }
  vnode.children = children;
  vnode.shapeFlag |= type;
}

/**
 * @author: Zhouqi
 * @description: 解析vnode（这里暂时只处理有状态组件的情况）
 * @param child 虚拟节点
 */
export function normalizeVNode(child) {
  if (child == null) {
    // 如果render函数没有返回对应的vnode，则默认创建一个注释节点
    return createVnode(Comment);
  } else if (isObject(child)) {
    // 显然已经是一个vnode类型的数据
    // 如果vnode上没有el，说明是初始化渲染，直接返回vnode即可
    // 如果是更新的话，需要克隆一份新的vnode
    return child.el === null ? child : cloneVNode(child);
  }
  return child;
}

/**
 * @author: Zhouqi
 * @description: 克隆vnode
 * @param  vnode 虚拟节点
 * @param  extraProps 额外的属性
 */
export function cloneVNode(vnode, extraProps?) {
  // vnode克隆处理
  const { props } = vnode;
  const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;
  // 简单处理一下
  vnode = extend(vnode, { props: mergedProps });
  return vnode;
}

/**
 * @author: Zhouqi
 * @description: 合并props属性
 * @param  args 需要合并的props对象数组
 */
export function mergeProps(...args) {
  let result: Record<string, any> = {};
  const argLength = args.length;
  for (let i = 0; i < argLength; i++) {
    const arg = args[i];
    for (const key in arg) {
      const value = arg[key];
      if (key === "class") {
        // 标准化class
        result.class = normalizeClass(value);
      } else if (isOn(key)) {
        // 处理事件相关属性
        const exist = result[key];
        if (
          value &&
          value !== exist &&
          !(isArray(exist) && exist.includes(value))
        ) {
          // 如果新的事件存在且和旧的事件不相同，并且旧的事件集合里面没有新的事件，则合并新旧事件
          result[key] = exist ? [].concat(exist, value) : value;
        }
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

export function createElementBlock(
  type,
  props?,
  children?,
  patchFlag?,
  shapeFlag?
) {
  return setupBlock(
    createBaseVNode(type, props, children, shapeFlag, false, patchFlag, true)
  );
}

/*
 * 对于一些动态节点可以在编译阶段就收集到相关动态节点的信息，比如{{text}}可以认为是一个
 * 动态文本节点。在编译阶段这个节点会附带patchFlag为TEXT的标记。在虚拟创建的时候，
 * 对于这类动态节点需要添加到根节点的dynamicChildren中，这样在更新阶段就不需要再去遍历children，
 * 因为children中可能存在静态节点，这些节点在patch的时候也会进行一系列的比较，这些比较是无意义的。
 * 我们只需要遍历那些动态节点，然后通过补丁标记进行靶向更新即可。
 */

export const blockStack: any[] = [];
export let currentBlock: any = null;

/**
 * 编译生成的渲染函数中，创建虚拟节点的函数是从子到父创建的，当执行到setupBlock的时候，子孙的虚拟节点函数
 * 都已经执行完毕，对应的动态节点也收集完成了，此时只要将当前的block存储到根节点的dynamicChildren上，然后
 * 关闭当前block的收集即可。
 */
function setupBlock(vnode) {
  vnode.dynamicChildren = currentBlock || EMPTY_ARR;
  closeBlock();
  return vnode;
}

export function closeBlock() {
  blockStack.pop();
  currentBlock = blockStack[blockStack.length - 1] || null;
}

/**
 * @author: Zhouqi
 * @description: 开启动态子/孙节点收集
 * @param disableTracking 是否允许收集
 */
export function openBlock(disableTracking = false) {
  blockStack.push((currentBlock = disableTracking ? null : []));
}

export { createBaseVNode as createElementVNode };
