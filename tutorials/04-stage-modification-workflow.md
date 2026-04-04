# Lab 4 — 컴파일러 특정 단계 수정의 공통 워크플로우

> **대상**: 어느 단계에서 고쳐야 할지는 대략 감이 오지만, 실제 수정 절차는 아직 흐릿한 학습자
> **목표**: 재현 → 위치 파악 → 최소 수정 → 좁은 검증 → 인접 회귀 확인의 공통 절차를 몸에 익히기
> **예상 시간**: 60~90분
> **선행 실습**: [03-pipeline-entrypoints-and-knowledge-map.md](03-pipeline-entrypoints-and-knowledge-map.md)

---

## 빠른 시작

아래 체크리스트를 먼저 외우세요.

1. **실패를 좁게 재현한다**
2. **단계를 먼저 분류한다**
3. **첫 진입 파일을 하나만 고른다**
4. **최소 수정만 한다**
5. **가장 좁은 테스트부터 다시 돈다**
6. **인접 회귀를 확인한다**
7. **마지막에 merged diff와 비교한다**

---

## 공통 환경 패턴

실제 사례 실습은 부모 커밋을 별도 worktree로 꺼내서 진행합니다.

```bash
export ROOT=$PWD
export SWIFT_MAIN_REPO=$ROOT/swift
mkdir -p "$ROOT/worktrees"

git -C "$SWIFT_MAIN_REPO" worktree add "$ROOT/worktrees/<case-name>" <parent-commit>
cd "$ROOT/worktrees/<case-name>"

utils/build-script \
  --skip-build-benchmarks \
  --swift-darwin-supported-archs "$(uname -m)" \
  --release-debuginfo \
  --swift-disable-dead-stripping

export BUILD=../build/Ninja-RelWithDebInfoAssert/swift-macosx-$(uname -m)
```

### 왜 worktree를 쓰는가
- main 브랜치를 건드리지 않고 이전 상태를 실험할 수 있습니다.
- 사례별로 독립된 build/test 로그를 남기기 쉽습니다.
- “직전 버전에서 직접 고쳐본다”는 학습 목표에 맞습니다.

---

## 단계 1 — 실패를 좁게 재현한다

가장 먼저 할 일은 **가장 작은 실패**를 손에 쥐는 것입니다.

좋은 재현의 조건:
- 단일 테스트 파일
- 단일 함수/단일 경고/단일 IR 패턴
- 실행 시간이 짧음

예:

```bash
utils/run-test --build-dir $BUILD test/Availability/availability_suggest_any_apple_os.swift
utils/run-test --build-dir $BUILD test/DebugInfo/if-bool-var.swift
utils/run-test --build-dir $BUILD test/IRGen/vtable_conformance_entries.sil
```

---

## 단계 2 — 단계부터 분류한다

증상보다 먼저 단계부터 고릅니다.

| 증상 | 첫 분류 힌트 |
|---|---|
| warning/fix-it/source loc 이상 | Sema / diagnostics 가능성 높음 |
| Raw SIL은 이상하고 Optimized SIL 전부터 어긋남 | SILGen 또는 SIL |
| debug metadata line/column 이상 | SILLocation / DebugInfo / IRGen 경계 |
| `-emit-ir` 패턴이 기대와 다름 | IRGen 가능성 높음 |
| 맹글된 심볼 문자열/트리 해석 문제 | Demangling |

---

## 단계 3 — 첫 진입 파일을 고른다

처음부터 10개 파일을 열지 마세요.  
아래 순서로 “첫 파일 하나”를 고릅니다.

1. 테스트 경로 본다
2. 테스트의 `RUN:`과 `CHECK:`를 읽는다
3. 관련 텍스트를 `rg`로 찾는다
4. 가장 가까운 함수 하나만 연다

예:

```bash
rg "availability_use_any_apple_os" lib/Sema include/swift
rg "ImplicitConversionExpr" lib/SIL include/swift
rg "emitScalarExistentialDowncast" lib/IRGen
```

---

## 단계 4 — 수정 전에 가설을 적는다

수정 전에 아래를 한 줄씩 적으세요.

- 내가 생각하는 원인:
- 이 파일이 맞다고 생각하는 이유:
- 고쳐야 하는 정보가 “계산”, “전파”, “출력”, “검증” 중 무엇인지:

이 단계를 생략하면, 수정은 했는데 왜 맞는지 설명하지 못하게 됩니다.

---

## 단계 5 — 최소 수정만 한다

처음부터 구조 개편을 하지 마세요.

좋은 첫 수정:
- 조건 하나
- range 계산 하나
- explicit/implicit flag 전파 하나
- fast path 하나

나쁜 첫 수정:
- 여러 서브시스템을 동시에 건드림
- 테스트 없이 리팩터링부터 시작
- 원인을 확신하기 전 API를 넓게 바꿈

---

## 단계 6 — 검증 순서를 고정한다

항상 아래 순서를 지킵니다.

### 1. 가장 좁은 검증
```bash
utils/run-test --build-dir $BUILD test/<가장좁은-재현>.swift
```

### 2. 인접 테스트
```bash
utils/run-test --build-dir $BUILD test/<같은-디렉토리의-관련-테스트>
```

### 3. 관찰 출력 재확인
```bash
swiftc -emit-sil -O sample.swift
swiftc -emit-ir -O sample.swift
```

### 4. 마지막 비교
```bash
git diff <parent>..<fix-commit> -- <relevant-files>
```

---

## 단계 7 — merged diff는 마지막에만 본다

사례 학습에서 merged diff는 “정답지”가 아니라 **후검토 자료**입니다.

올바른 순서:
1. 테스트 읽기
2. 단계 분류
3. 진입점 탐색
4. 내 수정 시도
5. 검증
6. **그 다음** merged diff 비교

비교할 때는 다음 질문만 봅니다.
- 내가 맞춘 핵심 원인은 무엇인가?
- 내가 놓친 보조 수정은 무엇인가?
- 실제 패치는 왜 내 패치보다 나은가?

---

## 독립 전이 과제

다음 중 하나를 수행하세요.

1. `test/Sema/` 아래 테스트 하나를 골라 어떤 파일을 먼저 열지 적기
2. `test/SILOptimizer/` 아래 테스트 하나를 골라 좁은 검증 → 인접 검증 순서를 적기
3. 실제 merged fix 하나를 골라 “내가 부모 커밋에서 어떻게 들어갈지” 계획을 10줄로 쓰기

---

## 회고 질문

1. 나는 수정 전에 가설을 쓰는가, 아니면 바로 코드를 바꾸는가?
2. 가장 좁은 검증을 찾는 데 시간이 오래 걸리는가?
3. 인접 회귀 확인을 생략하고 싶은 유혹이 언제 가장 강한가?

---

## 학습 설계 근거

- 이 랩은 문제 해결 과정을 “재현-분류-가설-수정-검증”으로 외현화합니다.
- 디버깅 교육 연구에서는 trial-and-error보다 가설 중심 개입이 더 안정적인 전이를 보입니다.
- merged diff를 마지막에만 보게 한 것은 productive struggle과 self-explanation을 확보하기 위함입니다.
- worktree 기반 실습은 실제 개발 맥락을 보존하면서도 안전한 실험 공간을 제공합니다.
- 관련 연구 링크는 [00-curriculum-and-method.md](00-curriculum-and-method.md)를 참고하세요.
