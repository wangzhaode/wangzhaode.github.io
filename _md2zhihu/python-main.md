
Python中入口函数为什么用`if __name__ == '__main__'`

是因为`__name__`是一个内部变量，其定义为：

-   当该文件为入口文件代码时，`__name__`为`__main__`；
-   当该文件为import时，`__name__`为文件名；

比如`foo.py`和`bar.py`的内容如下：

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/python-main/pythonfoopyimportbarprint__name_-3c79f10283f2a6a0.jpg)

则执行如下：

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/python-main/shell-pythonfoopyfoobar__main__--6bbbfd7e4dcca90f.jpg)

因此使用`if __name__ == '__main__'`能够保证只有在文件作为入口时执行，在被import时不执行。



Reference:

