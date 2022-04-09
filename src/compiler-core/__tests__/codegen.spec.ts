/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 20:34:26
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-09 21:41:46
 */
import { generate } from "../src/codegen";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";
describe("Compiler: transform", () => {
  test("codegen", () => {
    const ast = baseParse(`hello`);

    transform(ast);
    const code = generate(ast);

    expect(code).toMatchSnapshot();
  });
});
