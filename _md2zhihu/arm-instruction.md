
## element-wise计算指令

### binary

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/arm-instruction/cbinaryforinti=0i8iv0i=v1iopv2i-727b733fc8668011.jpg)

-   `+`: fadd, add
-   `-`: fsub, sub
-   `*`: fmul, mul
-   `/`: fdiv, div (不支持`fdiv v0.8h, v0.8h, v1.h[0]`这种写法)
-   `&`: and
-   `|`: or
-   `fmax`: fmax, max
-   `fmin`: fmin, min
-   `>>`: ushr, 示例：`ushr v8.16b, v0.16b, #4`

### unary

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/arm-instruction/cunaryforinti=0i8iv0i=opv1i-27c0835dddb565be.jpg)

-   `abs`: fabs
-   `round`: fcvtas
-   `cast<float>(int)`: scvtf

## 类型扩增、收窄

### 扩增

-   `int`: sxtl, sxtl2
-   `float`: fcvtl, fcvtl2

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/arm-instruction/int8toint16sxtlv28hv48bsxtl2v38h-5793e470d1b942b0.jpg)

## 收窄

-   `int`: sqxtn, sqxtn2
-   `float`: fcvtn, fcvtn2

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/arm-instruction/cint32toint16sqxtnv04hv14ssqxtn2-94f4efb4039db983.jpg)

## 重排

-   将2个寄存器按照类型奇偶交替排列: `zip1, zip2`

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/arm-instruction/cv2A7A6A5A4A3A2A1A0v3B7B6B5B4B3B-f58e8cc0ea58a10b.jpg)

-   反操作，将两个寄存器按照奇偶提取顺序排列到目标寄存器中: `uzp1, uzp2`

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/arm-instruction/cv2A7A6A5A4A3A2A1A0v3B7B6B5B4B3B-302d9f32e0e26527.jpg)

-   转置操作`trn1, trn2`

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/arm-instruction/cv2A7A6A5A4A3A2A1A0v3B7B6B5B4B3B-5e644879734d830d.jpg)



Reference:

