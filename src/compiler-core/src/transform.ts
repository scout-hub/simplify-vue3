/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 20:33:38
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-09 21:40:17
 */
import { isFunction } from "../../shared/src";
import { NodeTypes } from "./ast";

/**
 * @author: Zhouqi
 * @description: 转化ast
 * @param root ast
 * @param options 配置
 * @return
 */
export function transform(root, options = {}) {
  const context = createTransformContext(root, options);
  traverseNode(root, context);
  createRootCodegen(root);
}

/**
 * @author: Zhouqi
 * @description: 创建codegen所需要的ast
 * @param root ast
 */
function createRootCodegen(root) {
  root.codegenNode = root.children[0];
}

/**
 * @author: Zhouqi
 * @description: 创换上下文对象
 * @param root ast
 * @param options 配置
 * @return 上下文对象
 */
function createTransformContext(root, { nodeTransforms = [] }) {
  const context = {
    root,
    nodeTransforms,
  };

  return context;
}
/**
 * @author: Zhouqi
 * @description: 转化ast节点
 * @param node ast
 * @param context 上下文对象
 * @return
 */
function traverseNode(node, context) {
  const { type } = node;
  const { nodeTransforms } = context;
  const traverseChildrenType = [NodeTypes.ELEMENT, NodeTypes.ROOT];

  //   if (type === NodeTypes.TEXT) {
  //     node.content = node.content + "123";
  //   }
  // 上面这段逻辑可以由外部来添加，形成一种插件式的模式，扩展性更高
  for (let i = 0; i < nodeTransforms.length; i++) {
    nodeTransforms[i](node);
  }

  const nodeTypeHandlers = {
    [traverseChildrenType.includes(type) as any]() {
      traverseChildren(node.children, context);
    },
  };

  const nodeHandler = nodeTypeHandlers[true as any];
  if (isFunction(nodeHandler)) {
    nodeHandler();
  }
}

/**
 * @author: Zhouqi
 * @description: ast子节点转化
 * @param children ast子节点
 * @param context 上下文对象
 * @return
 */
function traverseChildren(children: [], context) {
  for (let i = 0; i < children.length; i++) {
    traverseNode(children[i], context);
  }
}
