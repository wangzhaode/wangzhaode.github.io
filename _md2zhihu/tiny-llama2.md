# 数据集选择

这里以广告文案生成数据为例，数据集链接：[AdvertiseGen](https://www.modelscope.cn/datasets/lvjianjin/AdvertiseGen/summary)

下载数据集

# 针对数据集训练词表

使用`SentencePiece`做`Tokenizer`，llama2原来的`Tokenizer`对中文支持不好，不能直接使用。这里需要针对数据集训练出自己的词表。

## 下载编译SentencePiece

```shell
git clone https://github.com/google/sentencepiece.git 
cd sentencepiece
mkdir build
cd build
cmake ..
make -j 8
cd src
ls
```

## 整理训练数据

将数据集的`csv`数据文件按行整理

```
python advertise.py build_train
```

## 训练分词模型

```
./spm_train --input=../../../llama2.c/advertise_train.txt --model_prefix=./advertise --vocab_size=32000 --character_coverage=0.9995 --model_type=bpe --unk_id 0 --bos_id 1 --eos_id 2 --pad_id 3
```

# 模型训练

## pre-train

## stf

## reward

训练数据中包含：question, response_chosen, response_rejected

-   将 question + response_chosen 拼接为 chonsen_input
-   将 question + response_rejected 拼接为 rejected_input

将两个输入分别放进模型推理，得到的输出作差，然后取-sigmoid作为loss



Reference:

