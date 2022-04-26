/*
 * @Author: Zhouqi
 * @Date: 2022-04-04 14:03:59
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-08 19:44:56
 */
/**
 * @author: Zhouqi
 * @description: 更新dom属性
 * @param el dom元素
 * @param key 属性
 * @param value 值
 */
export function patchDOMProp(el, key, value) {
  if (value === "" || value === null) {
    const type = typeof el[key];
    // 对于dom属性上的值为boolean的情况下，如果设置的值是空的则需要转化为true
    if (type === "boolean") {
      el[key] = true;
      return;
    }
    el.removeAttribute(key);
    return;
  }
  el[key] = value;
}
