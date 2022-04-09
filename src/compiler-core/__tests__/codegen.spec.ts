/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 20:34:26
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-09 23:40:53
 */
import { generate } from "../src/codegen";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";
import { transformExpression } from "../src/transforms/transformExpression";
describe("Compiler: transform", () => {
  test("codegen string", () => {
    const ast = baseParse(`hello`);

    transform(ast);
    const code = generate(ast);

    expect(code).toMatchSnapshot();
  });

  test("codegen interplation", () => {
    const ast = baseParse(`{{ hello }}`);

    transform(ast, {
      nodeTransforms: [transformExpression],
    });
    const code = generate(ast);

    expect(code).toMatchSnapshot();
  });
});
