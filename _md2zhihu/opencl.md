
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

```c
// 工作组大小
Lx = Gx / Wx
Ly = Gy / Wy

// 工作组id与局部id转换为全局id
gx = wx * Lx + lx
gy = wy * Ly + ly

// 全局id转换为工作组id与局部id
wx = gx / Lx
wy = gy / Ly
lx = gx % Lx
ly = gy % Ly
```

在opencl的kernel内部获取这些信息：

```c
int g0 = get_global_id(0);
int l1 = get_local_id(1);
int L0 = get_local_size(0);
int w1 = get_group_id(1);
```



Reference:

