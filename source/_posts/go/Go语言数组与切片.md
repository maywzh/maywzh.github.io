---
title: Go语言数组与切片
categories: 编程
comments: false
thumbnail: https://i.loli.net/2020/09/04/vY4eq6OIRotf19l.jpg
cover: https://i.loli.net/2020/09/04/vY4eq6OIRotf19l.jpg
date: 2019-01-05 15:47:08
tags:
  - Go
---

初学Go，对于数组与切片往往理解不清，在Python中，只有List这种数据结构，只有切片，而在Go中，作为一种编译性语言，数组与切片在底层原理上有所区别，在此需要结合编译运行时来介绍它们的实现原理。

<!--more-->

## 数组的数据结构与创建

数组是由相同类型元素的集合组成的数据结构，**计算机会为数组分配一块连续的内存来保存其中的元素**，我们可以利用数组中元素的索引快速访问元素对应的存储地址，常见的数组大多都是一维的线性数组，而多维数组在数值和图形计算领域却有比较常见的应用。

![2019-02-20-3D-array](https://i.loli.net/2020/09/04/QoATkRlvJutEDmx.jpg)

数组作为一种基本的数据类型，我们通常都会从两个维度描述数组，我们首先需要描述数组中存储的元素类型，还需要描述数组最大能够存储的元素个数，在 Go 语言中我们往往会使用如下所示的方式来表示数组类型：

```go
[10]int
[200]interface{}
```

与很多语言不同，Go 语言中数组在初始化之后大小就无法改变，存储元素类型相同、但是大小不同的数组类型在 Go 语言看来也是完全不同的，只有两个条件都相同才是同一个类型。

```go
func NewArray(elem *Type, bound int64) *Type {
	if bound < 0 {
		Fatalf("NewArray: invalid bound %v", bound)
	}
	t := New(TARRAY)
	t.Extra = &Array{Elem: elem, Bound: bound}
	t.SetNotInHeap(elem.NotInHeap())
	return t
}
```

编译期间的数组类型是由上述的 [`cmd/compile/internal/types.NewArray`](https://github.com/golang/go/blob/616c39f6a636166447bdaac4f0871a5ca52bae8c/src/cmd/compile/internal/types/type.go#L473-L481) 函数生成的，类型 `Array` 包含两个字段，一个是元素类型 `Elem`，另一个是数组的大小 `Bound`，这两个字段共同构成了数组类型，而当前数组是否应该在堆栈中初始化也在编译期就确定了。



## 初始化

Go 语言中的数组有两种不同的创建方式，一种是显式的指定数组的大小，另一种是使用 `[...]T` 声明数组，Go 语言会在编译期间通过源代码对数组的大小进行推断：

```go
arr1 := [3]int{1, 2, 3}
arr2 := [...]int{1, 2, 3}
```

上述两种声明方式在运行期间得到的结果是完全相同的，后一种声明方式在编译期间就会被『转换』成为前一种，这也就是编译器对数组大小的推导，下面我们来介绍编译器的推导过程。

### 上限推导

两种不同的声明方式会导致编译器做出完全不同的处理，如果我们使用第一种方式 `[10]T`，那么变量的类型在编译进行到类型检查阶段段就会被提取出来，随后会使用 [`cmd/compile/internal/types.NewArray`](https://github.com/golang/go/blob/616c39f6a636166447bdaac4f0871a5ca52bae8c/src/cmd/compile/internal/types/type.go#L473-L481) 函数创建包含数组大小的 `Array` 类型。

当我们使用 `[...]T` 的方式声明数组时，虽然在这一步也会创建一个 `Array` 类型 `Array{Elem: elem, Bound: -1}`，但是其中的数组大小上限会是 `-1`，这里的 `-1` 只是一个占位符，编译器会在后面的 [`cmd/compile/internal/gc.typecheckcomplit`](https://github.com/golang/go/blob/b7d097a4cf6b8a9125e4770b54d33826fa803023/src/cmd/compile/internal/gc/typecheck.go#L2755-L2961) 函数中对该数组的大小进行推导：

```go
func typecheckcomplit(n *Node) (res *Node) {
	...

	switch t.Etype {
	case TARRAY, TSLICE:
		var length, i int64
		nl := n.List.Slice()
		for i2, l := range nl {
			i++
			if i > length {
				length = i
			}
		}

		if t.IsDDDArray() {
			t.SetNumElem(length)
		}
	}
}
```

这个删减后的 [`cmd/compile/internal/gc.typecheckcomplit`](https://github.com/golang/go/blob/b7d097a4cf6b8a9125e4770b54d33826fa803023/src/cmd/compile/internal/gc/typecheck.go#L2755-L2961) 函数通过遍历元素的方式来计算数组中元素的数量。上述代码中的 `DDDArray` 指的就是使用 `[...]T` 声明的数组，因为声明这种数组时需要使用三个点（Dot），所以在编译器中就被称作 `DDDArray`。

所以我们可以看出 `[...]T{1, 2, 3}` 和 `[3]T{1, 2, 3}` 在运行时是完全等价的，`[...]T` 这种初始化方式也只是 Go 语言为我们提供的一种语法糖，当我们不想计算数组中的元素个数时就可以通过这种方法较少一些工作。

### 语句转换

对于一个由字面量组成的数组，根据数组元素数量的不同，编译器会在负责初始化字面量的 [`cmd/compile/internal/gc.anylit`](https://github.com/golang/go/blob/f07059d949057f414dd0f8303f93ca727d716c62/src/cmd/compile/internal/gc/sinit.go#L875-L967) 函数中做两种不同的优化：

1. 当元素数量小于或者等于 4 个时，会直接将数组中的元素放置在栈上；
2. 当元素数量大于 4 个时，会将数组中的元素放置到静态区并在运行时取出；

```go
func anylit(n *Node, var_ *Node, init *Nodes) {
	t := n.Type
	switch n.Op {
	case OSTRUCTLIT, OARRAYLIT:
		if n.List.Len() > 4 {
			...
		}

		fixedlit(inInitFunction, initKindLocalCode, n, var_, init)
	...
	}
}
```

当数组的元素**小于或者等于四个**时，[`cmd/compile/internal/gc.fixedlit`](https://github.com/golang/go/blob/f07059d949057f414dd0f8303f93ca727d716c62/src/cmd/compile/internal/gc/sinit.go#L515-L583) 会负责在函数编译之前将 `[3]{1, 2, 3}` 转换成更加原始的语句：

```go
func fixedlit(ctxt initContext, kind initKind, n *Node, var_ *Node, init *Nodes) {
	var splitnode func(*Node) (a *Node, value *Node)
	...

	for _, r := range n.List.Slice() {
		a, value := splitnode(r)
		a = nod(OAS, a, value)
		a = typecheck(a, ctxStmt)
		switch kind {
		case initKindStatic:
			genAsStatic(a)
		case initKindLocalCode:
			a = orderStmtInPlace(a, map[string][]*Node{})
			a = walkstmt(a)
			init.Append(a)
		}
	}
}
```

当数组中元素的个数小于四个时，[`cmd/compile/internal/gc.fixedlit`](https://github.com/golang/go/blob/f07059d949057f414dd0f8303f93ca727d716c62/src/cmd/compile/internal/gc/sinit.go#L515-L583) 函数接受的 `kind` 是 `initKindLocalCode`，上述代码会将原有的初始化语句 `[3]int{1, 2, 3}` 拆分成一个声明变量的表达式和几个赋值表达式，这些表达式会完成对数组的初始化：

```go
var arr [3]int
arr[0] = 1
arr[1] = 2
arr[2] = 3
```

但是如果当前数组的元素大于 4 个，`anylit` 方法会先获取一个唯一的 `staticname`，然后调用 [`cmd/compile/internal/gc.fixedlit`](https://github.com/golang/go/blob/f07059d949057f414dd0f8303f93ca727d716c62/src/cmd/compile/internal/gc/sinit.go#L515-L583) 函数在静态存储区初始化数组中的元素并将临时变量赋值给当前的数组：

```go
func anylit(n *Node, var_ *Node, init *Nodes) {
	t := n.Type
	switch n.Op {
	case OSTRUCTLIT, OARRAYLIT:
		if n.List.Len() > 4 {
			vstat := staticname(t)
			vstat.Name.SetReadonly(true)

			fixedlit(inNonInitFunction, initKindStatic, n, vstat, init)

			a := nod(OAS, var_, vstat)
			a = typecheck(a, ctxStmt)
			a = walkexpr(a, init)
			init.Append(a)
			break
		}
		
		...
	}
}
```

假设我们在代码中初始化 `[5]int{1, 2, 3, 4, 5}` 数组，那么我们可以将上述过程理解成以下的伪代码：

```go
var arr [5]int
statictmp_0[0] = 1
statictmp_0[1] = 2
statictmp_0[2] = 3
statictmp_0[3] = 4
statictmp_0[4] = 5
arr = statictmp_0
```

总结起来，如果数组中元素的个数小于或者等于 4 个，那么所有的变量会直接在栈上初始化，如果数组元素大于 4 个，变量就会在静态存储区初始化然后拷贝到栈上，这些转换后的代码才会继续进入[中间代码生成](https://draveness.me/golang/docs/part1-prerequisite/ch02-compile/golang-ir-ssa/)和[机器码生成](https://draveness.me/golang/docs/part1-prerequisite/ch02-compile/golang-machinecode/)两个阶段，最后生成可以执行的二进制文件。

## 访问和赋值

无论是在栈上还是静态存储区，数组在内存中其实就是一连串的内存空间，表示数组的方法就是一个指向数组开头的指针、数组中元素的数量以及数组中元素类型占的空间大小，如果我们不知道数组中元素的数量，访问时就可能发生越界，而如果不知道数组中元素类型的大小，就没有办法知道应该一次取出多少字节的数据，如果没有这些信息，我们就无法知道这片连续的内存空间到底存储了什么数据：

![golang-array-memory](https://i.loli.net/2020/09/04/5dHu9LZRQck3EKS.png)

数组访问越界是非常严重的错误，Go 语言中对越界的判断是可以在编译期间由静态类型检查完成的，[`cmd/compile/internal/gc.typecheck1`](https://github.com/golang/go/blob/b7d097a4cf6b8a9125e4770b54d33826fa803023/src/cmd/compile/internal/gc/typecheck.go#L327-L2081) 函数会对访问数组的索引进行验证：

```go
func typecheck1(n *Node, top int) (res *Node) {
	switch n.Op {
	case OINDEX:
		ok |= ctxExpr
		l := n.Left  // array
		r := n.Right // index
		switch n.Left.Type.Etype {
		case TSTRING, TARRAY, TSLICE:
			...
			if n.Right.Type != nil && !n.Right.Type.IsInteger() {
				yyerror("non-integer array index %v", n.Right)
				break
			}
			if !n.Bounded() && Isconst(n.Right, CTINT) {
				x := n.Right.Int64()
				if x < 0 {
					yyerror("invalid array index %v (index must be non-negative)", n.Right)
				} else if n.Left.Type.IsArray() && x >= n.Left.Type.NumElem() {
					yyerror("invalid array index %v (out of bounds for %d-element array)", n.Right, n.Left.Type.NumElem())
				}
			}
		}
	...
	}
}
```

1. 访问数组的索引是非整数时会直接报错 —— `non-integer array index %v`；
2. 访问数组的索引是负数时会直接报错 —— `"invalid array index %v (index must be non-negative)"`；
3. 访问数组的索引越界时会直接报错 —— `"invalid array index %v (out of bounds for %d-element array)"`；

数组和字符串的一些简单越界错误都会在编译期间发现，比如我们直接使用整数或者常量访问数组，但是如果使用变量去访问数组或者字符串时，编译器就无法发现对应的错误了，这时就需要 Go 语言运行时发挥作用了。

```go
arr[4]: invalid array index 4 (out of bounds for 3-element array)
arr[i]: panic: runtime error: index out of range [4] with length 3
```

Go 语言运行时在发现数组、切片和字符串的越界操作会由运行时的 `panicIndex` 和 [`runtime.goPanicIndex`](https://github.com/golang/go/blob/22d28a24c8b0d99f2ad6da5fe680fa3cfa216651/src/runtime/panic.go#L86-L89) 函数触发程序的运行时错误并导致崩溃退出：

```go
TEXT runtime·panicIndex(SB),NOSPLIT,$0-8
	MOVL	AX, x+0(FP)
	MOVL	CX, y+4(FP)
	JMP	runtime·goPanicIndex(SB)

func goPanicIndex(x int, y int) {
	panicCheck1(getcallerpc(), "index out of range")
	panic(boundsError{x: int64(x), signed: true, y: y, code: boundsIndex})
}
```

当数组的访问操作 `OINDEX` 成功通过编译器的检查之后，会被转换成几个 SSA 指令，假设我们有如下所示的 Go 语言代码，通过如下的方式进行编译会得到 `ssa.html` 文件：

```go
package check

func outOfRange() int {
	arr := [3]int{1, 2, 3}
	i := 4
	elem := arr[i]
	return elem
}

$ GOSSAFUNC=outOfRange go build array.go
dumped SSA to ./ssa.html
```

`start` 阶段生成的 SSA 代码就是优化之前的第一版中间代码，下面展示的部分就是 `elem := arr[i]` 对应的中间代码，在这段中间代码中我们发现 Go 语言为数组的访问操作生成了判断数组上限的指令 `IsInBounds` 以及当条件不满足时触发程序崩溃的 `PanicBounds` 指令：

```go
b1:
    ...
    v22 (6) = LocalAddr <*[3]int> {arr} v2 v20
    v23 (6) = IsInBounds <bool> v21 v11
If v23 → b2 b3 (likely) (6)

b2: ← b1-
    v26 (6) = PtrIndex <*int> v22 v21
    v27 (6) = Copy <mem> v20
    v28 (6) = Load <int> v26 v27 (elem[int])
    ...
Ret v30 (+7)

b3: ← b1-
    v24 (6) = Copy <mem> v20
    v25 (6) = PanicBounds <mem> [0] v21 v11 v24
Exit v25 (6)
```

`PanicBounds` 指令最终会被转换成上面提到的 `panicIndex` 函数，当数组下标没有越界时，编译器会先获取数组的内存地址和访问的下标，然后利用 `PtrIndex` 计算出目标元素的地址，再使用 `Load` 操作将指针中的元素加载到内存中。

当然只有当编译器无法对数组下标是否越界无法做出判断时才会加入 `PanicBounds` 指令交给运行时进行判断，在使用字面量整数访问数组下标时就会生成非常简单的中间代码，当我们将上述代码中的 `arr[i]` 改成 `arr[2]` 时，就会得到如下所示的代码：

```go
b1:
    ...
    v21 (5) = LocalAddr <*[3]int> {arr} v2 v20
    v22 (5) = PtrIndex <*int> v21 v14
    v23 (5) = Load <int> v22 v20 (elem[int])
    ...
```

Go 语言对于数组的访问还是有着比较多的检查的，它不仅会在编译期间提前发现一些简单的越界错误并插入用于检测数组上限的函数调用，而在运行期间这些插入的函数会负责保证不会发生越界错误。

数组的赋值和更新操作 `a[i] = 2` 也会生成 SSA 生成期间计算出数组当前元素的内存地址，然后修改当前内存地址的内容，这些赋值语句会被转换成如下所示的 SSA 操作：

```go
b1:
    ...
    v21 (5) = LocalAddr <*[3]int> {arr} v2 v19
    v22 (5) = PtrIndex <*int> v21 v13
    v23 (5) = Store <mem> {int} v22 v20 v19
    ...
```

赋值的过程中会先确定目标数组的地址，再通过 `PtrIndex` 获取目标元素的地址，最后使用 `Store` 指令将数据存入地址中，从上面的这些 SSA 代码中我们可以看出无论是数组的寻址还是赋值都是在编译阶段完成的，没有运行时的参与。

## 总结

数组是 Go 语言中重要的数据结构，了解它的实现能够帮助我们更好地理解这门语言，通过对其实现的分析，我们知道了对数组的访问和赋值需要同时依赖编译器和运行时，它的大多数操作在编译期间都会转换成对内存的直接读写，在中间代码生成期间，编译器还会插入运行时方法 `panicIndex` 调用防止发生越界错误。

## 参考

- [Arrays, slices (and strings): The mechanics of ‘append’](https://blog.golang.org/slices)

- [Array vs Slice: accessing speed](https://stackoverflow.com/questions/30525184/array-vs-slice-accessing-speed)