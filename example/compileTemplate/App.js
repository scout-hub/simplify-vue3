/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-21 21:21:38
 */
import {
    ref
} from "../../lib/simplify-vue.esm.js";
export default {
    template: `<div>{{ msg }}<p>123</p><h1>哈哈哈</h1></div>`,
    name: "App",
    setup() {
        const msg = ref('msg');
        window.msg = msg;
        return {
            msg
        }
    }
};