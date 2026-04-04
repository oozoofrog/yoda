# Swift 컴파일러 기여자를 위한 체계적 학습 가이드

> **대상**: Swift 언어 사용 경험이 있으나 컴파일러 내부 구조는 처음인 개발자
> **목표**: 구조적 멘탈 모델을 구축하고, Good First Issue부터 기여를 시작할 수 있는 수준 도달
> **전제**: [컴파일러 개발 환경 가이드](2026-04-04-swift-compiler-dev-environment.md)를 병행해 빌드/테스트 루프를 확보할 준비가 되어 있는 상태

---

## 빠른 시작 (5분)

이 문서는 “모든 것을 자세히 배우기”보다 “어떤 순서로 익힐지 감을 잡기”에 초점을 둡니다. 먼저 아래 순서만 따라가세요.

1. [컴파일러 개발 환경 가이드](2026-04-04-swift-compiler-dev-environment.md)의 빠른 시작을 끝냅니다.
2. AST와 SIL을 각각 한 번 덤프해 파이프라인을 눈으로 확인합니다.
3. `docs/Lexicon.md`에서 낯선 용어를 빠르게 훑습니다.
4. 관심 서브시스템을 하나만 골라 관련 deep dive 문서로 들어갑니다.

```bash
cat >/tmp/sample.swift <<'SWIFT'
func add(_ a: Int, _ b: Int) -> Int { a + b }
SWIFT

swiftc -dump-ast /tmp/sample.swift >/tmp/sample.ast
swiftc -emit-sil /tmp/sample.swift >/tmp/sample.sil
```

추천 읽기 순서:
- 환경/빌드부터 익히기 → `2026-04-04-swift-compiler-dev-environment.md`
- SIL부터 파고들기 → `2026-04-04-sil-deep-dive.md`
- 심볼/ABI 쪽으로 들어가기 → `2026-04-04-demangling-deep-dive.md`

---

## Layer 1: 핵심 요약 (30초)

Swift 컴파일러를 이해하는 핵심 멘탈 모델은 **"레이어 케이크"**입니다:

```
소스 코드 (.swift)
    ↓ Parse
AST (추상 구문 트리)
    ↓ Sema (타입 체크)
Type-Checked AST
    ↓ SILGen
Raw SIL ← 여기가 핵심! Swift만의 고수준 IR
    ↓ Mandatory Passes
Canonical SIL
    ↓ Optimization Passes
Optimized SIL
    ↓ IRGen
LLVM IR
    ↓ LLVM Backend
기계어
```

**기여자가 알아야 할 3가지:**
1. 각 레이어는 정보를 **점진적으로 구체화**합니다
2. 자신이 작업할 레이어와 **인접 1~2개 레이어만** 깊이 이해하면 됩니다
3. **SIL**이 Swift 컴파일러를 다른 컴파일러와 차별화하는 핵심 — 소유권, 프로토콜 적합성, 제네릭 정보를 보존하면서 최적화합니다

---

## Layer 2: 상세 학습 로드맵 (20분)

### Phase 1: 환경 구축과 첫 번째 빌드 (1~2일)

#### 왜 빌드부터 시작하는가?

컴파일러를 **직접 빌드하고 수정하고 테스트하는 루프**가 모든 학습의 기반입니다. 코드를 읽기만 하면 추상적인 이해에 머물지만, 빌드하고 깨뜨려 보면 구체적인 이해가 생깁니다.

#### Before: 빌드 없이 코드만 읽는 접근

```
"소스를 읽어봤는데, lib/ 안에 파일이 수천 개라 어디서부터 봐야 할지 모르겠다."
→ 방향 없는 코드 읽기는 학습 효과가 극히 낮습니다
```

#### After: 빌드 → 수정 → 테스트 사이클 확보

```bash
# 자세한 플래그와 디렉토리 구조는 환경 가이드의 빠른 시작/3장/4장을 따릅니다.
# 이 문서에서는 "학습 루프를 확보하는 최소 명령"만 기억하면 충분합니다.
export BUILD=../build/Ninja-RelWithDebInfoAssert/swift-macosx-$(uname -m)
ninja -C $BUILD bin/swift-frontend
utils/run-test --build-dir $BUILD test/Sema/accessibility.swift
```

#### 왜 중요한가?

컴파일러 기여자들의 일상은 **"가설 → 수정 → 빌드 → 테스트 → 확인"** 루프입니다. 이 루프가 빠를수록 학습도 빨라집니다. `--release-debuginfo`로 빌드하면 디버거 연결도 가능해져서 내부 동작을 실시간으로 관찰할 수 있습니다.

**팁**: `sccache`를 사용하면 LLVM 재빌드 시간이 크게 줄어듭니다:
```bash
utils/build-script --sccache ...
```

---

### Phase 2: 컴파일러 파이프라인 멘탈 모델 (1~2주)

컴파일러 개발자들이 머릿속에 가지고 있는 파이프라인을 단계별로 이해합니다.

#### 2-1. Parsing → AST

**개발자의 멘탈 모델**: "소스 코드를 트리 구조로 변환한다"

```bash
# 직접 해보기: AST 덤프
echo 'let x = 42' | swiftc -dump-ast -

# 프로젝트 내 위치
# lib/Parse/   → 파서 구현
# include/swift/AST/   → AST 노드 정의
```

**핵심 개념**: AST는 "Abstract Syntax Tree"라 불리지만 실제로는 **방향 그래프(directed graph)**에 가깝습니다.

#### 2-2. Sema (Semantic Analysis) — 타입 체킹

**개발자의 멘탈 모델**: "제약 조건을 모아서 풀고, 타입을 결정한다"

```bash
# 직접 해보기: 타입 체커 디버깅
echo 'let x: Int = "hello"' | swiftc -Xfrontend -debug-constraints -
```

**핵심 개념**: Swift의 타입 체커는 **제약 기반(constraint-based)**입니다:
1. **제약 생성**: 표현식마다 타입 변수(T0, T1...)와 제약 조건을 만듭니다
2. **제약 풀기**: 해 공간을 탐색하여 구체적 타입을 결정합니다
3. **해 적용**: 추론된 타입을 AST에 적용합니다

```
# 프로젝트 내 위치
# lib/Sema/           → 타입 체커 구현
# docs/TypeChecker.md → 설계 문서
```

#### 2-3. SILGen → SIL — Swift만의 핵심 IR

**개발자의 멘탈 모델**: "고수준 의미 정보를 보존하면서 최적화 가능한 형태로 내린다"

```bash
# 직접 해보기: SIL 보기 (최적화 전)
echo 'func add(_ a: Int, _ b: Int) -> Int { a + b }' | swiftc -emit-silgen -

# SIL 보기 (최적화 후)
echo 'func add(_ a: Int, _ b: Int) -> Int { a + b }' | swiftc -emit-sil -O -
```

**왜 SIL이 존재하는가?** 이것이 가장 중요한 질문입니다:
- LLVM IR로 바로 가면 **소유권 정보**, **프로토콜 적합성**, **제네릭 특화** 기회를 잃습니다
- SIL은 이 정보를 **보존하면서** SSA(Static Single Assignment) 형태로 최적화합니다
- ARC 최적화, 디바이스별 최적화, 제네릭 특화 같은 Swift 고유 최적화가 여기서 일어납니다

```
# 프로젝트 내 위치
# lib/SIL/            → SIL 자료구조
# lib/SILGen/         → AST → Raw SIL 변환
# lib/SILOptimizer/   → SIL 최적화 패스들
# docs/SIL/           → SIL 상세 문서
```

#### 2-4. IRGen → LLVM IR → 기계어

**개발자의 멘탈 모델**: "구체적 메모리 레이아웃과 호출 규약을 결정한다"

```bash
# 직접 해보기
echo 'func add(_ a: Int, _ b: Int) -> Int { a + b }' | swiftc -emit-ir -O -
echo 'func add(_ a: Int, _ b: Int) -> Int { a + b }' | swiftc -S -O -
```

```
# 프로젝트 내 위치
# lib/IRGen/     → SIL → LLVM IR 변환
# lib/LLVMPasses → LLVM 수준 최적화
```

---

### Phase 3: Lexicon — 용어 사전 익히기 (상시)

컴파일러 기여자들은 **공유된 어휘**를 사용합니다. 이 어휘를 모르면 PR 리뷰나 포럼 토론을 따라갈 수 없습니다.

**필수 용어 10선 (빈도순)**:

| 용어 | 의미 | 왜 알아야 하는가 |
|------|------|-----------------|
| **SIL** | Swift Intermediate Language | 모든 대화에 등장 |
| **Sema** | Semantic Analysis (타입 체커) | 버그 리포트, 커밋 태그 |
| **archetype** | 제네릭 문맥에서 타입 매개변수의 자리표시자 | 제네릭 관련 코드 이해 |
| **witness table** | 프로토콜 적합성의 SIL/런타임 표현 | vtable의 프로토콜 버전 |
| **canonical type** | 문법적 설탕이 제거된 타입 | `Int?` → `Optional<Int>` |
| **existential** | 프로토콜 타입의 값 | `any Protocol` 관련 작업 |
| **metatype** | 타입을 나타내는 값의 타입 | `Int.self`의 타입 |
| **thunk** | 호출 규약 조정용 합성 함수 | 디버깅 시 자주 만남 |
| **NFC** | No Functionality Change | 커밋 메시지에서 자주 사용 |
| **QoI** | Quality of Implementation | FIXME 주석에서 자주 등장 |

전체 용어 사전: `docs/Lexicon.md` (이 파일을 **반복적으로** 참조하게 됩니다)

---

### Phase 4: 기여 시작하기 — Good First Issues (2~4주)

#### 어디서 이슈를 찾는가?

```
https://github.com/swiftlang/swift/contribute
→ "good first issue" 라벨이 붙은 이슈들
```

#### 이슈를 고를 때의 판단 기준

```
좋은 선택:
  ✅ 다른 사람이 작업 중이 아닌 것 (댓글, 담당자 확인)
  ✅ 구체적인 재현 단계가 있는 것
  ✅ 최근(1~2개월) 활동이 있는 것
  ✅ 컴파일러 서브시스템 태그가 있는 것 (예: [Sema], [SILOptimizer])

피해야 할 것:
  ❌ 6개월 이상 아무도 안 건드린 이슈 (난이도가 예상보다 높을 확률)
  ❌ 재현 단계가 불명확한 이슈
  ❌ "좋은 첫 이슈"지만 댓글이 토론으로 가득한 이슈
```

#### 일반적인 Good First Issue 유형

| 유형 | 예시 | 필요 지식 |
|------|------|----------|
| **진단 메시지 개선** | 에러 메시지를 더 명확하게 | Sema + Diagnostics |
| **경고 추가** | 특정 패턴에 대한 경고 | Sema |
| **코드 정리 (NFC)** | 리팩토링, API 현대화 | 해당 서브시스템 |
| **테스트 추가** | 누락된 테스트 케이스 | lit 테스트 프레임워크 |
| **문서 개선** | 주석, 문서 업데이트 | 낮은 진입 장벽 |

#### 작업 흐름

```bash
# 1. 이슈에 댓글 남기기
# "I'd like to work on this issue."

# 2. 브랜치 생성
git checkout -b fix/issue-12345 main

# 3. 관련 코드 찾기 — 에러 메시지에서 역추적
grep -r "error message text" lib/

# 4. 수정 & 빌드
ninja -C ../build/Ninja-RelWithDebInfoAssert/swift-macosx-$(uname -m) bin/swift-frontend

# 5. 테스트 작성 & 실행
# 테스트 파일: test/<서브시스템>/<your_test>.swift
utils/run-test --build-dir ../build/Ninja-RelWithDebInfoAssert/swift-macosx-$(uname -m) \
  test/Sema/<your_test>.swift

# 6. PR 제출
git push origin fix/issue-12345
# → GitHub에서 PR 생성
```

---

### Phase 5: 테스트 이해하기

> 상세한 `run-test`/`lit.py` 옵션과 사이트 설정은
> [컴파일러 개발 환경 가이드](2026-04-04-swift-compiler-dev-environment.md)의 테스트 장을 참고하세요.
> 여기서는 학습 루프에 필요한 최소한만 남깁니다.

#### 테스트 구조

```
test/           → 주요 테스트 (빠름, PR마다 실행)
validation-test/ → 검증 테스트 (느림, CI에서 실행)
unittests/       → C++ 유닛 테스트
benchmark/       → 성능 벤치마크
```

#### lit 테스트 읽는 법

```swift
// test/Sema/<example>.swift
// RUN: %target-typecheck-verify-swift

func test() {
  let x: Int = "hello" // expected-error {{cannot convert value of type 'String' to specified type 'Int'}}
}
```

- `// RUN:` — 테스트 실행 명령어
- `%target-typecheck-verify-swift` — 타입 체크 후 expected-error/warning 검증
- `// expected-error` — 이 줄에서 이 에러가 나와야 테스트 통과

#### 직접 테스트 실행하기

```bash
# 단일 테스트
utils/run-test --build-dir ../build/Ninja-RelWithDebInfoAssert/swift-macosx-$(uname -m) \
  test/Sema/<your_test>.swift

# 필터링 (의존성 재빌드 없이 반복 실행)
../llvm-project/llvm/utils/lit/lit.py -sv \
  ../build/Ninja-RelWithDebInfoAssert/swift-macosx-$(uname -m)/test-macosx-$(uname -m) \
  --filter="keyword"
```

---

### Phase 6: 디버깅 기법

> AST/SIL 덤프, SIL 패스 추적, LLDB 연결의 상세 옵션은
> [컴파일러 개발 환경 가이드](2026-04-04-swift-compiler-dev-environment.md)의 디버깅 장을 참고하세요.
> 여기서는 “레이어를 관찰하는 최소 명령”만 유지합니다.

#### 중간 표현 덤프 (가장 많이 쓰는 기법)

```bash
swiftc -dump-ast file.swift          # AST
swiftc -emit-sil file.swift          # Canonical SIL
swiftc -emit-sil -O file.swift       # Optimized SIL
```

#### 컴파일러 디버깅

```bash
# 디버거 연결
lldb -- ../build/Ninja-RelWithDebInfoAssert/swift-macosx-$(uname -m)/bin/swift-frontend \
  -typecheck file.swift

# 타입 체커 제약 풀기 과정 보기
swiftc -Xfrontend -debug-constraints file.swift
```

---

## Layer 3: 깊은 통찰 — 기여자의 성장 경로

### 기여자들은 어떤 멘탈 모델을 가지고 있는가?

Swift 컴파일러 기여자들과의 대화, 포럼 글, 발표를 종합하면 **3단계 멘탈 모델 성장 경로**가 보입니다:

#### Level 1: "파이프라인 관찰자" (0~3개월)

```
"이 Swift 코드가 각 단계에서 어떻게 변환되는지 추적할 수 있다"
```

- 중간 표현 덤프를 읽고 각 단계의 역할을 설명할 수 있음
- 에러 메시지에서 역추적하여 관련 코드를 찾을 수 있음
- lit 테스트를 읽고, 작성할 수 있음
- **주로 하는 기여**: 진단 개선, 테스트 추가, 문서, NFC 리팩토링

#### Level 2: "서브시스템 전문가" (3~12개월)

```
"이 서브시스템(예: Sema, SILOptimizer) 안에서 데이터가 어떻게 흐르는지 이해한다"
```

- 특정 서브시스템의 주요 자료구조와 알고리즘을 이해함
- 해당 영역의 버그를 독립적으로 진단하고 수정할 수 있음
- 새로운 기능의 작은 부분을 구현할 수 있음
- **주로 하는 기여**: 버그 수정, 기존 기능 개선, 작은 최적화 패스

#### Level 3: "아키텍처 이해자" (1년+)

```
"서브시스템 간의 상호작용과 설계 트레이드오프를 이해한다"
```

- 여러 서브시스템에 걸친 변경을 설계할 수 있음
- Swift Evolution 제안의 구현 가능성을 평가할 수 있음
- 다른 기여자의 코드를 리뷰할 수 있음
- **주로 하는 기여**: 새로운 언어 기능 구현, 대규모 리팩토링

### 체계적 학습을 위한 추천 자료 (순서대로)

#### Step 1: 파이프라인 전체 조망

| 자료 | 유형 | 소요시간 | 핵심 |
|------|------|---------|------|
| [Contributing to Open Source Swift](https://youtu.be/Ysa2n8ZX-YY) by Jesse Squires | 발표 | 40분 | 파이프라인 전체 + 기여 팁 |
| [Becoming an Effective Contributor](https://youtu.be/oGJKsp-pZPk) by Haskins & Widmann | 발표 | 40분 | 빌드/디버그/테스트 실무 |
| [Getting Started with Swift Compiler Dev](https://modocache.io/getting-started-with-swift-development) by Brian Gesiak | 블로그 시리즈 | 2~3시간 | 단계별 가이드 |

#### Step 2: SIL 깊이 이해

| 자료 | 유형 | 소요시간 | 핵심 |
|------|------|---------|------|
| [Swift's High-Level IR](https://youtu.be/Ntj8ab-5cvE) by Groff & Lattner | 발표 | 50분 | SIL의 존재 이유와 설계 |
| [Ownership SSA](https://youtu.be/qy3iZPHZ88o) by Gottesman | 발표 | 40분 | 소유권과 메모리 안전성 |
| `docs/SIL/SIL.md` | 문서 | 2~3시간 | SIL 명령어 완전 참조 |

#### Step 3: 타입 시스템 이해

| 자료 | 유형 | 소요시간 | 핵심 |
|------|------|---------|------|
| [A Type System from Scratch](https://youtu.be/IbjoA5xVUq0) by Robert Widmann | 발표 | 50분 | 제약 기반 타입 추론 |
| [Implementing Swift Generics](https://youtu.be/ctS8FzqcRug) by Pestov & McCall | 발표 | 50분 | 제네릭 컴파일 전략 |
| [The Secret Life of Types in Swift](https://medium.com/@slavapestov/the-secret-life-of-types-in-swift-ff83c3c000a5) | 블로그 | 30분 | 타입 내부 표현 |
| `docs/Generics/` | 책 | 여러 시간 | "Compiling Swift Generics" |

#### Step 4: 런타임과 ABI

| 자료 | 유형 | 소요시간 | 핵심 |
|------|------|---------|------|
| [The Swift Runtime](https://belkadan.com/blog/tags/swift-runtime/) by Jordan Rose | 블로그 시리즈 | 3~4시간 | 런타임 레이아웃 완전 정복 |
| [How Swift Achieved Dynamic Linking](https://gankra.github.io/blah/swift-abi/) | 블로그 | 1시간 | ABI 안정성 설계 철학 |
| `docs/ABI/` | 문서 | 여러 시간 | ABI 상세 사양 |

### 핵심 프로젝트 디렉토리 맵

```
swift/
├── lib/                          # 컴파일러 핵심 (C++)
│   ├── Parse/                    # 파서
│   ├── AST/                      # AST 자료구조
│   ├── Sema/                     # 타입 체커 ← Good First Issue 다수
│   ├── SIL/                      # SIL 자료구조
│   ├── SILGen/                   # AST → SIL 변환
│   ├── SILOptimizer/             # SIL 최적화 패스
│   ├── IRGen/                    # SIL → LLVM IR
│   ├── ClangImporter/            # C/ObjC 가져오기
│   ├── Frontend/                 # 컴파일러 드라이버 진입점
│   └── Serialization/            # 모듈 직렬화
│
├── SwiftCompilerSources/Sources/ # 컴파일러 (Swift로 작성)
│   ├── AST/                      # AST 확장
│   ├── SIL/                      # SIL 확장
│   ├── Optimizer/                # Swift로 작성된 최적화 패스
│   └── Basic/                    # 기본 유틸리티
│
├── stdlib/                       # 표준 라이브러리
│   ├── public/core/              # Array, String, Int 등
│   ├── public/Concurrency/       # async/await, Actor
│   └── public/runtime/           # 런타임 지원
│
├── test/                         # 주요 테스트
├── validation-test/              # 검증 테스트
├── docs/                         # 문서
│   ├── HowToGuides/              # 가이드
│   ├── SIL/                      # SIL 문서
│   ├── Generics/                 # 제네릭 책
│   └── Lexicon.md                # 용어 사전 ★ 반복 참조
└── utils/                        # 빌드/개발 도구
    ├── build-script               # 메인 빌드 스크립트
    └── update-checkout            # 의존성 관리
```

### 커뮤니티 참여

```
Swift Forums (forums.swift.org)
├── Development 카테고리         ← 기여자 질문/토론 장소
├── Swift Evolution 카테고리      ← 언어 변경 제안
└── Compiler 카테고리             ← 컴파일러 관련 토론

GitHub (github.com/swiftlang/swift)
├── Issues                       ← 버그 리포트
│   └── "good first issue" 라벨  ← 여기서 시작
├── Pull Requests                ← 코드 리뷰 참여 (다른 사람 PR 리뷰도 좋은 학습)
└── Discussions                  ← 일반 토론
```

**리뷰를 받는 것도, 하는 것도 학습입니다.** 다른 사람의 PR을 읽고 이해하려는 시도 자체가 컴파일러 내부를 배우는 가장 효과적인 방법 중 하나입니다.

---

## 메타인지 질문

1. **확장 질문**: "SIL이 없고 AST에서 바로 LLVM IR로 갔다면 어떤 최적화가 불가능했을까?"를 생각해 보세요. 이 질문에 답할 수 있다면 SIL의 존재 이유를 진정으로 이해한 것입니다.

2. **전이 질문**: "이 컴파일러 파이프라인 패턴이 내가 만드는 소프트웨어에서는 어떻게 나타나는가?" — 점진적 변환, 중간 표현, 단계별 검증은 컴파일러에만 국한되지 않는 보편적 설계 패턴입니다.
