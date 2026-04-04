# Swift 컴파일러 개발 환경 완전 정복

> **대상**: Swift 컴파일러에 기여하려는 개발자
> **목표**: 빌드 → 수정 → 테스트 → 디버깅 사이클을 자유롭게 돌릴 수 있는 수준 도달
> **전제**: macOS + Apple Silicon 기준 (Intel/Linux는 차이점만 별도 표기)

---

## 빠른 시작 (10분)

이 문서 전체를 다 읽기 전에, 아래 4단계만 먼저 실행해도 일상 개발 루프를 바로 만들 수 있습니다.

```bash
# 1. 저장소 준비
mkdir swift-project && cd swift-project
git clone git@github.com:swiftlang/swift.git swift
cd swift
utils/update-checkout --clone-with-ssh

# 2. 첫 빌드
utils/build-script \
  --skip-build-benchmarks \
  --swift-darwin-supported-archs "$(uname -m)" \
  --release-debuginfo \
  --swift-disable-dead-stripping

# 3. 이후 반복 루프
export BUILD=../build/Ninja-RelWithDebInfoAssert/swift-macosx-$(uname -m)
ninja -C $BUILD bin/swift-frontend

# 4. 테스트 한 번 실행
utils/run-test --build-dir $BUILD test/SILOptimizer/simplify_cfg.sil
```

이 단계가 끝나면:
- 로컬 빌드 컴파일러가 생깁니다.
- 증분 빌드 명령이 정리됩니다.
- 수정 후 어디서 검증할지 바로 연결됩니다.

---

## Layer 1: 핵심 요약 (1분)

Swift 컴파일러 개발 환경의 핵심은 **"4단 빌드 위임"**과 **"멀티 레포"**입니다.

### 빌드 시스템 구조

```
build-script (Python)      ← 사용자가 호출하는 진입점
    ↓
build-script-impl (Bash)   ← 수많은 빌드 설정을 CMake 호출로 변환
    ↓
CMake                      ← 빌드 그래프 생성
    ↓
Ninja                      ← 실제 컴파일 실행 ← 증분 빌드 시 여기를 직접 호출
```

### 멀티 레포 구조

```
swift-project/             ← 작업 루트
├── swift/                 ← 컴파일러 + 표준 라이브러리 (이 저장소)
├── llvm-project/          ← LLVM/Clang 백엔드
├── swift-syntax/          ← 구문 트리 라이브러리
├── swift-driver/          ← 컴파일러 드라이버
├── swift-corelibs-*/      ← Foundation, Dispatch, XCTest
└── ... (여러 의존 저장소)
```

### 일상 작업의 99%

```bash
# 1. 코드 수정
vim lib/SILOptimizer/Transforms/CSE.cpp

# 2. 증분 빌드 (수 분)
ninja -C ../build/Ninja-RelWithDebInfoAssert/swift-macosx-$(uname -m) bin/swift-frontend

# 3. 테스트
utils/run-test --build-dir ../build/Ninja-RelWithDebInfoAssert/swift-macosx-$(uname -m) \
  test/SILOptimizer/simplify_cfg.sil

# 4. (필요 시) 디버깅
lldb -- ../build/Ninja-RelWithDebInfoAssert/swift-macosx-$(uname -m)/bin/swift-frontend \
  -emit-sil test.swift
```

---

## Layer 2: 상세 가이드

---

### 1장. 사전 준비 — 시스템 요구사항

#### 하드웨어

| 항목 | 최소 | 권장 |
|------|------|------|
| **디스크** | 70 GB | 150+ GB |
| **RAM** | 16 GB | 32+ GB |
| **CPU** | 4코어 | 8코어+ |

> 소스 자체는 수 GB 규모이고, 빌드 산출물은 설정에 따라 수십 GB 이상까지 커질 수 있습니다.

#### 소프트웨어

```bash
# 확인할 것들
xcode-select -p         # Xcode Command Line Tools (또는 Xcode 전체)
python3 --version        # 3.6+
git --version            # 2.x
cmake --version          # 3.19.6+ (build-script가 자동 관리하므로 없어도 됨)
ninja --version          # 없으면 build-script가 자동 빌드

# Apple Silicon 주의: Rosetta가 아닌 네이티브 arm64 확인
uname -m                 # arm64 여야 함
file $(which python3)    # arm64 여야 함
```

#### 선택 사항 (강력 권장)

```bash
# sccache — LLVM 재빌드 시간을 극적으로 줄여줌
brew install sccache

# 캐시 크기 설정
export SCCACHE_CACHE_SIZE="50G"
```

---

### 2장. 소스 클론 — 멀티 레포 이해하기

#### Before: "git clone만 하면 되겠지?"

```bash
git clone https://github.com/swiftlang/swift.git
cd swift
# 빌드 시도 → 실패! llvm-project, swift-syntax 등이 없음
```

#### After: update-checkout으로 전체 의존성 클론

```bash
# 작업 루트 디렉토리 생성
mkdir swift-project && cd swift-project

# Swift 메인 저장소 클론
git clone git@github.com:swiftlang/swift.git swift

# 모든 의존 저장소를 함께 클론
cd swift
utils/update-checkout --clone-with-ssh
```

#### 왜 중요한가? — 멀티 레포 구조

Swift 컴파일러는 LLVM, Clang, SwiftSyntax 등 **독립적으로 발전하는 프로젝트들**에 의존합니다. 각각이 별도 저장소인 이유:
- LLVM/Clang은 Apple 외에도 수많은 기여자가 있는 별도 오픈소스 프로젝트
- swift-syntax는 SwiftPM 패키지로도 독립 사용됨
- 각 저장소가 독립적 릴리스 사이클을 가짐

`update-checkout`은 이 저장소들의 **호환되는 커밋 조합**을 자동으로 맞춰줍니다.

#### update-checkout 주요 명령어

```bash
# 최신 상태로 업데이트
utils/update-checkout

# 특정 브랜치/태그로 전환
utils/update-checkout --scheme release/6.0
utils/update-checkout --tag swift-6.0-RELEASE

# 현재 모든 저장소의 해시 덤프 (재현용)
utils/update-checkout --dump-hashes

# 로컬 변경 사항 정리 후 업데이트
utils/update-checkout --clean   # 변경 삭제
utils/update-checkout --stash   # 변경 stash
```

---

### 3장. 빌드 — 처음부터 끝까지

#### 3-1. 빌드 설정(Build Type) 이해

| 플래그 | CMake 타입 | 최적화 | 디버그 정보 | 용도 |
|--------|-----------|--------|------------|------|
| `-d` / `--debug` | Debug | 없음 | 전체 | 디버거로 깊이 추적할 때 |
| **`-r` / `--release-debuginfo`** | **RelWithDebInfo** | **O2** | **있음** | **★ 일상 개발에 권장** |
| `-R` / `--release` | Release | O2 | 최소 | 최종 성능 테스트 |

```
--release-debuginfo를 권장하는 이유:
├── 컴파일러 자체가 최적화되어 빌드/테스트가 빠름
├── 디버그 정보가 있어 lldb로 디버깅 가능
└── Assertion 켜면 내부 불변식 위반을 즉시 발견
```

#### 3-2. 컴포넌트별 독립 설정

"컴파일러는 디버그, 표준 라이브러리는 릴리스"처럼 **컴포넌트별로 다르게** 설정할 수 있습니다:

```bash
# 실용적 조합: 릴리스 stdlib + 디버그 가능한 컴파일러
utils/build-script --release-debuginfo --debug-swift

# 타입 체커만 최적화 유지 (메모리 사용량 감소)
utils/build-script --release-debuginfo --debug-swift --force-optimized-typechecker
```

#### 3-3. 첫 빌드 실행

```bash
# macOS (Apple Silicon) — 가장 일반적인 개발 빌드
utils/build-script \
  --skip-build-benchmarks \
  --swift-darwin-supported-archs "$(uname -m)" \
  --release-debuginfo \
  --swift-disable-dead-stripping \
  --sccache
```

각 플래그의 의미:

| 플래그 | 효과 |
|--------|------|
| `--skip-build-benchmarks` | 벤치마크 스위트 빌드 생략 (시간 절약) |
| `--swift-darwin-supported-archs "$(uname -m)"` | 현재 아키텍처만 빌드 (arm64 또는 x86_64) |
| `--release-debuginfo` | 최적화 + 디버그 정보 |
| `--swift-disable-dead-stripping` | 디버깅 시 심볼 보존 |
| `--sccache` | C++ 빌드 캐싱 (재빌드 시 극적 속도 향상) |

#### 3-4. 빌드 산출물 위치

```
swift-project/
├── swift/                                          ← 소스
└── build/
    └── Ninja-RelWithDebInfoAssert/                 ← 빌드 타입 + Assertion
        ├── swift-macosx-<arch>/                    ← Swift 컴파일러
        │   ├── bin/
        │   │   ├── swift-frontend                  ★ 메인 컴파일러 바이너리
        │   │   ├── swiftc                          ← 드라이버
        │   │   └── swift-demangle                  ← 디맹글링 도구
        │   ├── lib/
        │   │   └── swift/macosx/                   ← 표준 라이브러리
        │   └── test-macosx-<arch>/                 ← 테스트 설정
        ├── llvm-macosx-arm64/                      ← LLVM/Clang
        ├── cmark-macosx-arm64/                     ← CommonMark 파서
        └── swift-syntax-macosx-arm64/              ← SwiftSyntax
```

> **팁**: 이후 모든 예시에서 macOS 기준 `$BUILD`는 `../build/Ninja-RelWithDebInfoAssert/swift-macosx-$(uname -m)`를 의미합니다.

#### 3-5. 빌드 시간 예상

| 상황 | 시간 |
|------|------|
| 첫 빌드 (sccache 없음) | 1~3시간 |
| 첫 빌드 (sccache 있음) | 30분~1시간 |
| LLVM 변경 없는 재빌드 | 5~20분 |
| Swift 컴파일러만 증분 빌드 | 1~5분 |
| 파일 1~2개 수정 후 증분 빌드 | 30초~2분 |

---

### 4장. 증분 빌드 — 일상의 핵심

#### Before: 매번 build-script 실행

```bash
# 매번 전체 빌드 파이프라인을 다시 실행 (느림!)
utils/build-script --release-debuginfo ...
```

#### After: ninja 직접 호출

```bash
# 플랫폼 변수 설정 (셸 프로필에 넣어두면 편리)
export PLATFORM=$([[ $(uname) == Darwin ]] && echo macosx || echo linux)
export ARCH=$(uname -m)
export BUILD=../build/Ninja-RelWithDebInfoAssert/swift-${PLATFORM}-${ARCH}

# ★ 컴파일러만 증분 빌드 (가장 자주 쓰는 명령)
ninja -C $BUILD bin/swift-frontend

# 전체 Swift 프로젝트 빌드
ninja -C $BUILD

# 특정 타겟만 빌드
ninja -C $BUILD bin/swift-demangle

# 사용 가능한 타겟 목록
ninja -C $BUILD -t targets | grep swift-frontend
ninja -C $BUILD -t targets | grep stdlib
```

#### 왜 중요한가? — build-script vs ninja

```
build-script:
├── CMake 재구성 확인
├── 의존 프로젝트(LLVM, SwiftSyntax 등) 빌드 확인
├── Swift 빌드
└── (옵션) 테스트 실행

ninja 직접 호출:
└── Swift 증분 빌드만 실행 ← 이미 CMake 구성이 되어 있으면 이것만으로 충분
```

**규칙**: CMakeLists.txt나 의존 저장소를 변경하지 않았다면 **항상 ninja를 직접** 호출하세요.

#### 더 빠른 빌드를 위한 고급 설정

```bash
# 1. bootstrapping=hosttools (최신 Swift 툴체인 필요)
#    컴파일러의 Swift 부분을 시스템 Swift로 빌드 → 2~3배 빠름
utils/build-script --bootstrapping=hosttools ...

# 2. 병렬 링크 작업 제한 (메모리 부족 시)
utils/build-script \
  --llvm-cmake-options=-DLLVM_PARALLEL_LINK_JOBS=2 \
  --swift-cmake-options=-DSWIFT_PARALLEL_LINK_JOBS=2

# 3. 릴리스 stdlib + 디버그 컴파일러 (두 빌드 디렉토리 활용)
#    Step 1: 릴리스 빌드
utils/build-script --release-assert
#    Step 2: 릴리스 stdlib을 디버그 빌드에 복사
SRC=../build/Ninja-ReleaseAssert/swift-macosx-$ARCH
DST=../build/Ninja-DebugAssert/swift-macosx-$ARCH
cp -r $SRC/lib/swift/macosx $DST/lib/swift/
#    Step 3: 디버그 컴파일러만 재빌드
ninja -C $DST bin/swift-frontend

# 4. sccache 통계 확인
sccache --show-stats
```

---

### 5장. 테스트 — 3가지 수준

#### 5-1. 테스트 디렉토리 구조

```
swift/
├── test/                    ★ 주요 테스트 (PR마다 CI에서 실행)
│   ├── SIL/                    SIL 관련 (~285 파일, 현재 checkout 기준)
│   ├── SILGen/                 SIL 생성 (~973 파일, 현재 checkout 기준)
│   ├── SILOptimizer/           SIL 최적화 (~1338 파일, 현재 checkout 기준)
│   ├── Sema/                   타입 체커
│   ├── Parse/                  파서
│   ├── Demangle/               디맹글링
│   ├── IRGen/                  IR 생성
│   ├── Concurrency/            동시성
│   └── ... (96개 하위 디렉토리, 현재 checkout 기준)
│
├── validation-test/         느린 검증 테스트 (CI에서만)
├── unittests/               C++ 유닛 테스트
└── benchmark/               성능 벤치마크 스위트
```

#### 5-2. lit 테스트 해부

lit(LLVM Integrated Tester)은 Swift 컴파일러 테스트의 핵심입니다.

```swift
// test/SILOptimizer/simplify_cfg.sil
//
// RUN: %target-sil-opt -enable-sil-verify-all %s -simplify-cfg | %FileCheck %s
//     ↑ 실행 명령어                                               ↑ 출력 검증
//
// %target-sil-opt → 빌드된 sil-opt 바이너리 (타겟 트리플 자동 설정)
// %FileCheck      → LLVM FileCheck 도구 (패턴 매칭)

sil_stage canonical
import Swift

// CHECK-LABEL: sil @simple_branch
// CHECK-NOT: cond_br
// CHECK: return
sil @simple_branch : $@convention(thin) () -> Int32 {
bb0:
  %0 = integer_literal $Builtin.Int1, 1
  cond_br %0, bb1, bb2
bb1:
  %1 = integer_literal $Builtin.Int32, 42
  %2 = struct $Int32 (%1 : $Builtin.Int32)
  return %2 : $Int32
bb2:
  unreachable
}
```

**해부**:
- `// RUN:` — 테스트 실행 명령. 여러 줄 가능
- `%target-sil-opt` — 빌드된 `sil-opt` 바이너리로 치환되는 변수
- `-simplify-cfg` — 실행할 SIL 최적화 패스
- `%FileCheck %s` — 이 파일의 CHECK 패턴과 출력 비교
- `// CHECK-LABEL:` — 새로운 검증 블록 시작 (함수 이름 등)
- `// CHECK:` — 이 패턴이 출력에 있어야 함
- `// CHECK-NOT:` — 이 패턴이 출력에 **없어야** 함

**다른 테스트 유형**:

```swift
// Swift 소스 테스트 (타입 체커 검증)
// RUN: %target-typecheck-verify-swift
let x: Int = "hello"  // expected-error {{cannot convert value}}

// Swift 소스 테스트 (SIL 출력 검증)
// RUN: %target-swift-frontend -emit-sil %s | %FileCheck %s

// Demangle 테스트
// RUN: %swift-demangle -tree-only < %s | %FileCheck %s
```

#### 5-3. 테스트 실행 방법

```bash
# ── 방법 1: lit.py 직접 호출 (가장 빠름, 의존성 재빌드 안 함) ──

# 단일 파일
../llvm-project/llvm/utils/lit/lit.py -sv $BUILD/test-${PLATFORM}-${ARCH}/SILOptimizer/simplify_cfg.sil

# 디렉토리 전체
../llvm-project/llvm/utils/lit/lit.py -sv $BUILD/test-${PLATFORM}-${ARCH}/SILOptimizer/

# 패턴 필터
../llvm-project/llvm/utils/lit/lit.py -sv --filter="demangle" $BUILD/test-${PLATFORM}-${ARCH}/

# ── 방법 2: run-test (의존성 재빌드 포함) ──

# 소스 경로로 지정 가능
utils/run-test --build-dir $BUILD test/SILOptimizer/simplify_cfg.sil

# ── 방법 3: CMake 타겟 ──

# 전체 주요 테스트
cmake --build $BUILD -- check-swift-${PLATFORM}-${ARCH}

# 최적화 모드 테스트
cmake --build $BUILD -- check-swift-optimize-${PLATFORM}-${ARCH}
```

**lit.py 유용한 옵션**:

| 옵션 | 효과 |
|------|------|
| `-s` | 진행률 바만 표시 |
| `-v` | 실패한 테스트의 명령어 표시 |
| `-vv` | 정확한 실패 지점 표시 |
| `-a` | 성공한 테스트도 명령어 표시 |
| `--filter=PATTERN` | 이름 패턴으로 필터 |
| `--max-failures=N` | N개 실패 후 중단 |
| `--time-tests` | 테스트별 소요 시간 |
| `--no-execute` | 드라이런 (PASS로 가정) |

#### 5-4. 테스트 작성

```swift
// test/SILOptimizer/<my_new_test>.sil

// 1. 실행 명령어 — 어떤 패스를 어떻게 실행할지
// RUN: %target-sil-opt %s -my-optimization-pass | %FileCheck %s

sil_stage canonical
import Swift

// 2. 기대 출력 패턴
// CHECK-LABEL: sil @test_function
// CHECK: [[VAL:%[0-9]+]] = integer_literal
// CHECK: return [[VAL]]

// 3. 입력 SIL
sil @test_function : $@convention(thin) () -> Builtin.Int64 {
bb0:
  %0 = integer_literal $Builtin.Int64, 42
  return %0 : $Builtin.Int64
}
```

**테스트 작성 원칙**:
- 가능한 한 **작게** — 재현에 필요한 최소한의 코드만
- **가장 가까운 추상화 수준**에서 작성 — SIL 최적화 버그면 .sil, 타입 체커 버그면 .swift
- `expected-error`/`expected-warning`은 **정확한 줄**에 배치

---

### 6장. 디버깅 — 컴파일러를 뜯어보는 기법들

#### 6-1. 중간 표현 덤프 (가장 기본, 가장 자주 사용)

```bash
# 각 단계의 출력을 파일로 저장하고 비교
swiftc -dump-ast test.swift          > ast.txt      # AST
swiftc -emit-silgen test.swift       > raw.sil      # Raw SIL
swiftc -emit-sil test.swift          > canonical.sil # Canonical SIL
swiftc -emit-sil -O test.swift       > optimized.sil # Optimized SIL
swiftc -emit-ir -O test.swift        > llvm.ll       # LLVM IR
swiftc -S -O test.swift              > asm.s          # 어셈블리

# diff로 최적화 전후 비교
diff canonical.sil optimized.sil
```

#### 6-2. SIL 패스별 추적

```bash
# 특정 함수의 SIL을 각 패스 전후로 출력
swiftc -Xllvm '-sil-print-function=$s4test3fooyyF' -O test.swift

# 모든 함수의 SIL을 각 패스마다 출력 (매우 많은 출력!)
swiftc -Xllvm -sil-print-all -O test.swift

# 특정 패스 전/후만 출력
swiftc -Xllvm '-sil-print-before=simplify-cfg' -O test.swift
swiftc -Xllvm '-sil-print-after=simplify-cfg' -O test.swift
swiftc -Xllvm '-sil-print-around=simplify-cfg' -O test.swift

# 패스 이름 찾기 — 패스 파이프라인 덤프
swiftc -Xllvm -sil-print-pass-name -O test.swift 2>&1 | head -50
```

#### 6-3. 타입 체커 디버깅

```bash
# 제약 풀기 과정 전체 추적
swiftc -Xfrontend -debug-constraints test.swift

# 진단 메시지의 내부 ID 표시
swiftc -Xfrontend -debug-diagnostic-names test.swift

# 첫 에러에서 즉시 중단 (assert)
swiftc -Xllvm -swift-diagnostics-assert-on-error=1 test.swift
```

#### 6-4. LLDB로 컴파일러 디버깅

```bash
# 컴파일러를 LLDB로 실행
lldb -- $BUILD/bin/swift-frontend -emit-sil -O test.swift

# LLDB 내에서:
(lldb) breakpoint set -n "SILCombiner::run"
(lldb) run
(lldb) bt               # 백트레이스
(lldb) frame variable   # 지역 변수 확인
(lldb) expr inst->dump() # SIL 명령어 덤프
```

**Xcode에서 디버깅**:
1. `utils/swift-dev-utils/swift-xcodegen`으로 Xcode 프로젝트 생성
2. Scheme: `swift-frontend` 선택
3. Edit Scheme → Run → Arguments에 컴파일러 인자 입력:
   ```
   -emit-sil -O /path/to/test.swift
   ```
4. Cmd+R로 실행 → 브레이크포인트에서 멈춤

#### 6-5. C++ 코드에서 print 디버깅

```cpp
// LLVM 스트림으로 출력
llvm::errs() << "Value: " << someValue << "\n";

// SIL 노드 덤프
instruction->dump();
function->dump();
type.dump();

// 타입과 값 목록 출력
auto &e = llvm::errs();
e << "types = [";
llvm::interleaveComma(types, e, [&](auto ty) { ty.dump(e); });
e << "]\n";

// 의도적 크래시 (이 지점에 도달하면 안 됨을 표시)
llvm_unreachable("unexpected case");

// 메시지와 함께 크래시
llvm::report_fatal_error("something went wrong");
```

#### 6-6. 옵티마이저 버그 이분 탐색

```bash
# SIL 최적화 패스를 N개만 실행하고 중단
# N을 조절하며 이분 탐색 → 문제를 일으키는 패스 특정
swiftc -Xllvm -sil-opt-pass-count=10 -O test.swift  # 10개 패스만
swiftc -Xllvm -sil-opt-pass-count=5 -O test.swift   # 5개 패스만
# ... 범위를 좁혀감
```

---

### 7장. 로컬 빌드 컴파일러 사용하기

#### 직접 Swift 파일 컴파일

```bash
# 빌드된 swiftc로 직접 컴파일
$BUILD/bin/swiftc MyFile.swift -o MyProgram

# SDK 지정 (iOS 등)
xcrun -sdk iphoneos $BUILD/bin/swiftc -target arm64-apple-ios16.0 MyFile.swift
```

#### SwiftPM 패키지에 사용

```bash
# SWIFT_EXEC 환경변수로 지정
SWIFT_EXEC=$BUILD/bin/swiftc swift build
```

#### Xcode 프로젝트에 사용

```
프로젝트 선택 → Build Settings → + → Add User-Defined Setting
  SWIFT_EXEC = /absolute/path/to/swift-project/build/Ninja-RelWithDebInfoAssert/swift-macosx-<arch>/bin/swiftc
→ Clean Build (Cmd+Shift+K) 후 재빌드
```

---

### 8장. 유용한 도구 모음

#### 컴파일러 관련 바이너리

| 도구 | 위치 | 용도 |
|------|------|------|
| `swift-frontend` | `$BUILD/bin/` | 메인 컴파일러 (모든 단계 실행) |
| `sil-opt` | `$BUILD/bin/` | SIL 최적화 패스만 독립 실행 |
| `swift-demangle` | `$BUILD/bin/` | 맹글된 심볼 디맹글링 |
| `sil-func-extractor` | `$BUILD/bin/` | SIL에서 특정 함수 추출 |
| `sil-nm` | `$BUILD/bin/` | SIL 모듈의 심볼 목록 |
| `swift-ide-test` | `$BUILD/bin/` | IDE 기능 테스트 |
| `swift-refactor` | `$BUILD/bin/` | 리팩토링 도구 |

#### utils/ 주요 스크립트

| 스크립트 | 용도 |
|----------|------|
| `utils/build-script` | 전체 빌드 오케스트레이션 |
| `utils/update-checkout` | 멀티 레포 동기화 |
| `utils/run-test` | 의존성 재빌드 + 테스트 실행 |
| `utils/build-toolchain` | 배포용 툴체인 패키징 |
| `utils/viewcfg` | SIL CFG(제어 흐름 그래프) 시각화 |
| `utils/scale-test` | 컴파일러 성능 스케일링 분석 |
| `utils/dev-scripts/split-cmdline` | 긴 명령줄을 읽기 좋게 분리 |

#### 에디터 통합

```
utils/vim/          → Vim SIL 구문 강조
utils/sil-mode.el   → Emacs SIL 모드
```

---

### 9장. build-script 주요 플래그 레퍼런스

#### 빌드 설정

| 플래그 | 효과 |
|--------|------|
| `--release-debuginfo` / `-r` | ★ 최적화 + 디버그 정보 (권장) |
| `--debug` / `-d` | 최적화 없음 + 전체 디버그 |
| `--release` / `-R` | 최대 최적화 |
| `--assertions` / `-a` | Assert 활성화 (버그 조기 발견) |
| `--debug-swift` | Swift 컴파일러만 디버그 |
| `--force-optimized-typechecker` | 타입 체커는 최적화 유지 |

#### 범위 제어

| 플래그 | 효과 |
|--------|------|
| `--skip-build-benchmarks` | 벤치마크 빌드 생략 |
| `--swift-darwin-supported-archs arm64` | 현재 아키텍처만 |
| `--skip-ios` | iOS 빌드 생략 |

#### 캐싱/성능

| 플래그 | 효과 |
|--------|------|
| `--sccache` | C++ 빌드 캐싱 |
| `--bootstrapping=hosttools` | 시스템 Swift로 부트스트랩 (빠름) |
| `--jobs=N` | 병렬 빌드 작업 수 |

#### 테스트

| 플래그 | 효과 |
|--------|------|
| `--test` | 주요 테스트 실행 |
| `--validation-test` | 검증 테스트 실행 |
| `--long-test` | 긴 테스트 포함 |
| `--test-paths PATH` | 특정 테스트만 |

#### 디버깅/정보

| 플래그 | 효과 |
|--------|------|
| `--dry-run` / `-n` | 실행하지 않고 명령어만 표시 |
| `--verbose-build` | 실행되는 명령어 모두 표시 |
| `--reconfigure` | CMake 재구성 강제 |
| `--dump-config` | JSON 빌드 설정 출력 |

---

### 10장. 문제 해결

#### 빌드 실패 시

```bash
# 1. Xcode 버전 확인
xcodebuild -version

# 2. 클린 빌드 (Xcode 버전 변경 후)
utils/build-script --clean ...

# 3. CMake 재구성
utils/build-script --reconfigure ...

# 4. 의존 저장소 동기화
utils/update-checkout

# 5. 메모리 부족 (링커 OOM)
#    → 병렬 링크 작업 줄이기
--llvm-cmake-options=-DLLVM_PARALLEL_LINK_JOBS=1
--swift-cmake-options=-DSWIFT_PARALLEL_LINK_JOBS=1
```

#### 테스트 실패 시

```bash
# 실패한 테스트의 정확한 명령어 확인
../llvm-project/llvm/utils/lit/lit.py -vv \
  --param swift_site_config=$BUILD/test-${PLATFORM}-${ARCH}/lit.site.cfg \
  test/Sema/accessibility.swift

# 해당 명령어를 수동으로 실행하며 디버깅
# (lit -vv 출력에서 RUN 명령어 복사)
```

#### "변경이 반영 안 됨" 느낌일 때

```bash
# 1. 올바른 바이너리를 사용하는지 확인
which swiftc                          # 시스템 swiftc가 아닌지?
$BUILD/bin/swift-frontend --version   # 빌드 시간 확인

# 2. 증분 빌드가 제대로 됐는지 확인
ninja -C $BUILD bin/swift-frontend    # 재빌드
echo $?                                # 0이면 성공
```

---

### 11장. 일상 워크플로우 요약

```bash
# === 셸 프로필에 추가 (한 번만) ===
export SWIFT_PROJECT=~/swift-project
export PLATFORM=$([[ $(uname) == Darwin ]] && echo macosx || echo linux)
export ARCH=$(uname -m)
export BUILD=$SWIFT_PROJECT/build/Ninja-RelWithDebInfoAssert/swift-${PLATFORM}-${ARCH}
alias sninja='ninja -C $BUILD'
alias stest='$SWIFT_PROJECT/llvm-project/llvm/utils/lit/lit.py -sv'

# === 일상 작업 ===

# 1. 코드 수정
cd $SWIFT_PROJECT/swift
vim lib/Demangling/Demangler.cpp

# 2. 빌드
sninja bin/swift-frontend

# 3. 수정 확인
$BUILD/bin/swift-demangle '$s4Test3FooC'

# 4. 테스트
stest $BUILD/test-${PLATFORM}-${ARCH}/Demangle/

# 5. 전체 테스트 (PR 제출 전)
stest $BUILD/test-${PLATFORM}-${ARCH}/

# 6. PR 제출
git add -A && git commit -m "[Demangling] Fix something"
git push origin my-branch
```

---

## Layer 3: 깊은 통찰

### 빌드 시스템을 이해하면 보이는 것들

Swift 컴파일러의 빌드 시스템이 복잡한 이유는 **크로스 컴파일**과 **부트스트래핑** 때문입니다:

1. **크로스 컴파일**: macOS에서 빌드하지만 iOS/watchOS/Linux 등 다른 플랫폼의 표준 라이브러리도 함께 빌드해야 합니다
2. **부트스트래핑**: Swift 컴파일러의 일부는 Swift로 작성되어 있어서, Swift 컴파일러를 빌드하려면 Swift 컴파일러가 필요합니다 (닭과 달걀 문제)
3. **LLVM 의존성**: LLVM/Clang은 독립 프로젝트이므로 별도 빌드-설치-링크 과정이 필요합니다

이 세 가지 복잡성이 `build-script` → `build-script-impl` → CMake → Ninja 4단 구조를 만든 근본 원인입니다. 하지만 일상 개발에서는 **ninja 직접 호출만으로 충분**합니다.

### 메타인지 질문

1. **"내가 수정한 코드가 어떤 빌드 타겟에 속하는가?"** — 이 질문에 답할 수 있으면 `ninja -C $BUILD <타겟>`으로 정확히 필요한 것만 빌드할 수 있습니다. `ninja -C $BUILD -t targets | grep <키워드>`로 찾으세요.

2. **"이 테스트는 어떤 바이너리를 사용하는가?"** — `// RUN:` 줄의 `%target-*` 치환 변수가 어떤 바이너리로 치환되는지 이해하면, 테스트를 수동으로 재현하고 디버거를 연결할 수 있습니다. `lit -vv`로 실제 치환 결과를 확인하세요.
