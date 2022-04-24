/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-24 22:15:14
 */
import {
    ref
} from "../../lib/simplify-vue.esm.js";
export default {
    template: `
    <div :class="className" id="div" v-on:click="changeClass">
        {{ msg }}
        <h1 class="h1">
        {{ msg1 }}
        </h1>
        <p v-show="show">
            hi，
            <span>scout</span>
         </p>
    </div>`,
    name: "App",
    setup() {
        const msg = ref('hello');
        const msg1 = ref('simplify-vue');
        const className = ref('red');
        const show = ref(false);

        const changeClass = () => {
            className.value = 'green';
        }

        return {
            show,
            msg,
            className,
            msg1,
            changeClass
        }
    }
};