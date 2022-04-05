/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 22:15:52
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-05 20:15:21
 */

import { shallowReadonly, proxyRefs } from "../../reactivity/src/index";
import { isObject, ShapeFlags } from "../../shared/src/index";
import { emit } from "./componentEmits";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";

/**
 * @description: 创建组件实例
 * @param vnode 虚拟节点
 * @param parent 父组件实例
 */
export function createComponentInstance(vnode, parent) {
  const componentInstance = {
    isMounted: false,
    subTree: null,
    vnode,
    ctx: {},
    slots: {},
    type: vnode.type,
    emit: null,
    parent,
    next: null,
    provides: parent ? parent.provides : Object.create(null),
  };

  // 在_属性中存储组件实例对象
  componentInstance.ctx = { _: componentInstance };
  componentInstance.emit = emit.bind(null, componentInstance) as any;
  return componentInstance;
}

/**
 * @description: 是否是有状态组件
 * @param  instance 组件实例
 */
export function isStatefulComponent(instance) {
  return instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT;
}

/**
 * @description: 初始化组件
 * @param instance 组件实例
 */
export function setupComponent(instance) {
  const { props, children } = instance.vnode;
  const isStateful = isStatefulComponent(instance);
  // 初始化props
  initProps(instance, props);
  // 初始化slots
  initSlots(instance, children);
  const setupResult = isStateful ? setupStatefulComponent(instance) : undefined;
  return setupResult;
}

export let currentInstance = null;

/**
 * @description: 获取当前的组件实例
 */
export function getCurrentInstance() {
  return currentInstance;
}

/**
 * @description: 有状态组件
 * @param instance
 */
function setupStatefulComponent(instance) {
  const { type: component, props, emit } = instance;
  const { setup } = component;

  // 这里只是代理了instance上的ctx对象
  // 在处理函数中由于需要instance组件实例，因此需要在ctx中增加一个变量_去存储组件实例，供处理函数内部访问
  // 通过这个代理，我们就能用this.xxx去访问数据了
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);

  // 调用组件上的setup方法获取到数据
  if (setup) {
    setCurrentInstance(instance);
    // props是浅只读的，在开发模式下是shallowReadonly类型，生产环境下不会进行shallowReadonly处理，这里默认进行shallowReadonly处理
    const setupResult = setup(shallowReadonly(props), { emit }) || {};
    unsetCurrentInstance();
    handleSetupResult(instance, setupResult);
  }
}

/**
 * @description: 处理setup返回值
 * @param instance 组件实例
 * @param setupResult setup返回值
 */
function handleSetupResult(instance, setupResult) {
  if (isObject(setupResult)) {
    instance.setupState = proxyRefs(setupResult);
  }
  // TODO
  // setup返回函数时表示render函数
  finishComponentSetup(instance);
}

/**
 * @description: 完成组件初始化
 * @param instance 组件实例
 */
function finishComponentSetup(instance) {
  const { type: component, proxy } = instance;
  if (component.render) {
    instance.render = component.render.bind(proxy);
  }
}

/**
 * @description: 修改当前组件实例
 * @param instance 当前组件实例
 */
function setCurrentInstance(instance) {
  currentInstance = instance;
}

/**
 * @description: 重置当前组件实例
 */
function unsetCurrentInstance() {
  currentInstance = null;
}
