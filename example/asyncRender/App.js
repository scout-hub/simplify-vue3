/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-05 21:10:47
 */
import {
    h,
    ref
} from "../../lib/simplify-vue.esm.js";

export default {
    name: "App",
    setup() {
        const count = ref(1);
        const click = () => {
            for (let i = 0; i < 10; i++) {
                // 循环多次改变值应该只触发一次渲染，而不是循环几次渲染几次
                count.value = i;
            }
        }
        return {
            count,
            click
        }
    },
    render() {
        return h("div", {
            onClick: this.click
        }, this.count);
    }
};