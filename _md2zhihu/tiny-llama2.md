# 数据集选择

这里以广告文案生成数据为例，数据集链接：[AdvertiseGen](https://www.modelscope.cn/datasets/lvjianjin/AdvertiseGen/summary)

下载数据集

# 针对数据集训练词表

使用`SentencePiece`做`Tokenizer`，llama2原来的`Tokenizer`对中文支持不好，不能直接使用。这里需要针对数据集训练出自己的词表。

## 下载编译SentencePiece

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/tiny-llama2/shellgitclonehttpsgithubcomgoogl-4262ecf2c41e8660.jpg)

## 整理训练数据

将数据集的`csv`数据文件按行整理

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/tiny-llama2/pythonadvertisepybuild_train-9be12f199bb9dfa4.jpg)

## 训练分词模型

![](https://gitee.com/wangzhaode/asset/raw/main-md2zhihu-asset@main-md2zhihu-asset/tiny-llama2/spm_train--input=llama2cadvertis-a95521f66f952f9a.jpg)

# 模型训练

## pre-train

## stf

## reward

训练数据中包含：question, response_chosen, response_rejected

-   将 question + response_chosen 拼接为 chonsen_input
-   将 question + response_rejected 拼接为 rejected_input

将两个输入分别放进模型推理，得到的输出作差，然后取-sigmoid作为loss



Reference:

