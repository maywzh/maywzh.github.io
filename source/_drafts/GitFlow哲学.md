---
title: 体验GitFlow
categories: uncategorized
comments: false
date: 2018-10-16 17:11:06
tags:
---

Gitflow是一种使用git来进行版本管理的的开发团队的理想协作模式，目前我和组里的同事正在由svn转向git，在此记录一些gitflow中的

<!--more-->





### GitFlow工作流简介

![img](https://ws4.sinaimg.cn/large/006tNbRwgy1fwa6jrg2l9j30vy16cjui.jpg)

GitFlow是基于Git分布式版本管理系统的多人合作工作流。它描述了这样的一个工作模式，项目有一个主干的分支，所有的开发人员都有若干个分支，这些分支可以随时合并到主干分支。

### GitFlow的运作基础：Git

作为git

#### `Git init / Git flow init` 初始化Git

在创建一个工程的时候，最先我们要做的就是在工程目录里面初始化Git。在这里我们可以使用`git init` 命令来初始化
终端键入这个命令以后，在工作目录下面就会生成一个`.git/` 隐藏的文件夹，这个文件夹就是Git的工作目录，所有以后的文件变动所产生的文件快照都会保留在这个文件目录下面。

```
⋊> ~/D/gittest git init                                                                                                       19:58:36
Initialized empty Git repository in /Users/mike/Desktop/gittest/.git/                                                                                                19:58:42
⋊> ~/D/gittest on master  ls -al                                                                                              19:59:11
total 0
drwxr-xr-x   3 mike  staff  102  1 28 19:58 .
drwxr-xr-x+  9 mike  staff  306  1 28 19:59 ..
drwxr-xr-x  10 mike  staff  340  1 28 19:59 .git
```

而你想直接让计算机帮助你创建一个完整的GitFlow工作流，那么你可能得现在终端里面安装`git flow`。安装好了以后，就可以直接使用`git flow init` 来创建一个带有六个基础分支的完整项目了，关于Gitflow 里面的两个长期分支和四个短期分支，我们待会儿再介绍。

```
⋊> ~/D/gittest brew install git-flow                                                                                          19:59:23
Updating Homebrew...
^CWarning: git-flow-0.4.1 already installed
⋊> ~/D/gittest git flow init                                                                                                  19:59:58
Initialized empty Git repository in /Users/mike/Desktop/gittest/.git/
No branches exist yet. Base branches must be created now.
Branch name for production releases: [master]
Branch name for "next release" development: [develop]

How to name your supporting branch prefixes?
Feature branches? [feature/]
Release branches? [release/]
Hotfix branches? [hotfix/]
Support branches? [support/]
Version tag prefix? []
⋊> ~/D/gittest on develop
```

#### `Git add & Git commit` 添加版本控制和提交更改

在初始化完成以后，我们可以为代码工程添加相应的文件进入版本控制。使用`git add` 加上要添加的文件名称就可以了。一般对于大型工程，我们没法逐个添加，就可以通过文件`.gitignore` 来筛选不需要添加进入版本控制的文件内容，之后直接`git add` 相应的工程目录即可。
我们可以先通过`git status` 来查看当前工作目录下文件的追踪情况，如果要查看具体的修改，则可以使用`git diff` 命令：

```
⋊> /V/M/F/i/MySpace on feature/NavigationController ⨯ git status                                                              20:17:18
On branch feature/NavigationController
Your branch is up-to-date with 'origin/feature/NavigationController'.
Untracked files:
  (use "git add <file>..." to include in what will be committed)

	text.txt

nothing added to commit but untracked files present (use "git add" to track)
```



添加完成以后就将修改提交到本地的Git仓库：

```
⋊> /V/M/F/i/MySpace on feature/NavigationController ⨯ git add text.txt                                                        20:24:45
⋊> /V/M/F/i/MySpace on feature/NavigationController ⨯ git commit -m "add file : text.txt"                                     20:24:59
[feature/NavigationController b27e389] add file : text.txt
 1 file changed, 1 insertion(+)
 create mode 100644 text.txt
⋊> /V/M/F/i/MySpace on feature/NavigationController ↑
```

这样就完成了最简单的修改和提交操作。