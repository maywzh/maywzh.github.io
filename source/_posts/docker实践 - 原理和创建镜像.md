---
title: Docker实践 - 原理和创建镜像
date: 2017-02-13 21:04:40
categories: DevOps
tags:
  - Docker
thumbnail: https://raw.githubusercontent.com/maywzh/imagebed/master/img/docker.png
---
你是否遇到过这种问题，在一个开发环境下面运行完全正常的程序，到了生产环境就会出现种种问题。因为生产环境的种种配置、库与环境变量等依赖项都与开发环境不尽相同，所以部署到生产环境之前，必须提前将生产环境配置好，才能保证服务正常运行。

但这样十分麻烦，尤其是要迁移服务器的话，环境配置又要重新来一遍。最理想的状况是，部署到生产环境可以自带环境配置，把运行正常的环境直接复制到生产机器上。[Docker](https://www.docker.com/)为这种需求提供了解决方案。


<!--more-->

## Docker是什么

Docker 是一种Linux容器的封装， 由[Docker Inc.](https://www.docker.com/company)开发，它把应用程序和依赖打包为一个文件，docker基于这个文件生成一个虚拟容器，应用程序在这个虚拟容器里面运行，与在真实物理机上运行无异。它解决了环境配置问题。

Docker目前提供了企业版(Docker Enterprise Edition, Docker EE)和社区版(Docker Community Edition, Docker CE)两种版本。

## Docker 安装

Docker EE是面向企业的，一般只需要使用Docker CE即可，我们选择安装Docker CE版本。在此以Ubuntu18.04为例：

### 卸载老版本的Docker

如果安装过老版本的docker(docker` or `docker-engine)，要先卸载掉

```bash
$ sudo apt-get remove docker docker-engine docker.io
```

### 安装Docker

采用官方推荐的通过Docker‘s repositories方式来安装。

#### 设置Docker's repository

1. 先更新apt索引

   ```bash
   $ sudo apt-get update
   ```

2. 安装必要的包，这是为了apt能够通过HTTPS的方式访问Docker repositories

    ```bash
      $ sudo apt-get install \
       apt-transport-https \
       ca-certificates \
       curl \
       software-properties-common
    ```

3. 添加Docker的官方GPG key

   ```bash
   $ curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
   ```

   确认是否有带有`9DC8 5822 9FC7 DD38 854A E2D8 8D81 803C 0EBF CD88`指纹的key。

   ```bash
   $ sudo apt-key fingerprint 0EBFCD88
   
   pub   4096R/0EBFCD88 2017-02-22
         Key fingerprint = 9DC8 5822 9FC7 DD38 854A  E2D8 8D81 803C 0EBF CD88
   uid                  Docker Release (CE deb) <docker@docker.com>
   sub   4096R/F273FCD8 2017-02-22
   ```

4. 安装`stable`版本的repository。如果想安装`edge`或`test`版本，在`stable`后面添加`edge`或`test`。

   ```bash
   $ sudo add-apt-repository \
      "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) \
      stable"
   ```


#### 安装Docker CE
1. 先更新apt索引

   ```bash
   $ sudo apt-get update
   ```

2. 安装最新版的Docker CE

   ```bash
   $ sudo apt-get install docker-ce
   ```

3. *如果想安装特定版本Docker CE，则可以列出repo中可用的版本，选择安装

   a. 列出repo中可用版本
   ​    ```bash
   ​    $ apt-cache madison docker-ce
   ​    docker-ce | 18.03.0~ce-0~ubuntu | https://download.docker.com/linux/ubuntu xenial/stable amd64 Packages
   ​    ```

   b. 安装特定版本

   ```bash
   $ sudo apt-get install docker-ce=<VERSION>
   ```

4. 确定是否安装成功，下载一个测试镜像并在容器中运行。

   ```bash
   $ sudo docker run hello-world
   Hello from Docker!
   This message shows that your installation appears to be working correctly.
   
   To generate this message, Docker took the following steps:
    1. The Docker client contacted the Docker daemon.
    2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
       (amd64)
    3. The Docker daemon created a new container from that image which runs the
       executable that produces the output you are currently reading.
    4. The Docker daemon streamed that output to the Docker client, which sent it
       to your terminal.
   
   To try something more ambitious, you can run an Ubuntu container with:
    $ docker run -it ubuntu bash
   
   Share images, automate workflows, and more with a free Docker ID:
    https://hub.docker.com/
   
   For more examples and ideas, visit:
    https://docs.docker.com/get-started/
   ```

   如果出现如上信息就安装成功了，如果是在linux下安装的还需要设置用户权限。

### 设置用户权限（linux安装）

Docker daemon进程与Unix socket绑定。默认状况下Unix socket权限由`root`用户拥有，其他用户必须用`sudo`才可以访问。Docker daemon必须以`root`用户身份运行。想要省掉输入`sudo`就必须设置当前用户权限。

我们可以创建一个`docker`用户组并把当前用户加到这个组里面去，Docker daemon启动时就创建一个可以被`docker`用户组访问的Unix socket。

1. 创建`docker`用户组

   ```bash
   $ sudo groupadd docker
   ```

2. 把当前用户加入`docker`用户组

   ```bash
   $ sudo usermod -aG docker $USER
   ```

3. 重新登陆当前用户来使用户组生效

4. 此时就可以不加`sudo`运行`docker`了

   ```bash
   $ docker run hello-world
   ```


### 设置Docker开机启动

Ubuntu16.04开始都用`systemd`来管理开机启动服务。如果Ubuntu14.10以下则使用`upstart`。

#### Ubuntu16.04及以上 - systemd

```bash
$ sudo systemctl enable docker//设置docker开机启动
$ sudo systemctl disable docker//取消docker开机启动
```

#### Ubuntu14.10及以下 - upstart

Docker被upstart自动配置为开机启动，取消开机启动则使用下面的命令

```bash
$ echo manual | sudo tee /etc/init/docker.override
```





## Docker image

Docker 容器(container)是通过运行镜像(image)文件来生成的。image是一个可执行的包，它包含了运行一个应用程序所需要的所有东西—运行时、库、环境变量和配置文件。一个image可以生成多个同时运行的container。



## Docker container

Docker 容器是image的一个运行时实例。image被执行并被加载到内存就变成一个container，也就是一个具有状态的image或用户进程。可以通过`docker ps`来查看正在运行的container的列表。

## 容器与虚拟机的区别

一个容器在Linux上**原生**运行，并于其他容器共享主机的内核。容器运行轻量级的独立的进程，占据资源相当少。而虚拟机则运行在一个客户操作系统(Guest OS)上，它通过虚拟机控制器技术来虚拟访问访问主机的资源，相对其他的进程，虚拟机要占据较多的机器资源。





## Docker启动服务

Docker是C/S架构，运行docker命令时，相当于把传递指令给监听特定Unix socket的Docker服务，所以必须启动Docker服务。

```bash
# service 方式
$ sudo service docker start

# systemctl 方式
$ sudo systemctl start docker
```



## 实战 - 构建一个app并创建docker镜像。

如果我们想要开发一个python app，第一步就是安装一个python的runtime到开发机上，而这个配置必须完美契合app的配置要求，生产环境也必须这样。

使用Docker，就可以把所需Python runtime打包为一个镜像(image)，无需安装。然后在app的代码包含这个image即可。我们就算把app的环境打包好了。

### 步骤1: 通过`Dockerfile`来定义容器(`container`)

`Dockerfile`定义了`container`内的行为。在`container`环境中，所有对环境资源的访问，例如网络接口和磁盘驱动，都被虚拟化了，并与`container`外的操作系统隔离。因此需要定义到容器外的端口，并确定想要“拷贝”到这个环境的文件。做完这个以后，就可以确保在`Dockerfile`中运行的app在任何外部环境都能完全相同地运行。

#### 创建`Dockerfile`

```bash
cd ~/Workspace/dockerdemo
touch Dockerfile
vim Dockerfile
```



```dockerfile
# ~/Workspace/dockerdemo/Dockerfile
# 用一个官方的Python runtime作为父image
FROM python:2.7-slim

# 设置工作目录为 /app
WORKDIR /app

# 把当前的目录内容拷贝到 /app 中的容器
COPY . /app

# 安装 requirements.txt 定义的依赖包
RUN pip install --trusted-host pypi.python.org -r requirements.txt

# 把 80 端口对容器外开放
EXPOSE 80

# 定义环境变量
ENV NAME World

# 容器启动时运行 app.py
CMD ["python", "app.py"]
```

当`Dockerfile`被构建为为一个`image`，COPY`命令把`requirements.txt`和 `app.py` 拷贝到容器内，EXPOSE命令让`app.py`的输出可以通过HTTP来访问。

### 步骤2: 构建示例demo

#### 编写 demo app代码

编写`requirements.txt`和`app.py`，把它们放在Dockerfile的同一目录下。

`requirements.txt`

```
Flask
Redis
```

`app.py`

```python
from flask import Flask
from redis import Redis, RedisError
import os
import socket

# Connect to Redis
redis = Redis(host="redis", db=0, socket_connect_timeout=2, socket_timeout=2)

app = Flask(__name__)

@app.route("/")
def hello():
    try:
        visits = redis.incr("counter")
    except RedisError:
        visits = "<i>cannot connect to Redis, counter disabled</i>"

    html = "<h3>Hello {name}!</h3>" \
           "<b>Hostname:</b> {hostname}<br/>" \
           "<b>Visits:</b> {visits}"
    return html.format(name=os.getenv("NAME", "world"), hostname=socket.gethostname(), visits=visits)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=80)
```

至此app就编写完毕了。我们可以看到`pip install -r requirements.txt`这个命令安装了Flask和Redis，而app打印了环境变量`NAME`和`socket.gethostname()`的输出。由于Redis安装之后并没有运行，所以预期app会运行失败，打印错误信息。



#### 构建app

查看当前目录的文件

```bash
$ ls
Dockerfile		app.py			requirements.txt
```

运行`build`命令，建立Docker image，我们也可以用`-t`选项来为之创建一个标签。

```bash
docker build -t friendlyhello .
```

我们可以查看注册的image

```bash
$ docker image ls
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
friendlyhello       latest              cfb6345425ed        41 seconds ago      132MB
```



#### 运行app

`docker run` 命令运行app，`-p`选项把机器上的4000端口绑定到container发布的80端口

```bash
docker run -p 4000:80 friendlyhello
 * Serving Flask app "app" (lazy loading)
 * Environment: production
   WARNING: Do not use the development server in a production environment.
   Use a production WSGI server instead.
 * Debug mode: off
 * Running on http://0.0.0.0:80/ (Press CTRL+C to quit)
```

显示信息访问`http://0.0.0.0:80`。但实际上，这条信息来自于容器内部，容器内部的app并不知道它正运行于容器内部，所以它在实体机上显示虚拟环境的地址`http://0.0.0.0:80`，实际上我们已经把容器的80端口映射到了物理机的4000端口，所以真实地址是`http://localhost:4000`



点击 `CTRL+C`退出进程。

也可以添加`-d`选项在后台运行

```bash
docker run -d -p 4000:80 friendlyhello
6b514ac64d134b52a35394c82839da468dcb94b56123109bd33113e5fdb36d7b 
```



输入该命令后，得到了一个container ID，例如上面的`6b514ac64d134b52a35394c82839da468dcb94b56123109bd33113e5fdb36d7b`，此时我们的container在后台运行。也可以通过`docker container ls`来查看container ID的缩写。

```bash
$ docker container ls
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS                  NAMES
6b514ac64d13        friendlyhello       "python app.py"     3 minutes ago       Up 3 minutes        0.0.0.0:4000->80/tcp   compassionate_shannon
```

运行docker container stop命令来停止container进程。

```bash
$ docker container stop 6b514ac64d13
```



### 步骤3: 分享image

我们想要我们的image可以随处运行。我们可以把自己的image推送到Docker仓库(repository)中。Docker仓库类似于Github仓库，只是代码已经被构建好了。可以注册一个Docker ID来创建自己的repository。Docker命令行默认使用公有仓库。

#### 登陆Docker公有仓库

我们需要去[Docker官网](docker.com)注册一个Docker ID，在本机输入

```bash
$ docker login
```

接着输入Docker ID和密码即可登录。

#### 为image添加标签

一个仓库中的image的格式是`username/repository:tag`。这个Tag是可选的，但一般推荐添加上，因为仓库可以用tag来设定Docker image版本号。

```bash
$ docker tag image user/repository:tag
```

例如

```bash
$ docker tag helloworld maywzh/maywzhrepo:part2
```

通过`docker image ls`来查看新的添加了标签的image:

```bash
$ docker image ls
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
friendlyhello       latest              cfb6345425ed        2 days ago          132MB
koa-demo            0.0.1               628b71e7fc7d        2 weeks ago         675MB
hello-world         latest              4ab4c602aa5e        3 weeks ago         1.84kB
python              2.7-slim            c9cde4658340        4 weeks ago         120MB
node                8.4                 386940f92d24        13 months ago       673MB
```

#### 发布image

可以把标签过的image发布到仓库中：

```bash
$ docker push username/repository:tag
```

一旦完成，那么上传的东西就可以被可以被公开访问了，也可以上[Docker Hub](https://hub.docker.com/)来查看image上传的image。

#### 从远端仓库拉取image

经过之前的步骤，我们可以通过`docker run` 在任何机器上来运行我们的app

```bash
$ docker run -p 4000:80 username/repository:tag
```

如果image在本机不可用，就会把它拉回到本地:

```bash
$ docker run -p 4000:40 
```



## 总结

Docker提供了一种虚拟化容器的方式来打包app以及它的运行环境，该容器(container)通过镜像(image)创建，而镜像通过编写`dockerfile`的方式来定义。我们也可以把为docker镜像添加标签，并推送到docker远程仓库中。这样就可以通过远程仓库直接运行镜像。



## 附录 所用的所有命令

```bash
docker build -t friendlyhello .  # 用dockerfile来构建镜像
docker run -p 4000:80 friendlyhello  # 运行friendlyhello 把容器端口80导航到到运行机端口4000
docker run -d -p 4000:80 friendlyhello         # 后台运行模式
docker container ls                                # 列出所有的容器
docker container ls -a             # 列出所有的容器包括为未运行的
docker container stop <hash>           # 优雅的方式关闭容器
docker container kill <hash>         # 强制杀掉容器进程
docker container rm <hash>        # 删除容器
docker container rm $(docker container ls -a -q)         # 删除所有容器
docker image ls -a                             # 列出所有的镜像
docker image rm <image id>            # 删除特定镜像
docker image rm $(docker image ls -a -q)   # 删除所有镜像
docker login             # 登陆到docker CLI session
docker tag <image> username/repository:tag  # 为镜像添加标签来上传到公有库
docker push username/repository:tag            # 上传镜像到公有库
docker run username/repository:tag                   # 从仓库运行镜像
```

