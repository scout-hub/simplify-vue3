/*
 * @Author: Zhouqi
 * @Date: 2022-04-10 10:16:09
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-20 21:57:34
 */
import { createVnodeCall, NodeTypes } from "../ast";

export function transformElement(node, context) {
  return () => {
    const { type } = node;
    if (type === NodeTypes.ELEMENT) {
      const { tag, props, children } = node;
      const vnodeTag = `"${tag}"`;
      let vnodeProps;
      let vnodeChildren;

      if (children.length === 1) {
        const child = children[0];
        if (child.type === NodeTypes.TEXT) {
          // 如果只有一个子节点且是文本节点，则vnodeChildren为当前文本节点对象
          vnodeChildren = child;
        } else {
          // 否则为整个children
          vnodeChildren = children;
        }
      }else{
        // 孩子节点有多个的情况下vnodeChildren为children
        vnodeChildren = children;
      }

      node.codegenNode = createVnodeCall(
        context,
        vnodeTag,
        vnodeProps,
        vnodeChildren
      );
    }
  };
}
