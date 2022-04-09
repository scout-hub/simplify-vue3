/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 20:34:26
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-09 21:05:19
 */
import { NodeTypes } from "../src/ast";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";
describe("Compiler: transform", () => {
  test("context state", () => {
    const ast = baseParse(`<div>hello {{ world }}</div>`);
    const plugin = (node, context) => {
      if (node.type === NodeTypes.TEXT) {
        node.content = node.content + "33";
      }
    };

    transform(ast, {
      nodeTransforms: [plugin],
    });

    expect(ast.children[0].children[0].content).toBe("hello 33");
  });
});
