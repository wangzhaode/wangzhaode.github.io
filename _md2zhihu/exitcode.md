
当使用tee时，程序的exitcode无法正常获取，比如`a.out`的exitcode为1，但是使用tee之后得到的为`0`。这时可以使用`set -o pipefail`，如下：

```shell
./a.out | tee
echo $? # 0

set -o pipefail
./a.out | tee
echo $? # 1
```



Reference:

