---
layout: post
title: Arm SME2 计算单元数量检测
date: 2026-08-13
last_modified_at: 2026-08-13
categories: [mnn, arm, cpu]
---

## 问题背景

Arm 在 **Armv9.3-A** 中引入了 SME2（Scalable Matrix Extension 2），用于加速矩阵乘法、卷积等计算密集型任务。

SME2 和我们熟悉的 NEON 不太一样。NEON 是固定 128-bit 的 SIMD 指令，主要对向量中的多个元素执行相同操作；SME2 建立在 SME 和 Streaming SVE 之上，使用可扩展向量，并增加了二维矩阵存储 `ZA`、外积累加和多向量指令，更适合 AI 推理中的矩阵计算。

另一个重要区别是：NEON 执行单元通常集成在每个 CPU Core 内，而 SME 的计算资源允许由多个 CPU Core 共享。Arm 把这种共享的 SME 与 Streaming SVE 计算资源称为 **SMCU（Streaming Mode Compute Unit）**。

和 NEON、DotProd、I8MM 等 CPU 特性一样，系统可以告诉应用 SME2 是否存在：

- **Linux / Android**：读取 `getauxval(AT_HWCAP2)`，检查 `HWCAP2_SME2`（bit 37）
- **Apple**：读取 `sysctlbyname("hw.optional.arm.FEAT_SME2")`

但这里有一个问题：这些接口只能回答“是否支持 SME2”，不能回答“有几个 SME2 计算单元”。不同厂商可以自行决定 SMCU 的数量，以及一个 SMCU 是由一个还是多个 CPU Core 共享。早期 Arm 没有提供通用的用户态查询方式，MNN 只能先检测 SME2 是否存在，再为 SME Core 数设置固定值。

在没有接口的情况下，我们也尝试过用 `SMOPA` / `FMOPA` 做 microbenchmark：分别测试单线程、双线程和更多线程的总吞吐。如果线程数增加而总算力不变，通常说明多个 CPU Core 在争用同一个 SMCU；当总吞吐出现阶跃增长时，则可能开始使用另一个 SMCU。这种方法可以帮助理解硬件，但受线程调度、核心类型和频率影响，不适合放进运行时自动检测。

最近 Arm 提供了 Linux / Android 上基于 `SMIDR_EL1` 的检测方案，但 Apple 平台仍没有对应接口，网络上也找不到一份完整、权威的 Apple 芯片 SMCU 数量表。因此把 MNN 中的实现和目前的测试结果记录下来。

完整实现见 [MNN PR #4766](https://github.com/alibaba/MNN/pull/4766)。

---

## Linux / Android：读取 SMIDR_EL1

Linux 会通过 sysfs 暴露每个 CPU 的 `SMIDR_EL1`：

```text
/sys/devices/system/cpu/cpuN/regs/identification/smidr_el1
```

`SMIDR_EL1` 中与计数相关的字段有两个：

- `SH`：bits `[14:13]`，表示当前 PE（Processing Element）是否与其他 PE 共享 SMCU
- `Affinity2:Affinity`：由 bits `[51:32]` 和 `[11:0]` 组成，用来标识共享的 SMCU

处理规则如下：

| SH | 含义 | 计数方式 |
|---|---|---|
| `0b10` | Private | 当前 CPU 有独立 SMCU，直接加 1 |
| `0b11` | Shared | 按 Affinity ID 去重，相同 ID 只计 1 个 |
| `0b00` | Ambiguous | Affinity 为 0 时按 Private，否则按 Shared |
| `0b01` | Reserved | 忽略 |

Affinity ID 的拼接方式为：

```cpp
uint32_t affinity =
    (smidr & 0xFFF) | ((smidr >> 20) & 0xFFFFF000);
```

因此最终结果是：

```text
SMCU 数量 = Private 数量 + Shared Affinity ID 去重后的数量
```

MNN 的检测流程可以概括为：

```cpp
if (getauxval(AT_HWCAP2) & HWCAP2_SME2) {
    cpuInfo->sme2 = true;
    cpuInfo->smeCoreNumber = countSMCUFromSysfs();
}
```

如果 sysfs 节点不存在、没有权限或没有成功读取任何 `SMIDR_EL1`，则保守返回 1。因为此时 HWCAP 已经确认 SME2 可用，返回 1 可以安全启用 SME2，又不会错误地启动多个 worker 去争用同一个单元。

### Android 真机结果

我们在一台 8 核 Android 设备上读取到每个 CPU 的值均为：

```text
SMIDR_EL1 = 0x0000000041116000
SH         = 0b11 (Shared)
Affinity   = 0
```

8 个 CPU 都指向同一个 Shared Affinity，去重后 MNN 得到：

```text
sme2=1
smeCoreNumber=1
cpuNumber=8
```

也就是说，这台设备的 8 个 CPU Core 都可以执行 SME2 指令，但背后共享 1 个 SMCU。这正是不能用 CPU Core 数代替 SME Core 数的原因。

---

## Apple：芯片表只是当前的经验结果

Apple 可以通过下面的接口判断 SME2 是否存在：

```cpp
sysctlbyname("hw.optional.arm.FEAT_SME2", ...);
```

但 macOS / iOS 不向应用暴露 `SMIDR_EL1`，无法读取 `SH` 和 Affinity。MNN 目前只能再读取：

```cpp
sysctlbyname("machdep.cpu.brand_string", ...);
```

然后查询一张经过测试或资料确认的芯片表：

| 芯片 | MNN 当前使用的 SME Core 数 |
|---|:---:|
| Apple M4 | 1 |
| Apple M4 Pro / Max | 2 |
| Apple M5 | 1 |
| Apple M5 Pro / Max | 2 |
| Apple A18 / A18 Pro | 2 |
| Apple A19 / A19 Pro | 2 |

> **注意：Apple，特别是 iOS 芯片的结果并未完整覆盖测试，仅供参考。** 目前我们实际测试过 M4、M4 Pro、M5、M5 Pro 和 A18 Pro（iPhone 16 Pro Max）；表中的其他型号来自现有资料和同系列信息，后续仍需要更多真机验证。

代码使用 `strcmp` 精确匹配芯片名，不按 `Apple M`、`Pro` 或 `Max` 做模糊推断。遇到未来的新芯片或未验证型号时统一回退到 1，避免高估并行能力。

### 为什么 M4 记为 1

我们在 M4 Mac mini 上运行 FP32 `FMOPA` 吞吐测试时得到：

```text
1 thread   ≈ 1.98 TFLOPS
2 threads  ≈ 1.98 TFLOPS
4 threads  ≈ 1.98 TFLOPS
5 threads  ≈ 2.33 TFLOPS
```

1 到 4 个线程的总吞吐几乎不变，说明性能核共享一个高性能 SMCU；第 5 个线程开始使用能效核集群后，总吞吐只增加约 0.35 TFLOPS，说明能效核一侧还有一个明显更小的共享单元。

从物理结构看，基础款 M4 可以认为有两个不同规模的 SME 单元；但 MNN 的 `smeCoreNumber` 用于限制等价并行 worker 数，不能简单把高性能单元和低吞吐单元都按 1 计算。因此当前将 M4 记为 1 个高性能 SME Core。

在 iPhone 16 Pro Max 上，早期通过单线程与双线程 SME 吞吐对比观察到了接近两个单元的并行能力，因此 A18 Pro 当前记为 2。不过由于 iOS 缺少寄存器级验证接口，这仍属于性能测试推断，而不是像 Linux 那样从硬件拓扑直接读取。

---

## 实现中的几个取舍

第一，**先检测能力，再检测数量**。`getSME2CoreNumber()` 只在调用方已经确认 SME2 存在后执行，因此内部不重复调用 HWCAP 或 sysctl。

第二，**未知情况保守返回 1**。0 应该表示不支持 SME2，而不是“支持但数量未知”；返回 CPU Core 数又很容易过度订阅共享 SMCU。

第三，**这里检测的是有效并行度，不一定是 floorplan 上的物理模块数**。Linux 可以读取标准的 SMCU 共享关系；Apple 只能结合芯片型号和吞吐测试，估算适合 MNN 调度的 worker 上限。

MNN 最终会使用该值约束 SME 并行线程：

```cpp
smeThreadCount = std::min(threadCount, smeCoreNumber);
```

这个小改动背后的关键点是：**CPU 特性是一个布尔值，实际算力却是一个拓扑问题。** 每个 CPU Core 都能执行 SME2，并不代表每个 Core 背后都有一份独立的 SME 硬件。Linux / Android 现在已经可以通过 `SMIDR_EL1` 得到较准确的答案；Apple 平台仍需要依赖芯片表和持续的真机测试。

---

## 参考资料

- [MNN PR #4766：增加 SME2 Core 数量检测](https://github.com/alibaba/MNN/pull/4766)
- [Arm：SME2 – AI Acceleration with Armv9 CPUs](https://www.arm.com/technologies/sme2)
- [Arm Architecture Reference Manual Supplement：The Scalable Matrix Extension](https://documentation-service.arm.com/static/65fdd330aec7154a17edea61)
- [Linux Kernel：Scalable Matrix Extension support for AArch64 Linux](https://www.kernel.org/doc/html/latest/arch/arm64/sme.html)
- [Apple XNU：ARM Scalable Matrix Extension](https://github.com/apple-oss-distributions/xnu/blob/main/doc/arm/sme.md)
- [Hello SME! Generating Fast Matrix Multiplication Kernels Using the Scalable Matrix Extension](https://arxiv.org/abs/2409.18779)
