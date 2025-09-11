
## 构建TVM Unity

直接使用pip安装该[教程](https://llm.mlc.ai/docs/install/tvm.html#tvm-unity-prebuilt-package)中的预编译wheel包会失败，查看`github issue`发现预编译包要求比较新的系统版本。所以按照该[教程](https://llm.mlc.ai/docs/install/tvm.html#tvm-unity-build-from-source)编译安装`TVM Unity`。

注意事项：

-   链接`libtvm.so`时会有`-lxml2`依赖，所以需要提前安装`sudo apt-get install libxml2-dev`
-   在Python安装tvm之后，可能会出现`GLIBCXX_3.4.30 not found`的情况，查看系统所有的C++库：`locate libstdc++.so.6`， 找到其中包含`GLIBCXX_3.4.30`的库并替换依赖

## 模型编译

将`Llama-2-7b-chat-ms`模型编译成为动态库

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/mlc-llm/shellpython-mmlc_llmbuild--targe-0cd09cfb11a0ffd2.jpg)

## 编译apk

参考[教程](https://llm.mlc.ai/docs/deploy/android.html)构建Android apk文件并安装。

注意：

-   `android/MLCChat/app/src/main/assets/app-config.json` 文件对应修改为：

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/mlc-llm/jsonmodel_libsLlama-2-7b-chat-ms-103627894cde5838.jpg)

-   将第2步中编译出的`params`下的文件拷贝到手机中，注意模型目录`Llama-2-7b-chat-ms-q4f16_1`需要与`local_id`一致

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/mlc-llm/shelladbshellmkdir-pstorageemula-45f225eb39522160.jpg)

## 测试

使用`xiaomi12`测试，Soc为骁龙8gen1, 内存8G;

-   速度：prefill: 2.7 tok/s, decode: 3.4 tok/s
-   发现内存原因崩溃情况比较多；原因如下：
    -   预计`mlc-llm`跑`llama-2-7b-int4`需要内存大于4G；
    -   MIUI系统内存占用较高，原始内存8G，空闲内存在4G左右；



Reference:

