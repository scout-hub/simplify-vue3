/*
 * @Author: Zhouqi
 * @Date: 2022-04-10 11:31:15
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-21 22:35:17
 */
import { createCallExpression, NodeTypes } from "../ast";
import { CREATE_TEXT } from "../runtimeHelpers";
import { isText } from "../utils";

export function transformText(node, context) {
  if (node.type === NodeTypes.ROOT || node.type === NodeTypes.ELEMENT) {
    return () => {
      const { children } = node;
      let container;
      let hasText = false;

      // 找到相邻的字符串/插值节点，通过+去拼接，并且重新定义新的复合类型节点
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child)) {
          hasText = true;
          for (let j = i + 1; j < children.length; j++) {
            const nextChild = children[j];
            if (isText(nextChild)) {
              // 表明是复合节点，需要重新去修改当前节点数据
              if (!container) {
                container = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child],
                };
              }
              // 前后需要进行拼接处理
              container.children.push(` + `);
              container.children.push(nextChild);
              // nextChild节点被重新处理过了，需要删除老的
              children.splice(j, 1);
              // 删除了一个，为了不影响遍历j也要减1
              j--;
            } else {
              // 下一个不是文本或者插值节点，跳出循环结束即可
              container = undefined;
              break;
            }
          }
        }
      }

      // 不处理文本节点的情况
      // 1、存在文本节点
      // 2、只有一个文本子节点，且父元素是element/root类型
      if (
        !hasText ||
        (children.length === 1 &&
          (node.type === NodeTypes.ELEMENT || node.type === NodeTypes.ROOT))
      ) {
        return;
      }

      // 需要增加createTextVNode的处理，因为有多个子节点且其中有文本节点
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        // 处理文本节点或者复合节点（文本+插值）
        if (isText(child) || child.type === NodeTypes.COMPOUND_EXPRESSION) {
          const callArgs: any = [];
          callArgs.push(child);
          children[i] = {
            type: NodeTypes.TEXT_CALL,
            content: child,
            codegenNode: createCallExpression(
              context.helper(CREATE_TEXT),
              callArgs
            ),
          };
        }
      }
    };
  }
}
