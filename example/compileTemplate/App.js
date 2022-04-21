/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-21 22:40:08
 */
import {
    ref
} from "../../lib/simplify-vue.esm.js";
export default {
    template: `<div>{{ msg }}<p>123</p>{{ msg1 }}<h1>哈哈哈，{{ msg }}</h1></div>`,
    name: "App",
    setup() {
        const msg = ref('msg');
        const msg1 = ref('msg1');
        return {
            msg,
            msg1
        }
    }
};