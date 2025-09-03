
终端中有些任务意外断开可能会导致光标消失

```shell
echo -e "\033[?25h" # 显示光标
echo -e "\033[?25l" # 隐藏光标
```



Reference:

