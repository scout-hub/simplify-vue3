/*
 * @Author: Zhouqi
 * @Date: 2022-04-03 15:36:54
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-04 20:39:52
 */
// 平台渲染操作
export const nodeOps = {
  // 创建节点
  createElement(type) {
    return document.createElement(type);
  },
  // 添加节点
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null);
  },
  // 删除节点
  remove(child) {
    const parent = child.parentNode;
    parent && parent.removeChild(child);
  },
  // 设置文本内容
  setElementText(el, text) {
    el.textContent = text;
  },
};
