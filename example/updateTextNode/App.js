/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-13 20:28:51
 */
import {
    h,
    ref,
    createTextVnode
} from "../../lib/simplify-vue.esm.js";

export default {
    name: "App",
    setup() {
        const flag = ref(true);
        window.flag = flag;
        return {
            flag
        }
    },
    render() {
        return this.flag ? h("div", null, [h('div'), createTextVnode(2)]) : h("div", null, [h('div'), createTextVnode(3)]);
    }
};