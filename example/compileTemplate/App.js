/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-19 22:48:49
 */
import {
    ref
} from "../../lib/simplify-vue.esm.js";
export default {
    template: '<div><p>123</p></div>',
    name: "App",
    setup() {
        const msg = ref('123');
        window.msg = msg;
        return {
            msg
        }
    }
};