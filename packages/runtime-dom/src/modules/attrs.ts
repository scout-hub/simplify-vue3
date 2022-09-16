/*
 * @Author: Zhouqi
 * @Date: 2022-04-04 13:53:46
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-09-14 17:43:17
 */
export function patchAttr(el, key, value) {
  // 新的值不存在，则表示删除属性
  if (value == null) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, value);
  }
}
