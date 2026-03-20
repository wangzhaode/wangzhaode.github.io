---
layout: post
title:  如何设计端侧高性能 Tokenizer？—— MNN 重构实践与思考
date:   2026-03-20
last_modified_at: 2026-03-20
categories: [MNN, llm]
---

## 1. 引言

在端侧大模型推理中，Tokenizer 是用户输入文本到模型可以理解的 token ID 之间的桥梁。它看似简单，实则涉及 Unicode 规范化、正则分词、子词编码等多个环节。

服务端的 Tokenizer 实现（如 HuggingFace Tokenizers）通常基于 Rust 构建，依赖完整的 Unicode 库（ICU）、复杂的正则引擎，编译产物数 MB 级别。这在服务端不是问题，但端侧场景有着截然不同的约束：

- **极致的包大小控制**：移动端 App 对每一个 KB 都斤斤计较，数 MB 的第三方库不可接受
- **高性能低延迟**：手机 CPU 资源有限，加载和编码必须在毫秒级完成
- **最小化第三方依赖**：每多一个依赖都意味着编译复杂度、兼容性风险和包大小增长
- **低代码量**：代码越少，维护成本越低，出错概率越小

MNN 很早就支持了 LLM 推理的 Tokenizer，但由于当时各家模型的 Tokenizer 尚未收敛，实现上采用了针对不同模型分别适配的方式（Sentencepiece / Tiktoken / BertTokenizer / HuggingfaceTokenizer），功能不够完备，维护成本也在持续增长。

本次升级引入了 **PipelineTokenizer**——一套专为端侧设计的、与 HuggingFace Transformers 行为完全对齐的统一流水线架构。设计遵循三个基本原则：**零第三方依赖、高性能、低代码量（小二进制）**。核心思路是「Python 导出时预计算，C++ 加载时零拷贝」——把能在离线做的计算全部提前做掉，让端侧 C++ 代码尽可能简单、快速。

## 2. 统一的 Tokenizer 流水线：原理与流程

### 2.1 四阶段流水线

现代 HuggingFace Tokenizer 采用统一的四阶段流水线架构：

```
输入文本 → [Normalizer] → [PreTokenizer] → [Model] → [PostProcessor] → Token IDs
```

| 阶段 | 职责 | 典型实现 |
|------|------|---------|
| **Normalizer** | 文本规范化：Unicode 归一化、大小写转换等 | NFKC、BertNormalizer、Prepend("▁") |
| **PreTokenizer** | 预分词：将文本切分为子串 | ByteLevel (GPT-2)、Metaspace (SentencePiece)、Split (正则) |
| **Model** | 核心编码：将子串编码为 token ID | BPE、WordPiece、Unigram |
| **Decoder** | 解码还原：将 token ID 还原为文本 | ByteLevel、Metaspace、WordPiece |

每个阶段都是可插拔的组件，不同模型只是组件的组合不同。这样一套架构就能覆盖几乎所有主流 LLM 的 Tokenizer。

### 2.2 以 Qwen3 为例：一句话的完整编码过程

以 Qwen3（BPE 模型，ByteLevel 预分词）处理一句话 `"Hello, MNN!"` 为例，展示每一步的变化：

**Step 0: 原始输入**
```
"Hello, MNN!"
```

**Step 1: Normalizer（无操作）**

Qwen3 的 Tokenizer 没有配置 Normalizer，文本保持不变：
```
"Hello, MNN!"
```

**Step 2: PreTokenizer（ByteLevel + Digits）**

ByteLevel PreTokenizer 使用类似 GPT-2 的正则模式将文本分割为子串。这个正则的核心思想是：将英文单词（含前导空格）、数字、标点各自切开。

```
分割后的子串列表：
["Hello", ",", " MNN", "!"]
```

同时，ByteLevel 会将每个字节映射为一个可见的 Unicode 字符（GPT-2 byte-to-unicode mapping）。例如空格 `0x20` 被映射为 `Ġ`（U+0120）：

```
ByteLevel 映射后：
["Hello", ",", "ĠMNN", "!"]
```

**Step 3: Model（BPE 编码）**

对每个子串独立执行 BPE（Byte Pair Encoding）。BPE 的过程是：

1. 将子串拆为单字符序列
2. 反复查找优先级最高的相邻 pair 并合并
3. 直到无法继续合并

以子串 `"Hello"` 为例：
```
初始:  ["H", "e", "l", "l", "o"]
合并1: ["He", "l", "l", "o"]       ← (H, e) 是优先级最高的 pair
合并2: ["He", "ll", "o"]           ← (l, l) 合并
合并3: ["He", "llo"]               ← (ll, o) 合并
合并4: ["Hello"]                   ← (He, llo) 合并
查表:  Hello → 9906
```

对所有子串执行 BPE 后：
```
"Hello" → [9906]
","     → [11]
"ĠMNN"  → [386, 2224]    ← "ĠMNN" 被分为 "ĠM" 和 "NN" 两个子词
"!"     → [0]
```

**Step 4: 最终结果**

合并所有子串的 token ID：
```
[9906, 11, 386, 2224, 0]
```

这就是模型实际接收到的输入。

### 2.3 解码过程（逆向）

解码时，Decoder 将 token ID 还原为文本：
```
[9906, 11, 386, 2224, 0]
→ 查表: ["Hello", ",", "ĠM", "NN", "!"]
→ 拼接: "Hello,ĠMNN!"
→ ByteLevel 逆映射: "Hello, MNN!"
```

其中 `Ġ` 被还原为空格，恢复原始文本。

## 3. MNN 旧版 Tokenizer 的问题

MNN 从 2023 年就开始支持 LLM 推理的 Tokenizer，但当时各家模型的 Tokenizer 实现差异较大，MNN 采用了分别适配的策略：

| 旧实现类 | 适配模型 | 局限性 |
|---------|---------|--------|
| `Sentencepiece` | LLaMA 1/2、ChatGLM | 仅支持 Unigram/BPE，不支持 AddedToken 等特性 |
| `Tiktoken` | GPT 系列、Qwen 1 | 不支持 chat template |
| `BertTokenizer` | BERT、ChatGLM | WordPiece 专用，不可扩展 |
| `HuggingfaceTokenizer` | GPT-2、LLaMA 3、Qwen 2 | 使用 std::regex，性能差；不支持 Normalizer |

存在的问题：

1. **功能不完备**：每种实现只覆盖部分场景。新模型出来时经常需要加 if-else 特殊处理，编码结果与 HuggingFace 不一致
2. **文本格式加载慢**：词表以文本 + base64 格式存储，逐行读取解析，15 万词表加载耗时数百毫秒
3. **正则性能差**：`std::regex` 在移动端性能极差，含 Unicode property（如 `\p{L}`）的模式尤甚
4. **外部依赖**：Unicode 归一化依赖外部库或缺失，导致部分模型编码不正确

## 4. 新版 PipelineTokenizer：一套架构覆盖所有模型

### 4.1 架构设计

新版 PipelineTokenizer 实现了完整的四阶段流水线，每个阶段通过组合不同组件来适配不同模型：

```
PipelineTokenizer
├── Normalizer
│   ├── NFKCNormalizer      ← 预计算查表，无外部依赖
│   ├── BertNormalizer      ← 去重音、小写、中文字符处理
│   ├── PrependNormalizer   ← 前缀添加（如 "▁"）
│   ├── ReplaceNormalizer   ← 字符串替换
│   └── SequenceNormalizer  ← 多个 Normalizer 串联
│
├── PreTokenizer
│   ├── ByteLevelPreTokenizer   ← GPT-2/Qwen/LLaMA3 风格
│   ├── MetaspacePreTokenizer   ← SentencePiece 风格
│   ├── BertPreTokenizer        ← BERT 风格
│   ├── SplitPreTokenizer       ← 自定义正则分割
│   ├── DigitsPreTokenizer      ← 数字分割
│   └── SequencePreTokenizer    ← 多个 PreTokenizer 串联
│
├── Model
│   ├── BPEModel        ← GPT/Qwen/LLaMA 等
│   ├── WordPieceModel  ← BERT
│   └── UnigramModel    ← SentencePiece Unigram
│
└── Decoder
    ├── ByteLevelDecoder     ← 逆 byte-to-unicode 映射
    ├── MetaspaceDecoder     ← ▁ → 空格
    ├── WordPieceDecoder     ← 去除 ## 前缀
    ├── ByteFallbackDecoder  ← byte fallback 处理
    ├── ReplaceDecoder       ← 字符串替换
    ├── StripDecoder         ← 去除首尾字符
    └── SequenceDecoder      ← 多个 Decoder 串联
```

通过这种组合式设计，可以覆盖目前几乎所有主流 LLM 的 Tokenizer：

| 模型 | Normalizer | PreTokenizer | Model | Decoder |
|------|-----------|-------------|-------|---------|
| Qwen3 | — | ByteLevel+Digits | BPE | ByteLevel |
| LLaMA 3 | — | ByteLevel | BPE | ByteLevel |
| LLaMA 2 | — | Metaspace | BPE | Metaspace+ByteFallback |
| BERT | BertNormalizer | Bert | WordPiece | WordPiece |
| T5 | — | Metaspace | Unigram | Metaspace |
| ChatGLM4 | — | ByteLevel | BPE | ByteLevel |

### 4.2 与 HuggingFace 完全对齐

新版实现严格对齐 HuggingFace Transformers 的 tokenizer 行为，包括：

- Added Token 的精确匹配（支持 lstrip/rstrip 属性）
- Chat Template 的 Jinja2 渲染（内置轻量级 Jinja 引擎）
- 特殊 token 的处理策略

测试覆盖了 **47 个模型、1901 条测试用例**，与 HuggingFace Python 实现的输出完全一致。

## 5. 端侧优化：针对移动端的深度定制

端侧部署对加载速度、运行时内存、安装包大小有严格要求。本次升级在三个维度做了针对性优化。

### 5.1 加载速度：核心优化——导出时排序而非加载时排序

**问题**：旧版文本格式逐行读取 15 万行词表，每行需要 base64 解码 + `std::string` 分配，加载耗时数百毫秒。更关键的是，旧版在 C++ 加载时需要构建 `unordered_map<string, int>` 作为词表查找结构——15 万次 string 哈希 + 插入的开销非常大。

**核心思路**：将排序从加载时移到导出时。

传统做法是按 token ID 顺序存储词表（ID 0, 1, 2, ...），加载后构建哈希表用于 encode 时的 token→ID 查找。本次优化的关键洞察是：**在 Python 导出时就按 token 字符串的字典序排好序存储**。这样 C++ 端加载后无需任何额外处理，直接就是一个有序数组，可以用二分查找。

代价是什么？由于词表不再按 ID 顺序存储，每个 token 需要额外存储一个 4 字节的 token ID。对于 15 万词表，这仅增加约 600KB，但换来的是：

- **省去 15 万次 hashmap 插入**：不再需要构建 `unordered_map`
- **省去 15 万次 string 分配**：配合 StringRef 零拷贝，token 字符串直接指向 buffer
- **加载速度提升 20 倍以上**

```
旧方案加载流程：
  逐行读取 → base64 解码 → 分配 string → 插入 hashmap  （× 15万次）

新方案加载流程：
  单次 read() 整个文件 → 指针偏移填充 StringRef 数组    （× 15万次，无分配）
```

**方案细节**：

1. **单次 I/O**：整个二进制部分一次 `read()` 读入 `binary_buf_`
2. **零拷贝 StringRef**：词表 token 不分配 `std::string`，用 `StringRef` 直接指向 buffer 中的位置
3. **导出时预排序**：Python 导出时按字典序排序，C++ 端直接用 `std::lower_bound` 二分查找
4. **预计算 Merge 规则**：BPE merge 规则在导出时转为 `(id1<<32|id2)` 的 uint64 key 并排序

```cpp
// 零拷贝：StringRef 直接指向读入的 buffer，无 string 分配
struct StringRef {
    const char* ptr;   // 直接指向 binary_buf_ 中的位置
    uint16_t len;
};

// 词表条目：同样零拷贝，存储预排序的 token→ID 映射
struct VocabEntry {
    const char* str;   // 指向 buffer
    uint16_t len;
    int id;            // 导出时预排序的代价：多存一个 ID
};

// 加载时只需顺序填充，无需排序或构建哈希表
for (uint32_t i = 0; i < vocab_size; i++) {
    StringRef sr = read_str_ref(ptr);       // 零拷贝读取
    int id = (int)read_u32(ptr);            // 读取预存的 ID
    id_to_token[id] = sr;                   // decode 用：ID→token
    sorted_vocab[i] = {sr.ptr, sr.len, id}; // encode 用：已排序，直接二分
}
```

encode 时的词表查找从 hashmap 变为二分查找，虽然单次查找从 O(1) 变为 O(log n)，但排序数组在内存中连续存放，对 CPU cache 极为友好，实测性能相当甚至更优，且完全省去了加载时的构建开销。

### 5.2 文件大小：紧凑二进制存储

| 存储项 | 旧格式 | 新格式 |
|-------|--------|--------|
| Token 内容 | base64 编码（膨胀 33%） | 原始字节 + 2B 长度前缀 |
| Token ID | ASCII 十进制文本 | 4B uint32 |
| Merge 规则 | 文本（如 `"Ġ t"`） | 12B（id1 + id2 + rank） |
| Chat Template | 单独 JSON 文件 | 内嵌在 .mtok 尾部 |

综合来看，`.mtok` 文件比旧版 `.txt` + `tokenizer_config.json` 体积更小，同时还包含了更多信息（Normalizer 配置、Decoder 配置等）。

### 5.3 编码性能：Unicode 折叠 + 轻量 Regex 替代 std::regex

`std::regex` 是端侧 Tokenizer 的一大性能瓶颈。许多 Tokenizer 的预分词模式包含 Unicode property（如 `\p{L}+`、`\p{N}{1,3}`），而主流 C++ 标准库的 regex 实现对 Unicode property 支持差或根本不支持。

新版实现了一个通用的 `regex_scanner`，核心思路是 **Unicode 折叠**：先将 Unicode 文本中的每个字符按 General Category 映射为单字节分类码，再用轻量级的 regex 引擎在折叠后的单字节序列上匹配。

```
Unicode 折叠示意：
原始文本:   "Hello 你好 123"
折叠后:     "\x01\x01\x01\x01\x01 \x01\x01 \x02\x02\x02"
            (Letter=0x01, Number=0x02, 其余保留原字节)

正则模式也同步折叠：
\p{L}+  →  [\x01]+
\p{N}+  →  [\x02]+
```

折叠后的匹配完全在单字节域上进行，避免了传统 regex 引擎处理多字节 Unicode 的复杂性。对于极少数无法折叠处理的模式，才回退到 `std::wregex`。

### 5.4 NFKC/NFD 归一化：从代码内嵌到文件内嵌

Unicode 归一化（NFKC / NFD）是 Normalizer 阶段可能用到的功能。简单解释：

- **NFKC**（兼容性分解后标准合成）：将 Unicode 中形式不同但语义等价的字符统一。例如全角字母 `Ａ`→`A`、罗马数字 `Ⅲ`→`III`、连字 `ﬁ`→`fi` 等
- **NFD**（标准分解）：将组合字符拆为基字符+组合标记。例如 `é` 拆为 `e` + `´`，配合 BertNormalizer 的 `strip_accents` 功能去除重音符号

这两个表的数据量不小（NFKC 约 5000+ 条目，NFD 类似），通常需要 ICU 等 Unicode 库（数 MB 级）来支持。但在实际端侧场景中，**只有少数模型需要归一化**——主要是 BERT 系列模型会用到 BertNormalizer（含 NFKC 和 NFD），主流 LLM（Qwen、LLaMA、ChatGLM 等）的 Tokenizer 都不需要 Normalizer。

因此，本次方案的设计是：**不将 NFKC/NFD 数据编译到 C++ 代码中，而是在 Python 导出时按需写入 .mtok 文件**。

```
导出策略：
- Qwen3.mtok:  Normalizer = None，文件中不包含 NFKC/NFD 数据
- BERT.mtok:   Normalizer = BertNormalizer，文件中内嵌 NFD 表
- T5.mtok:     Normalizer = SequenceNormalizer(NFKC + Prepend)，文件中内嵌 NFKC 表
```

这样做的好处是：
1. **二进制包大小零增长**：不需要归一化的模型（绝大多数），C++ 代码中完全不包含这些数据
2. **无外部依赖**：需要归一化的模型，数据已经在 .mtok 文件中预计算好，C++ 端只需二分查找，不依赖 ICU
3. **按需付费**：只有实际使用归一化功能的模型文件才会包含这些数据

### 5.5 代码依赖与包大小

端侧部署对安装包大小极为敏感。本次优化在依赖控制上做了以下工作：

1. **Unicode 归一化数据外置**：NFKC/NFD 数据不编译进代码，按需内嵌到模型文件中（见 5.4）
2. **Unicode 分类数据精简内置**：预分词所需的 Unicode General Category 数据（30 种分类的码点范围表 + 大小写映射）以 range 压缩形式编译进代码，仅约 **30KB**
3. **内置轻量 Jinja 引擎**：Chat Template 渲染使用单头文件的 Jinja2 子集实现（~2200 行），替代了之前的 minja 依赖
4. **轻量 JSON 封装（ujson）**：LLM 推理引擎中仍有配置文件等场景需要解析 JSON。端侧实测 rapidjson 性能明显优于 nlohmann/json，但 rapidjson 的 API 易用性较差（需要手动判断类型、手动处理缺失字段等）。因此我们基于 rapidjson 封装了 ujson，兼顾了 rapidjson 的解析性能和 nlohmann 风格的简洁 API
5. **代码合并精简**：将原先分散的多个 tokenizer 实现合并到统一的 `tokenizer.hpp/cpp`，消除了条件编译和重复代码

```
tokenizer 目录文件：
├── tokenizer.hpp        # 统一声明
├── tokenizer.cpp        # 统一实现（~2400 行）
├── jinja.hpp            # 轻量 Jinja2（单头文件）
├── unicode.hpp/cpp      # Unicode 工具（折叠 + regex scanner）
└── unicode_data.hpp/cpp # Unicode 分类数据（预生成，~30KB）
```

整个 tokenizer 模块无外部依赖，仅依赖 C++11 标准库，即可支持所有主流 LLM 的 Tokenizer。

## 6. 性能实测

以 Qwen3.5-0.8B 模型的 Tokenizer 为基准，在 MacBook Pro (M3 Pro) 上对比三种实现的性能：MNN 新版 PipelineTokenizer（.mtok）、MNN 旧版（.txt）、HuggingFace Transformers（Python，底层为 Rust 实现的 tokenizers 库）。

测试项说明：
- **Load**：加载 Tokenizer（5 轮取平均）
- **Encode(short)**：4 条短文本编码（中英文混合，共约 61 tokens），100 轮取平均
- **Encode(long)**：~5KB 长文本编码（约 1088 tokens），20 轮取平均
- **Decode**：逐 token 解码（21 tokens × 1000 轮取平均）

### 测试结果

| 指标 | HuggingFace (Rust) | MNN 旧版 (.txt) | MNN 新版 (.mtok) |
|------|:-------------------:|:---------------:|:----------------:|
| **Load** | 485.27 ms | 71.73 ms | **3.14 ms** |
| **Encode(short)** | 0.022 ms | 0.038 ms | **0.004 ms** |
| **Encode(long)** | 1.098 ms | 3.097 ms | **0.171 ms** |
| **Decode** | 0.0009 ms | 0.0001 ms | 0.0002 ms |

### 性能提升倍数

| 指标 | 新版 vs HuggingFace | 新版 vs MNN 旧版 |
|------|:-------------------:|:----------------:|
| **Load** | **154x** | **22.8x** |
| **Encode(short)** | **5.5x** | **9.5x** |
| **Encode(long)** | **6.4x** | **18.1x** |
| **Decode** | 4.5x | ~持平 |

几个值得注意的点：

1. **加载速度是最大的提升点**：新版 3.14ms vs 旧版 71.73ms vs HuggingFace 485.27ms。这主要归功于两方面：一是「导出时预排序 + 二进制零拷贝」的设计省去了 hashmap 构建和 string 分配；二是**完全绕过了 JSON 解析**。HuggingFace 的 `tokenizer.json` 是一个数 MB 的 JSON 文件，包含完整的词表、merge 规则和配置，光解析这个 JSON 就要消耗大量时间。这也是我们放弃直接使用 HuggingFace 原始 JSON 格式、选择自定义二进制格式的核心原因——JSON 解析在端侧是不可接受的性能瓶颈
2. **编码速度全面领先 Rust 实现**：即使 HuggingFace tokenizers 底层是 Rust 编写的高性能库，MNN 新版仍快 5-6 倍。这说明「预计算 + 紧凑数据结构」的收益大于语言层面的差异
3. **长文本编码提升最为显著**：18 倍于旧版，主要受益于 Unicode 折叠替代 std::regex、BPE 缓存命中、以及排序数组的 cache 友好性

## 7. 总结

| 维度 | 旧版 | 新版 PipelineTokenizer |
|------|------|----------------------|
| 架构 | 4 种独立实现，按模型分派 | 统一四阶段流水线，组件化组合 |
| 正确性 | 部分模型存在编码差异 | 47 模型 1901 用例 100% 对齐 HuggingFace |
| 词表查找 | hashmap（加载时构建，慢） | 导出时预排序 + StringRef 零拷贝（加载即用） |
| 加载速度 | 数百毫秒 | 十余毫秒（20x+ 提升） |
| 预分词 | std::regex | Unicode 折叠 + 轻量 regex |
| 文件格式 | 文本 + base64 + 外部 JSON | 单一 .mtok 二进制文件 |
| NFKC/NFD 数据 | 依赖 ICU 或缺失 | 按需内嵌到 .mtok 文件，不增加包大小 |
| 外部依赖 | ICU / minja 等 | 零外部依赖，纯 C++11 |

端侧 Tokenizer 的设计哲学可以概括为一句话：**把复杂性留给离线工具，把简单性留给运行时**。

Python 导出阶段承担了所有「重活」：词表排序、Merge 规则预计算、Unicode 归一化表生成、二进制格式序列化。C++ 运行时只需要做最简单的事：读入一块内存、设置几个指针、用二分查找编码。整个 Tokenizer 的 C++ 实现约 2400 行，无任何第三方依赖（不依赖 ICU、不依赖 Rust tokenizers、不依赖 sentencepiece 库），仅需 C++11 标准库即可编译。Unicode 分类数据以压缩 range 形式内置约 30KB，NFKC/NFD 等归一化数据按需内嵌到模型文件中而非代码中，做到了「不用不付费」。

这套方案证明了一个朴素的道理：端侧推理不需要搬运服务端的全部复杂性。通过合理的离线-在线分工，完全可以用极小的代码量和零外部依赖，实现与 HuggingFace Transformers 100% 对齐的 Tokenizer 功能，同时获得远超服务端实现的加载和编码性能。

## 8. 开发思路：VibeCoding 与人工优化的协作

本次 Tokenizer 重构大量使用了 **VibeCoding** 的开发方式，借助 Gemini 3.1 Pro 和 Claude Opus 4.6 完成了大部分实现工作。具体来说：

**AI 擅长的部分：**

- **流水线架构搭建**：四阶段 Pipeline 的组件化实现，各种 Normalizer、PreTokenizer、Model、Decoder 的编写，AI 可以参照 HuggingFace 的 Python 代码高效地翻译为 C++
- **编解码算法实现**：BPE 合并、Unigram Viterbi、WordPiece 匹配等标准算法，AI 给出的实现基本正确
- **格式解析与序列化**：二进制格式的读写、Python 导出脚本的编写，AI 能够快速完成
- **测试对齐**：批量生成测试用例、对比 HuggingFace 输出、定位不一致的 case，AI 在这类繁琐工作中效率极高

**AI 做不到的部分——核心优化策略需要人工指导：**

然而，几个决定性能天花板的关键优化策略，AI 都未能自主给出正确方向：

1. **「导出时排序而非加载时排序」**：这是本次最核心的优化。AI 的默认思路是按 token ID 顺序存储词表（这是所有现有实现的做法），加载后构建 hashmap。当我提出「能否在导出时就排好序，加载时直接用」时，AI 能很好地实现这个方案，但它不会主动想到用「多存一个 4 字节 ID」来换取「省去整个 hashmap 构建」这个 trade-off
2. **「正则预分词的实现路径」**：AI 先提出引入第三方正则库 oniguruma（被否），再转向为 GPT-2、LLaMA3 手写专用 scanner（通用性差），最终在引导下设计了 Unicode 折叠 + 轻量 regex 的通用方案
3. **「NFKC/NFD 数据放文件里而非代码里」**：AI 的默认方案是引入 utf8proc 库或将 Unicode 数据表编译进代码，但考虑到绝大多数 LLM 不需要归一化，这些数据不应该增加所有用户的二进制大小

**反思：**

目前来看，AI 在「实现已知方案」上的能力已经非常强——给定明确的优化方向，它可以高质量地完成编码、测试、调试。但在「提出优化方向」上，尤其是针对端侧这种有特殊约束的场景（包大小敏感、无法依赖重量级库、需要在多个 trade-off 之间做判断），AI 往往会给出服务端视角的「标准答案」，而非端侧视角的「最优答案」。

这种人机协作的模式或许是当前阶段最高效的开发方式：**人负责方向判断和关键 trade-off 决策，AI 负责高效实现和大量测试验证**。整个 Tokenizer 的重构（覆盖 47 个模型、1901 条测试用例、C++ 约 2400 行 + Python 导出约 500 行）在这种协作模式下得以高效完成。