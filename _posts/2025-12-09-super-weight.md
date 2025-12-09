---
layout: post
title: LLM Super Weight 实测：剪枝降智与量化思考
date:   2025-12-09
last_modified_at: 2025-12-09
categories: [llm, quant, mnn]
---

## 0. 前言：从一篇论文引发的“破坏性”实验

最近阅读了论文 *《The Super Weight in Large Language Models》* ，文中提出了一个极具冲击力的观点：大模型中存在极个别（通常仅为一个标量）的“超级权重”（Super Weight），它们是模型的承重墙。一旦将其剪枝，模型能力会瞬间崩塌。

出于好奇，我编写了一个脚本对 **Qwen3-0.6B** 进行了搜索与剪枝测试。实验证实了 Super Weight 的确存在，且移除后模型出现了明显的逻辑退化。基于此发现，我自然联想到：如果针对这些权重进行高精度保护，是否能优化 **MNN** 端侧推理的量化精度？然而，后续的量化实验却给出了一个反直觉的结论——单纯保护 Super Weight 对全局 PPL 的提升微乎其微。

本文将记录从原理分析、复现验证到量化踩坑的完整过程。

## 1. 为什么是 down_proj？Super Weight 的形成机制

论文指出，Super Weight 几乎总是出现在 MLP 的 `down_proj` 层，且伴随着巨大的输入激活值（Super Activation）。这并非偶然，而是现代 LLM 普遍采用的 **SwiGLU** 激活机制导致的。

SwiGLU 的计算公式包含 `Act(Gate) * Up` 的逐元素乘积。这一步操作倾向于筛选并放大特定特征，在进入 `down_proj` 之前制造出一个数值极大的“高能亮点”（Super Activation）。

而 `down_proj` 作为 MLP 的出口，其对应的权重（Super Weight）与这个高能激活值相乘，产生了一个足以“劫持”残差流（Residual Stream）的巨大信号。这种机制赋予了模型一种强逻辑控制能力，用于确立高置信度的语义锚点（如抑制停用词、确立实体关系）。因此，Super Weight 本质上是模型为了维持逻辑稳定性而进化出的“特异性结构”。

## 2. 复现与验证：剪枝后的“降智”现象

为了验证这一理论，我实现了一个基于 Hook 的搜索脚本，通过计算 $Contribution = |Activation \times Weight|$ 来定位关键权重。

**实验 A：Llama-2-7B (对齐论文)**
首先在 Llama-2-7B 上进行基准测试，脚本定位到的 Top-1 权重坐标为 **Layer 1, [2533, 7890]**。这与论文 Table 2 中的数据完全一致，证明了搜索算法的准确性。

**实验 B：Qwen3-0.6B (探究测试)**
随后在 Qwen3-0.6B 上进行测试，定位到 Super Weight 位于 **Layer 2, [35, 55]**，Z-Score 高达 9.01σ。
对其进行置零（Pruning）测试，模型并未像 Llama 那样输出乱码，而是出现了**逻辑反转**：

*   **Prompt**: "北京是中国的首都，"
*   **Original**: “...在旅游旺季，北京的游客数量会增加...”
*   **Pruned**: “...在旅游旺季，北京的旅游景点会受到很大影响，**导致游客数量减少**...”

模型从“智能”退化为了“通顺的胡说八道”，这证实了 Super Weight 对维持逻辑推理能力的决定性作用。

## 3. 量化实验：试图拯救 PPL 的失败尝试

既然 Layer 2 包含如此重要的权重，且分布极端异常，按照常规工程思路，对其进行混合精度量化理应能提升模型效果。

**MNN 框架实测：**
我使用 MNN 进行了对比测试：
*   **Baseline**: 全网 INT4 (Group Size=64) -> **PPL: 26.48**
*   **Mixed Precision**: Layer 2 提升至 INT8 (Group Size=32)，其余 INT4 -> **PPL: 26.70**

结果令人意外，提升关键层的精度反而导致 PPL 恶化。这可能是由于层间校准失配（Calibration Mismatch）或不同算子间的精度转换噪声导致的。

**Python 模拟实验：**
为了排除框架算子干扰，我编写脚本模拟了论文推荐的 "Clip & Restore" 策略（量化时剔除 SW，推理时 FP16 还原）：
*   **Naive INT4**: 18.3037
*   **SW-Aware (Protected)**: 18.2999

结果显示 PPL 仅提升了 **0.0038**，几乎可以忽略不计。

## 4. 结论与思考

本次实验得出了两个关键结论：

1.  **Super Weight 确实是逻辑核心**：在 Qwen-0.6B 中，剪掉一个参数虽然不会导致乱码，但会直接破坏模型的因果推理能力，产生严重幻觉。
2.  **保护 SW ≠ 提升 PPL**：对于小参数模型（如 0.6B），离群值往往呈现“抱团”分布（九头蛇效应）。即便保护了最大的 Super Weight，同组内依然存在次大值撑大量化 Scale，导致整体精度受损。

因此，Super Weight 的保护更多是 **“保智商”（维持特定逻辑正确性）**，而非 **“保画质”（降低全局 PPL）**。在实际量化工程中，Super Weight保护对模型的量化精度提升并非一定有效。

## 5. 附录与资源

本文参考的文献及复现代码已整理如下，欢迎感兴趣的读者尝试复现或进一步探索：

*   **原始论文**：
    *   [The Super Weight in Large Language Models (arXiv)](https://arxiv.org/pdf/2411.07191) —— 本文理论基础，详细阐述了 Super Weight 的成因与影响。
*   **实验代码 (GitHub)**：
    *   [Super Weight Search Script](https://github.com/wangzhaode/llm-lab/blob/main/super_weight/find_super.py)：用于搜索、定位及统计模型中的 Super Weight 分布。
    *   [PPL Test Script](https://github.com/wangzhaode/llm-lab/blob/main/super_weight/ppl_test.py)：包含量化模拟（Fake Quantization）及 Clip & Restore 策略的 PPL 评测脚本。