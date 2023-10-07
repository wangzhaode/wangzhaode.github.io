---
layout: post
title:  "Arm Compute Library Example"
date:   2023-07-21
last_modified_at: 2023-07-21
categories: [debug]
---

1. download pre-built binries 

    ```shell
    wget https://ghproxy.com/https://github.com/ARM-software/ComputeLibrary/releases/download/v23.08/arm_compute-v23.08-bin-android-arm64-v8.2-a-neon-cl.tar.gz
    ```
2. compile test example

   ```shell
   ~/android-ndk-r21b/toolchains/llvm/prebuilt/darwin-x86_64/bin/aarch64-linux-android21-clang++ examples/neon_sgemm.cpp utils/Utils.cpp -I. -Iinclude -std=c++14 -larm_compute-static -larm_compute_core-static -L. -o neon_sgemm_aarch64 -static-libstdc++ -pie

   ~/android-ndk-r21b/toolchains/llvm/prebuilt/darwin-x86_64/bin/aarch64-linux-android21-clang++ examples/cl_sgemm.cpp utils/Utils.cpp -I. -Iinclude -std=c++14 -larm_compute-static -larm_compute_core-static -L. -o cl_sgemm_aarch64 -static-libstdc++ -pie -DARM_COMPUTE_CL
   ```

3. test in `adb`
   ```shell
   adb push neon_sgemm_aarch64 /data/local/tmp/MNN
   adb push cl_sgemm_aarch64 /data/local/tmp/MNN

   adb shell
   ./neon_sgemm_aarch64 1 4096 4096
   ```
4. set thread
   ```cpp
   arm_compute::Scheduler::get().set_num_threads(4);
   ```