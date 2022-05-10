/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 20:34:26
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-10 20:00:38
 */
import { transformShow } from "../../compiler-dom/src/transform/vShow";
import { generate } from "../src/codegen";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";
import { transformElement } from "../src/transforms/transformElement";
import { transformExpression } from "../src/transforms/transformExpression";
import { transformText } from "../src/transforms/transformText";
import { transformBind } from "../src/transforms/vBind";
import { transformFor } from "../src/transforms/vFor";
import { transformIf } from "../src/transforms/vIf";
import { transformModel } from "../src/transforms/vModel";
import { transformOn } from "../src/transforms/vOn";
describe("Compiler: transform", () => {
  test("context state", () => {
    const ast = baseParse(`
    <input v-model="text" />
`);

    transform(ast, {
      nodeTransforms: [
        // transformIf,
        // transformFor,
        transformExpression,
        transformElement,
        transformText,
      ],
      // nodeTransforms: [transformExpression, transformElement, transformText],
      directiveTransforms: {
        model: transformModel,
        // bind: transformBind,
        // on: transformOn,
        // show: transformShow,
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
