---
layout: post
title:  arm neon汇编指令
date:   2023-11-01
last_modified_at: 2023-11-01
categories: []
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
- 奇偶交替排列: `zip1, zip2`
```c
// zip1 v0.16b, v2.16b, v3.16b
for (int i = 0; i < 8; i++) {
    v0[i * 2 + 0] = v2[i];
    v0[i * 2 + 1] = v3[i];
}
// zip2 v1.16b, v2.16b, v3.16b
for (int i = 0; i < 8; i++) {
    v1[i * 2 + 0] = v2[8 + i];
    v1[i * 2 + 1] = v3[8 + i];
}
```
- 奇偶顺序排列: `uzp1, uzp2`
```c
// uzp1 v0.16b, v2.16b, v3.16b
for (int i = 0; i < 8; i++) {
    v0[i] = v2[i];
    v0[8 + i] = v3[i];
}
// uzp2 v1.16b, v2.16b, v3.16b
for (int i = 0; i < 8; i++) {
    v1[i] = v2[8 + i];
    v1[8 + i] = v3[8 + i];
}
```

