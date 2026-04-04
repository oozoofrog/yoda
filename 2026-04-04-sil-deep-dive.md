# SIL (Swift Intermediate Language) 심화 가이드

> **대상**: Swift 컴파일러 빌드 환경을 갖추고, SIL 관련 기여를 시작하려는 개발자
> **목표**: SIL을 읽고, 패스/검증기/테스트의 연결 지점을 파악하며, 작은 최적화 수정까지 시도할 수 있는 수준 도달
> **전제**: [컴파일러 개발 환경 가이드](2026-04-04-swift-compiler-dev-environment.md)를 읽고 빌드 사이클이 동작하는 상태

---

## 빠른 시작 (5분)

아래 3개 명령은 SIL 작업의 가장 기본적인 관찰 루프를 구성합니다.

```bash
# 준비: 예제 파일 하나 만들기
cat >/tmp/sil-sample.swift <<'SWIFT'
func add(_ a: Int, _ b: Int) -> Int { a + b }
SWIFT

# 1. Raw SIL 보기
swiftc -emit-silgen /tmp/sil-sample.swift | sed -n '1,80p'

# 2. Optimized SIL 보기
swiftc -emit-sil -O /tmp/sil-sample.swift | sed -n '1,80p'

# 3. 대표 SILOptimizer 테스트 실행
utils/run-test --build-dir $BUILD test/SILOptimizer/simplify_cfg.sil
```

이 단계가 끝나면:
- SILGen 단계와 최적화 이후 출력을 비교할 수 있습니다.
- SIL 텍스트가 어느 정도 읽히기 시작합니다.
- 패스 변경 후 어떤 테스트로 검증할지 감이 잡힙니다.

---

## Layer 1: 핵심 요약 (1분)

SIL은 Swift 컴파일러의 **심장**입니다. AST와 LLVM IR 사이에 위치하며, Swift 고유의 의미 정보(소유권, 프로토콜 적합성, 제네릭)를 보존하면서 최적화를 수행합니다.

```
AST → [SILGen] → Raw SIL → [Mandatory Passes] → Canonical SIL → [Optimization] → Optimized SIL → [IRGen] → LLVM IR
           ↑                        ↑                                    ↑
        생성 단계               검증/진단 단계                       성능 최적화 단계
```

**SIL의 3가지 형태**:

| 형태 | 특징 | 보는 법 |
|------|------|---------|
| **Raw SIL** | SILGen 직후, 미검증 | `swiftc -emit-silgen` |
| **Canonical SIL** | 필수 패스 완료, 검증됨 | `swiftc -emit-sil` |
| **Optimized SIL** | 최적화 패스 완료 | `swiftc -emit-sil -O` |

**핵심 자료구조 4개**:
```
SILModule → SILFunction → SILBasicBlock → SILInstruction
  (모듈)      (함수)        (기본 블록)     (명령어 150+종)
```

---

## Layer 2: 상세 가이드

---

### 1장. SIL은 왜 존재하는가

#### Before: AST에서 바로 LLVM IR로

```
만약 SIL 없이 AST → LLVM IR로 갔다면:
├── ARC 최적화 불가능 (LLVM은 retain/release의 의미를 모름)
├── 제네릭 특화 불가능 (LLVM은 Swift 제네릭을 이해 못 함)
├── 프로토콜 디스패치 최적화 불가능
├── Definite Initialization 진단 불가능
└── 소유권 기반 메모리 안전성 검증 불가능
```

#### After: SIL이 있으므로

```
SIL 덕분에 가능한 것들:
├── ARC 최적화: 불필요한 retain/release 제거 (LLVM은 모르는 의미)
├── 제네릭 특화: Array<Int>용 특화 코드 생성
├── 디바이추얼라이제이션: 프로토콜 호출 → 직접 호출로 변환
├── Definite Initialization: "변수 초기화 전 사용" 진단
├── Ownership SSA: 컴파일 타임 메모리 안전성 보장
└── Copy-on-Write 최적화: 유일 참조면 복사 생략
```

#### 왜 중요한가?

LLVM IR은 범용 IR로, C/C++/Rust 등 다양한 언어를 지원합니다. Swift 고유의 의미를 LLVM IR에서 표현하면 범용 최적화가 방해받거나, Swift 특화 최적화가 불가능합니다. SIL은 **Swift의 의미를 정확히 표현하는 전용 IR**이기에, 두 세계(고수준 의미 보존 + 저수준 최적화)를 다리 놓을 수 있습니다.

---

### 2장. SIL 텍스트 형식 읽기

SIL을 읽는 능력이 **모든 SIL 작업의 기반**입니다.

#### 2-1. 기본 구조

```sil
sil_stage canonical          // SIL 단계: raw 또는 canonical
import Swift                 // 의존 모듈

// 함수 선언
sil @$s4main3addyS2i_SitF : $@convention(thin) (Int, Int) -> Int {

// 기본 블록 (bb = basic block)
bb0(%0 : $Int, %1 : $Int):
  // 명령어들
  %2 = struct_extract %0 : $Int, #Int._value    // Int에서 Builtin.Int64 추출
  %3 = struct_extract %1 : $Int, #Int._value
  %4 = builtin "add_Int64"(%2 : $Builtin.Int64, %3 : $Builtin.Int64) : $Builtin.Int64
  %5 = struct $Int (%4 : $Builtin.Int64)        // Builtin.Int64를 Int로 다시 감쌈
  return %5 : $Int                               // 반환
}
```

**읽는 순서**:
1. `sil @심볼이름 : $함수타입` — 함수 시그니처
2. `bb숫자(%인자 : $타입)` — 기본 블록과 인자 (SSA phi 노드)
3. `%레지스터 = 명령어 피연산자 : $타입` — 명령어
4. 마지막 명령어는 항상 **터미네이터** (return, br, cond_br, switch_enum 등)

#### 2-2. 타입 표기법

```sil
$Int                           // 일반 타입 (object type)
$*Int                          // 주소 타입 (address type, 포인터와 유사)
$@convention(thin) (Int) -> Int  // 함수 타입 (thin = 컨텍스트 없음)
$@convention(method) (Int, @guaranteed MyClass) -> Int  // 메서드
$@callee_guaranteed (Int) -> Int  // 클로저 (컨텍스트 보장됨)
$(Int, String)                 // 튜플
$Optional<Int>                 // Optional
$any Protocol                  // 존재 타입 (existential)
```

**주소 타입 vs 오브젝트 타입**:
- `$Int` — SSA 값으로 레지스터에 담김 (loadable)
- `$*Int` — 메모리 주소를 가리킴 (address-only 타입은 항상 이 형태)

#### 2-3. 소유권 표기 (OSSA)

```sil
// 소유권 종류가 인자와 결과에 표시됨
bb0(%0 : @owned $String,           // 소유: 이 블록이 해제 책임
    %1 : @guaranteed $String,      // 대여: 수명이 보장됨, 해제 불가
    %2 : $Int):                    // 없음: trivial 타입, 관리 불필요

  %3 = copy_value %1 : $String    // 대여 → 소유 복사본 생성
  destroy_value %0 : $String      // 소유된 값 해제
  end_borrow %1 : $String         // 대여 종료
  return %3 : $String             // 소유된 복사본 반환
```

**소유권 4종류**:

| 종류 | 의미 | 예시 |
|------|------|------|
| **Owned** | 소유. 정확히 한 번 소비되어야 함 | `copy_value`, `move_value` 결과 |
| **Guaranteed** | 대여. `begin_borrow`~`end_borrow` 범위에서 유효 | 함수 인자 `@guaranteed` |
| **Unowned** | 순간적 유효. 사용 전 copy 필요 | `unowned` 참조 로드 |
| **None** | 관리 불필요 (trivial 타입) | `Int`, `Bool`, 주소 타입 |

---

### 3장. 핵심 명령어 카테고리

150+개 명령어 중 **실무에서 자주 만나는 것들**:

#### 메모리 할당/해제

```sil
%0 = alloc_stack $Int            // 스택에 Int 공간 확보 (빠름)
dealloc_stack %0 : $*Int         // 스택 해제

%1 = alloc_ref $MyClass          // 힙에 클래스 인스턴스 할당
%2 = alloc_box ${ var Int }      // 힙에 박스(캡처 변수용) 할당
```

#### 메모리 접근

```sil
%val = load %addr : $*Int                   // 주소에서 값 로드
store %val to %addr : $*Int                 // 값을 주소에 저장

%borrowed = load_borrow %addr : $*String    // 주소에서 대여 로드 (복사 없음)
end_borrow %borrowed : $String              // 대여 종료

%access = begin_access [modify] %addr : $*Int  // 접근 시작 (배타성 검사)
end_access %access : $*Int                     // 접근 종료
```

#### 함수 호출

```sil
%result = apply %fn(%arg1, %arg2) : $@convention(thin) (Int, Int) -> Int

// 예외를 던질 수 있는 호출
try_apply %fn(%arg) : $@convention(thin) (Int) -> (Int, @error Error),
  normal bb1, error bb2

// 부분 적용 (클로저 생성)
%closure = partial_apply %fn(%captured) : $@convention(thin) (Int, Int) -> Int
```

#### 구조체/튜플/열거형

```sil
// 구조체
%s = struct $Point (%x : $Double, %y : $Double)        // 생성
%x = struct_extract %s : $Point, #Point.x              // 필드 추출
%addr = struct_element_addr %saddr : $*Point, #Point.x // 필드 주소

// 튜플
%t = tuple (%a : $Int, %b : $String)                   // 생성
%first = tuple_extract %t : $(Int, String), 0          // 요소 추출

// 열거형
%some = enum $Optional<Int>, #Optional.some!enumelt, %val : $Int
switch_enum %opt : $Optional<Int>, case #Optional.some!enumelt: bb1,
                                   case #Optional.none!enumelt: bb2
```

#### 참조 카운팅 (ARC)

```sil
// OSSA 스타일 (최신)
%copy = copy_value %original : $MyClass       // retain + 새 값
destroy_value %owned : $MyClass               // release

%borrow = begin_borrow %owned : $MyClass      // 대여 시작
end_borrow %borrow : $MyClass                 // 대여 종료

// Non-OSSA (레거시)
strong_retain %ref : $MyClass
strong_release %ref : $MyClass
```

#### 제어 흐름 (터미네이터)

```sil
return %val : $Int                            // 함수 반환
br bb1(%arg : $Int)                           // 무조건 분기
cond_br %cond, bb_true, bb_false              // 조건 분기
switch_enum %e, case #E.a: bb1, case #E.b: bb2  // 열거형 분기
unreachable                                   // 도달 불가능
throw %error : $Error                         // 예외 던지기
```

#### 타입 변환/캐스트

```sil
%up = upcast %derived : $Child to $Parent              // 업캐스트
%checked = checked_cast_br %val : $Parent to Child, bb_succ, bb_fail  // 다운캐스트
%conv = convert_function %fn : $... to $...            // 함수 타입 변환
%thick = thin_to_thick_function %fn : $... to $...     // thin → thick
```

---

### 4장. SIL 소스 코드 지도

#### 핵심 자료구조 (헤더)

```
include/swift/SIL/
├── SILModule.h              모듈 컨테이너 (함수, 전역, vtable 등 보유)
├── SILFunction.h            함수 (기본 블록 리스트, 시그니처, 속성)
├── SILBasicBlock.h          기본 블록 (명령어 리스트, 인자, 전임자/후임자)
├── SILInstruction.h      ★  명령어 클래스 계층 (12,000줄, 150+종)
├── SILValue.h               값 + 소유권 (SSA 값, Use-Def 체인)
├── SILBuilder.h          ★  명령어 생성 API (패스 작성 시 핵심)
├── SILCloner.h              코드 복제 유틸리티 (인라이닝 등에 사용)
├── SILNodes.def          ★  모든 명령어 정의 (매크로 메타프로그래밍)
└── SILType.h                SIL 타입 시스템
```

#### 명령어 정의 방식 (SILNodes.def)

```cpp
// SILNodes.def — 매크로로 모든 명령어를 정의
// 이 파일 하나가 150+개 명령어의 "등록부"

SINGLE_VALUE_INST(StructExtractInst, struct_extract,
                  SILInstruction, None, DoesNotRelease)
//                ^클래스명         ^텍스트  ^부모    ^메모리동작  ^해제여부

TERMINATOR(BranchInst, branch,
           TermInst, None, DoesNotRelease)

NON_VALUE_INST(StoreInst, store,
               SILInstruction, MayWrite, DoesNotRelease)
```

**Why**: 매크로 메타프로그래밍으로 정의하면 **한 곳에서 추가/수정하면 방문자(visitor), 직렬화, 검증기 등이 자동으로 갱신**됩니다.

#### 구현 코드 (C++)

```
lib/SIL/
├── IR/                          핵심 자료구조 구현
│   ├── SILFunction.cpp             함수 생성/조작
│   ├── SILBasicBlock.cpp           블록 조작/제어흐름
│   ├── SILInstruction.cpp          명령어 기반 기능 (~2,300줄)
│   ├── SILInstructions.cpp         150+ 명령어 정의 (~3,600줄)
│   ├── SILBuilder.cpp              명령어 생성 API
│   ├── SILValue.cpp                값/Use-Def 체인
│   ├── SILType.cpp                 타입 속성
│   ├── SILFunctionType.cpp         함수 타입 처리 (~5,700줄)
│   ├── TypeLowering.cpp         ★  형식→저수준 타입 변환 (~5,700줄)
│   ├── SILPrinter.cpp              텍스트 SIL 출력 (~5,100줄)
│   ├── OperandOwnership.cpp        피연산자 소유권 검사
│   └── ValueOwnership.cpp          값 소유권 관리
│
├── Parser/                      텍스트 SIL 파싱 (.sil → 메모리)
│   └── ParseSIL.cpp               SIL 파서 (~9,100줄)
│
├── Utils/                       분석 유틸리티
│   ├── OwnershipUtils.cpp          소유권 분석
│   ├── PrunedLiveness.cpp          생존성 분석 (~1,200줄)
│   ├── MemAccessUtils.cpp          메모리 접근 분석 (~2,900줄)
│   ├── Dominance.cpp               지배자 트리
│   └── LoopInfo.cpp                루프 분석
│
└── Verifier/                    검증기 (불변식 확인)
    ├── SILVerifier.cpp          ★  기본 SIL 검증 (~8,000줄)
    ├── SILOwnershipVerifier.cpp    OSSA 소유권 검증 (~1,100줄)
    └── MemoryLifetimeVerifier.cpp  메모리 안전성 검증
```

#### SIL 생성 (SILGen)

```
lib/SILGen/                      AST → Raw SIL 변환
├── SILGen.cpp/.h                메인 진입점
├── SILGenFunction.cpp           함수별 코드 생성
├── SILGenExpr.cpp               표현식 변환
├── SILGenDecl.cpp               선언 처리
├── SILGenStmt.cpp               구문 변환
├── SILGenPattern.cpp            패턴 매칭
├── ManagedValue.cpp/.h          자동 정리(cleanup) 관리 값
├── Cleanup.cpp/.h               RAII 스타일 정리 코드
└── RValue.cpp/.h                R-value 처리
```

#### SIL 최적화 (SILOptimizer)

```
lib/SILOptimizer/                대규모 최적화 하위 시스템 (대표 디렉토리만 발췌)
├── Analysis/                    분석 패스
│   ├── AliasAnalysis.cpp           에일리어스 분석
│   ├── DominanceAnalysis.cpp       지배자 분석
│   ├── LoopAnalysis.cpp            루프 분석
│   └── BasicCalleeAnalysis.cpp     호출 대상 분석
│
├── Mandatory/                ★  필수 패스 (항상 실행)
│   ├── DefiniteInitialization.cpp  변수 초기화 검사
│   ├── DiagnoseStaticExclusivity.cpp  메모리 안전성 진단
│   ├── DataflowDiagnostics.cpp     데이터 흐름 에러 감지
│   └── AddressLowering.cpp         주소 프로젝션 최적화
│
├── Transforms/               ★  선택 최적화 패스
│   ├── CSE.cpp                     공통 부분식 제거
│   ├── Devirtualizer.cpp           가상 호출 → 직접 호출
│   ├── GenericSpecializer.cpp      제네릭 특화
│   ├── AllocBoxToStack.cpp         힙 → 스택 승격
│   ├── StackPromotion.cpp          스택 승격
│   ├── ARCCodeMotion.cpp           ARC 연산 이동
│   ├── LoopUnroll.cpp              루프 펼치기
│   └── ConditionForwarding.cpp     조건 전파
│
├── SemanticARC/                 OSSA 전용 최적화
│   └── (참조 카운팅 패턴 최적화)
│
└── IPO/                         프로시저간 최적화
    └── (함수 시그니처 변환, 인라이닝 등)
```

#### Swift로 작성된 SIL (최신)

```
SwiftCompilerSources/Sources/
├── SIL/                         Swift 래퍼
│   ├── Instruction.swift           명령어 래퍼
│   ├── Function.swift              함수 래퍼
│   ├── BasicBlock.swift            기본 블록 래퍼
│   ├── Value.swift                 값 래퍼
│   ├── Builder.swift            ★  SIL 빌더 (~900줄)
│   ├── Type.swift                  타입 유틸리티
│   └── ApplySite.swift             함수 호출 사이트
│
└── Optimizer/                   Swift로 작성된 최적화
    ├── FunctionPasses/          ★  함수별 패스 (현재 37개 Swift 파일)
    ├── InstructionSimplification/  ★  명령어 단순화 (현재 44개 Swift 파일)
    ├── ModulePasses/               모듈 패스
    ├── PassManager/                패스 관리자
    └── Analysis/                   분석 구현
```

> **추세**: 새로운 최적화 패스는 점점 **Swift로** 작성되고 있습니다. 기여를 시작한다면 `SwiftCompilerSources/Sources/Optimizer/`를 주목하세요.

---

### 5장. SIL 최적화 패스 해부

#### 패스의 기본 구조 (C++)

```cpp
// lib/SILOptimizer/Transforms/<MyPass>.cpp

class MyPass : public SILFunctionTransform {
  void run() override {
    SILFunction *F = getFunction();

    // 함수의 모든 블록을 순회
    for (auto &BB : *F) {
      // 블록의 모든 명령어를 순회
      for (auto &I : BB) {
        if (auto *SI = dyn_cast<StructExtractInst>(&I)) {
          // struct_extract 명령어 발견 시 처리
        }
      }
    }

    // 분석 무효화 (변경한 것에 따라)
    invalidateAnalysis(SILAnalysis::InvalidationKind::Instructions);
  }

  StringRef getName() override { return "MyPass"; }
};
```

#### 패스의 기본 구조 (Swift — 최신 방식)

```swift
// SwiftCompilerSources/Sources/Optimizer/FunctionPasses/<MyPass>.swift

let myPass = FunctionPass(name: "my-pass") {
  (function: Function, context: FunctionPassContext) in

  for block in function.blocks {
    for inst in block.instructions {
      if let sei = inst as? StructExtractInst {
        // struct_extract 명령어 발견 시 처리
      }
    }
  }
}
```

#### SILBuilder로 명령어 생성

```swift
// Swift 버전
let builder = Builder(before: insertionPoint, context)
let newInst = builder.createIntegerLiteral(value: 42, type: intType)
let result = builder.createStruct(type: structType, elements: [newInst])
```

```cpp
// C++ 버전
SILBuilder B(insertionPoint);
auto *literal = B.createIntegerLiteral(loc, intType, 42);
auto *result = B.createStruct(loc, structType, {literal});
```

#### InstructionSimplification 예시 (기여 진입점!)

```swift
// SwiftCompilerSources/Sources/Optimizer/InstructionSimplification/
// SimplifyStructExtract.swift (예시)

extension StructExtractInst : OnoneSimplifyable {
  func simplify(_ context: SimplifyContext) {
    // struct_extract(struct(..., x, ...)) → x
    // struct를 만들자마자 바로 추출하면 → 원래 값 사용
    if let structInst = self.struct as? StructInst {
      let field = structInst.operands[self.fieldIndex]
      self.uses.replaceAll(with: field.value, context)
      context.erase(self)
    }
  }
}
```

**이런 패턴 단순화가 가장 접근하기 쉬운 기여입니다.**

---

### 6장. 테스트 실전

#### SIL 테스트 작성

```sil
// test/SILOptimizer/<my_test>.sil

// RUN: %target-sil-opt -enable-sil-verify-all %s -my-pass | %FileCheck %s

sil_stage canonical
import Swift

// CHECK-LABEL: sil @test_simplification :
// CHECK-NOT: struct_extract
// CHECK: return %0
sil @test_simplification : $@convention(thin) (Int) -> Int {
bb0(%0 : $Int):
  %1 = struct $Int (%0 : $Builtin.Int64)   // 의미 없는 감싸기
  %2 = struct_extract %1 : $Int, #Int._value // 바로 풀기
  %3 = struct $Int (%2 : $Builtin.Int64)   // 다시 감싸기
  return %3 : $Int
  // 최적화 후: 중간 단계 모두 제거되고 %0 직접 반환 기대
}
```

#### SILGen 테스트 작성

```swift
// test/SILGen/<my_silgen_test>.swift

// RUN: %target-swift-emit-silgen %s | %FileCheck %s

// CHECK-LABEL: sil hidden [ossa] @$s{{.*}}3foo
// CHECK: [[BORROW:%[0-9]+]] = begin_borrow
// CHECK: end_borrow [[BORROW]]
func foo(_ s: String) -> Int {
    return s.count
}
```

#### 테스트 실행

> 공통적인 빌드/테스트 루프와 `run-test`/`lit.py`의 차이는
> [컴파일러 개발 환경 가이드](2026-04-04-swift-compiler-dev-environment.md)의 테스트 장을 참고하세요.
> 여기서는 SIL 작업에 바로 연결되는 최소 명령만 유지합니다.

```bash
# SIL 최적화 테스트
utils/run-test --build-dir $BUILD test/SILOptimizer/simplify_cfg.sil

# SILGen 테스트
utils/run-test --build-dir $BUILD test/SILGen/accessors.swift

# sil-opt 직접 실행 (디버깅용)
$BUILD/bin/sil-opt -enable-sil-verify-all test.sil -my-pass

# 특정 함수만 패스별 SIL 출력
$BUILD/bin/sil-opt -sil-print-function='$s...' test.sil -my-pass
```

---

### 7장. 핵심 개념: Ownership SSA (OSSA)

OSSA는 현대 SIL의 **가장 중요한 혁신**입니다.

#### 핵심 불변식 (Invariant)

```
모든 @owned 값은 모든 실행 경로에서 정확히 한 번 소비(consume)되어야 한다.
  - 소비 = destroy_value, return, store, 다른 @owned 인자로 전달
  - 누락 = 메모리 누수
  - 중복 = use-after-free

모든 @guaranteed 값은 begin_borrow~end_borrow 범위 안에서만 사용 가능하다.
```

#### 시각적 이해

```
@owned 값의 수명:
  %x = copy_value %original ─── 탄생
  │
  │ ... 여러 곳에서 사용 (non-consuming uses)
  │
  destroy_value %x ──────────── 소멸 (정확히 한 번)

@guaranteed 값의 수명:
  %b = begin_borrow %owned ──── 대여 시작
  │
  │ ... 사용 (borrow scope 안에서만)
  │
  end_borrow %b ─────────────── 대여 종료
```

#### 검증기

```
lib/SIL/Verifier/SILOwnershipVerifier.cpp

검사 항목:
├── 모든 @owned 값이 모든 경로에서 정확히 한 번 소비되는가?
├── @guaranteed 값이 borrow scope 밖에서 사용되지 않는가?
├── begin_borrow/end_borrow 쌍이 올바른가?
└── forwarding 명령어의 소유권 전파가 올바른가?
```

---

### 8장. 기여 로드맵

#### 입문 (0~2개월)

| 활동 | 구체적 위치 |
|------|------------|
| SIL 텍스트 읽기 연습 | `swiftc -emit-sil` 출력 분석 |
| 명령어 카탈로그 파악 | `docs/SIL/Instructions.md` |
| 기존 테스트 읽기 | `test/SILOptimizer/`, `test/SIL/` |
| 간단한 테스트 추가 | 기존 패스의 누락 케이스 |

#### 중급 (2~6개월)

| 활동 | 구체적 위치 |
|------|------------|
| InstructionSimplification | `SwiftCompilerSources/Sources/Optimizer/InstructionSimplification/` |
| 검증기 로직 이해 | `lib/SIL/Verifier/SILVerifier.cpp` |
| 기존 패스 버그 수정 | Good First Issue + SILOptimizer 태그 |
| OSSA 개념 실전 적용 | `lib/SIL/Verifier/SILOwnershipVerifier.cpp` |

#### 고급 (6개월+)

| 활동 | 구체적 위치 |
|------|------------|
| 새 최적화 패스 작성 | `SwiftCompilerSources/Sources/Optimizer/FunctionPasses/` |
| 기존 패스 Swift 재작성 | C++ → Swift 마이그레이션 |
| SILGen 변경 | `lib/SILGen/` |
| 타입 저수준화 변경 | `lib/SIL/IR/TypeLowering.cpp` |

---

## Layer 3: 깊은 통찰

### SIL 개발자의 멘탈 모델

SIL 관련 기여자들이 코드를 볼 때 머릿속에 가지고 있는 프레임:

1. **"이 값의 소유권은 누가 가지고 있는가?"** — 모든 SIL 값에 대해 소유/대여/없음을 추적합니다. 이것이 OSSA의 핵심이며, 모든 변환이 이 불변식을 유지해야 합니다.

2. **"이 변환은 의미를 보존하는가?"** — 최적화는 프로그램의 관찰 가능한 동작을 변경하면 안 됩니다. SIL 수준에서는 ARC 연산의 순서, 메모리 접근 패턴, 예외 동작이 관찰 가능합니다.

3. **"검증기가 통과할 것인가?"** — `sil-opt -enable-sil-verify-all`은 모든 패스 사이에 검증기를 실행합니다. 패스가 SIL 불변식을 깨뜨리면 즉시 발견됩니다.

### 메타인지 질문

1. **"struct_extract(struct(...))가 왜 코드에 남아 있을까?"** — SILGen은 의미적 정확성만 보장하고, 이런 중복 패턴은 최적화 패스가 제거합니다. 이 분리가 컴파일러의 **관심사 분리** 원칙입니다.

2. **"C++로 된 패스와 Swift로 된 패스의 차이는 무엇인가?"** — 기능적으로 동일하지만, Swift 버전은 타입 안전성이 높고 메모리 관리가 자동입니다. 새 패스는 Swift로 작성하는 것이 프로젝트 방향입니다.

### 핵심 참고 문서

| 문서 | 위치 | 필수도 |
|------|------|--------|
| SIL 소개 | `docs/SIL/SIL.md` | ★★★ |
| 소유권 | `docs/SIL/Ownership.md` | ★★★ |
| 명령어 참조 | `docs/SIL/Instructions.md` | ★★☆ (필요 시 참조) |
| 타입 | `docs/SIL/Types.md` | ★★☆ |
| 옵티마이저 설계 | `docs/OptimizerDesign.md` | ★★☆ |
| ARC 최적화 | `docs/SIL/ARCOptimization.md` | ★☆☆ |
