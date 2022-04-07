/*
 * @Author: Zhouqi
 * @Date: 2022-04-07 22:00:37
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-07 22:03:15
 */
// import { ElementTypes, NodeTypes } from "../src/ast";
import { baseParse } from "../src/parse";

describe("parser", () => {
  describe("text", () => {
    // test("simple text", () => {
    //   const ast = baseParse("some text");
    //   const text = ast.children[0];
    //   expect(text).toStrictEqual({
    //     type: NodeTypes.TEXT,
    //     content: "some text",
    //   });
    // });
    // test("simple text with invalid end tag", () => {
    //   const ast = baseParse("some text</div>");
    //   const text = ast.children[0];
    //   expect(text).toStrictEqual({
    //     type: NodeTypes.TEXT,
    //     content: "some text",
    //   });
    // });
    // test("text with interpolation", () => {
    //   const ast = baseParse("some {{ foo + bar }} text");
    //   const text1 = ast.children[0];
    //   const text2 = ast.children[2];
    //   // ast.children[1] 应该是 interpolation
    //   expect(text1).toStrictEqual({
    //     type: NodeTypes.TEXT,
    //     content: "some ",
    //   });
    //   expect(text2).toStrictEqual({
    //     type: NodeTypes.TEXT,
    //     content: " text",
    //   });
    // });
  });

  describe("Interpolation", () => {
    test("simple interpolation", () => {
      // const ast = baseParse("{{message}}");
      // const interpolation = ast.children[0];

      // expect(interpolation).toStrictEqual({
      //   type: NodeTypes.INTERPOLATION,
      //   content: {
      //     type: NodeTypes.SIMPLE_EXPRESSION,
      //     content: `message`,
      //   },
      // });
    });
  });

  // describe("Element", () => {
  //   test("simple div", () => {
  //     const ast = baseParse("<div>hello</div>");
  //     const element = ast.children[0];

  //     expect(element).toStrictEqual({
  //       type: NodeTypes.ELEMENT,
  //       tag: "div",
  //       tagType: ElementTypes.ELEMENT,
  //       children: [
  //         {
  //           type: NodeTypes.TEXT,
  //           content: "hello",
  //         },
  //       ],
  //     });
  //   });

  //   test("element with interpolation", () => {
  //     const ast = baseParse("<div>{{ msg }}</div>");
  //     const element = ast.children[0];

  //     expect(element).toStrictEqual({
  //       type: NodeTypes.ELEMENT,
  //       tag: "div",
  //       tagType: ElementTypes.ELEMENT,
  //       children: [
  //         {
  //           type: NodeTypes.INTERPOLATION,
  //           content: {
  //             type: NodeTypes.SIMPLE_EXPRESSION,
  //             content: `msg`,
  //           },
  //         },
  //       ],
  //     });
  //   });
  // });
});