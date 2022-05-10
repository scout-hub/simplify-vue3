import { isArray, invokeArrayFns } from "@simplify-vue/shared";
import { addEventListener } from "../modules/events";

/*
 * @Author: Zhouqi
 * @Date: 2022-05-10 21:06:56
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-10 21:26:33
 */
export const vModelText = {
  created(el, binding, vnode) {
    el._assign = getModelAssigner(vnode);
    addEventListener(el, "input", (e) => {
      el._assign(el.value);
    });
  },
  mounted(el, { value }) {
    el.value = value == null ? "" : value;
  },
  beforeUpdate(el, { value }, vnode) {
    el._assign = getModelAssigner(vnode);
    const newValue = value == null ? "" : value;
    if (el.value !== newValue) {
      el.value = newValue;
    }
  },
};

const getModelAssigner = (vnode) => {
  const fn = vnode.props!["onUpdate:modelValue"];
  return isArray(fn) ? (value) => invokeArrayFns(fn, value) : fn;
};
