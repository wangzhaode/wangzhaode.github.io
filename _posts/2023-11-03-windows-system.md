---
layout: post
title:  windows安装系统到指定磁盘
date:   2023-11-03
last_modified_at: 2023-11-03
categories: [windows]
---

# 一些概念
### 1.GPT分区格式
引导方式：
- `BIOS(legency)`: 需要硬盘为MBR分区表
- `UEFI`: 需要硬盘为GPT分区表

新的系统一般使用`UEFI`引导，所以首先需要将磁盘转换为GPT分区格式。

### 2.UEFI引导分区
需要在磁盘中创建一个100+M的`UEFI`引导分区。`UEFI`引导不支持`NTFS`格式，所以要将该分区格式化为`FAT32`格式。

### 3.系统分区
系统分区使用`NTFS`格式即可。

# 具体操作

### 1.将系统镜像iso文件挂载，将`\sources\install.wim`文件拷贝到`D:`盘中;
### 2.将待安装磁盘格式化为`GPT`分区并创建引导分区域系统分区;

```sh
# 打开磁盘管理工具
diskpart 

# 显示本地硬盘
list disk

# 选择要安装的磁盘
select disk 2

# 清除硬盘中的分区信息
clean

# 将硬盘转换为GPT分区格式
convert gpt

# 显示硬盘分区情况
list part

# 创建150MB大小引导分区
create part efi size=150

# 格式化引导分区为FAT32格式
format fs=fat32 quick

# 引导分区分配盘符: m
assign letter=m

# 创建大小为230GB的系统分区
create part primary size=230000

# 格式化系统分区为NTFS格式
format fs=ntfs quick

# 为系统分区分配盘符: n
assign letter=n

# 退出
exit
```

### 3.安装镜像系统到磁盘并创建引导

```sh
# 获取安装镜像的系统信息，记住需要安装的系统索引
dism /get-imageinfo /imagefile:d:\install.wim

# 释放系统镜像到系统分区中
dism /apply-image /imagefile:d:\install.wim /applydir:n:\ /index:4

# 创建系统引导
bcdboot n:\windows /s m: /f UEFI
```
### 4.从该磁盘启动系统即可

```sh
# 跳过联网：在OOBE界面Shift+F10打开CMD
oobe\bypassnro
```