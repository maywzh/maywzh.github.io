---
title: 如何理解Linux权限系统
date: 2015-04-09 11:41:59
tags:
  - Linux系统
categories: Linux
thumbnail: https://i.loli.net/2019/08/31/fQJeDlcYZIBFLor.jpg
---

最近一直在处理服务器上的issue，中间遇到最多的的就是`Permission denied`问题，这就是权限问题。今天就来整理一下Linux文件权限系统的知识，从根本上填掉这个坑。

## Linux 文件权限

**Linux中，目录和文件都被视为文件。**Linux中每个文件都有其属性与权限。我们可以使用`ls`命令来查看


<!--more-->

```bash
$ ls -al
```

![image-20181004114428707](https://ws1.sinaimg.cn/large/006tNbRwgy1fvw1lts6cuj30lc046aay.jpg)

可以看到，每个文件的最前面都有一个文件类型和权限描述。后面分别是文件链接数，文件拥有者，文件用户组，文件最后修改日期和名称。`.` 代表当前目录 `..` 代表上一级目录。

![æä"¶å±æ§çç¤ºæå¾](https://ws3.sinaimg.cn/large/006tNbRwgy1fvw1wnexv2g30gc053dfs.gif)

### 第一栏： 文件类型和权限

```bash
 maywzh@M-Ubuntu  /bin  ls -al
total 13412
drwxr-xr-x  2 root root    4096 Sep 24 19:19 .
drwxr-xr-x 24 root root    4096 Oct  4 06:12 ..
-rwxr-xr-x  1 root root 1113504 Apr  5 02:30 bash
-rwxr-xr-x  1 root root  748968 Aug 29 15:57 brltty
-rwxr-xr-x  1 root root   34888 Jan 30  2017 bunzip2
-rwxr-xr-x  1 root root 2022480 Dec 13  2017 busybox
-rwxr-xr-x  1 root root   34888 Jan 30  2017 bzcat
lrwxrwxrwx  1 root root       6 Sep 13 18:35 bzcmp -> bzdiff
-rwxr-xr-x  1 root root    2140 Jan 30  2017 bzdiff
...
```

我们来观察一下第一栏的类型权限描述符，总共有10个字符。

- 第一个字符代表文件的类型: 目录、文件、链接文件、设备等等。
  - 当为[ d ]则是目录，例如[上表](https://wizardforcel.gitbooks.io/vbird-linux-basic-4e/Text/index.html#table2.1.1)文件名为“.config”的那一行；
  - 当为[ - ]则是文件，例如[上表](https://wizardforcel.gitbooks.io/vbird-linux-basic-4e/Text/index.html#table2.1.1)文件名为“initial-setup-ks.cfg”那一行；
  - 若是[ l ]则表示为链接文件（link file）；
  - 若是[ b ]则表示为设备文件里面的可供储存的周边设备（可随机存取设备）；
  - 若是[ c ]则表示为设备文件里面的序列埠设备，例如键盘、鼠标（一次性读取设备）。

- 接下来的字符，三个为一组，分为三组。为`[r/-][w/-][x/-]`的组合。`[ r ]`代表可读（read）、`[ w ]`代表可写（write）、`[ x ]`代表可执行（execute）。 这三个权限的位置不会改变，如果没有权限，就会出现减号`[ - ]`。

  - 第一组为“文件拥有者权限”，例如上面的`bash`的文件拥有者为`root`。
  - 第二组为“本群组账号权限”，例如上面的`bash`的文件群组为`root`。
  - 第三组为“非本人非本群组其他帐号的权限”。

- **也可以用三个数字来代表权限，我们可以把每组的权限组合写成一个二进制数字，1代表有权限，0代表无权限。**

  **例如 `r-x`->`101`，再把这个101二进制数转换为十进制的5，这样我们用三个十进制数即可代表一个文件的权限配置。例如 rw-r-xr--就可以写成`654`。**

  #### 



### 第二栏： 文件名链接数

每个文件的元信息实际上是记录在i-node中的，文件名只是别名而已。目录树却使用文件名来记录。每个文件名都会连接到一个i-node，但每个i-node却可以链接不止一个文件名。

这一栏记录的就是对应的i-node连接到了多少个不同的文件名。

### 第三、四栏： 文件拥有者和群组

### 第五栏：文件容量大小 

默认单位为Byte

### 第六栏：文件创建日期或最新修改日期

### 第七栏：文件名

如果文件名前面多一个`.`则代表该文件为隐藏文件。可用`ls -a`来显示隐藏文件



## 改变文件属性与权限

### 改变文件的权限 - `chmod`命令 

```bash
#u-user g-group o-others a-all +添加 -去除 =设定 
chmod u+x,g+w file #为file的拥有者加上可执行的权限，群组加上可写的权限
chmod u=rwx,g=rw,o=r file #设置file的拥有者可读可写可执行，群组可读可写，其他人可读
chmod u=764 file #设置file的拥有者可读可写可执行(7=rwx),群组可读可栖(6=rw-)，其他人可读(4=r--)
chmod a+x #设置u g o 都可以执行
chmod o-r #去除其他人的读权限
```

### 改变文件的拥有者和群组 - `chown`命令

用法

```bash
chown user1 file # 把file的拥有者设定为user1 
chown -R user1 dir # 把dir目录下所有文件以及次目录文件的拥有者都设置为user1
chown -R user1:group1 file # 把file的拥有者设定为user1 群组设置为group1
```

被改变的用户必须在用户账户配置文件`/etc/passed`中存在

```bash
[maywzh@M-Ubuntu] ~$ cat /etc/passwd
scin:x:4:534:sync:/bin:/bin/sync
games:x:5:34:games:/usr/games:/usr/sbin/nologin
```

`/etc/passwd`的每个用户组一条记录占据一行，记录格式`　　用户名:口令:用户标识号:组标识号:注释性描述:主目录:登录Shell `

- 用户名(login_name)：是代表用户账号的字符串

- 口令(passwd)：这个字段存放是用户口令的加密串。为了安全起见，目前许多Linux系统（如SVR4）都使用了shadow技术，把真正的加密后的用户口令字存放到`/etc/shadow`文件中，而在`/etc/passwd`文件的口令字段中只存放一个特殊的字符，例如“x”或者“*”。

- 用户标识号(UID)：系统内部用它来标识用户。一般情况下它与用户名是一一对应的。如果几个用户名对应的用户标识号是一样的，系统内部将把它们视为同一个用户，但是它们可以有不同的口令、不同的主目录以及不同的登录Shell等。取值范围是0-65535。0是超级用户root的标识号，1-99由系统保留，作为管理账号，普通用户的标识号从100开始。在Linux系统中，这个界限是500。

- 组标识号(GID)：字段记录的是用户所属的用户组。它对应着/etc/group文件中的一条记录。

- 注释性描述(users)：字段记录着用户的一些个人情况。

- 主目录(home_directory)：也就是用户的起始工作目录，它是用户在登录到系统之后所处的目录。在大多数系统中，各用户的主目录都被组织在同一个特定的目录下，而用户主目录的名称就是该用户的登录名。各用户对自己的主目录有读、写、执行（搜索）权限，其他用户对此目录的访问权限则根据具体情况设置。

- 登录Shell(Shell)：用户登录后，要启动一个Shell进程，负责将用户的操作传给内核，常见有sh,bash,zsh等。不指定Shell，那么系统使用/bin/sh。用户的登录Shell可以指定为某个特定的程序。利用这一特点，我们可以限制用户只能运行指定的应用程序，在该应用程序运行结束后，用户就自动退出了系统。有些Linux系统要求只有那些在系统中登记了的程序才能出现在这个字段中。例如可以为git只配置git程序的权限。



### 改变文件所属群组 - chgrp命令

用法

```bash
chgrp group1 file # 把file的群组设定为group1
chgrp -R group1 dir # 把dir目录下所有文件以及次目录文件的群组都设置为group1
```



被改变的群组必须在群组配置文件`/etc/group`中存在

```bash
[maywzh@M-Ubuntu] ~$ cat /etc/group
tester:x:500:linuxsir
charger:x:134:syslog,maywzh
...
```

`/etc/group`的每个用户组一条记录占据一行，记录格式`group_name:passwd:GID:user_list `

第一字段：用户组名称； 
第二字段：用户组密码； x表示未设密码
第三字段：GID 该用户组下的用户包括用户列表中的用户GID为该GID的用户,通过`/etc/passwd`查看
第四字段：用户列表，每个用户之间用,号分割；本字段可以为空；如果字段为空表示用户组为GID的用户名； 

对应的命令

```bash
gpasswd –a username groupname #把某用户加入到某个组中
gpasswd –d username groupname #把组中的某个用户删除
smbpasswd –a username          #在SMB中加入用户
smbpasswd –x username          #在 SMB中删除用户
```



## 详解权限

### 读 - r

文件：读取文件的实际内容。

目录：可以查询该目录下的文件名数据，使用`ls`命令把该目录内容列表显示出来。

### 写 - w



文件: 可以编辑、新增或者是修改该文件的内容但不含删除该文件。`w`主要都是针对“文件的内容”而言，与文件文件名的存在与否没有关系，因为文件记录的是实际的数据。

目录：表示可以修改目录结构清单的权限，即

- 创建新的文件与目录；
- 删除已经存在的文件与目录（不论该文件的权限为何）
- 将已存在的文件或目录进行更名；
- 搬移该目录内的文件、目录位置。

### 执行 - x

文件：Linux中文件是否能被执行就是由`x`这个字段来指定。

目录：代表使用者是否能进入该目录作为工作目录，即`cd`到这个目录的权限。



例：假设现在在系统使用 may 这个帐号，那么这个帐号针对 /dir1, /dir1/file1, /dir2 这三个文件名来说，分别需要“哪些最小的权限”才能达成各项任务？

| 操作动作              | /dir1 | /dir1/file1 | /dir2 | 重点                                     |
| --------------------- | ----- | ----------- | ----- | ---------------------------------------- |
| 读取 file1 内容       | x     | r           | -     | 要能够进入 /dir1 才能读到里面的文件数据  |
| 修改 file1 内容       | x     | rw          | -     | 能够进入 /dir1 且修改 file1 才行         |
| 执行 file1 内容       | x     | rx          | -     | 能够进入 /dir1 且 file1 能运行才行       |
| 删除 file1 文件       | wx    | -           | -     | 能够进入 /dir1 具有目录修改的权限即可    |
| 将 file1 复制到 /dir2 | x     | r           | wx    | 要能够读 file1 且能够修改 /dir2 内的数据 |

上面的表格当中，很多时候 /dir1 都不必有 r 。这是因为我们知道 /dir1 是个目录，类似于抽屉。那个抽屉的 r 代表“这个抽屉里面有灯光”， 所以能看到抽屉内的所有数据名称 （非内容）。但我们已经知道里面的数据放在哪个地方，所以可以不需要灯光摸黑拿到该数据。 因此，上面很多动作中，你只要具有 x 即可。r 是非必备的！只是，没有 r 的话，使用 [tab] 时，就无法自动补全文件名。

