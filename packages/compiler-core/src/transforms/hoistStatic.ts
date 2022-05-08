/*
 * @Author: Zhouqi
 * @Date: 2022-05-08 21:04:07
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-08 21:47:53
 */

import { isString } from "@simplify-vue/shared";
import { ConstantTypes, NodeTypes } from "../ast";

/**
 * @author: Zhouqi
 * @description: 获取节点的constant type
 * @param node
 * @return constant
 */
export function getConstantType(node) {
  // TODO 这里只处理 插值/文本/插值结合文本的情况
  const { type } = node;
  switch (type) {
    case NodeTypes.TEXT:
      return ConstantTypes.CAN_STRINGIFY;
    case NodeTypes.INTERPOLATION:
      return getConstantType(node.content);
    case NodeTypes.SIMPLE_EXPRESSION:
      return node.constType;
    case NodeTypes.COMPOUND_EXPRESSION:
      const children = node.children;
      // 默认是可字符串化的
      let returnType = ConstantTypes.CAN_STRINGIFY;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        // 文本直接跳过
        if (isString(child)) continue;
        const constType = getConstantType(child);
        // 如果有一个子节点是非常量，则直接返回
        if (constType === ConstantTypes.NOT_CONSTANT) {
          return constType;
        } else if (returnType > constType) {
          returnType = constType;
        }
      }
      return returnType;
  }
}
