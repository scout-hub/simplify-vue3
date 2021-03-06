/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 22:15:52
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-12 21:48:02
 */

import { shallowReadonly, proxyRefs } from "@simplify-vue/reactivity";
import {
  EMPTY_OBJ,
  isFunction,
  isObject,
  NOOP,
  ShapeFlags,
} from "@simplify-vue/shared";
import { emit, normalizeEmitsOptions } from "./componentEmits";
import { applyOptions } from "./componentOptions";
import { initProps, normalizePropsOptions } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";

// 生命周期钩子名称枚举
export const enum LifecycleHooks {
  BEFORE_MOUNT = "bm",
  MOUNTED = "m",
  BEFORE_UPDATE = "bu",
  UPDATED = "u",
  BEFORE_UNMOUNT = "bum",
  UNMOUNTED = "um",
}

/**
 * @author: Zhouqi
 * @description: 创建组件实例
 * @param vnode 虚拟节点
 * @param parent 父组件实例
 */
export function createComponentInstance(vnode, parent) {
  const type = vnode.type;

  const componentInstance = {
    vnode,
    type,
    parent,
    isMounted: false,
    subTree: null,
    emit: null,
    next: null,
    proxy: null,
    provides: parent ? parent.provides : Object.create(null),
    propsOptions: normalizePropsOptions(type),
    emitsOptions: normalizeEmitsOptions(type),

    components: null,
    directives: null,

    props: EMPTY_OBJ,
    data: EMPTY_OBJ,
    attrs: EMPTY_OBJ,
    slots: EMPTY_OBJ,
    ctx: EMPTY_OBJ,
    setupState: EMPTY_OBJ,

    accessCache: null,
    inheritAttrs: type.inheritAttrs,

    // lifecycle hooks
    bm: null,
    m: null,
    bu: null,
    u: null,
    bum: null,
    um: null,
  };

  // 在_属性中存储组件实例对象
  componentInstance.ctx = { _: componentInstance };
  componentInstance.emit = emit.bind(null, componentInstance) as any;
  return componentInstance;
}

/**
 * @author: Zhouqi
 * @description: 是否是有状态组件
 * @param  instance 组件实例
 */
export function isStatefulComponent(instance) {
  return instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT;
}

/**
 * @author: Zhouqi
 * @description: 初始化组件
 * @param instance 组件实例
 */
export function setupComponent(instance) {
  const { props, children } = instance.vnode;
  const isStateful = isStatefulComponent(instance);
  // 初始化props
  initProps(instance, props, isStateful);
  // 初始化slots
  initSlots(instance, children);
  const setupResult = isStateful ? setupStatefulComponent(instance) : undefined;
  return setupResult;
}

export let currentInstance = null;

/**
 * @author: Zhouqi
 * @description: 获取当前的组件实例
 */
export function getCurrentInstance() {
  return currentInstance;
}

/**
 * @author: Zhouqi
 * @description: 有状态组件
 * @param instance
 */
function setupStatefulComponent(instance) {
  const { type: component, props, emit, attrs, slots } = instance;
  const { setup } = component;

  // 这里accessCache不能赋值为{}，因为通过this.xxx读取的xxx属性可能是对象内置的属性，比如hasOwnProperty，这会影响
  // instance.proxy中get的读取逻辑
  instance.accessCache = Object.create(null);

  // 这里只是代理了instance上的ctx对象
  // 在处理函数中由于需要instance组件实例，因此需要在ctx中增加一个变量_去存储组件实例，供处理函数内部访问
  // 通过这个代理，我们就能用this.xxx去访问数据了
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);

  // 调用组件上的setup方法获取到数据
  if (setup) {
    setCurrentInstance(instance);
    // props是浅只读的，在开发模式下是shallowReadonly类型，生产环境下不会进行shallowReadonly处理，这里默认进行shallowReadonly处理
    const setupResult =
      setup(shallowReadonly(props), { emit, attrs, slots }) || {};
    unsetCurrentInstance();

    handleSetupResult(instance, setupResult);
  } else {
    finishComponentSetup(instance);
  }
}

/**
 * @author: Zhouqi
 * @description: 处理setup返回值
 * @param instance 组件实例
 * @param setupResult setup返回值
 */
function handleSetupResult(instance, setupResult) {
  if (isObject(setupResult)) {
    // 如果结果是对象，说明返回的是数据
    instance.setupState = proxyRefs(setupResult);
  } else if (isFunction(setupResult)) {
    // 如果是函数，则表示渲染函数
    instance.render = setupResult;
  }
  finishComponentSetup(instance);
}

/**
 * @author: Zhouqi
 * @description: 完成组件初始化
 * @param instance 组件实例
 */
function finishComponentSetup(instance) {
  const { type: component } = instance;

  if (!instance.render) {
    if (!component.render) {
      const { template } = component;
      if (template) {
        component.render = compile(template);
      }
    }
    instance.render = component.render || NOOP;
  }

  applyOptions(instance);
}

/**
 * @author: Zhouqi
 * @description: 修改当前组件实例
 * @param instance 当前组件实例
 */
export const setCurrentInstance = (instance) => {
  currentInstance = instance;
};

/**
 * @author: Zhouqi
 * @description: 重置当前组件实例
 */
export const unsetCurrentInstance = () => {
  currentInstance = null;
};

let compile;

/**
 * @author: Zhouqi
 * @description: 注册一个运行时编译函数，传入compile函数来编译template
 * @param {any} _compile
 * @return {*}
 */
export function registerRuntimeCompiler(_compile) {
  compile = _compile;
}
