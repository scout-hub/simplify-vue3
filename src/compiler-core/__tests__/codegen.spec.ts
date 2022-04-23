/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 20:34:26
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-23 10:25:56
 */
import { generate } from "../src/codegen";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";
import { transformElement } from "../src/transforms/transformElement";
import { transformExpression } from "../src/transforms/transformExpression";
import { transformText } from "../src/transforms/transformText";
import { transformBind } from "../src/transforms/vBind";
describe("Compiler: transform", () => {
  test("context state", () => {
    const ast = baseParse(`<div :class="name"></div>`);

    transform(ast, {
      nodeTransforms: [transformExpression, transformElement, transformText],
      directiveTransforms: {
        bind: transformBind,
      },
    });

    const code = generate(ast);
    expect(code).toMatchSnapshot();
  });
  // test("codegen string", () => {
  //   const ast = baseParse(`hello`);

  //   transform(ast);
  //   const { code } = generate(ast);

  //   expect(code).toMatchSnapshot();
  // });

  // test("codegen interplation", () => {
  //   const ast = baseParse(`{{ hello }}`);

  //   transform(ast, {
  //     nodeTransforms: [transformExpression],
  //   });
  //   const { code } = generate(ast);

  //   expect(code).toMatchSnapshot();
  // });

  // test("codegen element", () => {
  //   const ast = baseParse(`<div></div>`);

  //   transform(ast, {
  //     nodeTransforms: [transformElement],
  //   });
  //   const { code } = generate(ast);

  //   expect(code).toMatchSnapshot();
  // });

  // test("codegen element interplation string", () => {
  //   const ast = baseParse(`<div>hello, {{ message }}</div>`);

  //   transform(ast, {
  //     nodeTransforms: [transformElement, transformExpression, transformText],
  //   });

  //   const { code } = generate(ast);

  //   expect(code).toMatchSnapshot();
  // });
});
