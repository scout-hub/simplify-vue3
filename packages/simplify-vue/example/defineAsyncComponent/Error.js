/*
 * @Author: Zhouqi
 * @Date: 2022-04-14 22:37:53
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-15 22:41:08
 */
import {
    h
} from '../../dist/simplify-vue.esm.js'

export default {
    name: "Error",
    props: ['error'],
    setup(props) {
        return () => h('div', null, props.error.message);
    },
}