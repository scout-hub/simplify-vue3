/*
 * @Author: Zhouqi
 * @Date: 2022-04-07 14:13:10
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-26 17:03:16
 */
import { reactive, ref } from "@simplify-vue/reactivity";
import { watch, watchEffect, watchPostEffect } from "../src";

describe("first", () => {
  test("watch array", () => {
    const ref1: any = ref(1);
    let i = 1;

    watch([ref1], () => {
      i++;
    });

    ref1.value++;

    expect(i).toBe(2);
  });

  // test("watch array", () => {
  //   const ref1: any = ref(1);
  //   const ref2: any = ref(2);
  //   let i = 1;

  //   watch([ref1, ref2], () => {
  //     i++;
  //   });

  //   //TODO 在vue中一个事件里面同时修改监听的变量只会执行一次回调
  //   function change() {
  //     ref1.value++;
  //     ref2.value++;
  //   }

  //   change();

  //   expect(i).toBe(2);
  // });

  test("watch reactive object", () => {
    const obj: any = reactive({ count: 1 });
    let i = 1;
    watch(obj, () => {
      i++;
    });
    obj.count++;
    expect(i).toBe(2);
  });

  test("watch ref value", () => {
    const obj: any = ref(1);
    let i = 1;
    watch(obj, () => {
      i++;
    });
    obj.value++;
    expect(i).toBe(2);
  });

  test("watch function getter", () => {
    const obj: any = reactive({ count: 1 });
    let i = 1;
    watch(
      () => obj.count,
      () => {
        i++;
      }
    );
    obj.count++;
    expect(i).toBe(2);
  });

  test("watch value changed", () => {
    const obj: any = reactive({ count: 1 });
    let i = 1;
    let j = 0;
    watch(
      () => obj.count,
      (newValue, oldValue) => {
        i = newValue;
        j = oldValue;
      }
    );
    obj.count++;
    expect(i).toBe(2);
    expect(j).toBe(1);
    obj.count++;
    expect(i).toBe(3);
    expect(j).toBe(2);
  });

  test("watch immediate options", () => {
    const obj: any = reactive({ count: 1 });
    let i = 1;
    let j = 0;
    watch(
      () => obj.count,
      (newValue, oldValue) => {
        i = newValue;
        j = oldValue;
      },
      {
        immediate: true,
      }
    );
    expect(i).toBe(1);
    expect(j).toBe(undefined);
  });

  test("watch flush options", () => {
    const obj: any = reactive({ count: 1 });
    let i = 1;
    watch(
      () => obj.count,
      (newValue, oldValue) => {
        i = newValue;
      },
      {
        flush: "post",
      }
    );

    obj.count++;

    expect(i).toBe(1);

    Promise.resolve().then(() => {
      expect(i).toBe(2);
    });

    setTimeout(() => {
      expect(i).toBe(2);
    }, 1000);
  });

  test("watch effect be overdue", () => {
    const obj: any = reactive({ count: 1 });
    let i = 0;
    let result;
    const fetch = (data, time) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(data);
        }, time);
      });
    };
    watch(
      () => obj.count,
      async (newValue, oldValue, onCleanup) => {
        let flag = false;
        onCleanup(() => {
          flag = true;
        });
        i++;
        if (i === 1) {
          const res = await fetch("A", 2000);
          if (!flag) {
            result = res;
          }
        } else {
          const res = await fetch("B", 1000);
          if (!flag) {
            result = res;
          }
        }
      }
    );
    obj.count++;
    obj.count++;

    setTimeout(() => {
      expect(result).toBe("B");
    }, 3000);
  });

  test("watchEffect", () => {
    const refs: any = ref(1);
    let i = 1;

    watchEffect(() => {
      i++;
      refs.value;
    });
    refs.value++;
    expect(i).toBe(3);
  });

  test("watchEffect flush post", () => {
    const refs: any = ref(1);
    let i = 1;

    watchEffect(
      () => {
        i++;
        refs.value;
      },
      {
        flush: "post",
      }
    );
    expect(i).toBe(1);

    Promise.resolve().then(() => {
      expect(i).toBe(2);
    });
  });

  test("watchEffect flush post", () => {
    const refs: any = ref(1);
    let i = 1;

    watchPostEffect(() => {
      i++;
      refs.value;
    });
    expect(i).toBe(1);

    Promise.resolve().then(() => {
      expect(i).toBe(2);
    });
  });

  test("unwatch", () => {
    const refs: any = ref(1);
    let i = 1;

    const unwatch = watchEffect(() => {
      i++;
      refs.value;
    });
    unwatch();
    refs.value++;
    expect(i).toBe(2);
  });
});
