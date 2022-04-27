/*
 * @Author: Zhouqi
 * @Date: 2022-04-26 21:19:36
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-27 22:23:49
 */
import {
  createCallExpression,
  createConditionalExpression,
  NodeTypes,
} from "../ast";
import { CREATE_COMMENT } from "../runtimeHelpers";
import { createStructuralDirectiveTransform, traverseNode } from "../transform";
import { processExpression } from "./transformExpression";

// v-if指令转换器
export const transformIf = createStructuralDirectiveTransform(
  /^(if|else|else-if)$/,
  (node, dir, context) => {
    return processIf(node, dir, context, (ifNode, branch, isRoot) => {
      return () => {
        if (isRoot) {
          // v-if
          ifNode.codegenNode = createCodegenNodeForBranch(branch, context);
        } else {
          // 找到v-if节点
          const parentCondition = getParentCondition(ifNode.codegenNode);
          // 修改v-if表达式为false时要渲染的节点内容，即渲染v-else节点
          parentCondition.alternate = createCodegenNodeForBranch(
            branch,
            context
          );
        }
      };
    });
  }
);

function processIf(node, dir, context, fn?) {
  const { name, exp } = dir;
  if (exp) {
    dir.exp = processExpression(exp);
  }

  if (name === "if") {
    // 处理 if
    const branch = createIfBranch(node, dir);
    const ifNode = {
      type: NodeTypes.IF,
      branches: [branch],
    };
    context.replaceNode(ifNode);
    if (fn) {
      return fn(ifNode, branch, true);
    }
  } else {
    // TODO v-else
    const siblings = context.parent.children;
    // 从子节点数组中找到v-else节点的位置，该位置之前的节点应该是v-if/v-else-if节点
    let i = siblings.indexOf(node);
    while (i-- >= -1) {
      // 向前查找v-if/v-else-if节点
      const sibling = siblings[i];
      // 如果前一个节点v-if节点
      if (sibling && sibling.type === NodeTypes.IF) {
        // 将当前节点移动的v-if节点的branchs中
        // 移动的步骤：
        // 1、从父节点的children中移除当前节点
        // 2、将当前节点移动到v-if节点的branches中
        context.removeNode();
        const branch = createIfBranch(node, dir);
        sibling.branches.push(branch);

        const onExit = fn && fn(sibling, branch, false);
        // 由于当前branch添加到了v-if的branches中，接下去执行时该branch无法正常走traverseNode
        // 因此这里需要执行一下traverseNode
        traverseNode(branch, context);
        onExit && onExit();
        // 清除当前节点
        context.currentNode = null;
      }
    }
  }
}

function createIfBranch(node, dir) {
  return {
    type: NodeTypes.IF_BRANCH,
    condition: dir.name === "else" ? undefined : dir.exp,
    children: [node],
  };
}

function createCodegenNodeForBranch(branch, context) {
  if (branch.condition) {
    return createConditionalExpression(
      branch.condition,
      // 表达式是true是需要创建的元素ast
      createChildrenCodegenNode(branch),
      // 表达式是false时创建的注释节点ast
      createCallExpression(context.helper(CREATE_COMMENT), ['"v-if"', "true"])
    );
  } else {
    return createChildrenCodegenNode(branch);
  }
}

function createChildrenCodegenNode(branch) {
  return branch.children[0];
}

// 查找v-if节点
function getParentCondition(ifNode) {
  // TODO v-else-if
  // 这里先处理v-if v-else的情况，因此传入的ifNode就是v-if节点
  return ifNode;
}
