/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 20:34:26
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-21 20:11:09
 */
import { NodeTypes } from "../src/ast";
import { generate } from "../src/codegen";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";
import { transformElement } from "../src/transforms/transformElement";
import { transformText } from "../src/transforms/transformText";
describe("Compiler: transform", () => {
  test("context state", () => {
    // const ast = baseParse(`<div>hello {{ world }}</div>`);
    const ast = baseParse(`<div><p>123</p><p>xxxx</p></div>`);
    const plugin = (node, context) => {
      if (node.type === NodeTypes.TEXT) {
        node.content = node.content + "33";
      }
    };

    transform(ast, {
      nodeTransforms: [transformText, transformElement],
    });

    const code = generate(ast);
    console.log(code);

    // expect(ast.children[0].children[0].content).toBe("hello 33");
  });
});
