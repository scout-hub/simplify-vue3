/*
 * @Author: Zhouqi
 * @Date: 2022-04-24 22:11:19
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-25 09:54:47
 */
export const vShow = {
  beforeMount(el, binding) {
    const { value } = binding;
    setDisplay(el, value);
  },
  updated(el, binding) {
    const { value, oldValue } = binding;
    if (!!value === !!oldValue) {
      return;
    }
    setDisplay(el, value);
  },
};

// 设置元素显示隐藏
function setDisplay(el, value) {
  el.style.display = value ? "block" : "none";
}
