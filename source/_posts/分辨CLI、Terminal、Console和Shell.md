---
title: 分辨CLI、Terminal、Console和Shell
date: 2016-09-25 19:41:53
tags:
  - 计算机史
  - 操作系统
categories: 计算机科学
---

CLI 命令行界面、Terminal 终端 、Console 控制台和 Shell，是几个比较容易混淆的概念。

虽然经常在工作中遇到这些概念，但常常处于半知半解的状态，下文通过聊聊计算机发展史的方式初步探讨一下这些术语。

## 一句话概括

- **命令行界面** (CLI) = 使用文本命令进行交互的用户界面
- **终端** (Terminal) = **TTY** = 文本输入/输出环境
- **控制台** (Console) = 一种特殊的终端
- **Shell** = 命令行解释器，执行用户输入的命令并返回结果

  <!--more-->

## 命令行界面(CLI)

> 命令行界面（英语：Command-line Interface，缩写：CLI）是在图形用户界面得到普及之前使用最为广泛的用户界面，它通常不支持鼠标，用户通过键盘输入指令，计算机接收到指令后，予以执行。

命令行界面相对于我们日常使用的图形用户界面(GUI)而言，是一种操作效率极高的操作系统管理和控制方式。

![img](https://ws1.sinaimg.cn/large/006tNbRwgy1fvlv5nqqouj30sg0lc13p.jpg)

▲ _命令行界面_

![Screen Shot 2018-09-25 at 6.22.25 PM](https://ws3.sinaimg.cn/large/006tNbRwgy1fvlyss3e4ij31kw0w0hdt.jpg)

▲*图形界面*

尽管图形界面人机交互更加友好和现代化，但相对于直观的命令行界面来说，其操作效率远远不如，所以现代所有的操作系统都提供了命令行的操作方式。例如 macOS 的 Terminal，Windows 的 Powershell。

## 终端(Terminal)

终端是一种用于与计算机进行交互的输入输出设备，其特征就是，我们在上面输入命令，命令传递给计算机，计算机把处理结果反馈到终端的显示界面上。终端本身不参与计算和处理任务。

### 起源

在大型机和小型机时代，计算机体型相当巨大，往往是安放在单独的计算机室，操作用户则利用另外的终端设备与之交互。而现在常见的键盘和显示器在当时相当昂贵。

Unix 的创始人 Ken Thompson 和 Dennis Ritchie 想让 Unix 成为一个多用户系统。多用户系统就意味着要给每个用户配置一个终端，每个用户都要有一个显示器、一个键盘。但当时所有的计算机设备都非常昂贵（包括显示器），而且键盘和主机是集成在一起的，根本没有独立的键盘。

当时有一种电传打字机，其原本用途是在电报线路上首发电报，它有可以作为输入设备的键盘，也有作为输出设备的纸袋打印机，价格也比较低廉。于是完美满足了这一需求。

![âteletypeâçå¾çæç´¢ç"æ](https://ws2.sinaimg.cn/large/006tNbRwgy1fvlz3a5vymj30sg0lcjyz.jpg)

▲*电传打字机*

于是他们机智地把电传打字机连接到计算机上，每个用户都可以在终端登录并操作主机。看起来是不是十分 geek？

###控制台

控制台是一种特殊的终端，普通的终端都是以外设的形式连接到计算机，而控制台是计算机自带的的控制面板。

![image-20180925185459612](https://ws1.sinaimg.cn/large/006tNbRwgy1fvlzgz7sv2j30m80godxj.jpg)

▲*左边是控制台 右边是终端*

控制台一般是系统管理员操作，有更高的控制权限。

但随着个人计算机的普及，控制台和终端的概念已经逐渐模糊，我们往往具有对计算机的全部控制权限。目前的输入（键盘等）输出设备（显示器等）既可以充当控制台可以作为终端使用。因此，现在 Console 与 Terminal 基本被看作是同义词。

### 终端模拟器

如今，图形操作界面已经成为了主流。有许多优秀的命令行程序不兼容如今的图形化操作界面，为了在图形界面下与之交互，人们发明了终端模拟器来模拟终端。

对于命令行程序，终端模拟器与传统的终端实体机无异，而对于我们的图形操作界面，它又相当于一个 GUI 程序。

其工作流如下

![终端工作流](https://ws1.sinaimg.cn/large/006tNbRwgy1fvm00u5y4wj306409c74i.jpg)

实际上起到一个命令行程序和 GUI 的中介作用。

终端模拟器有很多

- GNU/Linux：gnome-terminal、Konsole；
- macOS：Terminal、iTerm2；
- Windows：cmd.exe、ConEmu 等。

![Screen Shot 2018-09-25 at 7.16.13 PM](/Users/maywzh/Desktop/Screen Shot 2018-09-25 at 7.16.13 PM.png)

▲*macOS 下的 Terminal 就是一种终端模拟器*

### tty

有的时候我们会发现系统进程中有一些名字叫 tty\*的进程，对应于我们的终端程序。

![Screen Shot 2018-09-25 at 7.19.56 PM](https://ws1.sinaimg.cn/large/006tNbRwgy1fvm07xns4tj31am0b877j.jpg)

这些 tty 是什么呢，实际上，tty 就是电传打字机 (Teletype / Teletypewriter) 的英文缩写，它表示终端的统称。

在类 UNIX 系统中，硬件设备都被抽象为文件，而当时的作为终端机的电传打字机就对应于操作系统的/dev/tty\*的设备文件。随着计算机的发展，终端设备已经有很多种，但是 tty 这个名字还是保留了下来。

> 实际上 UNIX 系统有许多我们当今看起来十分奇怪的设计，都是早期计算机发展相对不完善的历史遗留问题。例如/bin 和/usr/bin 这两个目录。有兴趣的同学可以去查一查。

## Shell

处于稳定性和安全方面的考虑，我们往往不建议用户直接对操作系统进行操作，而是通过应用程序调用操作系统的 API 进行操作。但生产生活中还是需要直接操作操作系统的，这个时候就需要一个专门的程序，接受用户输入的命令，然后帮我们与内核沟通，最后让内核完成我们的任务。它就是 Shell。它与操作系统的构架如下图。

![image-20180925193156475](https://ws4.sinaimg.cn/large/006tNbRwgy1fvm0je6xrlj30gb0bjjsb.jpg)

Shell 分为命令行 Shell 和图形 Shell，前者提供一个命令行界面(CLI)，后者则提供一个图形界面(GUI)。

像 macOS 的 Finder 实际上就可以理解为一个图形 Shell。而 Terminal 就是一个命令行 Shell。

常见或历史上知名的命令行 Shell 有：

- 适用于 Unix 及类 Unix 系统：
  - **sh** (Bourne shell)，最经典的 Unix shell；
  - **bash** (Bourne-Again shell)，目前绝大多数 Linux 发行版的默认 shell；
  - **zsh** (Z shell)，我个人最喜欢的 shell；
  - **fish** (Friendly interactive shell)，专注于易用性与友好用户体验的 shell；
- Windows 下的 **cmd.exe** (命令提示符) 与 **PowerShell**。

### Shell 与终端

从前文我们得知，终端的作用在于接受用户输入指令并显示输出结果。而 Shell 提供了与操作系统内核的交互接口。可以把终端理解为 Shell 的前端，

- 终端把用户输入传递给 Shell，把 Shell 返回的结果显示给用户。

- Shell 从终端那里拿到用户输入的命令，解析后交给操作系统内核去执行，并把执行结果返回给终端。
