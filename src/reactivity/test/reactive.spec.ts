/*
 * @Author: Zhouqi
 * @Date: 2022-03-20 20:46:00
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-03-26 21:47:44
 */
import { effect } from "../src/effect";
import { reactive } from "../src/reactive";

describe("reactive", () => {
  it("happy path", () => {
    const org = { foo: 1 };
    const obOrg = reactive(org);
    expect(obOrg).not.toBe(org);
    expect(obOrg.foo).toBe(1);
  });

  it("test rawValue", () => {
    let i = 0;
    const pObj = reactive({
      num: 1,
    });

    const rObj = reactive({ num1: 1 });
    effect(() => {
      i++;
      rObj.num1;
    });

    rObj.num1 = pObj;
    expect(i).toBe(2);
    rObj.num1 = pObj;
    expect(i).toBe(2);
  });
});
