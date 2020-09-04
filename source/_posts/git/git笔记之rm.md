---
title: git笔记之rm
author: maywzh
categories: 工具
tags:
  - git
date: 2015-08-15 00:44:00
thumbnail: https://i.loli.net/2020/08/23/OY9GyMIB1S5uk7f.png
cover: https://i.loli.net/2020/08/23/OY9GyMIB1S5uk7f.png
---
## 一个.gitignore的常见问题

> 明明我在.gitignore上写了这个规则啊，为毛它还是被git版本控制了

今天就遇到了这个蛋疼的问题，.vscode文件夹中的调试配置也被提交到版本库了，但它并不需要版本控制。我尝试在.gitignore里写上.vscode这个规则，但依旧不起作用。

<!--more-->



Google之，原来这是因为，该文件已经存在于远程目录。难道泼出去的水还能收回来吗。

⚈้̤͡ ˌ̫̮ ⚈้̤͡" 是可以的！git为我们提供了这样的工具--`git rm`



## git rm

```bash
git rm --help
```



它的作用时把相应文件从当前的版本移除出工作树。

好的我们想要吧.vscode中的所有文件都移除出去，所以应当

```bash
git rm -r .vscode
```

输入，回车，肿么文件都没了！！！我们只是想要移除版本控制而已，并不想移除文件啊。回复

仔细看看，原来有个--cached选项，这个选项移除版本控制，但是不把文件移除出工作区。

所以输入

```bash
git rm -r --cached .vscode
```



## 检查要被移除的文件

等等，我不放心！我要看看移除的是哪些文件！打开文件夹看看...

STOP！ git早为你们这些强迫症准备好了这个神器`-n` 选项，它不对文件移除，只是显示出这条命令会移除的文件

```bash
git rm -r -n --cached  .vscode
```



ok，这就是要移除的文件，删除`-n`命令，再执行一次吧

```bash
git rm -r --cached .vscode
git status
```

很好，要移除的文件都变成了untracked，然后commit，push到远程服务器。搞定！