
# 一些概念

### 1.GPT分区格式

引导方式：

-   `BIOS(legency)`: 需要硬盘为MBR分区表
-   `UEFI`: 需要硬盘为GPT分区表

新的系统一般使用`UEFI`引导，所以首先需要将磁盘转换为GPT分区格式。

### 2.UEFI引导分区

需要在磁盘中创建一个100+M的`UEFI`引导分区。`UEFI`引导不支持`NTFS`格式，所以要将该分区格式化为`FAT32`格式。

### 3.系统分区

系统分区使用`NTFS`格式即可。

# 具体操作

### 1.将系统镜像iso文件挂载，将
`\sources\install.wim`
文件拷贝到
`D:`
盘中;

### 2.将待安装磁盘格式化为
`GPT`
分区并创建引导分区域系统分区;

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/windows-system/shdiskpartlistdiskselectdisk2cle-329bfebc5d543121.jpg)

### 3.安装镜像系统到磁盘并创建引导

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/windows-system/shdismget-imageinfoimagefiledins-5c8fcf943e587787.jpg)

### 4.从该磁盘启动系统即可

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/windows-system/shOOBEShiftF10CMDoobebypassnro-ea269ee5bbf55af6.jpg)



Reference:

