/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 21:13:43
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-09 21:54:35
 */
export function generate(ast, options = {}) {
  //   return function render(_ctx, _cache, $props, $setup, $data, $options) {
  //     return "Hello World";
  //   }
  const context = createCodegenContext(ast, options);
  const { push } = context;
  const functionName = "render";
  const args = ["_ctx", "_cache", "$props", "$setup", "$data", "$options"].join(
    ", "
  );
  push("return ");
  push(`function ${functionName}(${args}) { `);
  genNode(ast.codegenNode, context);
  push(" }");

  return context.code;
}

/**
 * @author: Zhouqi
 * @description: 创建codegen上下文
 * @param ast
 * @param options
 * @return 上下文对象
 */
function createCodegenContext(ast: any, options: {}) {
  const context = {
    // 最终的代码字符串
    code: ``,
    // 字符串拼接操作
    push(text) {
      context.code += text;
    },
  };
  return context;
}

/**
 * @author: Zhouqi
 * @description: 根据ast生成节点
 * @param node astNode
 */
function genNode(node, context) {
  const { push } = context;
  push(`return '${node.content}';`);
}
