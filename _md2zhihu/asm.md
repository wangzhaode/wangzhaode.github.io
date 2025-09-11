
## 语法规则

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/asm/c__asm____volatile__movx12naddxx-6fb256e83667fd62.jpg)

### 汇编部分

每行以`\n`结尾

### 输出、输入部分

`[foo] "+&r" (),`顺序声明，其中`[]`为别名，`""`内为描述，`()`为引用变量

-   `[foo]`内的别名可以在汇编中按照`%x[foo]`来使用，如果省略则按照`%0`来使用
-   `=`表示写，`+`表示读写，`&`表示独占寄存器；
-   `r``q`表示通用寄存器，`w`表示向量寄存器

### 影响部分

-   `cc`表示修改了状态寄存器标志位
-   `memory`表示修改了内存值
-   `v0``x1`表示修改了指定寄存器的值

### 示例

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/asm/c__asm____volatile__sxtlv184s04h-10d8447d3ba32aa7.jpg)



Reference:

