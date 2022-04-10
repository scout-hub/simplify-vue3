/*
 * @Author: Zhouqi
 * @Date: 2022-04-10 11:31:15
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-10 13:54:39
 */
import { NodeTypes } from "../ast";
import { isText } from "../utils";

export function transformText(node, context) {
  if (node.type === NodeTypes.ROOT || node.type === NodeTypes.ELEMENT) {
    return () => {
      const { children } = node;
      let container;

      // 找到相邻的字符串/插值节点，通过+去拼接，并且重新定义新的复合类型节点
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child)) {
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
            } else {
              // 下一个不是文本或者插值节点，跳出循环结束即可
              container = undefined;
              break;
            }
          }
        }
      }
    };
  }
}
