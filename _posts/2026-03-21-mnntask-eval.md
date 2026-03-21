---
layout: post
title:  MNN 任务实测：七个模型，三个梯队
date:   2026-03-21
last_modified_at: 2026-03-21
categories: [mnn, llm]
---

## 起因

前两篇文章发出后，大家对这类真实工程任务的测评很感兴趣，评论区也提出了不少想看的模型。这里挑了几个（也是我用过的）做了一次补测和对比：GPT-5.4、GLM-5、Kimi-K2.5 和 Qwen3-Max，加上此前的 Claude Opus 4.6、MiniMax-M2.7 和 MiMo-V2-Pro，同一个任务现在有七个模型的实测数据。

任务不变：在 MNN 推理引擎中从零添加 LFM2 模型支持（Tier 6 级别），需要跨语言实现 Python 导出 + C++ 推理，端到端跑通。

> 声明：不同模型使用了不同的工具和配置（Claude Code / Codex），我对部分工具使用经验有限，测试结果仅供参考。此外，不同 API 提供方可能提供的是量化版本，这一点我无法判断，可能对结果有影响。

### 模型接入方案

| 模型 | 接入方式 | 工具 |
|------|---------|------|
| Claude Opus 4.6 | AWS Anthropic API（Bedrock），按 token 付费 | Claude Code |
| GPT-5.4 | 首次：Azure OpenAI API，按 token 付费；重测：GPT 订阅 | Codex |
| MiMo-V2-Pro | 首次：opencode free 版本；重测：MiMo 官网 API，按 token 付费 | opencode / Claude Code |
| GLM-5 | 联通元景 Coding Plan，¥30/月 | Claude Code |
| Kimi-K2.5 | 阿里云百炼 Coding Plan，首月 ¥7.9，之后 ¥40/月 | Claude Code |
| Qwen3-Max | 阿里云百炼 Coding Plan，首月 ¥7.9，之后 ¥40/月 | Claude Code |
| MiniMax-M2.7 | MiniMax Token Plan Starter，¥29/月 | Claude Code |

## 测试结果总览

| 模型 | 工具 | 结果 | 耗时（API） | 花费 | 代码变更 |
|------|------|------|------------|------|---------|
| Claude Opus 4.6 | Claude Code | **完全通过** | 14m 30s | ~¥45 | +414/-40 |
| GPT-5.4 | Codex xhigh | **完全通过** | 20 min | $3.34 | +351/-19 |
| MiMo-V2-Pro | Claude Code | **提醒后通过** | 28m 40s | ¥25.68 | +297/-44 |
| GLM-5 | Claude Code | **提醒后通过** | 46m 25s | $152.84 | +934/-139 |
| Kimi-K2.5 | Claude Code | 推理失败 | 1h 55m | $108.57 | +486/-28 |
| MiniMax-M2.7 | Claude Code | 推理失败 | 53m 31s | ¥29 | +451/-14 |
| Qwen3-Max | Claude Code | 推理失败 | 1h 3m 39s | $117.05 | +386/-28 |

> Claude Opus 4.6、MiniMax-M2.7、MiMo-V2-Pro 的详细分析见前两篇文章，本文重点展开 GPT-5.4、GLM-5、Kimi-K2.5 和 Qwen3-Max。

## GPT-5.4：$3.34，一次通过

### 一段小插曲

GPT-5.4 的测试经历了一个戏剧性的反转。

我最初的测试跑了 3 小时、花费 ¥820.93（1.67M input tokens，仅 27.1K output，完全没有 cache），任务没有完成——代码有硬伤（卷积方向翻转、`rope_theta` 处理错误），甚至没到导出阶段。事后分析，可能是我使用的付费接口和配置有问题，导致速度慢、费用高、效果差。
在来一位经常使用 Codex 的同事帮助下，改成 **Codex xhigh 模式** + 新的Token接口重新跑了一次——**$3.34，20 分钟，一次通过**。

同一个模型，Codex 模式不同，结果天壤之别。这也是本系列测评的一个反复出现的主题：**工具配置对模型发挥的影响远超预期**。

### 代码质量

GPT-5.4（xhigh 模式）的代码修改了 7 个文件、+351/-19 行，质量很高：

- **架构决策正确**：复用 `FusedLinearAttention`，`attn_type == "short_conv"` 分支
- **卷积方向正确**：`padded[l+k] * weight[k]`，cross-correlation
- **Shape inference 完整**：在 `ShapeAttention.cpp` 中为 short_conv 单独处理，输出 `[B, L, D]`
- **包含单元测试**：添加了 `NaiveShortConv` 参考实现 + prefill/decode 测试，这是所有模型中**唯一主动写了单元测试的**
- **状态管理**：`onResize` 中将 convState 和 recurrentState 解耦，short_conv 不分配无关内存

整体完成度和 Claude Opus 4.6 接近，在单元测试方面甚至更好。

## GLM-5：提醒一次，自主修复

GLM-5 使用 Claude Code 测试，API 耗时 46 分 25 秒，花费 $152.84。

值得一提的是，GLM-5 之前曾做过一次同样的测试，跑了 2 小时以上没有成功，被我手动中断了（具体用的哪个接入方式已经记不清了）。这次换了联通元景的 Coding Plan 重测，表现明显好了很多——同一个模型不同时期的表现确实存在波动。

第一次实现能导出、能推理，但输出不正确。我只告诉它"推理结果不对"，没有做任何方向性引导——它自己定位了问题并修复，第二次输出正确：

```
我是一篇AI助手，旨在提供信息和帮助。

但是，我不是一个真正的人类人士。我的设计目的是通过自然语言处理技术来模拟对话，并回答问题……
```

### 代码特点

GLM-5 的改动量较大（11 文件，+934/-139），做了一些额外的工作：

- **架构决策正确**：复用 LinearAttention，`attn_type == "short_conv"` 分支
- **扩展了 FlatBuffers schema**：在 `LinearAttentionParam` 中新增了 `hidden_size` 和 `kernel_size` 字段
- **全链路覆盖**：Python 导出 → ONNX 自定义算子 → MNN 转换器 → C++ 执行，每一环都有
- **模型映射完善**：正确处理了 `operator_norm`、`ffn_norm`、`layer_types` 等 LFM2 特有的字段

代码量偏多是因为它做了一些防御性重构（比如 `Mlp.__init__` 对非 MoE 模型的适配），整体风格规范。

### 关键评价

GLM-5 和 MiMo-V2-Pro 处于同一档位——都是"提醒一次后自主修复通过"。区别在于：
- GLM-5 更慢（46 分 vs 28 分）、更贵（$152.84 vs ¥25.68）、代码量更多（934 行 vs 297 行）
- 但 GLM-5 的映射更完善，额外处理了一些边界情况

两者的核心能力相当：都能正确理解架构、完成跨语言实现、在提醒后自主调试修复。**国产模型的第一梯队。**

## Kimi-K2.5：能跑但修不了

Kimi-K2.5 使用 Claude Code 测试，API 耗时 1 小时 55 分，花费 $108.57。

它的完成度不低——模型导出成功、C++ 推理也能执行，走到了和 GLM-5/MiMo 同样的位置。但输出是乱码：

```
is to achieve it. Ept for You Perfect It Pa Here perfectes are for For E to E,
the E Passes E (Pes) is a Parme Epaes Epas Epaes Epaesa all Epaeses...
```

我给了和 GLM-5、MiMo-V2-Pro 完全相同的提醒——"输出结果不对"。但 Kimi-K2.5 修改后**仍然是一样的乱码**，没有修复成功。

### 根本原因

乱码的根因是 **ONNX 导出路径缺失**：`ShortConv.forward()` 没有 `torch.onnx.is_in_onnx_export()` 分支，导出的是分解后的 PyTorch 标准算子，C++ 端的 `shortconv_forward()` 永远不会被执行——相当于 ShortConv 层在推理时没有状态管理，逐 token 生成时自然输出乱码。

此外，Python 端注释写了"NO SiLU in original LFM2"，但 C++ 端却加了 SiLU 激活——即使修复了导出路径，数值也会不对。

**这说明 Kimi-K2.5 理解了 LFM2 的整体结构，但在 MNN 的 ONNX 自定义算子机制上存在盲区**——它不知道需要通过 `FusedLinearAttention` 自定义算子来桥接 Python 和 C++，而是用了标准 PyTorch 算子导出，导致 C++ 端的实现形同虚设。

## Qwen3-Max：导出能过，推理崩溃

Qwen3-Max 使用 Claude Code 测试，API 耗时 1 小时 3 分 39 秒，花费 $117.05。

模型导出成功，但 C++ 推理直接 segment fault。给了一次提醒后仍然无法修复。

### 架构决策：创建新算子

与其他大部分模型复用 `LinearAttention` 不同，Qwen3-Max 选择了和 MiniMax-M2.7 类似的路线——创建全新的 `ShortConv` 算子（OpType 306），包括新的 FlatBuffers schema（`ShortConvParam`）、ONNX 自定义算子、C++ 后端实现。这条路更重，需要修改的环节更多，出错概率也更高。

### 崩溃原因

segment fault 的直接原因是**没有为新算子注册 shape inference**。没有 shape inference，MNN 无法确定输出 tensor 的维度，内存不会被分配，C++ 执行时访问空指针直接崩溃。

即使修复了 shape inference，还有更多问题：
- converter 中缺少 `main_type` 字段，运行时无法反序列化参数，会导致空指针
- C++ 实现的语义与 Python 端不一致（多了 SiLU 激活、输入维度假设错误）
- 无条件访问 bias tensor，当 `has_bias=false` 时越界访问

### 代码特点

改动量看似很大（14 文件，+935/-533），但其中 6 个文件是自动生成的注册文件重排序，实际逻辑改动约 +386/-28。此外，`regist_lfm2` 中混入了不相关的 InternVL 注册代码，代码组织不够清晰。

## 横向对比

### 按结果分层

| 层级 | 模型 | 说明 |
|------|------|------|
| **完全通过** | Opus 4.6、GPT-5.4 | 无人工干预，端到端一次通过 |
| **提醒后通过** | MiMo-V2-Pro、GLM-5 | 告知输出错误（无方向性引导），自主定位修复 |
| **提醒后仍失败** | Kimi-K2.5 | 告知输出错误，无法自主修复 |
| **推理失败** | MiniMax-M2.7 | 导出成功但推理直接报错 |
| **推理崩溃** | Qwen3-Max | 导出成功，推理 segment fault，新算子缺 shape inference |

### 核心设计决策

| 决策 | Opus 4.6 | GPT-5.4 | MiMo-V2-Pro | GLM-5 | Kimi-K2.5 | M2.7 | Qwen3-Max |
|------|----------|---------|-------------|-------|-----------|------|-----------|
| 复用 LinearAttention | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ 新建算子 | ❌ 新建算子 |
| 卷积方向正确 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ 语义不一致 |
| ONNX 导出路径 | ✅ | ✅ | ✅ | ✅ | ❌ 缺失 | ✅ | ✅ |
| Shape inference | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ 未注册 |
| 自主写单元测试 | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 多线程 C++ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |

### 效率对比

| 模型 | 耗时 | 花费 | 有效代码行 |
|------|------|------|-----------|
| Opus 4.6 | 14m 30s | ~¥45 | +414 |
| GPT-5.4 | 20 min | $3.34 | +351 |
| MiMo-V2-Pro | 28m 40s | ¥25.68 | +297 |
| GLM-5 | 46m 25s | $152.84 | +934 |
| M2.7 | 53m 31s | ¥29 | +451 |
| Kimi-K2.5 | 1h 55m | $108.57 | +486 |
| Qwen3-Max | 1h 3m 39s | $117.05 | +386 |

一个有趣的规律：**通过的模型普遍代码更少、速度更快**。Opus、GPT-5.4、MiMo 都在 30 分钟内完成，代码量 300-400 行；而未通过的模型往往耗时更长、代码更多但有效性更低。简洁精准的代码，本身就是能力的体现。

## 关于工具环境的发现

本系列测评中，有两个模型出现了"换工具/配置后结果逆转"的情况：

- **GPT-5.4**：我首次测试使用的付费接口和配置可能有问题（完全没有 cache，速度慢费用高），3 小时 ¥820 未完成；同事使用正确配置后 20 分钟 $3.34 通过
- **MiMo-V2-Pro**：opencode 免费额度 → 11 小时导出失败；Claude Code 充值 token → 28 分钟提醒后通过

这不是个例，而是规律。模型能力是基础，但工具链的质量和配置决定了能力能发挥几成。在评价一个模型的工程能力时，工具变量不可忽视。

## 结论

七个模型测下来，形成了清晰的三个梯队：

**第一梯队：一次通过**
- **Claude Opus 4.6**：14 分钟，~¥45，最快最稳
- **GPT-5.4**（xhigh 模式）：20 分钟，$3.34，性价比最高，还写了单元测试

**第二梯队：提醒后通过**
- **MiMo-V2-Pro**：28 分钟，¥25.68，国产最强之一
- **GLM-5**：46 分钟，$152.84，完成度高但代价不菲

**第三梯队：未通过**
- **Kimi-K2.5**：能跑但修不了，ONNX 导出机制理解不到位
- **MiniMax-M2.7**：架构决策偏差，走了更重的路
- **Qwen3-Max**：新建算子但缺 shape inference，推理直接崩溃

第一梯队和第二梯队的差距在于"最后一公里"：能否在实现完成后主动验证结果、发现问题并自行修复，而不需要人工提醒。第二梯队和第三梯队的差距则更根本：能否理解框架的核心机制（如 ONNX 自定义算子桥接），并在出错后定位根因。

值得一提的是，本次测评只是 LFM2 模型支持的基础部分——Dense Language Model。LFM2 全系列还包括 MoE、VL（视觉）、Audio（音频）三个更复杂的架构变体，这些任务已在 Claude Opus 4.6 上全部验证通过，但其他模型由于费用和耗时等原因尚未测试。随着各模型能力的持续提升，后续计划按架构复杂度逐步加码，进一步拉开区分度。

在复杂工程任务上，模型之间的差距比 benchmark 上看到的要大得多。能写代码和能端到端跑通，中间隔着一道鸿沟。