---
title: Go语言的反射
categories: 编程
comments: false
thumbnail: https://i.loli.net/2020/09/04/vY4eq6OIRotf19l.jpg
cover: https://i.loli.net/2020/09/04/vY4eq6OIRotf19l.jpg
mathjax: false
date: 2020-01-18 00:03:35
tags:
  - Go
---

反射是 Go 语言比较重要的特性。虽然在大多数的应用和服务中并不常见，但是很多框架都依赖 Go 语言的反射机制实现简化代码的逻辑。因为 Go 语言的语法元素很少、设计简单，所以它没有特别强的表达能力，但是 Go 语言的 [`reflect`](https://golang.org/pkg/reflect/) 包能够弥补它在语法上的一些劣势。

<!--more-->

[`reflect`](https://golang.org/pkg/reflect/) 实现了运行时的反射能力，能够让程序操作不同类型的对象。反射包中有两对非常重要的函数和类型，[`reflect.TypeOf`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/type.go#L1365-L1368) 能获取类型信息，[`reflect.ValueOf`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/value.go#L2316-L2328) 能获取数据的运行时表示，另外两个类型是 `Type` 和 `Value`，它们与函数是一一对应的关系：

![golang-reflection](https://i.loli.net/2020/09/11/ed6U9csrRv57onb.png)

类型 `Type` 是反射包定义的一个接口，我们可以使用 [`reflect.TypeOf`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/type.go#L1365-L1368) 函数获取任意变量的的类型，`Type` 接口中定义了一些有趣的方法，`MethodByName` 可以获取当前类型对应方法的引用、`Implements` 可以判断当前类型是否实现了某个接口：

```go
type Type interface {
        Align() int
        FieldAlign() int
        Method(int) Method
        MethodByName(string) (Method, bool)
        NumMethod() int
        ...
        Implements(u Type) bool
        ...
}
```

反射包中 `Value` 的类型与 `Type` 不同，它被声明成了结构体。这个结构体没有对外暴露的字段，但是提供了获取或者写入数据的方法：

```go
type Value struct {
        // contains filtered or unexported fields
}

func (v Value) Addr() Value
func (v Value) Bool() bool
func (v Value) Bytes() []byte
...
```

反射包中的所有方法基本都是围绕着 `Type` 和 `Value` 这两个类型设计的。我们通过 [`reflect.TypeOf`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/type.go#L1365-L1368)、[`reflect.ValueOf`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/value.go#L2316-L2328) 可以将一个普通的变量转换成『反射』包中提供的 `Type` 和 `Value`，随后就可以使用反射包中的方法对它们进行复杂的操作。

## 三大法则

运行时反射是程序在运行期间检查其自身结构的一种方式。反射带来的灵活性是一把双刃剑，反射作为一种元编程方式可以减少重复代码，其中包括：

1. 从 `interface{}` 变量可以反射出反射对象；
2. 从反射对象可以获取 `interface{}` 变量；
3. 要修改反射对象，其值必须可设置；

### 第一法则

反射的第一法则是我们能将 Go 语言的 `interface{}` 变量转换成反射对象。很多读者可能会对这以法则产生困惑 —— 为什么是从 `interface{}` 变量到反射对象？当我们执行 `reflect.ValueOf(1)` 时，虽然看起来是获取了基本类型 `int` 对应的反射类型，但是由于 [`reflect.TypeOf`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/type.go#L1365-L1368)、[`reflect.ValueOf`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/value.go#L2316-L2328) 两个方法的入参都是 `interface{}` 类型，所以在方法执行的过程中发生了类型转换。

在[函数调用](http://draveness.me/golang-function-call)一节中曾经介绍过，Go 语言的函数调用都是值传递的，变量会在函数调用时进行类型转换。基本类型 `int` 会转换成 `interface{}` 类型，这也就是为什么第一条法则是『从接口到反射对象』。

上面提到的 [`reflect.TypeOf`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/type.go#L1365-L1368) 和 [`reflect.ValueOf`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/value.go#L2316-L2328) 函数就能完成这里的转换，如果我们认为 Go 语言的类型和反射类型处于两个不同的『世界』，那么这两个函数就是连接这两个世界的桥梁。

![golang-interface-to-reflection](https://i.loli.net/2020/09/11/4itVukPmpZM73dg.png)

**接口到反射对象**

我们通过以下例子简单介绍这两个函数的作用，[`reflect.TypeOf`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/type.go#L1365-L1368) 获取了变量 `author` 的类型，[`reflect.ValueOf`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/value.go#L2316-L2328) 获取了变量的值 `draven`。如果我们知道了一个变量的类型和值，那么就意味着知道了这个变量的全部信息。

```go
package main

import (
	"fmt"
	"reflect"
)

func main() {
	author := "draven"
	fmt.Println("TypeOf author:", reflect.TypeOf(author))
	fmt.Println("ValueOf author:", reflect.ValueOf(author))
}

$ go run main.go
TypeOf author: string
ValueOf author: draven
```

有了变量的类型之后，我们可以通过 `Method` 方法获得类型实现的方法，通过 `Field` 获取类型包含的全部字段。对于不同的类型，我们也可以调用不同的方法获取相关信息：

- 结构体：获取字段的数量并通过下标和字段名获取字段 `StructField`；
- 哈希表：获取哈希表的 `Key` 类型；
- 函数或方法：获取入参和返回值的类型；
- …

总而言之，使用 [`reflect.TypeOf`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/type.go#L1365-L1368) 和 [`reflect.ValueOf`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/value.go#L2316-L2328) 能够获取 Go 语言中的变量对应的反射对象。一旦获取了反射对象，我们就能得到跟当前类型相关数据和操作，并可以使用这些运行时获取的结构执行方法。

### 第二法则

反射的第二法则是我们可以从反射对象可以获取 `interface{}` 变量。既然能够将接口类型的变量转换成反射对象，那么一定需要其他方法将反射对象还原成接口类型的变量，[`reflect`](https://golang.org/pkg/reflect/) 中的 [`reflect.Value.Interface`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/value.go#L992-L994) 方法就能完成这项工作：

![golang-reflection-to-interface](https://i.loli.net/2020/09/11/bvghG2u3EILPRrx.png)

**反射对象到接口**

不过调用 [`reflect.Value.Interface`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/value.go#L992-L994) 方法只能获得 `interface{}` 类型的变量，如果想要将其还原成最原始的状态还需要经过如下所示的显式类型转换：

```go
v := reflect.ValueOf(1)
v.Interface().(int)
```

从反射对象到接口值的过程就是从接口值到反射对象的镜面过程，两个过程都需要经历两次转换：

- 从接口值到反射对象：
  - 从基本类型到接口类型的类型转换；
  - 从接口类型到反射对象的转换；
- 从反射对象到接口值：
  - 反射对象转换成接口类型；
  - 通过显式类型转换变成原始类型；

![golang-bidirectional-reflection](https://i.loli.net/2020/09/11/WUurJpdtQ9fTa7Z.png)**接口和反射对象的双向转换**

当然不是所有的变量都需要类型转换这一过程。如果变量本身就是 `interface{}` 类型，那么它不需要类型转换，因为类型转换这一过程一般都是隐式的，所以我不太需要关心它，只有在我们需要将反射对象转换回基本类型时才需要显式的转换操作。

### 第三法则

Go 语言反射的最后一条法则是与值是否可以被更改有关，如果我们想要更新一个 `reflect.Value`，那么它持有的值一定是可以被更新的，假设我们有以下代码：

```go
func main() {
	i := 1
	v := reflect.ValueOf(i)
	v.SetInt(10)
	fmt.Println(i)
}

$ go run reflect.go
panic: reflect: reflect.flag.mustBeAssignable using unaddressable value

goroutine 1 [running]:
reflect.flag.mustBeAssignableSlow(0x82, 0x1014c0)
	/usr/local/go/src/reflect/value.go:247 +0x180
reflect.flag.mustBeAssignable(...)
	/usr/local/go/src/reflect/value.go:234
reflect.Value.SetInt(0x100dc0, 0x414020, 0x82, 0x1840, 0xa, 0x0)
	/usr/local/go/src/reflect/value.go:1606 +0x40
main.main()
	/tmp/sandbox590309925/prog.go:11 +0xe0
```

运行上述代码会导致程序崩溃并报出 `reflect: reflect.flag.mustBeAssignable using unaddressable value` 错误，仔细思考一下就能够发现出错的原因，Go 语言的[函数调用](http://draveness.me/golang-function-call)都是传值的，所以我们得到的反射对象跟最开始的变量没有任何关系，所以直接对它修改会导致崩溃。

想要修改原有的变量只能通过如下的方法：

```go
func main() {
	i := 1
	v := reflect.ValueOf(&i)
	v.Elem().SetInt(10)
	fmt.Println(i)
}

$ go run reflect.go
10
```

1. 调用 [`reflect.ValueOf`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/value.go#L2316-L2328) 函数获取变量指针；
2. 调用 [`reflect.Value.Elem`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/value.go#L788-L821) 方法获取指针指向的变量；
3. 调用 [`reflect.Value.SetInt`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/value.go#L1600-L1616) 方法更新变量的值：

由于 Go 语言的函数调用都是值传递的，所以我们只能先获取指针对应的 `reflect.Value`，再通过 [`reflect.Value.Elem`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/value.go#L788-L821) 方法迂回的方式得到可以被设置的变量，我们通过如下所示的代码理解这个过程：

```go
func main() {
	i := 1
	v := &i
	*v = 10
}
```

如果不能直接操作 `i` 变量修改其持有的值，我们就只能获取 `i` 变量所在地址并使用 `*v` 修改所在地址中存储的整数。

## 类型和值

Go 语言的 `interface{}` 类型在语言内部是通过 `emptyInterface` 这个结体来表示的，其中的 `rtype` 字段用于表示变量的类型，另一个 `word` 字段指向内部封装的数据：

```go
type emptyInterface struct {
	typ  *rtype
	word unsafe.Pointer
}
```

用于获取变量类型的 [`reflect.TypeOf`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/type.go#L1365-L1368) 函数将传入的变量隐式转换成 `emptyInterface` 类型并获取其中存储的类型信息 `rtype`：

```go
func TypeOf(i interface{}) Type {
	eface := *(*emptyInterface)(unsafe.Pointer(&i))
	return toType(eface.typ)
}

func toType(t *rtype) Type {
	if t == nil {
		return nil
	}
	return t
}
```

`rtype` 就是一个实现了 `Type` 接口的结构体，我们能在 [`reflect`](https://golang.org/pkg/reflect/) 包中找到如下所示的 [`reflect.rtype.String`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/type.go#L752-L758) 方法帮助我们获取当前类型的名称等信息：

```go
func (t *rtype) String() string {
	s := t.nameOff(t.str).name()
	if t.tflag&tflagExtraStar != 0 {
		return s[1:]
	}
	return s
}
```

[`reflect.TypeOf`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/type.go#L1365-L1368) 函数的实现原理其实并不复杂，它只是将一个 `interface{}` 变量转换成了内部的 `emptyInterface` 表示，然后从中获取相应的类型信息。

用于获取接口值 `Value` 的函数 [`reflect.ValueOf`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/value.go#L2316-L2328) 实现也非常简单，在该函数中我们先调用了 [`reflect.escapes`](https://github.com/golang/go/blob/4e8d27068df52eb372dc2ba7e929e47850934805/src/reflect/value.go#L2779-L2783) 函数保证当前值逃逸到堆上，然后通过 [`reflect.unpackEface`](https://github.com/golang/go/blob/4e8d27068df52eb372dc2ba7e929e47850934805/src/reflect/value.go#L140-L152) 方法从接口中获取 `Value` 结构体：

```go
func ValueOf(i interface{}) Value {
	if i == nil {
		return Value{}
	}

	escapes(i)

	return unpackEface(i)
}

func unpackEface(i interface{}) Value {
	e := (*emptyInterface)(unsafe.Pointer(&i))
	t := e.typ
	if t == nil {
		return Value{}
	}
	f := flag(t.Kind())
	if ifaceIndir(t) {
		f |= flagIndir
	}
	return Value{t, e.word, f}
}
```

[`reflect.unpackEface`](https://github.com/golang/go/blob/4e8d27068df52eb372dc2ba7e929e47850934805/src/reflect/value.go#L140-L152) 函数会将传入的接口转换成 `emptyInterface` 结构体，然后将具体类型和指针包装成 `Value` 结构体并返回。

[`reflect.TypeOf`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/type.go#L1365-L1368) 和 [`reflect.ValueOf`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/value.go#L2316-L2328) 函数的实现都很简单。我们已经分析了这两个函数的实现，现在需要了解编译器在调用函数之前做了哪些工作：

```go
package main

import (
	"reflect"
)

func main() {
	i := 20
	_ = reflect.TypeOf(i)
}

$ go build -gcflags="-S -N" main.go
...
MOVQ	$20, ""..autotmp_20+56(SP) // autotmp = 20
LEAQ	type.int(SB), AX           // AX = type.int(SB)
MOVQ	AX, ""..autotmp_19+280(SP) // autotmp_19+280(SP) = type.int(SB)
LEAQ	""..autotmp_20+56(SP), CX  // CX = 20
MOVQ	CX, ""..autotmp_19+288(SP) // autotmp_19+288(SP) = 20
...
```

从上面这段截取的汇编语言，我们发现在函数调用之前已经发生了类型转换，上述指令将 `int` 类型的变量转换成了占用 16 字节 `autotmp_19+280(SP) ~ autotmp_19+288(SP)` 的接口，两个 `LEAQ` 指令分别获取了类型的指针 `type.int(SB)` 以及变量 `i` 所在的地址。

当我们想要将一个变量转换成反射对象时，Go 语言会在编译期间完成类型转换的工作，将变量的类型和值转换成了 `interface{}` 并等待运行期间使用 [`reflect`](https://golang.org/pkg/reflect/) 包获取接口中存储的信息。

## 更新变量

当我们想要更新一个 `reflect.Value`，就需要调用 [`reflect.Value.Set`](https://github.com/golang/go/blob/4e8d27068df52eb372dc2ba7e929e47850934805/src/reflect/value.go#L1525-L1538) 方法更新反射对象，该方法会调用 [`reflect.flag.mustBeAssignable`](https://github.com/golang/go/blob/4e8d27068df52eb372dc2ba7e929e47850934805/src/reflect/value.go#L232-L236) 和 [`reflect.flag.mustBeExported`](https://github.com/golang/go/blob/4e8d27068df52eb372dc2ba7e929e47850934805/src/reflect/value.go#L214-L218) 分别检查当前反射对象是否是可以被设置的以及字段是否是对外公开的：

```go
func (v Value) Set(x Value) {
	v.mustBeAssignable()
	x.mustBeExported()
	var target unsafe.Pointer
	if v.kind() == Interface {
		target = v.ptr
	}
	x = x.assignTo("reflect.Set", v.typ, target)
	typedmemmove(v.typ, v.ptr, x.ptr)
}
```

[`reflect.Value.Set`](https://github.com/golang/go/blob/4e8d27068df52eb372dc2ba7e929e47850934805/src/reflect/value.go#L1525-L1538) 方法会调用 [`reflect.Value.assignTo`](https://github.com/golang/go/blob/4e8d27068df52eb372dc2ba7e929e47850934805/src/reflect/value.go#L2370-L2404) 并返回一个新的反射对象，这个返回的反射对象指针就会直接覆盖原始的反射变量。

```go
func (v Value) assignTo(context string, dst *rtype, target unsafe.Pointer) Value {
	...
	switch {
	case directlyAssignable(dst, v.typ):
		...
		return Value{dst, v.ptr, fl}
	case implements(dst, v.typ):
		if v.Kind() == Interface && v.IsNil() {
			return Value{dst, nil, flag(Interface)}
		}
		x := valueInterface(v, false)
		if dst.NumMethod() == 0 {
			*(*interface{})(target) = x
		} else {
			ifaceE2I(dst, x, target)
		}
		return Value{dst, target, flagIndir | flag(Interface)}
	}
	panic(context + ": value of type " + v.typ.String() + " is not assignable to type " + dst.String())
}
```

[`reflect.Value.assignTo`](https://github.com/golang/go/blob/4e8d27068df52eb372dc2ba7e929e47850934805/src/reflect/value.go#L2370-L2404) 会根据当前和被设置的反射对象类型创建一个新的 `Value` 结构体：

- 如果两个反射对象的类型是可以被直接替换，就会直接将目标反射对象返回；
- 如果当前反射对象是接口并且目标对象实现了接口，就会将目标对象简单包装成接口值；

在变量更新的过程中，[`reflect.Value.assignTo`](https://github.com/golang/go/blob/4e8d27068df52eb372dc2ba7e929e47850934805/src/reflect/value.go#L2370-L2404) 返回的 `reflect.Value` 中的指针会覆盖当前反射对象中的指针实现变量的更新。

## 实现协议

[`reflect`](https://golang.org/pkg/reflect/) 包还为我们提供了 [`reflect.rtypes.Implements`](https://github.com/golang/go/blob/4e8d27068df52eb372dc2ba7e929e47850934805/src/reflect/type.go#L1430-L1438) 方法可以用于判断某些类型是否遵循特定的接口。在 Go 语言中获取结构体的反射类型 `reflect.Type` 还是比较容易的，但是想要获得接口的类型就需要通过以下方式：

```go
reflect.TypeOf((*<interface>)(nil)).Elem()
```

我们通过一个例子在介绍如何判断一个类型是否实现了某个接口。假设我们需要判断如下代码中的 `CustomError` 是否实现了 Go 语言标准库中的 `error` 接口：

```go
type CustomError struct{}

func (*CustomError) Error() string {
	return ""
}

func main() {
	typeOfError := reflect.TypeOf((*error)(nil)).Elem()
	customErrorPtr := reflect.TypeOf(&CustomError{})
	customError := reflect.TypeOf(CustomError{})

	fmt.Println(customErrorPtr.Implements(typeOfError)) // #=> true
	fmt.Println(customError.Implements(typeOfError)) // #=> false
}
```

上述代码的运行结果正如我们在[接口](https://draveness.me/golang/docs/part2-foundation/ch04-basic/golang-interface/)一节中介绍的：

- `CustomError` 类型并没有实现 `error` 接口；
- `*CustomError` 指针类型实现了 `error` 接口；

抛开上述的执行结果不谈，我们来分析一下 [`reflect.rtypes.Implements`](https://github.com/golang/go/blob/4e8d27068df52eb372dc2ba7e929e47850934805/src/reflect/type.go#L1430-L1438) 方法的工作原理：

```go
func (t *rtype) Implements(u Type) bool {
	if u == nil {
		panic("reflect: nil type passed to Type.Implements")
	}
	if u.Kind() != Interface {
		panic("reflect: non-interface type passed to Type.Implements")
	}
	return implements(u.(*rtype), t)
}
```

[`reflect.rtypes.Implements`](https://github.com/golang/go/blob/4e8d27068df52eb372dc2ba7e929e47850934805/src/reflect/type.go#L1430-L1438) 方法会检查传入的类型是不是接口，如果不是接口或者是空值就会直接 panic 中止当前程序。在参数没有问题的情况下，上述方法会调用私有函数 [`reflect.implements`](https://github.com/golang/go/blob/4e8d27068df52eb372dc2ba7e929e47850934805/src/reflect/type.go#L1461-L1543) 判断类型之间是否有实现关系：

```go
func implements(T, V *rtype) bool {
	t := (*interfaceType)(unsafe.Pointer(T))
	if len(t.methods) == 0 {
		return true
	}
	...
	v := V.uncommon()
	i := 0
	vmethods := v.methods()
	for j := 0; j < int(v.mcount); j++ {
		tm := &t.methods[i]
		tmName := t.nameOff(tm.name)
		vm := vmethods[j]
		vmName := V.nameOff(vm.name)
		if vmName.name() == tmName.name() && V.typeOff(vm.mtyp) == t.typeOff(tm.typ) {
			if i++; i >= len(t.methods) {
				return true
			}
		}
	}
	return false
}
```

如果接口中不包含任何方法，就意味着这是一个空的接口，任意类型都自动实现该接口，这时就会直接返回 `true`。

![golang-type-implements-interface](https://i.loli.net/2020/09/11/kUQRuvsaTMynx5q.png)

**类型实现接口**

在其他情况下，由于方法都是按照字母序存储的，[`reflect.implements`](https://github.com/golang/go/blob/4e8d27068df52eb372dc2ba7e929e47850934805/src/reflect/type.go#L1461-L1543) 会维护两个用于遍历接口和类型方法的索引 `i` 和 `j` 判断类型是否实现了接口，因为最多只会进行 `n` 次比较（类型的方法数量），所以整个过程的时间复杂度是 `O(n)`。

## 方法调用

作为一门静态语言，如果我们想要通过 [`reflect`](https://golang.org/pkg/reflect/) 包利用反射在运行期间执行方法不是一件容易的事情，下面的十几行代码就使用反射来执行 `Add(0, 1)` 函数：

```go
func Add(a, b int) int { return a + b }

func main() {
	v := reflect.ValueOf(Add)
	if v.Kind() != reflect.Func {
		return
	}
	t := v.Type()
	argv := make([]reflect.Value, t.NumIn())
	for i := range argv {
		if t.In(i).Kind() != reflect.Int {
			return
		}
		argv[i] = reflect.ValueOf(i)
	}
	result := v.Call(argv)
	if len(result) != 1 || result[0].Kind() != reflect.Int {
		return
	}
	fmt.Println(result[0].Int()) // #=> 1
}
```

1. 通过 [`reflect.ValueOf`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/value.go#L2316-L2328) 获取函数 `Add` 对应的反射对象；
2. 根据反射对象 [`reflect.rtype.NumIn`](https://github.com/golang/go/blob/4e8d27068df52eb372dc2ba7e929e47850934805/src/reflect/type.go#L979-L985) 方法返回的参数个数创建 `argv` 数组；
3. 多次调用 [`reflect.ValueOf`](https://github.com/golang/go/blob/52c4488471ed52085a29e173226b3cbd2bf22b20/src/reflect/value.go#L2316-L2328) 函数逐一设置 `argv` 数组中的各个参数；
4. 调用反射对象 `Add` 的 [`reflect.Value.Call`](https://github.com/golang/go/blob/4e8d27068df52eb372dc2ba7e929e47850934805/src/reflect/value.go#L318-L322) 方法并传入参数列表；
5. 获取返回值数组、验证数组的长度以及类型并打印其中的数据；

使用反射来调用方法非常复杂，原本只需要一行代码就能完成的工作，现在需要十几行代码才能完成，但这也是在静态语言中使用动态特性需要付出的成本。

```go
func (v Value) Call(in []Value) []Value {
	v.mustBe(Func)
	v.mustBeExported()
	return v.call("Call", in)
}
```

[`reflect.Value.Call`](https://github.com/golang/go/blob/4e8d27068df52eb372dc2ba7e929e47850934805/src/reflect/value.go#L318-L322) 方法是运行时调用方法的入口，它通过两个 `MustBe` 开头的方法确定了当前反射对象的类型是函数以及可见性，随后调用 [`reflect.Value.call`](https://github.com/golang/go/blob/4e8d27068df52eb372dc2ba7e929e47850934805/src/reflect/value.go#L339-L501) 完成方法调用，这个私有方法的执行过程会分成以下的几个部分：

1. 检查输入参数以及类型的合法性；
2. 将传入的 `reflect.Value` 参数数组设置到栈上；
3. 通过函数指针和输入参数调用函数；
4. 从栈上获取函数的返回值；

我们将按照上面的顺序分析使用 [`reflect`](https://golang.org/pkg/reflect/) 进行函数调用的几个过程。

### 参数检查

参数检查是通过反射调用方法的第一步，在参数检查期间我们会从反射对象中取出当前的函数指针 `unsafe.Pointer`，如果该函数指针是方法，那么我们就会通过 [`reflect.methodReceiver`](https://github.com/golang/go/blob/4e8d27068df52eb372dc2ba7e929e47850934805/src/reflect/value.go#L612-L645) 函数获取方法的接受者和函数指针。

```go
func (v Value) call(op string, in []Value) []Value {
	t := (*funcType)(unsafe.Pointer(v.typ))
	...
	if v.flag&flagMethod != 0 {
		rcvr = v
		rcvrtype, t, fn = methodReceiver(op, v, int(v.flag)>>flagMethodShift)
	} else {
		...
	}
	n := t.NumIn()
	if len(in) < n {
		panic("reflect: Call with too few input arguments")
	}
	if len(in) > n {
		panic("reflect: Call with too many input arguments")
	}
	for i := 0; i < n; i++ {
		if xt, targ := in[i].Type(), t.In(i); !xt.AssignableTo(targ) {
			panic("reflect: " + op + " using " + xt.String() + " as type " + targ.String())
		}
	}
```

在上述方法中，上述方法还会检查传入参数的个数以及参数的类型与函数签名中的类型是否可以匹配，任何参数的不匹配都会导致整个程序的崩溃中止。

### 准备参数

当我们已经对当前方法的参数完成验证之后，就会进入函数调用的下一个阶段，为函数调用准备参数，在前面的章节[函数调用](https://draveness.me/golang/basic/golang-function-call.html)中我们已经介绍过 Go 语言的函数调用惯例，函数或者方法在调用时，所有的参数都会被依次放置到栈上。

```go
	nout := t.NumOut()
	frametype, _, retOffset, _, framePool := funcLayout(t, rcvrtype)

	var args unsafe.Pointer
	if nout == 0 {
		args = framePool.Get().(unsafe.Pointer)
	} else {
		args = unsafe_New(frametype)
	}
	off := uintptr(0)
	if rcvrtype != nil {
		storeRcvr(rcvr, args)
		off = ptrSize
	}
	for i, v := range in {
		targ := t.In(i).(*rtype)
		a := uintptr(targ.align)
		off = (off + a - 1) &^ (a - 1)
		n := targ.size
		...
		addr := add(args, off, "n > 0")
		v = v.assignTo("reflect.Value.Call", targ, addr)
		*(*unsafe.Pointer)(addr) = v.ptr
		off += n
	}
```

1. 通过 [`reflect.funcLayout`](https://github.com/golang/go/blob/4e8d27068df52eb372dc2ba7e929e47850934805/src/reflect/type.go#L2975-L3048) 函数计算当前函数需要的参数和返回值的栈布局，也就是每一个参数和返回值所占的空间大小；

2. 如果当前函数有返回值，需要为当前函数的参数和返回值分配一片内存空间 `args`；

3. 如果当前函数是方法，需要向将方法的接受者拷贝到 `args` 内存中；

4. 将所有函数的参数按照顺序依次拷贝到对应

    

   ```
   args
   ```

    

   内存中

   1. 使用 [`reflect.funcLayout`](https://github.com/golang/go/blob/4e8d27068df52eb372dc2ba7e929e47850934805/src/reflect/type.go#L2975-L3048) 返回的参数计算参数在内存中的位置；
   2. 将参数拷贝到内存空间中；

准备参数的过程是计算各个参数和返回值占用的内存空间并将所有的参数都拷贝内存空间对应的位置的过程，该过程会考虑函数和方法、返回值数量以及参数类型带来的差异。

### 调用函数

准备好调用函数需要的全部参数之后，就会通过以下的代码执行函数指针了。我们会向该函数传入栈类型、函数指针、参数和返回值的内存空间、栈的大小以及返回值的偏移量：

```go
	call(frametype, fn, args, uint32(frametype.size), uint32(retOffset))
```

上述函数实际上并不存在，它会在编译期间被链接到 [`runtime.reflectcall`](https://github.com/golang/go/blob/a38a917aee626a9b9d5ce2b93964f586bf759ea0/src/runtime/asm_386.s#L489-L526) 这个用汇编实现的函数上，我们在这里不会分析该函数的具体实现，感兴趣的读者可以自行了解其实现原理。

### 处理返回值

当函数调用结束之后，就会开始处理函数的返回值：

- 如果函数没有任何返回值，会直接清空 `args` 中的全部内容来释放内存空间；
- 如果当前函数有返回值；
  1. 将 `args` 中与输入参数有关的内存空间清空；
  2. 创建一个 `nout` 长度的切片用于保存由反射对象构成的返回值数组；
  3. 从函数对象中获取返回值的类型和内存大小，将 `args` 内存中的数据转换成 `reflect.Value` 类型并存储到切片中；

```go
	var ret []Value
	if nout == 0 {
		typedmemclr(frametype, args)
		framePool.Put(args)
	} else {
		typedmemclrpartial(frametype, args, 0, retOffset)
		ret = make([]Value, nout)
		off = retOffset
		for i := 0; i < nout; i++ {
			tv := t.Out(i)
			a := uintptr(tv.Align())
			off = (off + a - 1) &^ (a - 1)
			if tv.Size() != 0 {
				fl := flagIndir | flag(tv.Kind())
				ret[i] = Value{tv.common(), add(args, off, "tv.Size() != 0"), fl}
			} else {
				ret[i] = Zero(tv)
			}
			off += tv.Size()
		}
	}
	
	return ret
}
```

由 `reflect.Value` 构成的 `ret` 数组会被返回到上层，到这里为止使用反射实现函数调用的过程就结束了。

## 小结

Go 语言的 [`reflect`](https://golang.org/pkg/reflect/) 包为我们提供的多种能力，包括如何使用反射来动态修改变量、判断类型是否实现了某些接口以及动态调用方法等功能，通过对反射包中方法原理的分析能帮助我们理解之前看起来比较怪异、令人困惑的现象。

## 参考

- [The Laws of Reflection](https://blog.golang.org/laws-of-reflection)
- [runtime: new itab lookup table](https://github.com/golang/go/commit/3d1699ea787f38be6088f9a098d6e08dafca9387)
- [runtime: need a better itab table](https://github.com/golang/go/issues/20505)

- [Package reflect](https://golang.org/pkg/reflect/)

- [The Laws of Reflection](https://blog.golang.org/laws-of-reflection) 

