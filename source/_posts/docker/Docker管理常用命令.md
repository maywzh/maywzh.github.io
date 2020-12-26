---
title: Docker管理常用命令
categories: DevOps
comments: false
thumbnail: https://i.loli.net/2020/12/26/hpkCK6VX5cfJqDi.png
cover: https://i.loli.net/2020/12/26/hpkCK6VX5cfJqDi.png
date: 2017-09-08 14:25:13
tags:
  - Docker
---

Docker 的常用命令一般分为：镜像管理、容器管理。

<!--more-->

## 镜像管理命令

下面使用 busybox 软件作为示例，busybox 软件是一个集成了非常多最常用的 Linux 命令和工具的软件集合。

### 查看所有镜像

```text
docker images
```

- REPOSITORY：镜像来自哪个仓库
- TAG：镜像的标签信息，版本之类的信息
- IMAGE ID：镜像创建时的id
- CREATED：镜像创建的时间
- SIZE：镜像文件大小
- 下载软件镜像

```text
docker pull busybox:latest
```

备注：latest 表示使用 busybox 软件的最新版本，所以软件默认下载都是 latest 版本。

### 导出镜像

```text
docker save busybox > busybox.tar
```

备注：把 busybox 镜像导出为 busybox.tar 文件，可以把 busybox.tar 文件复制到别的操作系统上使用，免除下载时网络慢的问题。

### 删除镜像

```text
docker rmi busybox:latest
```

备注：镜像一般都会根据版本打包，如果有下载一个软件的多个版本就需要指定具体版本信息。如 busybox:1.26 就会删除 busybox 软件的 1.26 版本的镜像，不会删除latest 版本的镜像。

### 导入镜像

```text
docker load < busybox.tar
```

备注：使用导出命令导出的镜像，可以通过此命令导入到没有下载此软件的操作系统，方便网络条件差的情况使用。

### 更改镜像名

```text
docker tag busybox:latest busybox:test
```

备注：busybox:latest原镜像名，busybox:test要改成的镜像名



## 容器管理命令

### 运行容器

```text
docker run -d --name=busybox busybox:latest ping 114.114.114.114
```

- `run`：run参数代表启动容器
- `-d`：以后台daemon的方式运行
- `--name`：指定一个容器的名字，此后操作都需要使用这个名字来定位容器。
- `busybox:latest`：容器所使用的镜像名字
- `ping 114.114.114.114`：启动容器执行的命令
- 查看运行的容器

```text
docker ps
```

### 查看所有容器

```text
docker ps -a
```

- `CONTAINER ID`：容器启动的id
- `IMAGE`：使用哪个镜像启动的容器
- `COMMAND`：启动容器的命令
- `CREATED`：创建容器的时间
- `STATUS`：容器启动时间
- `PORTS`：容器映射到宿主机的端口
- `NAMES`：容器启动的名字
- 启动容器

```text
docker start busybox
```

###。重新启动容器

```text
docker restart busybox
```

### 停止容器

```text
docker stop busybox
```

### 杀死容器

```text
docker kill busybox
```

### 删除运行中的容器

```text
docker rm -f busybox
```

### 执行容器内命令

```text
docker exec -it busybox ls
```

备注：-it 交互终端

### 复制容器内文件

```text
docker cp busybox:/etc/hosts hosts
```

### 查看容器日志

```text
docker logs -f busybox
```