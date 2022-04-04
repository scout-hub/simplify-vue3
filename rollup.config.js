/*
 * @Author: Zhouqi
 * @Date: 2022-03-27 14:27:34
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-02 13:32:40
 */
import typescript from "@rollup/plugin-typescript";
import packageJSON from "./package.json";

export default {
    // 入口
    input: "./src/index.ts",
    // 出口
    // cjs、esm
    output: [{
        format: "cjs",
        file: packageJSON.main
    }, {
        format: "es",
        file: packageJSON.module
    }],
    plugins: [
        typescript({
            exclude: /test/
        })
    ]
}