
当使用tee时，程序的exitcode无法正常获取，比如`a.out`的exitcode为1，但是使用tee之后得到的为`0`。这时可以使用`set -o pipefail`，如下：

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/exitcode/shellaoutteeecho0set-opipefailao-e5b5f5c2d5bca66c.jpg)



Reference:

