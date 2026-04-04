# Demangling 심화 가이드

> **대상**: Swift 컴파일러 빌드 환경을 갖추고, Demangling/Mangling 시스템에 기여하려는 개발자
> **목표**: 맹글된 심볼을 읽고, Node Tree를 해석하고, 관련 테스트를 추가/수정할 수 있는 수준 도달
> **전제**: [컴파일러 개발 환경 가이드](2026-04-04-swift-compiler-dev-environment.md)를 읽고 빌드 사이클이 동작하는 상태

---

## 빠른 시작 (5분)

아래 3개 명령만 먼저 실행해도 이 문서의 핵심 흐름을 바로 체감할 수 있습니다.

```bash
# 1. 심볼 하나 읽기
echo '$s4Test3FooC' | $BUILD/bin/swift-demangle

# 2. 트리 구조 보기
echo '$s4Test3foo1xSSSi_tF' | $BUILD/bin/swift-demangle --tree-only

# 3. 관련 테스트 한 번 실행
utils/run-test --build-dir $BUILD test/Demangle/demangle.swift
```

이 단계가 끝나면:
- 어떤 심볼이 어떤 선언을 가리키는지 감이 생깁니다.
- `Node Tree → 사람이 읽는 문자열` 흐름이 보입니다.
- 수정 후 어디서 검증해야 하는지 바로 연결됩니다.

---

## Layer 1: 핵심 요약 (1분)

Swift의 **Mangling**은 Swift 선언(함수, 타입 등)을 **고유한 심볼 문자열**로 인코딩하는 과정이고, **Demangling**은 그 역과정입니다.

```
Swift 선언                    맹글된 심볼                      사람이 읽는 형태
Test.foo(x: Int) → String    $s4Test3foo1xSSSi_tF             Test.foo(x: Int) -> String
                   ─────────→                    ─────────→
                   Mangling                      Demangling
```

**3개의 핵심 컴포넌트**:

```
Mangler (ASTMangler)        맹글된 심볼               Demangler
AST 선언 → 심볼 문자열  →  "$s4Test3FooC"  →  Node Tree  →  NodePrinter → 읽기 형태
                                              ↕
                                          Remangler
                                     Node Tree → 심볼 문자열
```

**왜 중요한가**: 맹글된 심볼은 **바이너리의 모든 곳**에 있습니다 — 오브젝트 파일, SIL, 크래시 로그, 디버거, 런타임 메타데이터. Demangling을 이해하면 Swift의 ABI, 타입 시스템, 제네릭 구현이 어떻게 바이너리에 인코딩되는지 보입니다.

---

## Layer 2: 상세 가이드

---

### 1장. 맹글링은 왜 존재하는가

#### Before: 맹글링 없이 함수 이름만 사용한다면?

```
문제 1: 이름 충돌
  모듈 A의 foo(x: Int) 와 모듈 B의 foo(x: Int) 를 구별할 수 없음

문제 2: 오버로드 구별 불가
  foo(x: Int) 와 foo(x: String) 의 심볼이 같음

문제 3: 제네릭 특화 구별 불가
  Array<Int>.append(_:) 와 Array<String>.append(_:) 를 구별할 수 없음

문제 4: ABI 안정성 불가
  바이너리 호환성을 위해 안정적인 심볼 이름이 필요
```

#### After: 맹글링으로 모든 정보를 심볼에 인코딩

```
$s4Test3foo1xSSSi_tF
├─ $s        : Swift 5+ 접두사 (안정 ABI)
├─ 4Test     : 모듈 "Test"
├─ 3foo      : 이름 "foo"
├─ 1x        : 매개변수 라벨 "x"
├─ SSSi_t    : 함수 타입 시그니처 `(Int) -> String`
└─ F         : 함수 엔티티
```

> **주의**: 함수 타입 부분은 튜플/반환 타입 규칙까지 함께 인코딩되므로 글자 단위로 읽으면 직관적이지 않을 수 있습니다. 입문 단계에서는 `모듈 → 이름 → 라벨 → 타입 시그니처 → 엔티티 종류` 순서로 읽는 편이 안전합니다.

#### 왜 중요한가?

링커, 디버거, 런타임은 모두 **문자열 심볼**로 함수를 식별합니다. 맹글링은 Swift의 풍부한 타입 정보(모듈, 이름, 타입 매개변수, 반환 타입, 제네릭 서명 등)를 **하나의 고유 문자열**로 압축합니다. Demangling은 이것을 다시 사람이 읽을 수 있게 풀어주는 역할입니다.

---

### 2장. 맹글링 문법 해부

#### 2-1. 접두사

| 접두사 | 의미 |
|--------|------|
| `$s` | Swift 5+ (안정 ABI) |
| `$e` | Embedded Swift |
| `_$s` | `$s`의 대안 형태 |
| `$S` | Swift 4.2 |
| `_T0` | Swift 4.0 (레거시) |

#### 2-2. 기본 문법 — 후위 표기법 (Postfix Notation)

맹글링은 **후위 표기법**입니다. 먼저 컨텍스트(모듈, 타입), 그 다음 이름, 마지막에 종류를 표시합니다.

```
$s     4Test  3Foo  C
접두사  모듈    이름   종류(Class)

$s     4Test  3Bar  V
접두사  모듈    이름   종류(Struct)

$s     2UI    6Button C 5clickyyF
접두사  모듈    타입     종류  함수이름+시그니처
→ UI.Button.click() -> Void
```

#### 2-3. 종류 코드

| 코드 | 의미 | 예시 |
|------|------|------|
| `C` | Class | `$s4Test3FooC` → `Test.Foo` (class) |
| `V` | Struct | `$s4Test3BarV` → `Test.Bar` (struct) |
| `O` | Enum | `$s4Test3BazO` → `Test.Baz` (enum) |
| `P` | Protocol | `$s4Test5ProtoP` → `Test.Proto` (protocol) |
| `a` | Type alias | |
| `F` | Function | 함수 시그니처 끝 표시 |
| `fC` | Allocating init | |
| `fc` | Non-allocating init | |
| `fD` | Deallocating deinit | |

#### 2-4. 표준 타입 축약

자주 쓰는 Swift 타입은 한 글자로 축약됩니다:

| 축약 | 전체 이름 | 축약 | 전체 이름 |
|------|----------|------|----------|
| `Si` | Swift.Int | `SS` | Swift.String |
| `Sb` | Swift.Bool | `Sd` | Swift.Double |
| `Sf` | Swift.Float | `SU` | Swift.UInt |
| `s` | Swift (모듈) | `Sq` | Swift.Optional |
| `Sa` | Swift.Array | `SD` | Swift.Dictionary |

#### 2-5. 치환 (Substitution)

반복되는 노드는 **치환 인덱스**로 축약됩니다:

```
처음 등장:  전체 표기
두 번째:    S_    (첫 번째 치환)
세 번째:    S0_   (두 번째 치환)
네 번째:    S1_   (세 번째 치환)
```

예: `Array<Array<Int>>`에서 `Array`는 처음에 전체 표기, 두 번째는 `S_`로 축약

#### 2-6. 실전 분석 연습

```bash
# 로컬 빌드된 도구 사용 ($BUILD/bin/swift-demangle)
# 출력은 툴체인 버전에 따라 wrapper node가 약간 달라질 수 있지만,
# 핵심은 Function → Module / Identifier / LabelList / Type 구조입니다.

echo '$s4Test3foo1xSSSi_tF' | $BUILD/bin/swift-demangle --tree-only
# Demangling for $s4Test3foo1xSSSi_tF
# kind=Global
#   kind=Function
#     kind=Module, text="Test"
#     kind=Identifier, text="foo"
#     kind=LabelList
#       kind=Identifier, text="x"
#     kind=Type
#       kind=FunctionType
#         ...

echo '$s4Test3foo1xSSSi_tF' | $BUILD/bin/swift-demangle
# Test.foo(x: Swift.Int) -> Swift.String
```

---

### 3장. Node Tree — 중심 자료구조

#### Node 클래스

```
Node
├── Kind (300+ 종류: Class, Struct, Function, Type, Module, Identifier ...)
├── Payload (union):
│   ├── Text (StringRef) — 식별자, 연산자 이름
│   ├── Index (uint64_t) — 숫자 인덱스
│   └── Children (NodeVector) — 자식 노드들
└── 메서드: getKind(), getText(), getIndex(), getNumChildren(), getChild(i)
```

#### Node Kind 카테고리 (DemangleNodes.def에 300+ 정의)

**컨텍스트 노드** (부모가 될 수 있는 것):
```
Module, Class, Struct, Enum, Protocol,
Function, Initializer, Variable, Subscript,
Getter, Setter, Extension, Constructor, Destructor
```

**타입 노드**:
```
Type, FunctionType, TupleType, Metatype,
BoundGenericClass, BoundGenericStruct,
ExistentialMetatype, OptionalType,
ArrayType, DictionaryType
```

**특수 노드**:
```
GenericSpecialization, FunctionSignatureSpecialization,
ProtocolWitnessTable, ProtocolConformance,
ValueWitness, AsyncFunctionPointer,
DistributedThunk, DifferentiableFunctionType
```

**보조 노드**:
```
Identifier, Index, Number,
LocalDeclName, PrivateDeclName,
Suffix, LabelList
```

---

### 4장. 소스 코드 지도

#### 핵심 4파일

```
lib/Demangling/
├── Demangler.cpp     ★★★  4,677줄 — 맹글 문자열 → Node Tree 파싱
├── NodePrinter.cpp   ★★★  3,906줄 — Node Tree → 사람이 읽는 문자열
├── Remangler.cpp     ★★☆  4,378줄 — Node Tree → 맹글 문자열 (역변환)
└── Context.cpp       ★☆☆    301줄 — 메모리 관리/진입점
```

이 4개 파일이 Demangling 시스템의 **90%**입니다.

#### 전체 파일 맵

```
include/swift/Demangling/
├── Demangle.h           ★  공개 API (Context, Node, DemangleOptions)
├── Demangler.h             컴파일러 내부 API (Demangler 클래스)
├── DemangleNodes.def    ★  300+ Node Kind 정의 (매크로)
├── ManglingFlavor.h        맹글링 변형 (Default, ObjC, Embedded)
├── ManglingMacros.h        심볼 구성 매크로
├── ManglingUtils.h         공유 유틸리티
├── Punycode.h              비-ASCII 인코딩
├── StandardTypesMangling.def  표준 타입 축약 정의 (Si→Int 등)
└── ValueWitnessMangling.def   Value Witness 맹글링

lib/Demangling/
├── Demangler.cpp        ★  핵심 파서 (4,677줄)
├── NodePrinter.cpp      ★  출력 포맷터 (3,906줄)
├── Remangler.cpp        ★  리맹글러 (4,378줄)
├── OldDemangler.cpp        레거시 Swift 3/4.0 디맹글러
├── OldRemangler.cpp        레거시 리맹글러
├── Context.cpp             Context 클래스 (bump-pointer 할당)
├── Punycode.cpp            수정 Punycode (비-ASCII 식별자)
├── ManglingUtils.cpp       유틸리티
├── NodeDumper.cpp          트리 덤프 (디버깅용)
└── RemanglerBase.h         리맹글러 기반 (치환 캐싱, 해싱)

lib/AST/
├── ASTMangler.cpp       ★  맹글링 (AST 선언 → 심볼 문자열)
└── ASTDemangler.cpp        타입 재구성 (심볼 → AST 타입)

tools/swift-demangle/
└── swift-demangle.cpp      커맨드라인 도구
```

#### 맹글링(Mangling) vs 디맹글링(Demangling) 위치

```
맹글링 (AST → 심볼):
  lib/AST/ASTMangler.cpp        ← 컴파일러가 심볼 생성 시 호출
  
디맹글링 (심볼 → 읽기 형태):
  lib/Demangling/Demangler.cpp  ← swift-demangle, 런타임, LLDB가 호출
  lib/Demangling/NodePrinter.cpp
```

---

### 5장. Demangler 내부 동작

#### 파싱 방식: 스택 기반 후위 파싱

```cpp
// Demangler.cpp 핵심 루프 (단순화)

NodePointer Demangler::demangleSymbol(StringRef MangledName) {
  Text = MangledName;
  Pos = 0;
  
  // 접두사 처리 ($s, _T0 등)
  if (!parsePrefix())
    return nullptr;
  
  // 후위 표기법 파싱 — 스택에 노드를 쌓아감
  while (Pos < Text.size()) {
    if (!parseAndPushNodes())  // 한 토큰 파싱 → 스택에 push
      return nullptr;
  }
  
  // 스택에서 최종 결과 조합
  return popNode();
}
```

**스택 기반 파싱 패턴**:

```
입력: $s4Test3FooC

단계 1: "$s"       → Swift 접두사 확인
단계 2: "4Test"    → Module("Test") push
단계 3: "3Foo"     → Identifier("Foo") push
단계 4: "C"        → 스택에서 pop → Class(Module("Test"), Identifier("Foo")) 조합

결과 Node Tree:
  Global
    └── Class
          ├── Module("Test")
          └── Identifier("Foo")
```

#### 주요 파싱 메서드

```cpp
// Demangler.cpp 내 핵심 메서드들

demangleIdentifier()          // "3foo" → "foo" (길이 접두 식별자)
demangleNatural()             // 자연수 파싱
demangleIndex()               // 치환 인덱스 파싱
demangleBuiltinType()         // Bi64_ → Builtin.Int64
demangleBoundGenericType()    // 바운드 제네릭 (Array<Int> 등)
demanglePlainFunction()       // 일반 함수
demangleImplFunctionType()    // SIL 함수 타입
demangleGenericSignature()    // 제네릭 서명 <T: Protocol>
popProtocolConformance()      // 프로토콜 적합성
demangleAutoDiffFunction()    // 자동 미분 함수
```

---

### 6장. NodePrinter 내부 동작

```cpp
// NodePrinter.cpp 핵심 — 재귀적 트리 방문

void NodePrinter::print(NodePointer Node) {
  switch (Node->getKind()) {
  case Node::Kind::Class:
    printContext(Node->getChild(0));  // 모듈/부모 타입
    Printer << ".";
    print(Node->getChild(1));        // 이름
    break;
    
  case Node::Kind::Function:
    printContext(Node);               // 컨텍스트
    printFunctionSignature(Node);    // (매개변수) -> 반환
    break;
    
  case Node::Kind::BoundGenericClass:
    print(Node->getChild(0));        // 기본 타입
    printGenericArgs(Node);          // <T, U>
    break;
    
  // ... 300+ 케이스
  }
}
```

#### DemangleOptions

```cpp
DemangleOptions opts;
opts.SynthesizeSugarOnTypes = true;    // Optional<Int> → Int?
opts.QualifyEntities = true;           // 모듈명 포함
opts.DisplayModuleNames = true;        // 모듈명 표시
opts.DisplayGenericSpecializations = true;  // 제네릭 특화 표시

// 간략화 모드 (Xcode 디버거용)
auto simplified = DemangleOptions::SimplifiedUIDemangleOptions();
```

---

### 7장. Remangler — 왜 역변환이 필요한가?

#### 사용 사례

```
1. Demangle → 트리 수정 → Remangle
   예: thunk 속성 제거, 제네릭 인자 변경

2. 라운드트립 검증
   예: demangle("$s...") → remangle → 원본과 비교

3. 심볼 필터링/분류
   예: 모든 프로토콜 witness table 심볼 찾기
```

#### 치환 캐싱

Remangler의 핵심 최적화는 **치환 캐싱**입니다:

```cpp
// RemanglerBase.h

class RemanglerBase {
  // 이미 출력한 노드를 캐싱
  SubstitutionEntry InlineSubstitutions[64];  // 인라인 (빠름)
  std::unordered_map<...> OverflowSubstitutions;  // 오버플로우
  
  // 노드 해싱으로 빠른 조회
  SubstitutionEntry HashHash[HashHashCapacity];
  
  // 반복 노드 감지 시 치환 인덱스 출력 (S_, S0_, S1_, ...)
  int findSubstitution(const SubstitutionEntry &entry);
  void addSubstitution(const SubstitutionEntry &entry);
};
```

---

### 8장. swift-demangle 도구 활용

```bash
# 기본 디맹글링
echo '$s4Test3FooC' | $BUILD/bin/swift-demangle
# → Test.Foo

# 트리 구조 (학습에 최적)
echo '$s4Test3FooC' | $BUILD/bin/swift-demangle --tree-only
# Demangling for $s4Test3FooC
# kind=Global
#   kind=Class
#     kind=Module, text="Test"
#     kind=Identifier, text="Foo"

# 간략화 모드 (Xcode 스타일)
echo '$s4Test3FooC' | $BUILD/bin/swift-demangle --simplified

# 분류 모드 (심볼 종류 판별)
echo '$s4Test3FooC' | $BUILD/bin/swift-demangle --classify

# 라운드트립 테스트 (demangle → remangle → 비교)
echo '$s4Test3FooC' | $BUILD/bin/swift-demangle --test-remangle

# 파이프라인 활용: SIL 출력을 읽기 좋게
swiftc -emit-sil -O file.swift | $BUILD/bin/swift-demangle

# nm 출력 디맹글링
nm MyBinary | $BUILD/bin/swift-demangle

# 크래시 로그 디맹글링
cat crash.log | $BUILD/bin/swift-demangle
```

---

### 9장. 테스트

#### 테스트 파일 위치

```
test/Demangle/
├── Inputs/
│   └── manglings.txt       ★  1000+ 테스트 케이스 (맹글 → 기대 결과)
├── demangle.swift              포괄적 디맹글링 테스트
├── remangle.swift              라운드트립 테스트
├── demangle-types.test         타입 디맹글링
└── demangle-special-options.test  옵션별 테스트
```

#### manglings.txt 형식

```
$s4Test3FooC ---> Test.Foo
$s4Test3foo1xSSSi_tF ---> Test.foo(x: Swift.Int) -> Swift.String
$sSiN ---> type metadata for Swift.Int
```

각 줄이 `맹글된심볼 ---> 기대결과` 형식입니다.

#### 테스트 실행

> 공통적인 `utils/run-test`/`lit.py` 사용법과 차이는
> [컴파일러 개발 환경 가이드](2026-04-04-swift-compiler-dev-environment.md)의 테스트 장을 참고하세요.
> 여기서는 Demangling 작업에 필요한 최소 명령만 남깁니다.

```bash
# Demangle 테스트 전체
utils/run-test --build-dir $BUILD test/Demangle

# 특정 테스트
utils/run-test --build-dir $BUILD test/Demangle/demangle.swift

# 라운드트립 검증
utils/run-test --build-dir $BUILD test/Demangle/remangle.swift
```

#### 테스트 추가 방법

```bash
# 1. manglings.txt에 새 케이스 추가
echo '$sMyNewMangling ---> Expected.Output' >> test/Demangle/Inputs/manglings.txt

# 2. 빌드
ninja -C $BUILD bin/swift-demangle

# 3. 테스트 실행
utils/run-test --build-dir $BUILD test/Demangle/demangle.swift
```

---

### 10장. SIL과 Demangling의 교차점

#### SIL에서 맹글된 이름

SIL의 모든 함수, 전역 변수, witness table은 맹글된 이름으로 참조됩니다:

```sil
// 함수
sil @$s4Test3addyS2i_SitF : $@convention(thin) (Int, Int) -> Int { ... }
//    ^^^^^^^^^^^^^^^^^^ 맹글된 이름

// witness table
sil_witness_table MyStruct: MyProtocol module Test {
  // $s4Test8MyStructVAA0B8ProtocolA2aDP6methodyyFTW ← thunk 이름
}

// vtable
sil_vtable MyClass {
  #MyClass.method: (MyClass) -> () -> () : @$s4Test7MyClassC6methodyyF
}
```

#### SIL 디버깅 시 Demangling 활용

```bash
# SIL 출력을 바로 디맹글링
swiftc -emit-sil -O file.swift | swift-demangle

# 특정 함수만 디맹글링하여 찾기
swiftc -emit-sil -O file.swift | swift-demangle | grep "MyFunction"

# sil-opt 출력 디맹글링
$BUILD/bin/sil-opt test.sil -my-pass | swift-demangle
```

#### ASTMangler — SIL이 심볼을 얻는 방법

```cpp
// lib/AST/ASTMangler.cpp (단순화)

std::string ASTMangler::mangleEntity(const ValueDecl *decl) {
  appendModule(decl->getModuleContext());   // 모듈명
  appendDeclName(decl);                     // 선언 이름
  appendDeclType(decl);                     // 타입 서명
  appendOperator(decl);                     // 종류 코드 (C, V, F 등)
  return finalize();                        // "$s..." 완성
}
```

---

### 11장. 기여 로드맵

#### 입문 (0~2개월)

| 활동 | 구체적 위치 |
|------|------------|
| `--tree-only`로 다양한 심볼 분석 | `swift-demangle` 도구 |
| `Mangling.rst` 문법 학습 | `docs/ABI/Mangling.rst` |
| `manglings.txt` 테스트 케이스 이해 | `test/Demangle/Inputs/manglings.txt` |
| `NodePrinter.cpp` 읽기 | 가장 이해하기 쉬운 파일 |
| 테스트 케이스 추가 | 누락된 패턴 발견 시 |

#### 중급 (2~6개월)

| 활동 | 구체적 위치 |
|------|------------|
| `Demangler.cpp` 파싱 로직 추적 | `demangleSymbol()` 진입점부터 |
| 출력 포맷 개선 | `NodePrinter.cpp` |
| 라운드트립 실패 수정 | `Remangler.cpp` + `test/Demangle/remangle.swift` |
| 새 Node Kind 이해 | `DemangleNodes.def` |

#### 고급 (6개월+)

| 활동 | 구체적 위치 |
|------|------------|
| 새 Swift 기능의 맹글링 규칙 구현 | `ASTMangler.cpp` + `Demangler.cpp` |
| `Mangling.rst` 사양 업데이트 | `docs/ABI/Mangling.rst` |
| 런타임 타입 재구성 | `lib/AST/ASTDemangler.cpp` |
| 성능 최적화 | 치환 캐싱, 메모리 할당 |

---

## Layer 3: 깊은 통찰

### Demangling 개발자의 멘탈 모델

1. **"맹글링은 직렬화다"** — AST의 트리 구조를 문자열로 직렬화하는 것입니다. Demangling은 역직렬화(파싱). 이 관점으로 보면 `Demangler.cpp`는 **파서**, `Remangler.cpp`는 **직렬화기**, `NodePrinter.cpp`는 **포맷터**입니다.

2. **"후위 표기법은 의도적 설계"** — 맹글된 심볼을 **왼쪽에서 오른쪽으로 한 번만 읽으면서** 파싱할 수 있도록 설계되었습니다. 이는 런타임에서 빠른 디맹글링을 가능하게 합니다. 스택 기반 파싱은 O(n) 시간에 동작합니다.

3. **"치환은 압축이다"** — 같은 타입이 여러 번 나타나면 치환 인덱스로 대체합니다. 이는 심볼 길이를 줄여 바이너리 크기를 줄이는 동시에, 파싱/리맹글링 시 캐시 효율을 높입니다.

4. **"ABI 안정성의 최전선"** — 맹글링 규칙은 **한번 정해지면 영원히 유지**되어야 합니다. Swift 5에서 `$s` 접두사가 확정된 이후, 이 규칙을 바꾸면 모든 기존 바이너리와의 호환성이 깨집니다. 새 기능은 기존 문법을 **확장**하는 방식으로만 추가됩니다.

### Demangling이 독립적 서브시스템인 이유

Demangling 라이브러리(`lib/Demangling/`)는 컴파일러의 다른 부분에 **거의 의존하지 않습니다**:
- AST 모듈에 의존하지 않음
- SIL에 의존하지 않음
- LLVM에도 거의 의존하지 않음 (기본적인 StringRef 등만)

이것이 **기여 진입점으로 이상적인 이유**입니다. 독립적으로 이해하고, 수정하고, 테스트할 수 있습니다.

### 메타인지 질문

1. **"새로운 Swift 기능(예: parameter pack)이 추가되면 맹글링은 어떻게 확장되는가?"** — `DemangleNodes.def`에 새 Node Kind 추가 → `ASTMangler.cpp`에 인코딩 규칙 → `Demangler.cpp`에 파싱 로직 → `NodePrinter.cpp`에 출력 로직 → `Remangler.cpp`에 리맹글링 → `Mangling.rst` 사양 업데이트 → 테스트 추가. 이 전체 흐름을 추적하면 시스템을 완전히 이해한 것입니다.

2. **"swift-demangle --test-remangle이 실패하면 무엇이 잘못된 것인가?"** — Demangle → Remangle → 원본과 비교했을 때 다르면, Demangler가 정보를 잃었거나 Remangler가 다르게 인코딩한 것입니다. 이런 라운드트립 실패는 **좋은 기여 기회**입니다.

### 핵심 참고 문서

| 문서 | 위치 | 필수도 |
|------|------|--------|
| 맹글링 문법 사양 | `docs/ABI/Mangling.rst` | ★★★ |
| ABI 안정성 선언문 | `docs/ABIStabilityManifesto.md` | ★★☆ |
| Library Evolution | `docs/LibraryEvolution.rst` | ★☆☆ |
| 외부 자료: Exploiting The Swift ABI | [YouTube](https://youtu.be/0rHG_Pa86oA) | ★★☆ |
| 외부 자료: How Swift Achieved Dynamic Linking | [블로그](https://gankra.github.io/blah/swift-abi/) | ★★☆ |
