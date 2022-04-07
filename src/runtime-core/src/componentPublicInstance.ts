/*
 * @Author: Zhouqi
 * @Date: 2022-03-27 21:17:03
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-07 11:59:07
 */
import { shallowReadonly } from "../../reactivity/src";
import { hasOwn } from "../../shared/src";

// 建立map映射对应vnode上的属性，利于扩展
const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
  $slots: (i) => shallowReadonly(i.slots),
  $props: (i) => shallowReadonly(i.props),
  $attrs: (i) => shallowReadonly(i.attrs),
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState, props } = instance;

    if (hasOwn(props, key)) {
      return props[key];
    } else if (setupState && hasOwn(setupState, key)) {
      return setupState[key];
    }

    // 属性映射表上有对应的属性则返回对应的属性值
    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};
