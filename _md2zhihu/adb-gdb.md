
1.  push gdbserver 到 device

```shell
adb push ~/android-ndk-r21b/prebuilt/android-arm64/gdbserver/gdbserver /data/local/tmp
```

1.  device 测启动 gdbserver

```shell
gdbserver :5039 ./test
```

1.  本地启动gdb调试

```shell
adb forward tcp:5039 tcp:5039
~/android-ndk-r21b/prebuilt/darwin-x86_64/bin/gdb

(gdb) target remote :5039
(gdb) continue
```



Reference:

