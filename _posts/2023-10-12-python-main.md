---
layout: post
title:  python main函数
date:   2023-10-12
last_modified_at: 2023-10-12
categories: [python]
---

Python中入口函数为什么用`if __name__ == '__main__'`

是因为`__name__`是一个内部变量，其定义为：
- 当该文件为入口文件代码时，`__name__`为`__main__`；
- 当该文件为import时，`__name__`为文件名；

比如`foo.py`和`bar.py`的内容如下：
```python
# foo.py
import bar
print(__name__)

# bar.py
import foo
print(__name__)
```

则执行如下：
```shell
-> % python foo.py 
foo
bar
__main__

-> % python bar.py                           
bar
foo
__main__
```

因此使用`if __name__ == '__main__'`能够保证只有在文件作为入口时执行，在被import时不执行。