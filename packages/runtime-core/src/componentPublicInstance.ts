/*
 * @Author: Zhouqi
 * @Date: 2022-03-27 21:17:03
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-09-14 17:10:05
 */
import { shallowReadonly } from "@simplify-vue/reactivity";
import { EMPTY_OBJ, hasOwn } from "@simplify-vue/shared";

const enum AccessTypes {
  SETUP,
  DATA,
  PROPS,
}

// 建立map映射对应vnode上的属性，利于扩展
const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
  $slots: (i) => shallowReadonly(i.slots),
  $props: (i) => shallowReadonly(i.props),
  $attrs: (i) => shallowReadonly(i.attrs),
  $data: (i) => i.data,
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState, props, accessCache, data, propsOptions } = instance;
    /**
     * 这里每次都会通过hasOwn去判断属性是不是存在于某一个对象中，这样是不如直接访问对应对象属性来的更快
     * 为了能够直接访问到指定对象上的属性，需要建立一个映射表，在第一次读取值的时候将属性和对象之间进行关联
     * 比如第一次读取属性值时，通过hasOwn发现是setupState上的属性，那就标记该属性是SETUP，下一次访问
     * 该属性时，判断到标记为SETUP，则直接从setupState获取值
     */
    if (key[0] !== "$") {
      const t = accessCache[key];
      if (t !== undefined) {
        switch (t) {
          case AccessTypes.SETUP:
            return setupState[key];
          case AccessTypes.DATA:
            return data[key];
          case AccessTypes.PROPS:
            return props[key];
        }
      }
      if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
        accessCache[key] = AccessTypes.SETUP;
        return setupState[key];
      } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
        accessCache[key] = AccessTypes.DATA;
        return data[key];
      } else if (hasOwn(propsOptions[0], key)) {
        accessCache[key] = AccessTypes.PROPS;
        return props[key];
      }
    }

    // 属性映射表上有对应的属性则返回对应的属性值
    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }

    console.warn(
      `Property ${JSON.stringify(key)} was accessed during render ` +
        `but is not defined on instance.`
    );
  },
  set({ _: instance }, key: string, value: any) {
    const { data, setupState, accessCache } = instance;
    const t = accessCache[key];

    if (t !== undefined) {
      switch (t) {
        case AccessTypes.SETUP:
          setupState[key] = value;
          return true;
        case AccessTypes.DATA:
          data[key] = value;
          return true;
      }
    }

    if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
      setupState[key] = value;
    } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
      data[key] = value;
    }
    return true;
  },
};
