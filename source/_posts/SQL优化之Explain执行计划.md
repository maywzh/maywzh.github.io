---
title: SQL优化之Explain执行计划
categories: 数据库
comments: false
thumbnail: https://i.loli.net/2020/09/08/f6a3KFkoy5Ul1Js.png
cover: https://i.loli.net/2020/09/08/f6a3KFkoy5Ul1Js.png
date: 2016-12-08 11:01:24
tags:
  - MySQL
---

MySQL 提供了一个 EXPLAIN 命令, 它可以对 `SELECT` 语句进行分析, 并输出 `SELECT` 执行的详细信息, 以供开发人员针对性优化.
EXPLAIN 命令用法十分简单, 在 SELECT 语句前加上 Explain 就可以了, 例如:

```mysql
EXPLAIN SELECT * from user_info WHERE id < 300;
```

<!--more-->

## Explain有什么用

当`Explain` 与 `SQL`语句一起使用时，`MySQL` 会显示来自优化器关于SQL执行的信息。也就是说，`MySQL`解释了它将如何处理该语句，包括如何连接表以及什么顺序连接表等。

- 表的加载顺序
- `sql` 的查询类型
- 可能用到哪些索引，哪些索引又被实际使用
- 表与表之间的引用关系
- 一个表中有多少行被优化器查询 .....

