/*
 * @Author: Zhouqi
 * @Date: 2022-03-20 20:46:00
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-12 21:47:17
 */
import { effect } from "../src/effect";
import { reactive } from "../src/reactive";

describe("Map and Set", () => {
  test("Set", () => {
    const set = new Set([1, 2, 3]);
    const r = reactive(set);
    let i = 0;
    effect(() => {
      i++;
      r.size;
    });
    r.delete(1);
    expect(r.size).toBe(2);
    expect(i).toBe(2);
    r.add(1);
    expect(i).toBe(3);
    r.add(1);
    expect(i).toBe(3);
    r.delete(4);
    expect(i).toBe(3);
  });

  test("Map", () => {
    const map = new Map([["name", "zs"]]);
    const r = reactive(map);
    let i = 0;
    effect(() => {
      i++;
      r.get("name");
    });
    r.set("name", "1");
    expect(i).toBe(2);
  });

  test("dirty", () => {
    const map = new Map([["name", "zs"]]);
    const r = reactive(map);
    const r1 = reactive(new Map());
    r.set("r1", r1);
    let i = 0;
    effect(() => {
      i++;
      (map.get("r1") as any).size;
    });
    (map.get("r1") as any).set("age", 1);
    expect(i).toBe(1);
  });

  test("forEach", () => {
    const set = new Set([1, 2]);
    const map = new Map([["name", set]]);
    const r = reactive(map);
    let i = 0;
    effect(() => {
      i++;
      r.forEach((value, key) => {
        value.size;
      });
    });

    r.get("name").add(6);
    expect(i).toBe(2);
    r.set("name", 2);
    expect(i).toBe(3);
  });
});
