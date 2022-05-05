/*
 * @Author: Zhouqi
 * @Date: 2022-04-03 15:36:54
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-05 17:15:06
 */
// 平台渲染操作
export const nodeOps = {
  parentNode(node) {
    return node.parentNode || null;
  },
  /**
   * @author: Zhouqi
   * @description: 创建节点
   * @param type 节点类型
   */
  createElement(type) {
    return document.createElement(type);
  },
  /**
   * @author: Zhouqi
   * @description: 添加节点
   * @param child 子节点
   * @param parent 父节点
   * @param anchor 锚点节点
   */
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null);
  },
  /**
   * @author: Zhouqi
   * @description: 删除节点
   * @param child 子节点
   */
  remove(child) {
    const parent = child.parentNode;
    parent && parent.removeChild(child);
  },
  /**
   * @author: Zhouqi
   * @description: 设置元素的文本内容
   * @param el 元素
   * @param text 文本内容
   */
  setElementText(el, text) {
    el.textContent = text;
  },
  /**
   *
   * @author: Zhouqi
   * @description: 创建文本节点
   * @param text 文本内容
   * @return 文本节点
   */
  createText(text) {
    return document.createTextNode(text);
  },
  /**
   * @author: Zhouqi
   * @description: 设置文本节点的文本内容
   * @param node 文本节点
   * @param text 文本内容
   */
  setText(node, text) {
    node.nodeValue = text;
  },
  /**
   * @author: Zhouqi
   * @description: 创建注释节点
   * @param text 注释内容
   * @return 注释节点
   */
  createComment: (text) => document.createComment(text),
  /**
   * @author: Zhouqi
   * @description: 获取当前节点的下一个节点
   * @param node 当前节点
   * @return 当前节点的下一个节点
   */
  nextSibling: (node) => node.nextSibling,
  /**
   * @author: Zhouqi
   * @description: 查找节点
   * @param selector 选择器
   * @return 节点
   */
  querySelector: (selector) => document.querySelector(selector),
};
