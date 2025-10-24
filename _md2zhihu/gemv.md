
在llm推理中除了首token外，热点计算都是gemv, 相比gemm，gemv是访存密集型算子。

以下是一些simd的伪代码，pack的值根据芯片支持的SIMD指令选择，比如SSE/NEON选择4，计算部分则可以使用`fmla`指令实现。

### 行主序

```cpp
// weight: h/pack, l, pack
// input: l
// output: h
for (int i = 0; i < h/pack; i++) {
    auto sum_pack {0};
    for (int j = 0; j < l; j++) {
        auto x_pack = dup_pack(input[j]);
        auto w_pack = load_pack(weight + i * l);
        sum_pack += x_pack * w_pack;
    }
    store_pack(sum_pack, output + i * pack);
}
```

### 列主序

```cpp
// weight: l, h
// input: l
// output: h
for (int i = 0; i < l; i++) {
    float val = input[i];
    if (val < 1e-4) continue; // 跳过较小值
    auto x_pack = dup_pack(val);
    for (int j = 0; j < h/pack; j++) {
        auto sum_pack = load_pack(output + j * pack);
        auto w_pack = load_pack(weight + j * pack);
        sum_pack += x_pack * w_pack;
        store_pack(sum_pack, output + j * pack);
    }
}
```

## 混合精度

weight使用对称/非对称量化类型：4bit/8bit，这种实现能够显著降低weight的访存量

```cpp
// weight: h/pack, l, pack
// input: l
// output: h
for (int i = 0; i < h/pack; i++) {
    auto sum_pack {0};
    auto a_pack = load_pack(alpha + j * pack);
    auto b_pack = load_pack(bias + j * pack);
    for (int j = 0; j < l; j++) {
        auto x_pack = dup_pack(input[j]);
        auto wq_pack = load_pack(weight + i * l);
        auto w_pack = to_float(wq_pack) * a_pack + bpack;
        sum_pack += x_pack * w_pack;
    }
    store_pack(sum_pack, output + i * pack);
}
```



Reference:

