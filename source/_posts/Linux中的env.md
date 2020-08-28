---
title: Linux中的env是什么
categories: DevOps
comments: false
date: 2015-10-22 13:26:39
tags:
  - Linux命令
thumbnail: https://i.loli.net/2020/08/23/83MVATdal4hJLNU.png
---
env是环境Environment的缩写，正如它的名字一样，它用于**显示系统中已存在的环境变量**，以及**在定义的环境中执行指令**，一般位于`/usr/bin/env`。

<!--more-->

## env作为脚本解释器指定程序

用env启动是因为脚本解释器在linux可能被安装于不同目录，所以要在PATH环境变量中找

```bash
$ /usr/bin/env
...
SHELL=/bin/zsh
...
PATH=/Users/maywzh/.pyenv/shims:/Users/maywzh/.pyenv/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/Applications/Wireshark.app/Contents/MacOS

```

### 以python为例

在这里我们使用了pyenv来管理多版本python，它的具体可见https://github.com/pyenv/pyenv

它可以选用特定环境使用的python版本，把`~/.pyenv/shims`作为一个垫片路径，里面是选定的python版本的解释器。

```bash
$ ls /Users/maywzh/.pyenv/shims
2to3              easy_install      idle              idle3.7           pip3              pydoc             pydoc3.7          python-config     python3-config    python3.7-config  python3.7m-config pyvenv-3.7
2to3-3.7          easy_install-3.7  idle3             pip               pip3.7            pydoc3            python            python3           python3.7         python3.7m        pyvenv
```

在这里选用了python3.7，可以直接用下面命令来确定使用的版本

```bash
$ env python
Python 3.7.1 (default, Oct 22 2018, 04:20:43)
[Clang 10.0.0 (clang-1000.10.44.2)] on darwin
Type "help", "copyright", "credits" or "license" for more information.
>>>
```

用这种方式使用python就相当灵活，只需要配置PATH变量即可，不会出现因为写死解释器路径而找不到解释器的情况。

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

'''
hello.py
'''

print("hello")
```

要运行该程序

```bash
$ chmod +x hello.py #为该脚本程序添加执行权限
$ ./hello.py #因为指定了#!/usr/bin/env python ， 调用python解释器来运行该脚本程序
hello
```

