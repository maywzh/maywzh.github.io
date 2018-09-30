---
title: webpack入门
date: 2016-12-15 16:39:15
tags:
  - webpack
categories:
  - 前端
---

**2018updated：目前webpack已经到了4.0版本，本文基于1.x版本，有些方法已经过时，请参照官方文档**


## webpack介绍
什么是webpack

webpack官网主页就是一图胜千言。

![webpack官网图](https://ws3.sinaimg.cn/large/006tNc79gy1fvqzjwzm1qj30v60hjq4e.jpg)

webpack把工程中具有复杂依赖关系的代码(script)、样式文件(style)和图片(image)等文件打包为一个简洁的静态文件包，非常优雅和简单。

<!--more-->

## 准备工作

我们以[runyf的webpack教程](https://github.com/ruanyf/webpack-demos)作为起步练习。

第一步：安装webpack

```bash
$ npm i -g webpack webpack-dev-server
```

第二步：clone练习的repo，安装依赖

```bash
$ git clone https://github.com/ruanyf/webpack-demos.git
$ cd webpack-demos
$ npm install
```

这个repo总共有15个demo，足够我们入门webpack。



## 起步

配置好练习环境后，我们正式开始。

```bash
$ cd demo01
```

我们观察这个demo的结构。



![项目文件结构](https://ws2.sinaimg.cn/large/006tNc79gy1fvqzrjbf9sj304p041aa5.jpg)

`webpack.config.js`这个文件是webpack的配置文件，它是CommonJS规范的，导出一个module.exports对象。

```javascript
module.exports = {
  entry: './main.js',
  output: {
    filename: 'bundle.js'
  }
};

```

OK，我们执行这个命令

```bash
$ npm run dev
```

这时我们发现我们的main.js已经被打包到bundle.js中了。bundle.js正是webpack构建的最终产品。

webpack有一些常见的命令。

常见的命令们

- `webpack` 供开发构建
- `webpack -p` 供生产构建一次
- `webpack --watch` – 连续的增量构建
- `webpack -d` – 包括源地图
- `webpack --colors` – 让内部更好看

生产环境的应用需要在package.json中配置script ：

```javascript
// package.json
{
  // ...
  "scripts": {
    "dev": "webpack-dev-server --devtool eval --progress --colors",
    "deploy": "NODE_ENV=production webpack -p"
  },
  // ...
}
```



下面我们按照教程的顺序一步步来学会webpack的基础用法。

## 入口文件

入口文件就是webpack读取来构建bundle.js

Demo01里，main.js就是入口文件。

```javascript
//main.js
document.write('<h1>Hello World</h1>');
```

对应的html文件index.html

```html
<html>
  <body>
    <script type="text/javascript" src="bundle.js"></script>
  </body>
</html>
```

以及最核心的webpack的配置文件webpack.config.js，他是webpack工作的基础。

```javascript
// webpack.config.js
module.exports = {
  entry: './main.js', //设置main.js为入口文件
  output: {
    filename: 'bundle.js' //生成bundle.js文件
  }
};
```

### 多个入口文件

webpack支持多个入口文件，这对于我们构建每个页面都有不同入口文件的多页面应用很有帮助。

Demo02中，main1.js和main2.js都是入口文件

```javascript
// main1.js
document.write('<h1>Hello World</h1>');

// main2.js
document.write('<h2>Hello Webpack</h2>');
```

index.html文件，依赖于两个入口文件

```html
<html>
  <body>
    <script src="bundle1.js"></script>
    <script src="bundle2.js"></script>
  </body>
</html>
```

webpack.config.js配置文件

```javascript
module.exports = {
  entry: {
    bundle1: './main1.js', //main1.js 打包为 bundle1.js
    bundle2: './main2.js' //main2.js 打包为 bundle2.js
  },
  output: {
    filename: '[name].js' //产品的名称模式
  }
};
```

## Babel-loader集成

我们也可以在webpack的打包之前加入一些预处理器，例如可以把JSX文件或ES6风格的JS代码转换为ES5风格的[Babel-loader](https://www.npmjs.com/package/babel-loader)。

main.jsx是一个JSX文件

```jsx
// main.jsx
const React = require('react');
const ReactDOM = require('react-dom');

ReactDOM.render(
  <h1>Hello, world!</h1>,
  document.querySelector('#wrapper')
);
```

index.html依赖于打包的产物bundle.js

```html
<html>
  <body>
    <div id="wrapper"></div>
    <script src="bundle.js"></script>
  </body>
</html>
```

webpack.config.js配置

```js
module.exports = {
  entry: './main.jsx',
  output: {
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['es2015', 'react']
          }
        }
      }
    ]
  }
};
```

实际上我们把babel-loader集成到webpack服务上了，它作为webpack的一个模块化组件存在。



## CSS-loader集成

webpack可以把CSS文件打包到JS文件，然后用 [CSS-loader](https://github.com/webpack-contrib/css-loader)来处理。

main.js

```javascript
require('./app.css');
```

app.cssjavascript

```javascript
body {
  background-color: blue;
}
```

index.html

```html
<html>
  <head>
    <script type="text/javascript" src="bundle.js"></script>
  </head>
  <body>
    <h1>Hello World</h1>
  </body>
</html>
```

webpack.config.js

```js
module.exports = {
  entry: './main.js',
  output: {
    filename: 'bundle.js'
  },
  module: {
    rules:[
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      },
    ]
  }
};
```

在这里需要用CSS-loader来读取CSS文件，用Style-loader来吧`<style>`标签插入到html文件。

我们看看效果

```bash
$ cd demo04
$ npm run dev //webpack-dev-server --open
```

webpack吧style样式表插入到了index.html文件中。

```html
<head>
  <script type="text/javascript" src="bundle.js"></script>
  <style type="text/css">
    body {
      background-color: blue;
    }
  </style>
</head>
```



## 图片加载器

webpack可以在JS文件中包含文件。

main.js

```js
var img1 = document.createElement("img");
img1.src = require("./small.png");
document.body.appendChild(img1);

var img2 = document.createElement("img");
img2.src = require("./big.png");
document.body.appendChild(img2);
```

index.html

```html
<html>
  <body>
    <script type="text/javascript" src="bundle.js"></script>
  </body>
</html>
```

webpack.config.js用url-loader来处理图片文件。

```js
module.exports = {
  entry: './main.js',
  output: {
    filename: 'bundle.js'
  },
  module: {
    rules:[
      {
        test: /\.(png|jpg)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192
            }
          }
        ]
      }
    ]
  }
};
```

[url-loader](https://www.npmjs.com/package/url-loader) 把图像文件转换为`<img>`标签。如果图像小于8KB，就会被转换为DATA URL，否则会被转换为正常的URL。

小图片 `small.png` 和大图片 `big.png` 转换为不同的标签.

```html
<img src="data:image/png;base64,iVBOR...uQmCC">
<img src="4853ca667a2b8b8844eb2693ac1b2578.png">
```



## CSS模块

 [CSS Module](https://github.com/css-modules/css-modules) 可以清晰地划分CSS的作用域。

index.html

```html
<html>
<body>
  <h1 class="h1">Hello World</h1>
  <h2 class="h2">Hello Webpack</h2>
  <div id="example"></div>
  <script src="./bundle.js"></script>
</body>
</html>
```

app.css

```css
/* local scope */
.h1 {
  color:red;
}

/* global scope */
:global(.h2) {
  color: blue;
}
```

main.jsx

```jsx
var React = require('react');
var ReactDOM = require('react-dom');
var style = require('./app.css'); //引用CSS文件

ReactDOM.render(
  <div>
    <h1 className={style.h1}>Hello World</h1> //这个h1拥有app.css作用域
    <h2 className="h2">Hello Webpack</h2> // 全局作用域
  </div>,
  document.getElementById('example')
);
```

webpack.config.js

```js
module.exports = {
  entry: './main.jsx',
  output: {
    filename: 'bundle.js'
  },
  module: {
    rules:[
      {
        test: /\.js[x]?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['es2015', 'react']
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
             loader: 'css-loader',
             options: {
               modules: true
             }
          }
        ]
      }
    ]
  }
};
```

查看结果

```
$ cd demo06
$ npm run dev
```

![demo06结果](https://ws3.sinaimg.cn/large/006tNc79gy1fvr210vqt1j30e40dogma.jpg)

第一个h1不具有CSS文件作用域，而h2具有全局作用域的CSS。

## UglifyJS 插件

webpack有丰富的插件系统来扩展功能。 [UglifyJs Plugin](https://webpack.js.org/plugins/uglifyjs-webpack-plugin/) 这个插件就可以用来简化JS文件。

main.js

```js
var longVariableName = 'Hello';
longVariableName += ' World';
document.write('<h1>' + longVariableName + '</h1>');
```

index.html

```html
<html>
<body>
  <script src="bundle.js"></script>
</body>
</html>
```

webpack.config.js

```js
var webpack = require('webpack');
var UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: './main.js',
  output: {
    filename: 'bundle.js'
  },
  plugins: [
    new UglifyJsPlugin()
  ]
};
```

`main.js` 会被简化为

```js
var o="Hello";o+=" World",document.write("<h1>"+o+"</h1>")
```

## 第三方插件

[html-webpack-plugin](https://github.com/ampedandwired/html-webpack-plugin) 可以创建 `index.html` ， [open-browser-webpack-plugin](https://github.com/baldore/open-browser-webpack-plugin) 可以在webpack加载时打开一个浏览器窗口。

main.js

```js
document.write('<h1>Hello World</h1>');
```

webpack.config.js

```js
var HtmlwebpackPlugin = require('html-webpack-plugin');
var OpenBrowserPlugin = require('open-browser-webpack-plugin');

module.exports = {
  entry: './main.js',
  output: {
    filename: 'bundle.js'
  },
  plugins: [
    new HtmlwebpackPlugin({
      title: 'Webpack-demos',
      filename: 'index.html'
    }),
    new OpenBrowserPlugin({
      url: 'http://localhost:8080'
    })
  ]
};
```

实验demo08

```bash
$ cd demo08
$ npm run dev
```

无需编写 `index.html` 无需打开浏览器，webpack自动化帮助完成所有工作。

## 环境变量

有些时候需要分辨开发环境、测试环境和生产环境，所以引入下面这些魔法全局变量（magic globals）：

main.js

```js
document.write('<h1>Hello World</h1>');

if (__DEV__) {
  document.write(new Date());
}
```

index.html

```html
<html>
<body>
  <script src="bundle.js"></script>
</body>
</html>
```

webpack.config.js

```js
var webpack = require('webpack');

var devFlagPlugin = new webpack.DefinePlugin({
  __DEV__: JSON.stringify(JSON.parse(process.env.DEBUG || 'false'))
});

module.exports = {
  entry: './main.js',
  output: {
    filename: 'bundle.js'
  },
  plugins: [devFlagPlugin]
};
```

我们在package的scripts脚本处加上环境变量。

```json
// package.json
{
  // ...
  "scripts": {
    "dev": "cross-env DEBUG=true webpack-dev-server --open",
  },
  // ...
}
```

打开Demo09实验。

```bash
$ cd demo09
$ npm run dev
```

只有debug环境下会出现时间的信息。



## 代码分割

大的web应用把所有的代码都放在一个文件效率十分低下。webpack可以把一个大的JS文件分成多个小代码块。这些代码块可以按需加载。webpack用 `require.ensure` 来设定分割点。 ([官方文档](http://webpack.github.io/docs/code-splitting.html)).

```js
// main.js
require.ensure(['./a'], function (require) {
  var content = require('./a');
  document.open();
  document.write('<h1>' + content + '</h1>');
  document.close();
});
```

`require.ensure`告诉webpack `./a.js` 从 `bundle.js` 分割出来成为一个chunk文件。

```js
// a.js
module.exports = 'Hello World';
```

webpack解决依赖、输出文件和运行时的问题。不需要在 `index.html` 和 `webpack.config.js`进行冗余声明。

```js
<html>
  <body>
    <script src="bundle.js"></script>
  </body>
</html>
```

webpack.config.js

```js
module.exports = {
  entry: './main.js',
  output: {
    filename: 'bundle.js'
  }
};
```

运行Demo10

```
$ cd demo10
$ npm run dev
```

webpack吧main.js和a.js放在不同的代码段里面，可以看到main.js和a.js被勾践为bundle.js和0.bundle.js，当有需要的时候才会从bundle.js中加载0.bundle.js

![demo10](https://ws1.sinaimg.cn/large/006tNc79gy1fvr2upndewj30by09gdgi.jpg)

## 用bundle-loader进行代码分割


这是代码分割的另一种方式。

```js
// main.js

// Now a.js is requested, it will be bundled into another file
var load = require('bundle-loader!./a.js');

// To wait until a.js is available (and get the exports)
//  you need to async wait for it.
load(function(file) {
  document.open();
  document.write('<h1>' + file + '</h1>');
  document.close();
});
```

`require('bundle-loader!./a.js')`告诉webpack从另一个代码段加载a.js。



## 代码段复用

多个代码都复用一小段代码时，可以用 [CommonsChunkPlugin](https://webpack.js.org/plugins/commons-chunk-plugin/)把这段代码提取出来，可以提升网站的加载速度，节省带宽。

main1.jsx

```jsx
// main1.jsx
var React = require('react');
var ReactDOM = require('react-dom');

ReactDOM.render(
  <h1>Hello World</h1>,
  document.getElementById('a')
);


```

main2.jsx

```jsx
// main2.jsx
var React = require('react');
var ReactDOM = require('react-dom');

ReactDOM.render(
  <h2>Hello Webpack</h2>,
  document.getElementById('b')
);
```



index.html

```html
<html>
  <body>
    <div id="a"></div>
    <div id="b"></div>
    <script src="commons.js"></script>
    <script src="bundle1.js"></script>
    <script src="bundle2.js"></script>
  </body>
</html>
```

 `commons.js`是`main1.jsx` 和 `main2.jsx`的公用代码. `commons.js` 包含 `react` 和 `react-dom`.

webpack.config.js

```js
var webpack = require('webpack');

module.exports = {
  entry: {
    bundle1: './main1.jsx',
    bundle2: './main2.jsx'
  },
  output: {
    filename: '[name].js'
  },
  module: {
    rules:[
      {
        test: /\.js[x]?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['es2015', 'react']
          }
        }
      },
    ]
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: "commons",
      // (the commons chunk name)

      filename: "commons.js",
      // (the filename of the commons chunk)
    })
  ]
}
```

webpack把main1.jsx和main2.jsx以及依赖文件打包成了bundle1.js、bundle2.js和commons.js。



## 库代码块

可以从一个代码中分离出库到一个独立的文件。
main.js

```js
var $ = require('jquery');
$('h1').text('Hello World');
```

index.html

```html
<html>
  <body>
    <h1></h1>
    <script src="vendor.js"></script>
    <script src="bundle.js"></script>
  </body>
</html>
```

webpack.config.js

```js
var webpack = require('webpack');

module.exports = {
  entry: {
    app: './main.js',
    vendor: ['jquery'],
  },
  output: {
    filename: 'bundle.js'
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      filename: 'vendor.js'
    })
  ]
};
```

`entry.vendor: ['jquery']` 告诉webpack`jquery` 要被包含在公用库代码 `vendor.js`中。

如果想让一个模块在每个模块中都以全局变量的形式存在，例如在每个模块使用`$`和`jQuery`而不用声明引用`require("jquery")`。可以使用`ProvidePlugin` ([官方文档](https://webpack.js.org/plugins/provide-plugin/)) 来实现这一点。

```js
// main.js
$('h1').text('Hello World');

// webpack.config.js
var webpack = require('webpack');

module.exports = {
  entry: {
    app: './main.js'
  },
  output: {
    filename: 'bundle.js'
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    })
  ]
};
```



## 异步加载

拆分资源实现按需加载。

指定你要异步加载的 **拆分点**。看下面的例子

```javascript
if (window.location.pathname === '/feed') {
  showLoadingState();
  require.ensure([], function() { 
    hideLoadingState();
    require('./feed').show(); // 当这个函数被调用的时候，此模块是一定已经被同步加载下来了
  });
} else if (window.location.pathname === '/profile') {
  showLoadingState();
  require.ensure([], function() {
    hideLoadingState();
    require('./profile').show();
  });
}
```

Webpack生成并加载这些额外的 **chunk** 文件。

webpack 默认会从项目的根目录下引入这些chunk文件也可以通过 `output.publicPath`来配置chunk文件的引入路径

```
// webpack.config.js
output: {
    path: "/home/proj/public/assets", // webpack的build路径
    publicPath: "/assets/" // 你require的路径
}
```