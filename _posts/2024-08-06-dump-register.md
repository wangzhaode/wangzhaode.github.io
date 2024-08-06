---
layout: post
title:  "gdb/lldb打印SIMD寄存器的值"
date:   2024-08-06
last_modified_at: 2024-08-06
categories: [linux]
---

在gdb或者lldb调试时打印SIMD寄存器的值的方法

## gdb
```shell
p $v8.b
p $v8.h
p $v8.s
```

## lldb
```shell
p (char __attribute__((ext_vector_type(16)))) $v8
p (short __attribute__((ext_vector_type(8)))) $v8
p (float __attribute__((ext_vector_type(4)))) $v8
```