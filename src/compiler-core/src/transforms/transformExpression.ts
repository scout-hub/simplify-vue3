import { NodeTypes } from "../ast";

/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 23:38:10
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-09 23:40:47
 */
export function transformExpression(node, context) {
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(node.content, context);
  }
}

function processExpression(node, context) {
  node.content = `_ctx.${node.content}`;
  return node;
}
