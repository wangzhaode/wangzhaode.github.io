---
layout: post
title:  arm neon汇编指令
date:   2023-11-01
last_modified_at: 2023-11-08
categories: [arm]
---

## element-wise计算指令
### binary
```c
// binary
for (int i = 0; i < 8; i++) {
    v0[i] = v1[i] <op> v2[i];
}
```

- `+`: fadd, add
- `-`: fsub, sub
- `*`: fmul, mul
- `/`: fdiv, div (不支持`fdiv v0.8h, v0.8h, v1.h[0]`这种写法)
- `&`: and
- `|`: or
- `fmax`: fmax, max
- `fmin`: fmin, min
- `>>`: ushr, 示例：`ushr v8.16b, v0.16b, #4`

### unary
```c
// unary
for (int i = 0; i < 8; i++) {
    v0[i] = <op>(v1[i]);
}
```

- `abs`: fabs
- `round`: fcvtas
- `cast<float>(int)`: scvtf

## 类型扩增、收窄
### 扩增
- `int`: sxtl, sxtl2
- `float`: fcvtl, fcvtl2
```
// int8 to int16
sxtl v2.8h, v4.8b
sxtl2 v3.8h, v4.16b
// fp16 to fp32
fcvtl v5.4s, v4.4h
fcvtl2 v6.4s, v4.8h
```
## 收窄
- `int`: sqxtn, sqxtn2
- `float`: fcvtn, fcvtn2
```c
// int32 to int16
sqxtn v0.4h, v1.4s
sqxtn2 v0.8h, v1.4s
// fp32 to fp16
fcvtn v2.4h, v3.4s
fcvtn2 v2.8h, v3.4s
```

## 重排
- 将2个寄存器按照类型奇偶交替排列: `zip1, zip2`
```c
// v2: [A7, A6, A5, A4, A3, A2, A1, A0]
// v3: [B7, B6, B5, B4, B3, B2, B1, B0]
// --->
// v0: [B3, A3, B2, A2, B1, A1, B1, A0]
// v1: [B7, A7, B6, A6, B5, A5, B4, A4]
// 取两个寄存器的前半部分交替排列到目标寄存器中
// zip1 v0.8h, v2.8h, v3.8h
for (int i = 0; i < 4; i++) {
    v0[i * 2 + 0] = v2[i];
    v0[i * 2 + 1] = v3[i];
}
// 取两个寄存器的后半部分交替排列到目标寄存器中
// zip2 v1.8h, v2.8h, v3.8h
for (int i = 0; i < 4; i++) {
    v1[i * 2 + 0] = v2[4 + i];
    v1[i * 2 + 1] = v3[4 + i];
}
```
- 反操作，将两个寄存器按照奇偶提取顺序排列到目标寄存器中: `uzp1, uzp2`
```c
// v2: [A7, A6, A5, A4, A3, A2, A1, A0]
// v3: [B7, B6, B5, B4, B3, B2, B1, B0]
// --->
// v0: [B6, B4, B2, B0, A6, A4, A2, A0]
// v1: [B7, B5, B3, B1, A7, A5, A3, A1]
// 将两个寄存器的偶数位提取并顺序写入到目标寄存器中
// uzp1 v0.8h, v2.8h, v3.8h
for (int i = 0; i < 4; i++) {
    v0[0 + i] = v2[i * 2];
    v0[4 + i] = v3[i * 2];
}
// 将两个寄存器的奇数位提取并顺序写入到目标寄存器中
// uzp2 v1.8h, v2.8h, v3.8h
for (int i = 0; i < 4; i++) {
    v1[0 + i] = v2[2 * i + 1];
    v1[4 + i] = v3[2 * i + 1];
}
```
- 转置操作`trn1, trn2`
```c
// v2: [A7, A6, A5, A4, A3, A2, A1, A0]
// v3: [B7, B6, B5, B4, B3, B2, B1, B0]
// --->
// v0: [B6, A6, B4, A4, B2, A2, B0, A0]
// v1: [B7, A7, B5, A5, B3, A3, B1, A1]
// 第一个寄存器的偶数位写入目标寄存器的偶数位，第二个寄存器的偶数位写入目标寄存器的奇数位
// trn1 v0.8h, v2.8h, v3.8h
for (int i = 0; i < 4; i++) {
    v0[i* 2] = v2[i * 2];
    v0[i * 2 + 1] = v3[i * 2];
}
// 第一个寄存器的奇数位写入目标寄存器的偶数位，第二个寄存器的奇数位写入目标寄存器的奇数位
// trn1 v1.8h, v2.8h, v3.8h
for (int i = 0; i < 4; i++) {
    v1[i* 2] = v2[2 * i + 1];
    v1[i * 2 + 1] = v3[2 * i + 1];
}
```