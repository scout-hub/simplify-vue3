/*
 * @Author: Zhouqi
 * @Date: 2022-04-26 21:19:36
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-27 20:49:17
 */
import {
  createCallExpression,
  createConditionalExpression,
  NodeTypes,
} from "../ast";
import { CREATE_COMMENT } from "../runtimeHelpers";
import { createStructuralDirectiveTransform } from "../transform";
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
          // TODO else if / else
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
    // TODO else if / else
  }
}

function createIfBranch(node, dir) {
  return {
    type: NodeTypes.IF_BRANCH,
    condition: dir.exp,
    children: [node],
  };
}

function createCodegenNodeForBranch(branch, context) {
  if (branch.condition) {
    return createConditionalExpression(
      branch.condition,
      // 表达式是true是需要创建的元素ast
      createChildrenCodegenNode(branch, context),
      // 表达式是false时创建的注释节点ast
      createCallExpression(context.helper(CREATE_COMMENT), ['"v-if"', "true"])
    );
  }
}
function createChildrenCodegenNode(branch, context) {
  return branch.children[0];
}
