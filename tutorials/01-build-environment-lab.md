# Lab 1 — Swift 컴파일러 빌드 환경 구성

> **대상**: 빌드/테스트 루프를 아직 스스로 돌려보지 않은 학습자
> **목표**: 첫 빌드와 첫 증분 빌드, 첫 단일 테스트 실행까지 완료
> **예상 시간**: 60~120분
> **레퍼런스**: [../2026-04-04-swift-compiler-dev-environment.md](../2026-04-04-swift-compiler-dev-environment.md)

---

## 빠른 시작

```bash
mkdir swift-project && cd swift-project
git clone git@github.com:swiftlang/swift.git swift
cd swift
utils/update-checkout --clone-with-ssh

utils/build-script \
  --skip-build-benchmarks \
  --swift-darwin-supported-archs "$(uname -m)" \
  --release-debuginfo \
  --swift-disable-dead-stripping
```

첫 빌드가 끝나면 아래를 실행하세요.

```bash
export BUILD=../build/Ninja-RelWithDebInfoAssert/swift-macosx-$(uname -m)
ninja -C $BUILD bin/swift-frontend
utils/run-test --build-dir $BUILD test/SILOptimizer/simplify_cfg.sil
```

---

## 시작 전 회상 질문

1. `build-script`와 `ninja -C $BUILD`의 역할 차이는 무엇일까요?
2. 왜 컴파일러 학습은 “첫 빌드”보다 “첫 증분 빌드”가 더 중요할까요?
3. 왜 전체 테스트가 아니라 단일 테스트부터 시작해야 할까요?

이 질문에 먼저 짧게 답해보고 시작하세요.

---

## 실습 목표

이 랩이 끝나면 아래 4개를 설명할 수 있어야 합니다.

- 빌드 산출물이 어디 생기는가
- 일상 루프에서 왜 `ninja`를 직접 쓰는가
- 단일 테스트를 어떻게 실행하는가
- 수정 후 어떤 명령을 가장 먼저 치는가

---

## 단계 1 — 저장소와 의존성 확보

```bash
mkdir swift-project && cd swift-project
git clone git@github.com:swiftlang/swift.git swift
cd swift
utils/update-checkout --clone-with-ssh
```

### 확인할 것
- `swift/` 외에 `llvm-project/`, `swift-syntax/`, `swift-driver/` 등이 함께 생겼는가
- `utils/update-checkout`이 오류 없이 끝났는가

### self-explanation
- 왜 Swift 저장소 하나만으로는 빌드가 완결되지 않을까요?

---

## 단계 2 — 첫 빌드

```bash
utils/build-script \
  --skip-build-benchmarks \
  --swift-darwin-supported-archs "$(uname -m)" \
  --release-debuginfo \
  --swift-disable-dead-stripping
```

### 이 플래그를 처음에 쓰는 이유
- `--skip-build-benchmarks`: 처음엔 벤치마크보다 루프 확보가 우선
- `--swift-darwin-supported-archs "$(uname -m)"`: 현재 아키텍처만 빌드해 시간을 줄임
- `--release-debuginfo`: 디버깅 가능한 현실적인 개발 빌드
- `--swift-disable-dead-stripping`: 이후 관찰/디버깅에 유리

### 체크포인트
- `../build/Ninja-RelWithDebInfoAssert/swift-macosx-$(uname -m)/bin/` 아래에 `swift-frontend`, `swiftc`, `swift-demangle`가 생겼는가

---

## 단계 3 — 일상 루프 변수 고정

```bash
export PLATFORM=$([[ $(uname) == Darwin ]] && echo macosx || echo linux)
export ARCH=$(uname -m)
export BUILD=../build/Ninja-RelWithDebInfoAssert/swift-${PLATFORM}-${ARCH}
```

원한다면 셸 프로필에 alias도 추가합니다.

```bash
alias sninja='ninja -C $BUILD'
```

### self-explanation
- 왜 학습 초기에 경로를 외우기보다 변수 하나로 고정하는 것이 좋을까요?

---

## 단계 4 — 첫 증분 빌드

```bash
ninja -C $BUILD bin/swift-frontend
ninja -C $BUILD bin/swift-demangle
```

### 관찰 포인트
- 첫 빌드 이후에는 `build-script`보다 `ninja`가 훨씬 빠르게 끝나는가
- 특정 타겟만 다시 빌드할 수 있다는 감각이 생기는가

---

## 단계 5 — 첫 테스트

```bash
utils/run-test --build-dir $BUILD test/SILOptimizer/simplify_cfg.sil
```

여기서 중요한 것은 “이 테스트가 무엇을 검증하는가”를 완전히 아는 것이 아니라,  
**단일 테스트를 실행하고 결과를 읽는 루프**를 몸에 익히는 것입니다.

### 다음에 바로 해볼 것

```bash
utils/run-test --build-dir $BUILD test/Demangle/demangle.swift
utils/run-test --build-dir $BUILD test/Availability/availability_suggest_any_apple_os.swift
```

---

## 최소 산출물

이 랩이 끝나면 학습 로그에 아래를 남겨야 합니다.

- 내가 사용하는 `BUILD` 경로
- 첫 증분 빌드 명령
- 첫 단일 테스트 명령
- 빌드/테스트가 실패했을 때 가장 먼저 확인할 것 2가지

---

## 독립 전이 과제

아래 중 하나를 직접 수행해 보세요.

1. `bin/swift-demangle`만 다시 빌드하고 실행해 보기
2. `test/Demangle/demangle.swift` 한 개만 실행해 보기
3. `ninja -C $BUILD -t targets | grep swift-frontend`로 타겟 탐색해 보기

---

## 회고 질문

1. 오늘 가장 오래 걸린 단계는 무엇이었나요?
2. 그 지연은 개념 부족이었나요, 환경 문제였나요, 명령 기억 문제였나요?
3. 다음 세션을 더 빠르게 시작하려면 어떤 alias/메모가 필요할까요?

---

## 학습 설계 근거

- 이 랩은 “읽기”보다 “작은 성공 경험”을 먼저 만들어 초기 진입 장벽을 낮춥니다.
- 단일 테스트를 먼저 돌리게 한 이유는 인지 부하를 줄이고, 빠른 피드백 루프를 만들기 위해서입니다.
- 사전 회상 질문은 단순 따라하기를 막고 retrieval practice를 유도합니다.
- 독립 전이 과제는 worked example 이후 fading을 시작하기 위한 최소 단계입니다.
- 관련 근거와 원문 링크는 [00-curriculum-and-method.md](00-curriculum-and-method.md)를 참고하세요.
