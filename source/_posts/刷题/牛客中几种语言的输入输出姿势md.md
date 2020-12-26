---
title: 刷题几种语言的输入输出姿势
categories: 刷题
comments: false
thumbnail: https://i.loli.net/2020/12/26/yVnfD9bgNOcrWPL.png
cover: https://i.loli.net/2020/12/26/yVnfD9bgNOcrWPL.png
date: 2015-09-10 16:24:42
tags:
  - Go
  - Java
  - Python
---

总结一波自己常用的Python、Java、Golang的输入输出技巧。

<!--more-->

## 输入

### 70% Common 输入输出

输入两个整数，输入一个矩阵类型

#### Go
```go
package main

import "fmt"

func main() {
	var m, n int
	fmt.Scanln(&m, &n)
	var hash [][]int = make([][]int, m)
	for i := 0; i < m; i++ {
		hash[i] = make([]int, n)
		for j := 0; j < n; j++ {
			fmt.Scan(&hash[i][j])
		}
	}
	fmt.Println(hash)
}


```

#### Java
```java
import java.util.*;

public class IODemo {
    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);
        int m = sc.nextInt(), n = sc.nextInt();
        int m1 = sc.nextInt(), n1 = sc.nextInt();
      	int[][] map = new int[m][n];
      	float[][] fmap = new float[m][n];
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                map[i][j] = sc.nextInt();
            }
        }
      	for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                fmap[i][j] = sc.nextFloat();
            }
        }
        sc.close();
        for (int i = 0; i < m; i++) {

            for (int j = 0; j < n; j++) {
                System.out.println(map[i][j]);
            }
            System.out.println();
        }
    }

}
```

#### Python
```python
m, n = map(int, input().strip().split())
dray = [[0]*n]*n
for i in range(m):
    dray[i] = map(int, input().strip().split())
```

看看人家Python处理的多舒服，除了要暴力计算的时候，一般首选Python。😁

### 90% Common 字符串转整数

输入的数据以某个字符分割,并转化为整数or小数

#### Go

```go
package main
 
import (
    "bufio"
    "fmt"
    "os"
    "strconv"
    "strings"
)
 
func main() {
    input := bufio.NewScanner(os.Stdin)
    for input.Scan() {
        a := strings.Split(input.Text(), ",")
        a0, _ := strconv.Atoi(a[0])
        a1, _ := strconv.Atoi(a[1])
        fmt.Println(a0 + a1)
    }
}
```

#### Java

```java
import java.util.*;

public class IO2 {
    public static void main(String args[]) {
        Scanner sc = new Scanner(System.in);
        String s = sc.next();
        String[] ss = s.split(",");
        int sum = 0;
        for (int i = 0; i < ss.length; i++) {
            int thenum = Integer.parseInt(ss[i]);
            System.out.println(thenum);
            sum += thenum;
        }
        System.out.println(sum);
        sc.close();

    }
}

```

#### Python

```python
st = intput()
ist = int(st)
```

## 输出

### Go

```reStructuredText
%v     值的默认格式。
%+v   类似%v，但输出结构体时会添加字段名
%#v　 相应值的Go语法表示 
%T    相应值的类型的Go语法表示 
%%    百分号,字面上的%,非占位符含义
%b     二进制表示 
%c     相应Unicode码点所表示的字符 
%d     十进制表示 
%o     八进制表示 
%q     单引号围绕的字符字面值，由Go语法安全地转义 
%x     十六进制表示，字母形式为小写 a-f 
%X     十六进制表示，字母形式为大写 A-F 
%U     Unicode格式：123，等同于 "U+007B"
```

```go
package main

import "fmt"

func main() {
	// 旗标、宽度、精度、索引
	fmt.Printf("|%0+- #[1]*.[2]*[3]d|%0+- #[1]*.[2]*[4]d|\n", 8, 4, 32, 64)

	// 浮点型精度
	fmt.Printf("|%f|%8.4f|%8.f|%.4f|%.f|\n", 3.2, 3.2, 3.2, 3.2, 3.2)
	fmt.Printf("|%.3f|%.3g|\n", 12.345678, 12.345678)
	fmt.Printf("|%.2f|\n", 12.345678+12.345678i)

	// 字符串精度
	s := "你好世界！"
	fmt.Printf("|%s|%8.2s|%8.s|%.2s|%.s|\n", s, s, s, s, s)
	fmt.Printf("|%x|%8.2x|%8.x|%.2x|%.x|\n", s, s, s, s, s)

	// 带引号字符串
	s1 := "Hello 世界!"       // CanBackquote
	s2 := "Hello\n世界!"      // !CanBackquote
	fmt.Printf("%q\n", s1)  // 双引号
	fmt.Printf("%#q\n", s1) // 反引号成功
	fmt.Printf("%#q\n", s2) // 反引号失败
	fmt.Printf("%+q\n", s2) // 仅包含 ASCII 字符

	// Unicode 码点
	fmt.Printf("%U, %#U\n", '好', '好')
	fmt.Printf("%U, %#U\n", '\n', '\n')

	// 接口类型将输出其内部包含的值
	var i interface{} = struct {
		name string
		age  int
	}{"AAA", 20}
	fmt.Printf("%v\n", i)  // 只输出字段值
	fmt.Printf("%+v\n", i) // 同时输出字段名
	fmt.Printf("%#v\n", i) // Go 语法格式

	// 输出类型
	fmt.Printf("%T\n", i)
}

```

```reStructuredText
|+0032   |+0064   |
|3.200000|  3.2000|       3|3.2000|3|
|12.346|12.3|
|(12.35+12.35i)|
|你好世界！|      你好|        |你好||
|e4bda0e5a5bde4b896e7958cefbc81|    e4bd|        |e4bd||
"Hello 世界!"
`Hello 世界!`
"Hello\n世界!"
"Hello\n\u4e16\u754c!"
U+597D, U+597D '好'
U+000A, U+000A
{AAA 20}
{name:AAA age:20}
struct { name string; age int }{name:"AAA", age:20}
struct { name string; age int }
```



### Java

```java
import java.util.*;

public class IO3 {
    public static void main(String[] args) {
        /*** 输出字符串 ***/
        // %s表示输出字符串，也就是将后面的字符串替换模式中的%s
        System.out.printf("%s", 1212);
        // %n表示换行
        System.out.printf("%s%n", "end line");
        // 还可以支持多个参数
        System.out.printf("%s = %s%n", "Name", "Zhangsan");
        // %S将字符串以大写形式输出
        System.out.printf("%S = %s%n", "Name", "Zhangsan");
        // 支持多个参数时，可以在%s之间插入变量编号，1$表示第一个字符串，3$表示第3个字符串
        System.out.printf("%1$s = %3$s %2$s%n", "Name", "san", "Zhang");

        /*** 输出boolean类型 ***/
        System.out.printf("true = %b; false = ", true);
        System.out.printf("%b%n", false);

        /*** 输出整数类型 ***/
        Integer iObj = 342;
        // %d表示将整数格式化为10进制整数
        System.out.printf("%d; %d; %d%n", -500, 2343L, iObj);
        // %o表示将整数格式化为8进制整数
        System.out.printf("%o; %o; %o%n", -500, 2343L, iObj);
        // %x表示将整数格式化为16进制整数
        System.out.printf("%x; %x; %x%n", -500, 2343L, iObj);
        // %X表示将整数格式化为16进制整数，并且字母变成大写形式
        System.out.printf("%X; %X; %X%n", -500, 2343L, iObj);

        /*** 输出浮点类型 ***/
        Double dObj = 45.6d;
        // %e表示以科学技术法输出浮点数
        System.out.printf("%e; %e; %e%n", -756.403f, 7464.232641d, dObj);
        // %E表示以科学技术法输出浮点数，并且为大写形式
        System.out.printf("%E; %E; %E%n", -756.403f, 7464.232641d, dObj);
        // %f表示以十进制格式化输出浮点数
        System.out.printf("%f; %f; %f%n", -756.403f, 7464.232641d, dObj);
        // 还可以限制小数点后的位数
        System.out.printf("%.1f; %.3f; %f%n", -756.403f, 7464.232641d, dObj);

        /*** 输出日期类型 ***/
        // %t表示格式化日期时间类型，%T是时间日期的大写形式，在%t之后用特定的字母表示不同的输出格式
        Date date = new Date();
        long dataL = date.getTime();
        // 格式化年月日
        // %t之后用y表示输出日期的年份（2位数的年，如99）
        // %t之后用m表示输出日期的月份，%t之后用d表示输出日期的日号
        System.out.printf("%1$ty-%1$tm-%1$td; %2$ty-%2$tm-%2$td%n", date, dataL);
        // %t之后用Y表示输出日期的年份（4位数的年），
        // %t之后用B表示输出日期的月份的完整名， %t之后用b表示输出日期的月份的简称
        System.out.printf("%1$tY-%1$tB-%1$td; %2$tY-%2$tb-%2$td%n", date, dataL);

        // 以下是常见的日期组合
        // %t之后用D表示以 "%tm/%td/%ty"格式化日期
        System.out.printf("%1$tD%n", date);
        // %t之后用F表示以"%tY-%tm-%td"格式化日期
        System.out.printf("%1$tF%n", date);

        /*** 输出时间类型 ***/
        // 输出时分秒
        // %t之后用H表示输出时间的时（24进制），%t之后用I表示输出时间的时（12进制），
        // %t之后用M表示输出时间的分，%t之后用S表示输出时间的秒
        System.out.printf("%1$tH:%1$tM:%1$tS; %2$tI:%2$tM:%2$tS%n", date, dataL);
        // %t之后用L表示输出时间的秒中的毫秒
        System.out.printf("%1$tH:%1$tM:%1$tS %1$tL%n", date);
        // %t之后p表示输出时间的上午或下午信息
        System.out.printf("%1$tH:%1$tM:%1$tS %1$tL %1$tp%n", date);

        // 以下是常见的时间组合
        // %t之后用R表示以"%tH:%tM"格式化时间
        System.out.printf("%1$tR%n", date);
        // %t之后用T表示以"%tH:%tM:%tS"格式化时间
        System.out.printf("%1$tT%n", date);
        // %t之后用r表示以"%tI:%tM:%tS %Tp"格式化时间
        System.out.printf("%1$tr%n", date);

        /*** 输出星期 ***/
        // %t之后用A表示得到星期几的全称
        System.out.printf("%1$tF %1$tA%n", date);
        // %t之后用a表示得到星期几的简称
        System.out.printf("%1$tF %1$ta%n", date);

        // 输出时间日期的完整信息
        System.out.printf("%1$tc%n", date);
    }
}

```

```reStructuredText
1212end line
Name = Zhangsan
NAME = Zhangsan
Name = Zhang san
true = true; false = false
-500; 2343; 342
37777777014; 4447; 526
fffffe0c; 927; 156
FFFFFE0C; 927; 156
-7.564030e+02; 7.464233e+03; 4.560000e+01
-7.564030E+02; 7.464233E+03; 4.560000E+01
-756.403015; 7464.232641; 45.600000
-756.4; 7464.233; 45.600000
20-09-06; 20-09-06
2020-September-06; 2020-Sep-06
09/06/20
2020-09-06
18:03:51; 06:03:51
18:03:51 273
18:03:51 273 pm
18:03
18:03:51
06:03:51 PM
2020-09-06 Sunday
2020-09-06 Sun
Sun Sep 06 18:03:51 CST 2020
```

### Python

| 转换说明符 | 解释                                   |
| ---------- | -------------------------------------- |
| %d、%i     | 转换为带符号的十进制整数               |
| %o         | 转换为带符号的八进制整数               |
| %x、%X     | 转换为带符号的十六进制整数             |
| %e         | 转化为科学计数法表示的浮点数（e 小写） |
| %E         | 转化为科学计数法表示的浮点数（E 大写） |
| %f、%F     | 转化为十进制浮点数                     |
| %g         | 智能选择使用 %f 或 %e 格式             |
| %G         | 智能选择使用 %F 或 %E 格式             |
| %c         | 格式化字符及其 ASCII 码                |
| %r         | 使用 repr() 函数将表达式转换为字符串   |
| %s         | 使用 str() 函数将表达式转换为字符串    |

```reStructuredText
# 占位符
name = "maywzh的网站"
age = 8
url = "https://maywzh.com"
print("%s已经%d岁了，它的网址是%s。" % (name, age, url))

# 指定宽度
n = 1234567
print("n(10):%10d." % n)
print("n(5):%5d." % n)
url = "http://c.biancheng.net/python/"
print("url(35):%35s." % url)
print("url(20):%20s." % url)

#对齐方式
n = 123456
# %09d 表示最小宽度为9，左边补0
print("n(09):%09d" % n)
# %+9d 表示最小宽度为9，带上符号
print("n(+9):%+9d" % n)
f = 140.5
# %-+010f 表示最小宽度为10，左对齐，带上符号
print("f(-+0):%-+010f" % f)
s = "Hello"
# %-10s 表示最小宽度为10，左对齐
print("s(-10):%-10s." % s)

# 指定小数精度
f = 3.141592653
# 最小宽度为8，小数点后保留3位
print("%8.3f" % f)
# 最小宽度为8，小数点后保留3位，左边补0
print("%08.3f" % f)
# 最小宽度为8，小数点后保留3位，左边补0，带符号
print("%+08.3f" % f)
```



