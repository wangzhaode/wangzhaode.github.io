
arm中常用的乘累加操作。

## mla

#### fmla(32)

-   指令集 `>= armv7`
-   neon指令 `float32x4_t vfmaq_f32(float32x4_t a, float32x4_t b, float32x4_t c)`
-   计算实现

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/arm-mac/cppfloat32_tsrc14float32_tsrc24f-74f927460de840cf.jpg)

#### fmla(16)

-   指令集 `>= armv8a`
-   neon指令 `float16x8_t vfmaq_f16(float16x8_t a, float16x8_t b, float16x8_t c)`
-   计算实现

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/arm-mac/cppfloat16_tsrc18float16_tsrc28f-5530073d51ce8791.jpg)

## dot

#### sdot

-   指令集 `>= armv82`
-   neon指令 `int32x4_t vdotq_s32(int32x4_t r, int8x16_t a, int8x16_t b)`
-   计算实现

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/arm-mac/cppint8_tsrc116int8_tsrc216int32-d8cf8530726dc431.jpg)

#### usdot

-   指令集 `>= armv82`
-   neon指令 `int32x4_t vusdotq_s32(int32x4_t r, uint8x16_t a, int8x16_t b)`
-   计算实现

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/arm-mac/cppuint8_tsrc116int8_tsrc216int3-73db451e1fac29a3.jpg)

## mmla

#### smmla

-   指令集 `>= armv86`
-   neon指令 `int32x4_t vmmlaq_s32(int32x4_t r, int8x16_t a, int8x16_t b)`
-   计算实现

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/arm-mac/cppint8_tsrc116int8_tsrc216int32-9e4e731ba2eaf42a.jpg)

#### usmmla

-   指令集 `>= armv86`
-   neon指令 `int32x4_t vusmmlaq_s32(int32x4_t r, uint8x16_t a, int8x16_t b)`
-   计算实现

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/arm-mac/cppuint8_tsrc116int8_tsrc216int3-c20f77f4a36671c3.jpg)

#### bfmmla

-   指令集 `>= armv86`
-   neon指令 `float32x4_t vbfmmlaq_f32(float32x4_t r, bfloat16x8_t a, bfloat16x8_t b)`
-   计算实现

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/arm-mac/cppbfloat16_tsrc18bfloat16_tsrc2-06e28c95baf55bf4.jpg)



Reference:

