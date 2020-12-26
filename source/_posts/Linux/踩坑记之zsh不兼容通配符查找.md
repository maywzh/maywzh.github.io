---
title: 踩坑记之zsh不兼容通配符查找
categories: 坑
comments: true
date: 2017-09-01 17:17:04
tags:
  - zsh
  - Terminal
thumbnail: https://i.loli.net/2020/12/26/e6FHQ19v2LhdRzj.png
cover: https://i.loli.net/2020/12/26/e6FHQ19v2LhdRzj.png
---

这是在进行certbot通配符ssl证书申请时候发生的坑。

```bash
certbot certonly --nginx --preferred-challenges dns --manual  -d *.maywzh.com --server https://acme-v02.api.letsencrypt.org/directory
zsh: no matches found: *.maywzh.com

```



后来发现，在 zsh 下使用 find 命令查找指定目录下所有头文件时也出现问题：

```css
find . -name *.h

no matches found: *.h
```

后来查看了一些资料才知道，这是由于zsh导致的。

<!--more-->





具体原因：

因为zsh缺省情况下始终自己解释这个 *.h，而不会传递给 find 来解释。

解决办法：

在~/.zshrc中加入:

```bash
setopt no_nomatch
```

然后运行

```bash
source ~/.zshrc
```

然后恢复正常