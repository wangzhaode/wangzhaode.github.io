
## 工作组

opencl 使用工作组来组织工作项。工作组使用N维的网格作为索引，被称为`NDRange`；目前这个N维的索引维度可以是1、2或者3。

索引分为全局索引 (globale index) 个 局部索引 (loacl index)；具体用如下：

-   全局索引空间为`(Gx, Gy)`
-   工作组空间为`(Wx, Wy)`
-   局部索引空间为`(Lx, Ly)`
-   全局坐标`(gx, gy)`
-   工作组索引`(wx, wy)`
-   局部坐标`(lx, ly)`

则有

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/opencl/cLx=GxWxLy=GyWyidididgx=wxLxlxgy-0d17f54e197a88ec.jpg)

在opencl的kernel内部获取这些信息：

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/opencl/cintg0=get_global_id0intl1=get_l-be23402882594c6d.jpg)



Reference:

