/*
 * @Author: Zhouqi
 * @Date: 2022-05-10 21:06:56
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-09-16 15:12:23
 */
import { isArray, invokeArrayFns } from "@simplify-vue/shared";
import { addEventListener } from "../modules/events";

export const vModelText = {
  created(el, binding, vnode) {
    el._assign = getModelAssigner(vnode);
    // 绑定input事件
    addEventListener(el, "input", (e) => {
      el._assign(el.value);
    });
  },
  mounted(el, { value }) {
    // 设置value
    el.value = value == null ? "" : value;
  },
  beforeUpdate(el, { value }, vnode) {
    el._assign = getModelAssigner(vnode);
    const newValue = value == null ? "" : value;
    // 新旧value不同时更新value
    if (el.value !== newValue) {
      el.value = newValue;
    }
  },
};

const getModelAssigner = (vnode) => {
  const fn = vnode.props!["onUpdate:modelValue"];
  // 执行v-model的默认绑定函数
  return isArray(fn) ? (value) => invokeArrayFns(fn, value) : fn;
};
