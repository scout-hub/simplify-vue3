/*
 * @Author: Zhouqi
 * @Date: 2022-04-10 10:16:09
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-19 23:12:07
 */
import { createVnodeCall, NodeTypes } from "../ast";

export function transformElement(node, context) {
  return () => {
    const { type } = node;
    if (type === NodeTypes.ELEMENT) {
      const vnodeTag = `"${node.tag}"`;
      const children = node.children;
      let vnodeProps;
      let vnodeChildren;

      if (children.length === 1) {
        const child = children[0];
        if (child.type === NodeTypes.TEXT) {
          vnodeChildren = child;
        } else {
          vnodeChildren = children;
        }
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
