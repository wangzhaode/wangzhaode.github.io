
# 模型

segment-anything 在物体分割任务上功能非常强大，并且其官方提供了导出到onnx的示例，但是仅导出了segment部分，本文将其embedding部分也导出为onnx。然后将onnx模型转换到MNN模型，得益于MNN内部的cv函数与表达式接口，在仅依赖MNN的情况下即可端到端的运行segment-anything模型来对图片进行指定语义的分割。

MobileSam针对segment-anything做了优化，大幅提升了推理速度，更适合移动端部署。

# 模型导出

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/sam/pythonclassImageEmbeddingtorchnn-4aa63caf1c279362.jpg)

# 推理流程

流程为：

-   图片前处理 -> embedding -> segment -> mask

推理代码：

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/sam/pythondefinferenceemedsamimgprec-9267126a3dd7273d.jpg)

# github repo

-   [segment-anything](https://github.com/facebookresearch/segment-anything)
-   [MobileSAM](https://github.com/ChaoningZhang/MobileSAM)
-   [mnn-segment-anything](https://github.com/wangzhaode/mnn-segment-anything)



Reference:

