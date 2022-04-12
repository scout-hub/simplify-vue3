/*
 * @Author: Zhouqi
 * @Date: 2022-03-20 20:46:00
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-12 11:59:32
 */
import { effect } from "../src/effect";
import { reactive } from "../src/reactive";

describe("Map and Set", () => {
  test("happy path", () => {
    const set = new Set([1, 2, 3]);
    const r = reactive(set);
    r.size;
    expect(r.size).toBe(3);
  });
});
