/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-23 11:33:29
 */
import {
    ref
} from "../../lib/simplify-vue.esm.js";
export default {
    template: `
    <div :class="className">
        {{ msg }}
        <h1 class="h1">
        {{ msg1 }}
        </h1>
        <p>
            hi，
            <span>scout</span>
         </p>
    </div>`,
    name: "App",
    setup() {
        const msg = ref('hello');
        const msg1 = ref('simplify-vue');
        const className = ref('red');

        window.className = className;

        return {
            msg,
            className,
            msg1
        }
    }
};