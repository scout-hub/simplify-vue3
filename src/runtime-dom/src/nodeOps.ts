/*
 * @Author: Zhouqi
 * @Date: 2022-04-03 15:36:54
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-03 15:53:49
 */
// 平台渲染操作
export const nodeOps = {
  createElement(type) {
    return document.createElement(type);
  },
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null);
  },
};
