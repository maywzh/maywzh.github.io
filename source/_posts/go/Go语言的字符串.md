---
title: Go语言的字符串
categories: 编程
comments: false
thumbnail: https://i.loli.net/2020/12/26/acjRWpdMxSnIBUq.png
cover: https://i.loli.net/2020/12/26/acjRWpdMxSnIBUq.png
date: 2020-01-06 18:03:03
tags:
  - Go
---

字符串是 Go 语言中最常用的基础数据类型之一，虽然字符串往往被看做一个整体，但是实际上字符串是一片连续的内存空间，我们也可以将它理解成一个由字符组成的数组，本文就会详细介绍字符串的实现原理、相关转换过程以及常见操作的实现。

<!--more-->

字符串虽然在 Go 语言中是基本类型 `string`，但是它实际上是由字符组成的数组，C 语言中的字符串就使用字符数组 `char[]` 表示，作为数组会占用一片连续的内存空间，这片内存空间存储了的字节共同组成了字符串，Go 语言中的字符串其实是一个只读的字节数组，下图展示了 `"hello"` 字符串在内存中的存储方式：

![in-memory-string](https://i.loli.net/2020/09/04/D6RhWCdKk7oXeOp.png)

如果是代码中存在的字符串，会在编译期间被标记成只读数据 `SRODATA` 符号，假设我们有以下的一段代码，其中包含了一个字符串，当我们将这段代码编译成汇编语言时，就能够看到 `hello` 字符串有一个 `SRODATA` 的标记：

```bash
$ cat main.go
package main

func main() {
	str := "hello"
	println([]byte(str))
}

$ GOOS=linux GOARCH=amd64 go tool compile -S main.go
...
go.string."hello" SRODATA dupok size=5
	0x0000 68 65 6c 6c 6f                                   hello
... 
```

只读只意味着字符串会分配到只读的内存空间并且这块内存不会被修改，但是在运行时我们其实还是可以将这段内存拷贝到堆或者栈上，将变量的类型转换成 `[]byte` 之后就可以进行，修改后通过类型转换就可以变回 `string`，Go 语言只是不支持直接修改 `string` 类型变量的内存空间。

## 数据结构

字符串在 Go 语言中的接口其实非常简单，每一个字符串在运行时都会使用如下的 `StringHeader` 结构体表示，在运行时包的内部其实有一个私有的结构 `stringHeader`，它有着完全相同的结构只是用于存储数据的 `Data` 字段使用了 `unsafe.Pointer` 类型：

```go
type StringHeader struct {
	Data uintptr
	Len  int
}
```

我们会经常会说字符串是一个只读的[切片](https://draveness.me/golang/docs/part2-foundation/ch03-datastructure/golang-array-and-slice/)类型，这是因为切片在 Go 语言的运行时表示与字符串高度相似：

```go
type SliceHeader struct {
	Data uintptr
	Len  int
	Cap  int
}
```

与切片的结构体相比，字符串少了一个表示容量的 `Cap` 字段，因为字符串作为只读的类型，我们并不会直接向字符串直接追加元素改变其本身的内存空间，所有在字符串上执行的写入操作实际都是通过拷贝实现的。

## 解析过程

字符串的解析一定是解析器在词法分析时就完成的，词法分析阶段会对源文件中的字符串进行切片和分组，将原有无意义的字符流转换成 Token 序列，在 Go 语言中，有两种字面量方式可以声明一个字符串，一种是使用双引号，另一种是使用反引号:

```go
str1 := "this is a string"
str2 := `this is another 
string`
```

使用双引号声明的字符串和其他语言中的字符串没有太多的区别，它只能用于单行字符串的初始化，如果字符串内部出现双引号，需要使用 `\` 符号避免编译器的解析错误，而反引号声明的字符串就可以摆脱单行的限制，因为双引号不再负责标记字符串的开始和结束，我们可以在字符串内部直接使用 `"`，在遇到需要手写 JSON 或者其他复杂数据格式的场景下非常方便。

```go
json := `{"author": "draven", "tags": ["golang"]}`
```

两种不同的声明方式其实也意味着 Go 语言的编译器需要在解析的阶段能够区分并且正确解析这两种不同的字符串格式，解析字符串使用的 `scanner` 扫描器，它的功能就是将输入的字符流转换成 Token 流，[`cmd/compile/internal/syntax.scanner.stdString`](https://github.com/golang/go/blob/cdd2c265cc132a15e20298fbb083a70d7f3b495d/src/cmd/compile/internal/syntax/scanner.go#L641-L669) 方法就是它用来解析使用双引号包裹的标准字符串：

```go
func (s *scanner) stdString() {
	s.startLit()
	for {
		r := s.getr()
		if r == '"' {
			break
		}
		if r == '\\' {
			s.escape('"')
			continue
		}
		if r == '\n' {
			s.ungetr()
			s.error("newline in string")
			break
		}
		if r < 0 {
			s.errh(s.line, s.col, "string not terminated")
			break
		}
	}
	s.nlsemi = true
	s.lit = string(s.stopLit())
	s.kind = StringLit
	s.tok = _Literal
}
```

从这个方法的实现我们能分析出 Go 语言处理标准字符串的逻辑：

1. 标准字符串使用双引号表示开头和结尾；
2. 标准字符串中需要使用反斜杠 `\` 来 `escape` 双引号；
3. 标准字符串中不能出现如下所示的隐式换行符号 `\n`；

```go
str := "start
end"
```

使用反引号声明的原始字符串的解析规则就非常简单了，[`cmd/compile/internal/syntax.scanner.rawString`](https://github.com/golang/go/blob/cdd2c265cc132a15e20298fbb083a70d7f3b495d/src/cmd/compile/internal/syntax/scanner.go#L671-L693) 会将非反引号的所有字符都划分到当前字符串的范围中，所以我们可以使用它来支持复杂的多行字符串：

```go
func (s *scanner) rawString() {
	s.startLit()
	for {
		r := s.getr()
		if r == '`' {
			break
		}
		if r < 0 {
			s.errh(s.line, s.col, "string not terminated")
			break
		}
	}
	s.nlsemi = true
	s.lit = string(s.stopLit())
	s.kind = StringLit
	s.tok = _Literal
}
```

无论是标准字符串还是原始字符串最终都会被标记成 `StringLit` 类型的 Token 并传递到编译的下一个阶段 — [语法分析](https://draveness.me/golang/docs/part1-prerequisite/ch02-compile/golang-lexer-and-parser/)，在语法分析阶段，与字符串相关的表达式都会使用如下的方法 [`cmd/compile/internal/gc.noder.basicLit`](https://github.com/golang/go/blob/b7d097a4cf6b8a9125e4770b54d33826fa803023/src/cmd/compile/internal/gc/noder.go#L1349-L1408) 处理：

```go
func (p *noder) basicLit(lit *syntax.BasicLit) Val {
	switch s := lit.Value; lit.Kind {
	case syntax.StringLit:
		if len(s) > 0 && s[0] == '`' {
			s = strings.Replace(s, "\r", "", -1)
		}
		u, _ := strconv.Unquote(s)
		return Val{U: u}
	}
}
```

无论是 `import` 语句中包的路径、结构体中的字段标签还是表达式中的字符串都会使用这个方法将原生字符串中最后的换行符删除并对字符串 Token 进行 Unquote，也就是去掉字符串两遍的引号等无关干扰，还原其本来的面目。

`strconv.Unquote` 方法处理了很多边界条件导致整个函数非常复杂，不仅包括各种不同引号的处理，还包括 UTF-8 等编码的相关问题，所以在这里也就不展开介绍了。

## 拼接

Go 语言拼接字符串会使用 `+` 符号，编译器会将该符号对应的 `OADD` 节点转换成 `OADDSTR` 类型的节点，随后在 [`cmd/compile/internal/gc.walkexpr`](https://github.com/golang/go/blob/4d5bb9c60905b162da8b767a8a133f6b4edcaa65/src/cmd/compile/internal/gc/walk.go#L439-L1532) 函数中调用 [`cmd/compile/internal/gc.addstr`](https://github.com/golang/go/blob/bf4990522263503a1219372cd8f1ee9422b51324/src/cmd/compile/internal/gc/walk.go#L2528-L2586) 函数生成用于拼接字符串的代码：

```go
func walkexpr(n *Node, init *Nodes) *Node {
	switch n.Op {
	...
	case OADDSTR:
		n = addstr(n, init)
	}
}
```

[`cmd/compile/internal/gc.addstr`](https://github.com/golang/go/blob/bf4990522263503a1219372cd8f1ee9422b51324/src/cmd/compile/internal/gc/walk.go#L2528-L2586) 函数能帮助我们在编译期间选择合适的函数对字符串进行拼接，如果需要拼接的字符串小于或者等于 5 个，那么就会直接调用 `concatstring{2,3,4,5}` 等一系列函数，如果超过 5 个就会直接选择 [`runtime.concatstrings`](https://github.com/golang/go/blob/8174f7fb2b64c221f7f80c9f7fd4d7eb317ac8bb/src/runtime/string.go#L23-L55) 传入一个数组切片。

```go
func addstr(n *Node, init *Nodes) *Node {
	c := n.List.Len()

	buf := nodnil()
	args := []*Node{buf}
	for _, n2 := range n.List.Slice() {
		args = append(args, conv(n2, types.Types[TSTRING]))
	}

	var fn string
	if c <= 5 {
		fn = fmt.Sprintf("concatstring%d", c)
	} else {
		fn = "concatstrings"

		t := types.NewSlice(types.Types[TSTRING])
		slice := nod(OCOMPLIT, nil, typenod(t))
		slice.List.Set(args[1:])
		args = []*Node{buf, slice}
	}

	cat := syslook(fn)
	r := nod(OCALL, cat, nil)
	r.List.Set(args)
	...

	return r
}
```

其实无论使用 `concatstring{2,3,4,5}` 中的哪一个，最终都会调用 [`runtime.concatstrings`](https://github.com/golang/go/blob/8174f7fb2b64c221f7f80c9f7fd4d7eb317ac8bb/src/runtime/string.go#L23-L55)，该函数会先对传入的切片参数进行遍历，先过滤空字符串并计算拼接后字符串的长度。

```go
func concatstrings(buf *tmpBuf, a []string) string {
	idx := 0
	l := 0
	count := 0
	for i, x := range a {
		n := len(x)
		if n == 0 {
			continue
		}
		l += n
		count++
		idx = i
	}
	if count == 0 {
		return ""
	}
	if count == 1 && (buf != nil || !stringDataOnStack(a[idx])) {
		return a[idx]
	}
	s, b := rawstringtmp(buf, l)
	for _, x := range a {
		copy(b, x)
		b = b[len(x):]
	}
	return s
}
```

如果非空字符串的数量为 1 并且当前的字符串不在栈上就可以直接返回该字符串，不需要进行额外的任何操作。

![string-concat-and-copy](https://i.loli.net/2020/09/04/vroRD3qW15dKuHh.png)

但是在正常情况下，运行时会调用 `copy` 将输入的多个字符串拷贝到目标字符串所在的内存空间中，新的字符串是一片新的内存空间，与原来的字符串也没有任何关联，**一旦需要拼接的字符串非常大，拷贝带来的性能损失就是无法忽略的**。

## 类型转换

当我们使用 Go 语言解析和序列化 JSON 等数据格式时，经常需要将数据在 `string` 和 `[]byte` 之间来回转换，类型转换的开销并没有想象的那么小，我们经常会看到 [`runtime.slicebytetostring`](https://github.com/golang/go/blob/8174f7fb2b64c221f7f80c9f7fd4d7eb317ac8bb/src/runtime/string.go#L75-L108) 等函数出现在火焰图中，成为程序的性能热点。

从字节数组到字符串的转换就需要使用 [`runtime.slicebytetostring`](https://github.com/golang/go/blob/8174f7fb2b64c221f7f80c9f7fd4d7eb317ac8bb/src/runtime/string.go#L75-L108) 函数，例如：`string(bytes)`，该函数在函数体中会先处理两种比较常见的情况，也就是字节数组的长度为 0 或者 1，这两个情况处理起来都非常简单：

```go
func slicebytetostring(buf *tmpBuf, b []byte) (str string) {
	l := len(b)
	if l == 0 {
		return ""
	}
	if l == 1 {
		stringStructOf(&str).str = unsafe.Pointer(&staticbytes[b[0]])
		stringStructOf(&str).len = 1
		return
	}
	var p unsafe.Pointer
	if buf != nil && len(b) <= len(buf) {
		p = unsafe.Pointer(buf)
	} else {
		p = mallocgc(uintptr(len(b)), nil, false)
	}
	stringStructOf(&str).str = p
	stringStructOf(&str).len = len(b)
	memmove(p, (*(*slice)(unsafe.Pointer(&b))).array, uintptr(len(b)))
	return
}
```

处理过后会根据传入的缓冲区大小决定是否需要为新的字符串分配一片内存空间，[`runtime.stringStructOf`](https://github.com/golang/go/blob/8174f7fb2b64c221f7f80c9f7fd4d7eb317ac8bb/src/runtime/string.go#L229-L231) 会将传入的字符串指针转换成 `stringStruct` 结构体指针，然后设置结构体持有的字符串指针 `str` 和长度 `len`，最后通过 `memmove` 将原 `[]byte` 中的字节全部复制到新的内存空间中。

当我们想要将字符串转换成 `[]byte` 类型时，就需要使用 [`runtime.stringtoslicebyte`](https://github.com/golang/go/blob/8174f7fb2b64c221f7f80c9f7fd4d7eb317ac8bb/src/runtime/string.go#L155-L165) 函数，该函数的实现非常容易理解：

```go
func stringtoslicebyte(buf *tmpBuf, s string) []byte {
	var b []byte
	if buf != nil && len(s) <= len(buf) {
		*buf = tmpBuf{}
		b = buf[:len(s)]
	} else {
		b = rawbyteslice(len(s))
	}
	copy(b, s)
	return b
}
```

如果向该函数传入了缓冲区，那么它会使用传入的缓冲区存储 `[]byte`，没有传入缓冲区时，运行时会调用 [`runtime.rawbyteslice`](https://github.com/golang/go/blob/8174f7fb2b64c221f7f80c9f7fd4d7eb317ac8bb/src/runtime/string.go#L270-L279) 创建一个新的字节切片，`copy` 就会将字符串中的内容拷贝到新的 `[]byte` 中。

![string-bytes-conversion](https://i.loli.net/2020/09/04/DVsZNaPgfWS75dX.png)

字符串和 `[]byte` 中的内容虽然一样，但是字符串的内容是只读的，我们不能通过下标或者其他形式改变其中的数据，而 `[]byte` 中的内容是可以读写的，无论从哪种类型转换到另一种都需要对其中的内容进行拷贝，而内存拷贝的性能损耗会随着字符串和 `[]byte` 长度的增长而增长。

## 小结

字符串是 Go 语言中相对来说比较简单的一种数据结构，我们在本文中详细分析了字符串与 `[]byte` 类型的关系，从词法分析阶段理解字符串是如何被解析的，作为只读的数据类型，我们无法改变其本身的结构，但是在做拼接和类型转换等操作时时一定要注意性能的损耗，遇到需要极致性能的场景一定要尽量减少类型转换的次数。

## 参考

- [Strings in Go](https://go101.org/article/string.html)
- [Strings, bytes, runes and characters in Go](https://blog.golang.org/strings)
- [UTF-8 · Wikipedia](https://en.wikipedia.org/wiki/UTF-8)
- [How encode [\]rune into []byte using utf8 in golang?](https://stackoverflow.com/questions/29255746/how-encode-rune-into-byte-using-utf8-in-golang)
- [Conversions to and from a string type](https://golang.org/ref/spec#Conversions_to_and_from_a_string_type)
- [十分钟搞清字符集和字符编码](http://cenalulu.github.io/linux/character-encoding/)