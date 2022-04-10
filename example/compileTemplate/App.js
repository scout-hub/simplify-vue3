/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-10 19:20:53
 */
import {
    ref
} from "../../lib/simplify-vue.esm.js";
export default {
    template: '<div>{{ msg }}</div>',
    name: "App",
    setup() {
        const msg = ref('123');
        window.msg = msg;
        return {
            msg
        }
    }
};