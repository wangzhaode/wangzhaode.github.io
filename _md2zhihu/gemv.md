
在llm推理中除了首token外，热点计算都是gemv, 相比gemm，gemv是访存密集型算子。

以下是一些simd的伪代码，pack的值根据芯片支持的SIMD指令选择，比如SSE/NEON选择4，计算部分则可以使用`fmla`指令实现。

### 行主序

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/gemv/cppweighthpacklpackinputloutputh-fc4113cf8597ce27.jpg)

### 列主序

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/gemv/cppweightlhinputloutputhforinti=-950b34d103618032.jpg)

## 混合精度

weight使用对称/非对称量化类型：4bit/8bit，这种实现能够显著降低weight的访存量

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/gemv/cppweighthpacklpackinputloutputh-ab53206e5cf6e0c4.jpg)



Reference:

