/*
 * @Author: Zhouqi
 * @Date: 2022-04-10 10:16:09
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-10 14:17:02
 */
import { createVnodeCall, NodeTypes } from "../ast";

export function transformElement(node, context) {
  return () => {
    const { type } = node;
    if (type === NodeTypes.ELEMENT) {
      const vnodeTag = `"${node.tag}"`;
      const children = node.children;
      let vnodeProps;
      let vnodeChildren = children[0];

      node.codegenNode = createVnodeCall(
        context,
        vnodeTag,
        vnodeProps,
        vnodeChildren
      );
    }
  };
}
