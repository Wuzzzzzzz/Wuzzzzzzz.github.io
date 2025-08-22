---
title: python 用 pyinstaller打包exe文件
author: William
published: 2025-05-17
draft: false
description: ""
image: ""
category: 笔记
tags:
  - python
  - 打包
---
1、找到venvtest文件夹

2、进入Script文件夹

3、打开cmd

4、调用*activate.bat*

5、输入*cd ..*返回venvtest文件夹

6、如果有新安装的库，则先输入，如pyinstaller

```
pip install -i https://mirrors.aliyun.com/pypi/simple pyinstaller
```

7、输入打包代码

```
pyinstaller --onefile --noconsole --add-data "runs/detect/train8/weights/best.pt;runs/detect/train8/weights" main.py 
```
