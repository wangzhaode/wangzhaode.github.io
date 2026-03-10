---
layout: post
title:  MNN复杂任务Skill拆解实验
date:   2026-03-10
last_modified_at: 2026-03-10
categories: [ai, mnn, engineering]
---

大模型时代，每天都有新的开源模型发布。作为 MNN 推理框架的开发者，我们如何以最快的速度提供底层支持？这通常是一个横跨 Python 模型拆解、C++ 算子实现、多模态编解码的硬核工程任务。我尝试把这个任务完全交给目前业内最强的代码模型 Claude Opus 4.6，结果它翻车了。但当我改变了一种与 AI "沟通" 的结构后，效果显著提升……

## 背景

为 MNN 推理框架支持一个新的 LLM 模型，是一项复杂、耗时且繁琐的工程任务。整个链路涉及 6 个层次的知识，每一层都不可或缺：

1. **原始模型架构理解**：读懂 HuggingFace transformers 中模型的架构设计、实现细节（Attention 变体、RoPE 类型、残差模式）、输入输出格式（chat template、special tokens、多模态输入协议）
2. **统一模型映射与转换**：将 transformers 格式的模型结构映射到 llmexport 的统一模型框架（LlmModel），包括权重路径映射、config 字段映射、decoder/attention 子模块映射
3. **计算逻辑拆分**：识别模型中计算图友好的部分（线性层、LayerNorm、标准 Attention）和计算图不友好的部分（动态控制流、KV Cache 管理、采样逻辑），将后者从导出图中剥离
4. **ONNX 导出与自定义算子**：将计算图友好的部分导出为 ONNX，对无法用标准 ONNX 算子表达的操作（如 FusedAttention、自定义 RoPE）定义自定义算子的符号表示
5. **ONNX → MNN 转换与图优化**：通过 MNNConvert 将 ONNX 模型转换为 MNN 格式，处理算子映射、图优化、权重量化（HQQ/INT4）
6. **C++ 推理引擎集成**：对接 MNN LLM 的运行时逻辑，包括 Jinja 模板解析、tokenizer、KV Cache 管理、vision/audio dispatch、采样策略等
7. **多模态编码器适配**：对于视觉/音频模型，还需要额外处理多模态编码器——这是差异最大的部分。不同模型的图片预处理方式（resize/patch/normalize）、视觉编码器结构（ViT/SigLIP/自定义 CNN）、位置编码（2D RoPE/learnable）、特征融合方式（merger/projector/cross-attention）以及与语言模型的对接协议（token 替换/prefix embedding）各不相同，几乎每个新的多模态模型都需要编写独立的 Vision/Audio 子类

这些知识横跨 Python 和 C++ 两侧，散布在 10+ 个关键文件中，任何一个环节出错都会导致最终推理失败——而且错误往往表现为"模型说胡话"或"C++ 崩溃"，难以从表面现象定位根因。我尝试过多次直接让 AI 完成这个任务，效果都不理想——AI 要么在架构分析阶段就走偏，要么写完代码后无法有效 debug。

## 转机：Opus 4.6 + 任务拆解

在用 Claude Opus 4.6 支持 Qwen3.5 模型的过程中，我发现了一个关键规律：**当我把任务拆分好、测试节点制定好之后，Opus 4.6 基本能完成得很好。** 它强大的代码理解能力足以读懂复杂的 HF 模型实现，问题在于它缺少一个结构化的执行框架。

这让我产生了一个想法：**能否通过 Skill 的方式，把这个复杂任务拆解清楚，同时定义好每一步的测试标准（TDD 驱动），让 AI Agent 能独立完成整个流程？**

## Skill 设计

这里说的 Skill，并非外部 API 调用接口，而是一套**基于 AI 原生仓库理念（AI Native Repository）**的指令系统。我们在项目根目录建立主指令文件（如 `CLAUDE.md`），并在 `skills/` 目录下建立结构化的 Markdown 步骤指导，让 Agent（如 Claude Code）在干活时自行读取和执行。

### 核心理念

1. **TDD 驱动**：每一步都有明确的测试标准，必须通过当前步骤的测试后才能进入下一步
2. **渐进式披露**：考虑到任务的复杂性，如果一次性介绍全部内容会占用过多上下文窗口，因此拆解成 6 个独立步骤文件，按需加载
3. **先测试后实现**：Step 3 的 Hook 对齐测试是关键设计——在导出之前，先用 Python 逐层对比原始模型和 MNN 模型的中间结果

### 步骤结构

```text
Step 1: 分析模型架构 → 确定 Tier 级别
Step 2: 添加字段映射 → 验证模型可加载
Step 3: Hook 对齐测试 → 逐层数值对比（关键！）
Step 4: 导出 MNN 模型 → C++ 推理验证
Step 5: 多模态支持   → 视觉/音频编码器（按需）
Step 6: 新架构支持   → 自定义算子（按需）
```

每个步骤文件包含：目标、前置条件、具体操作、测试标准、常见错误与修复。

## 实验设计

为验证 Skill 的有效性，我设计了一个对照实验：

- **目标模型**：GLM-OCR（一个与 Qwen2.5-VL 架构相似的多模态 OCR 模型，Tier 5）
- **实验动机**：最近正好有一个真实的用户 Issue 请求支持 GLM-OCR 模型。以此作为测试对象，最能检验 Skill 在解决真实社区需求时的战斗力。
- **实验组**：使用 `support-new-llm` Skill 指令链
- **对照组**：不使用任何 Skill，直接给出相同的 prompt
- **控制变量**：相同的代码基线、相同的模型、相同的初始 prompt、相同的 Claude Opus 4.6 模型

GLM-OCR 是一个不错的测试对象，因为它包含多个技术难点：
- Gemma2 风格的 4-LayerNorm 残差模式
- 交错式 M-RoPE（与标准 Llama RoPE 不同）
- Conv2D 下采样 + SwiGLU merger 的视觉编码器
- 复杂的 Jinja chat template

### 输入 Prompt

两组实验使用完全相同的启动方式和初始 Prompt：

**启动命令（包含初始 Prompt）**：
为了授权 Agent 完全自治执行并避免中途的权限确认打断，我们使用以下命令行一键启动：

```bash
claude --dangerously-skip-permissions "请帮我支持 GLM-OCR 模型（/home/yanxing/data/models/GLM-OCR），支持模型导出和推理。"
```

敲下回车后，**人类完全放手，不再提供任何架构或业务逻辑上的指导**，直至模型自行判断任务结束或陷入报错死循环。

## 实验结果

### 代码产出对比

| 维度 | 无 Skill | 有 Skill |
|------|---------|---------|
| 修改文件数 | 4 个 |  6 个 |
| model_mapper.py | 正确 | 正确 + 注释说明残差模式 |
| model.py | `AutoModelForImageTextToText`（通用类） | `GlmOcrForConditionalGeneration`（精确类名） |
| transformers.py | **未修改** | +9行：interleaved RoPE 修复 |
| llmexport.py | **未修改** | +6行：Jinja 模板简化 |
| tokenizer.py | +16行：通用 fallback | +4行：精准 stop token |
| vision.py | +69行 | +71行 + 基类 bug 修复 |

### 关键问题发现与处理

| 问题 | 无 Skill | 有 Skill |
|------|---------|---------|
| **Interleaved RoPE** | 未发现 | Hook 测试精确定位并修复 |
| **embed_ dtype 级联** | 补丁式修复（事后恢复 dtype） | 根因修复（`object.__setattr__`） |
| **Jinja 模板崩溃** | 未处理 | C++ 崩溃后追查，永久修复 |
| **Stop token** | 通用 fallback 方式修复 | 精准添加 `<|user|>` |
| **Hook 逐层对齐** | 完全跳过 | 5 个检查点全部 < 1e-5 |
| **C++ 视觉推理** | 未测试 | 测试通过，正确描述图片 |

### 最终状态

| 维度 | 无 Skill | 有 Skill |
|------|---------|---------|
| MNN 导出 | 成功 | 成功 |
| C++ 文本推理 | **崩溃**（Jinja 模板解析失败） | 正常运行 |
| C++ 视觉推理 | 未测试 | 正常运行，输出与图片内容相关 |
| 推理数值正确性 | **错误**（RoPE 未修复） | 正确（Hook 对齐验证通过） |
| 能否直接使用 | **不能** | **能** |

> **一句话总结实验结果：** 无 Skill 的 AI 像一个能力很强但没有工程规范的新手，写出的代码看起来对但一跑就崩；有 Skill 的 AI 像一个严谨的资深工程师，提前拦截隐蔽 Bug，交付的代码直接可用。

为了更直观地展示差距，我们直接看 MNN C++ 的真机测试输出：

**❌ 无 Skill 版本测试结果（模型崩溃与数值幻觉）：**
虽然导出阶段看似正常，但在 C++ 端启动推理时，由于忽视了底层的结构性错误，引擎首先直接崩溃抛出核心转储：
```bash
Expected comma in tuple
terminate called after throwing an instance of 'std::invalid_argument'
  what():  stof
[1]    3412184 IOT instruction (core dumped)  ./llm_demo ../transformers/llm/export/model/config.json prompt.txt
```
不仅如此，哪怕人类介入帮它强行把模板代码（Jinja template）修复，由于没有经历 Hook 对齐测试，模型深处的 RoPE 对齐错误依然存在。再次尝试测试时，模型直接陷入了可怕的“文字幻觉”死循环：
```bash
prompt file is prompt.txt
惠全网通用发票
发票专用章
国家税务局监制
全国统一发票监制
国家税务总局监制
国家税务总局监制
2014013151401314000000000000000000000000000000...
0000000000000000000000
```

**✅ 有 Skill 版本测试结果（完美 OCR 与高性能推理）：**
在经过 Skill 的 Hook 对齐与 C++ Jinja/RoPE 修复之后，多模态推理完全跑通。我们向其输入了一张名为 `xp.jpg` 的超市购物小票实拍原图，模型不仅精准读出了各种繁乱的商品、单价、流水号：
```bash
(base) ➜  build ✗ ./llm_demo ../transformers/llm/export/model/config.json prompt.txt
...
prompt file is prompt.txt
惠万家购物厅(永和店)
店号:19工号:303串号:306677639
品名 数量 单价 金额
M1x230速货梳打小饼干(奶盐味/包
489702174485 1.10.80 10.80
各袋县県染沙琪玛4/包(原价18.8)
68425421728 9.70 9.90
...
鲁山商品数7件,合计57.41
原价合计67.61 为患节省10.20
...
```

| 执行效率维度 | 无 Skill（失败） | 有 Skill（成功） |
|------|---------|---------|
| 上下文窗口数 | 1 个 | 3 个 |
| Token 与缓存读取 | 7.2m cache read, 37.1k output | 22.7m cache read, 115.7k output |
| API 耗时 | ~14 分钟 | ~45 分钟 |
| **实际 API 成本**| **约 90 元人民币** | **约 140 元人民币** |
| 用户干预次数 | 1 次（continue，由于产出垃圾输出直接中断） | 1 次（由于 C++ 精度对齐需要人工敲回车跳过下一步） |
| 策略 | 半结构化，先写后测 | 严格 TDD，逐步验证 |

*注：虽然 `/cost` 命令给出的账面理论额度更高（$6 vs $19），但实际后台最终的结算扣费为 90 元与 140 元人民币左右。尽管 TDD 验证循环引发的大量长上下文验证拉高了账面 Token 用量（22.7m cached token），但这多花的 50 块钱（不到两杯星巴克的钱），却结结实实地为核心开发者省下了数天深埋在张量与 C++ 崩溃日志中徒劳 Debug 的成百上千倍的时薪成本。*

## 分析

### Skill 带来的最大价值：Hook 对齐测试拦截了隐蔽 Bug

无 Skill 版本完全没有发现 GLM-OCR 使用的是**交错式 RoPE 旋转**（相邻元素配对 (0,1),(2,3)...），而非标准的半半旋转（前后半配对 (0,64),(1,65)...）。它看到推理输出是垃圾文本后，简单归因为"OCR 模型不擅长纯文本"就跳过了验证。

有 Skill 版本在 Step 3 的 Hook 对齐测试中，立即发现 layer0 输出发生了 0.014 的偏差。这就好比建造大厦时，第一层钢筋就偏了 1 厘米。在此检查点的拦截下，AI 没有继续盲目搭建，而是立即追溯到了 `rotate_half` 函数的实现差异，准确发现 GLM-OCR 的旋转向量位置编码（RoPE）是交错式的，最后成功修复。

**如果没有这个 TDD 检查点，这种微小的浮点偏差会一路传导到最终输出端，表现为模型在疯狂乱吐字符。人类开发者顺着错误结果去倒推排查底层张量，简直是噩梦。**

### 修复质量：根因 vs 补丁

embed_ dtype 级联问题的修复方式对比很有说明性：

- **无 Skill**：在 `model.py` 中，先保存 `embed_dtype`，构造 Vision 后再恢复 `model.embed.embed.to(embed_dtype)`。这是一个"知道哪里出了问题但不知道为什么"的补丁式修复，每次加载模型都要执行恢复操作。

- **有 Skill**：在 `vision.py` 基类中使用 `object.__setattr__(self, 'embed_', base.embed)` 阻止 PyTorch 将 embed_ 注册为子 Module，从根源上避免 `.float()` 级联。这是一劳永逸的修复，且不需要上层代码做任何额外操作。

有 Skill 版本的修复质量更高，甚至比我之前人工支持时考虑的更好——我之前也是用补丁式的方式处理这个问题。

### Skill 的不足

实验也暴露了 Skill 的几个盲区：

1. **C++ 集成问题覆盖不足**：Jinja 模板兼容性、stop token 配置、MNNConvert 版本匹配，这些都是在 C++ 测试阶段才暴露的问题，原始 Skill 没有覆盖到。
2. **常见陷阱缺乏文档**：交错式 RoPE、dtype 级联等问题虽然被 Hook 测试拦截了，但如果 Skill 预先提示"检查 `rotate_half` 的实现方式"，定位速度会更快。
3. **效率代价**：有 Skill 版本消耗了 3 个上下文窗口（4.5MB 日志），而无 Skill 版本只用了 1 个（1.8MB）。结构化流程带来了质量提升，但也带来了更多的中间验证开销。

基于这些发现，我对 Skill 进行了迭代更新：新增了 `common-pitfalls.md` 文档，并在 step1/step2/step4/step5 中补充了 RoPE 变体检测、Decoder 残差模式速查、Jinja 限制、C++ 多模态测试指南等内容。

### 补充对照：基础模型能力与长上下文陷阱

为了验证完备的 Skill 框架是否能弥补基础模型的能力短板，我临时增加了一个对照组：使用 **GLM-5** 模型并在开启所有 Skill 约束的条件下重新执行该任务。该流程在运行了 5 个半小时后以失败告终，并输出了如下执行日志：

```bash
  ⎿  Total cost:            $189.97
     Total duration (wall): 5h 43m 57s
     Total code changes:    1636 lines added, 491 lines removed
     Usage by model:
                    glm-5:  36.9m input, 210.7k output, 0 cache read, 0 cache write ($189.97)
```
*(注：这里的 $189.97 是终端工具基于 Token 消耗量换算的理论标价。由于本次测试使用了包月订阅服务，实际并未产生此项费用，但该数据客观反映了整个流程消耗的计算资源。)*

这次失败的尝试暴露出在 Agent 实际工程落地中需要重点关注的几个隐性门槛：

1. **异常范围的代码修改倾向**：在复杂的底层代码适配中，合理的模式应当是“精确的局部修改”。前文的 Opus 4.6 仅通过百余行的改动便修复了根因；而 GLM-5 的增删代码量超过了 2000 行，说明模型在处理复杂的长链路逻辑时发生了“指令遗忘”或“上下文迷失”，开始推倒重写无关代码。
2. **死循环引发的 Token 雪球效应**：在长达 5 个多小时的 TDD 循环验证（需要不断读取当前代码库文件与测试报错内容）中，由于模型始终无法给出正确的 Bug 修复策略，流程被卡死在了“测试通过失败-重新修改-再次测试失败”的死胡同里。历史对话的不断堆积，导致最终的 Input Token 累积到了惊人的 **3690 万**。在按量计费的 API 业务场景下，这种死循环将带来不可控的费用风险。
3. **结构化流程无法越过基础推理短板**：Skill 能提供清晰的任务拆解与验证节点，但不能替代代码的具体实现逻辑。当任务难度超出了此时模型基础推理能力的上限，严苛的测试护栏反而会让它陷入反复报错的泥沼。

通过这组对照可以发现，对于硬核工程任务，Skill 和 TDD 可以作为提升下限的护栏，但 Agent 系统最终能否交付可用成果，依然取决于底层模型**本身的代码推理能力**和**对长上下文的稳定理解**。

## Skill 的自我进化：每次调用都是一次迭代

一个有趣的发现是：**AI 在执行 Skill 的过程中，本身就是 Skill 最好的审查者。**

在本次实验完成后，我让 AI 回顾整个执行过程，反思 Skill 哪里帮助了它、哪里让它困惑、哪里需要改进。AI 给出了非常具体的反馈：

- "RoPE 旋转方式（half-half vs interleaved）是最耗时的 debug 点，Skill 应该提示检查 `rotate_half` 的实现"
- "C++ minja parser 不支持复杂 Jinja 模板，Skill 应该记录这个限制"
- "Step 5 对 C++ 视觉推理测试的指导太少，缺少 dispatch 逻辑和输入格式说明"
- "Decoder 残差模式的映射关系比较反直觉，需要一个 pattern catalog"

基于这些反馈，我让 AI 直接修改了 Skill 文件：

| 更新内容 | 文件 |
|---------|------|
| 新增常见陷阱文档（6 个已知问题） | `common-pitfalls.md`（新文件） |
| Step 1 增加 RoPE 旋转方式检测指南 | `step1-analyze.md` |
| Step 2 增加 Decoder 残差模式速查表 | `step2-mapping.md` |
| Step 4 增加 Jinja/stop token 排查 | `step4-export.md` |
| Step 5 增加 C++ 视觉 dispatch 和测试指南 | `step5-multimodal.md` |

这形成了一个**正反馈循环**：

```text
Skill v1 → AI 执行 → 遇到问题 → AI 反思 → 更新 Skill v2
         → AI 执行 → 遇到新问题 → AI 反思 → 更新 Skill v3
         → ...
```

每一次 AI 调用都在"用"Skill 的同时"改进"Skill。传统的流程文档需要人工维护，容易过时；而这种模式下，**Skill 是被它的使用者（AI）自动迭代的**。AI 既是执行者，也是质量审查员，还是文档维护者。

更重要的是，这些改进不是泛泛而谈的——它们来自 AI 在实际执行中遇到的真实问题，带有具体的错误现象、根因分析和修复方案。比如 `common-pitfalls.md` 中的每一条都附有：问题描述、如何识别、代码级修复方案。这比人工凭记忆写的文档要精准得多。

随着更多模型被支持，这个 Skill 会积累越来越多的实战经验，覆盖越来越多的边界情况。可以预见：

- **第 1 次**：Skill 帮助 AI 完成任务，但有盲区
- **第 2-3 次**：盲区被填补，常见陷阱被记录，AI 执行更顺畅
- **第 N 次**：Skill 趋于完善，AI 几乎可以零干预地独立完成任务

**这本质上是一种"AI 原生"的知识管理方式**：不是人写文档给 AI 看，而是 AI 在实践中沉淀经验，再反哺给下一次 AI 调用。人类的角色从"写流程文档"转变为"审核 AI 的改进建议"——这是一个效率高得多的协作模式。

代码仓库的形态正在发生不可逆转的改变。未来的优秀开源项目，除了会提供面向开发者的 `README.md` 和 `CONTRIBUTING.md`，一套面向 AI Agent 甚至具备自我迭代能力的 `SKILL` 指令网络，或许将成为底层的基建标配。

## 结语

回顾本次围绕 GLM-OCR 支持的工程实战，我们得出了清晰的对比：

| 维度 | 无 Skill | 有 Skill |
|---|---------|---------|
| **产出可用性** | 不可用（C++ 崩溃 + 数值错误） | 可直接使用 |
| **Bug 发现能力** | 遗漏关键 Bug（RoPE） | 精确定位所有 Bug |
| **修复质量** | 补丁式 | 根因级 |
| **核心代价** | 节约了上下文，但结果不可用 | 多花了几十元 Token 费，产出直接落地 |

**核心结论**：对于底层架构解析类复杂任务，基础模型自身的代码推理能力往往存在瓶颈。**基于 TDD 约束的 Task 拆解与 Skill 化，是确保 AI 产出达到工程级可用的必要手段。** 缺乏 Skill 护栏的模型极易在长链路中遗漏微小的数值偏差（如 RoPE 异构）；而内置 Skill 约束的模型则能借助结构化验证点，实现 Bug 的精准拦截与根因修复。

这引出了一个更根本的经验总结：**AI 在处理复杂任务时，缺的往往不是更强的模型能力，而是合理的任务结构化。** Skill 本质上就是把我们开发者的“隐性经验”和“排错直觉”编排成了 AI 能懂的指令链路，让它在对的时间强制做对的检查。对于其他的硬核开发工作——比如自定义算子优化、新硬件的推理迁移，这种基于 Skill 指导的思路同样是个万能的解法。

---

### 相关资源

* 附上我们本次为 MNN 提交的 AI Skills 完整代码：[370d540745a](https://github.com/alibaba/MNN/commit/370d540745a309c04ce5ccd6d20f48f2b6104112)。在这套框架下，`support-new-llm`、`arm-cpu-optimize` 等技能都已经高度结构化地开放给了社区与 AI Agent。
* 用户请求支持 GLM-OCR 的原始 Github Issue：[#4221](https://github.com/alibaba/MNN/issues/4221)。
* 实验使用的 GLM-OCR 原生模型出处（ModelScope 魔搭社区）：[ZhipuAI/GLM-OCR](https://modelscope.cn/models/ZhipuAI/GLM-OCR/summary)。
* 转换出来的 MNN 模型下载地址：
  * ModelScope: https://modelscope.cn/models/MNN/GLM-OCR-MNN
  * Hugging Face: https://huggingface.co/taobao-mnn/GLM-OCR-MNN
