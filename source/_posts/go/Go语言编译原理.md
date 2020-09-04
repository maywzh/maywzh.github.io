---
title: Go语言编译原理
categories: 编程
comments: false
thumbnail: https://i.loli.net/2020/09/04/vY4eq6OIRotf19l.jpg
cover: https://i.loli.net/2020/09/04/vY4eq6OIRotf19l.jpg
date: 2020-01-04 09:14:27
tags:
  - Go
---
Go语言需要编译才能够运行，为了理解Go的执行过程，我们需要探讨一下Go的编译过程。

<!--more-->
Go 语言编译器的源代码在 src/cmd/compile 目录中，目录下的文件共同组成了 Go 语言的编译器。编译器有前端和后端，编译器的前端一般承担着词法分析、语法分析、类型检查和中间代码生成几部分工作，而编译器后端主要负责目标代码的生成和优化，也就是将中间代码翻译成目标机器能够运行的二进制机器码。

