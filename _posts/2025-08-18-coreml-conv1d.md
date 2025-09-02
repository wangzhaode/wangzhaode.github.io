---
layout: post
title: CoreML踩坑记：慎用Conv1D
date:   2025-08-18
last_modified_at: 2025-08-18
categories: [llm, coreml, ios]
---

### CoreML踩坑记：慎用Conv1D

#### 背景

最近在给MNN写CoreML后端，优化`Qwen2.5-Omni`的性能。在测试`BigVGAN`模型的时候发现结果对不齐，逐层调试后发现错误出现在`ConvTranspose1d`（一维转置卷积）算子上。

因为MNN的后端是在通过线转换计算图的方式得到CoreML模型的，而且这个构图的过程都是我自己从头实现的，所以一般出错都是算子构造问题。但此类问题会出现在同类型的第一个算子后，而这次错误却是从`ups`的第二层开始出现的。
```python
ups = [
        nn.ModuleList(
            [
                nn.ConvTranspose1d(
                    config.upsample_initial_channel // (2**layer_idx),
                    config.upsample_initial_channel // (2 ** (layer_idx + 1)),
                    kernel_size,
                    stride,
                    padding=(kernel_size - stride) // 2,
                )
            ]
        )
        for layer_idx, (stride, kernel_size) in enumerate(zip(config.upsample_rates, config.upsample_kernel_sizes))
    ]
```

#### 排查过程

首先怀疑构图出错。于是我用`coremltools`把一个PyTorch的`ConvTranspose1d`模型转成`.mlmodelc`，把`model.mil`抠出来当“标准答案”，跟我自己写的图定义对比发现一模一样。

这就奇怪了，图的定义没问题，那问题出在哪？

没有思路，就将出错的算子单独转换成一个模型进行深入测试，发现了一个奇怪的现象，当我把`ConvTranspose1d`改成`ConvTranspose2d`后，结果就对了。

理论上他们应该是等价的，但结果却不一样。为了进一步测试，我尝试把**把Bias参数去掉，全设成0**进行对比。

结果它俩输出就一样了！这下基本可以确定，问题就出在CoreML执行1D转置卷积时，处理Bias的逻辑有Bug。从错误的输出现象看，Bias没有被正确地加到整个输出通道上，只影响了每个通道的头几个数。

然后好奇第一层也有bias为何没问题呢？就把第一层的`ConvTranspose1d`提取成独立模型，同时改造出对应的`ConvTranspose2d`版本，结果它俩输出一致。看来这个问题是与算子的尺寸有关的。

到这里我估计就不是构图问题了，而是CoreML内部的问题。

#### 最终验证

为了验证是否是CoreML的问题，我写了个Python脚本来做测试。脚本里建了两个一模一样的PyTorch模型，一个用`ConvTranspose1d`，一个用`ConvTranspose2d`，然后用`coremltools`转成CoreML模型，对比输出。

```python
import torch
import torch.nn as nn
import numpy as np
import coremltools as ct

COMPUTE_UNIT = ct.ComputeUnit.ALL
# COMPUTE_UNIT = ct.ComputeUnit.CPU_ONLY
# COMPUTE_UNIT = ct.ComputeUnit.CPU_AND_GPU

class Deconv1DModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.deconv = nn.ConvTranspose1d(768, 384, kernel_size=7, stride=3, padding=2)
    def forward(self, x):
        return self.deconv(x)

class Deconv2DModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.deconv = nn.ConvTranspose2d(768, 384, kernel_size=(7, 1), stride=(3, 1), padding=(2, 0))
    def forward(self, x):
        return self.deconv(x.unsqueeze(-1)).squeeze(-1)

def convert_and_save(model, input_tensor, model_name):
    traced_model = torch.jit.trace(model, input_tensor)
    mlmodel = ct.convert(
        traced_model,
        inputs=[ct.TensorType(shape=input_tensor.shape, name="input", dtype=np.float32)],
        convert_to="mlprogram",
        minimum_deployment_target=ct.target.iOS18,
        compute_units=COMPUTE_UNIT
    )
    model_path = f'./{model_name}.mlpackage'
    mlmodel.save(model_path)
    return model_path

def predict_with_coreml(model_path, input_tensor):
    model = ct.models.MLModel(model_path, compute_units=COMPUTE_UNIT)
    input_data = {"input": input_tensor.numpy().astype(np.float32)}
    output_dict = model.predict(input_data)
    output_key = list(output_dict.keys())[0]
    return output_dict[output_key]


if __name__ == "__main__":
    model_1d = Deconv1DModel()
    model_2d = Deconv2DModel()
    torch.manual_seed(42)
    dummy_input = torch.randn(1, 768, 600)
    with torch.no_grad():
        model_2d.deconv.weight.data = model_1d.deconv.weight.data.unsqueeze(-1)
        model_2d.deconv.bias.data = model_1d.deconv.bias.data
    model_1d.eval()
    model_2d.eval()

    with torch.no_grad():
        torch_output_1d = model_1d(dummy_input)
        torch_output_2d = model_2d(dummy_input)
    are_torch_outputs_close = torch.allclose(torch_output_1d, torch_output_2d, atol=1e-3)
    print(f"PyTorch中1D和2D模型的输出是否一致? -> {are_torch_outputs_close}")
    assert are_torch_outputs_close, "错误：PyTorch模型不等价，测试无法继续！"

    # --- CoreML转换与推理 ---
    model_1d_path = convert_and_save(model_1d, dummy_input, "deconv1d_model_specific_data")
    model_2d_path = convert_and_save(model_2d, dummy_input, "deconv2d_model_specific_data")

    coreml_output_1d = predict_with_coreml(model_1d_path, dummy_input)
    coreml_output_2d = predict_with_coreml(model_2d_path, dummy_input)
    print(f'conv1d output: {coreml_output_1d.flatten()}')
    print(f'conv2d output: {coreml_output_2d.flatten()}')
    are_coreml_outputs_close = np.allclose(coreml_output_1d, coreml_output_2d, atol=1e-3)
    max_abs_diff = np.abs(coreml_output_1d - coreml_output_2d).max()
    print(f"CoreML中1D和2D模型的输出是否一致? -> {are_coreml_outputs_close}")
    print(f"两个输出之间的最大绝对差值为: {max_abs_diff:.6f}")
```

通过切换`coremltools`的`compute_units`参数，我得到了决定性的证据：

*   `compute_units = ct.ComputeUnit.CPU_ONLY`：**结果正确**。
*   `compute_units = ct.ComputeUnit.CPU_AND_GPU`：**结果正确**。
*   `compute_units = ct.ComputeUnit.ALL`：**结果错误**！

`ALL`模式和`CPU_AND_GPU`模式唯一的区别就是前者会启用ANE（苹果的神经网络引擎）。这就说明，**Bug的根源在于CoreML在ANE上的具体实现**。只要计算任务被分配到ANE上，这个特定尺寸的`ConvTranspose1d`的Bias加法就会出错。

#### 解决方案

既然定位了Bug，解决方案就有了。

1.  **方案A：把Bias加法拆出来**。先算一个不带Bias的`conv_transpose`，再手动加一个`add`算子。这个方法能解决问题，但多了一步操作，内存要多倒腾一次，可能会影响性能。
2.  **方案B：把1D伪装成2D**。在1D算子前后，分别插入`expand_dims`和`squeeze`算子，把数据变成4D，然后调用我们已经验证过没问题的`ConvTranspose2d`来计算。

考虑到性能，我最终选择了**方案B**。一个融合算子，内存读写一次，效率高。虽然在MNN的图转换逻辑里要多写几行代码，但这能让CoreML在底层执行一个高效的融合算子。这个维度变换的逻辑被封装在算子转换的内部，对整个计算图的其他部分是透明的，不会影响其他算子的实现。

#### 总结

这次踩坑经历耗费了不少时间，总结下来有几点：
1.  **CoreML的`Conv1d`算子在ANE上可能存在隐蔽的Bug**，当你的模型里有这个算子并且结果不对时，可以优先排查它，并尽量使用`Conv2d`。
2.  **验证问题时，一定要切换`compute_units`**，对比CPU、GPU、ANE的行为差异，这能帮你快速定位问题是不是硬件相关的。

希望这个排查过程能给遇到类似问题的朋友一点启发。