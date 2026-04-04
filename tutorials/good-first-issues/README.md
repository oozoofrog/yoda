# Open Good First Issue 카드 라이브러리

이 디렉토리는 `swiftlang/swift`의 open `good first issue`를 **짧은 탐색 카드**로 정리한 곳입니다.

핵심 원칙:
- merged 사례와 달리 정답이 아직 없습니다.
- 그래서 카드의 목적은 “정답 설명”이 아니라 “첫 진입점을 좁혀주는 것”입니다.
- 실제 분석은 [../07-open-issue-analysis-workbook.md](../07-open-issue-analysis-workbook.md)와 함께 진행합니다.

---

## 어떻게 사용할까

1. [06-good-first-issues-swift-6.0-6.3.md](../06-good-first-issues-swift-6.0-6.3.md)에서 버전별 추천 순서를 봅니다.
2. 카드 1개를 선택합니다.
3. 재현 코드와 첫 진입 파일 후보를 정리합니다.
4. 워크북 템플릿에 기록을 남깁니다.

---

## 카드 목록

| 카드 | 버전 | 단계 추정 | 난이도 | 유형 |
|---|---|---|---|---|
| [#48759 정적 멤버를 인스턴스에서 쓸 때의 진단 문구 개선](cards/01-static-member-instance-diagnostic.md) | 6.0 | Sema / diagnostics | 하 | diagnostics wording |
| [#72662 `any P!`에 대한 중복 진단 정리](cards/02-any-iuo-diagnostic.md) | 6.0 | Sema / type resolution | 중 | diagnostics deduplication + spelling |
| [#69241 opaque property inferred type에 대한 fix-it 추가](cards/03-opaque-property-fixit.md) | 6.0 | Sema / storage type checking | 중 | fix-it insertion |
| [#77835 `static nonmutating` 조합에 대한 진단 개선](cards/04-static-nonmutating-diagnostic.md) | 6.1 | Sema / attributes | 하 | diagnostics wording |
| [#78362 memberwise init 공개성 진단과 fix-it 개선](cards/05-memberwise-init-public-diagnostic.md) | 6.2 | Sema / protocol conformance + synthesis | 중 | diagnostics + fix-it guidance |
| [#83344 `@dynamicMemberLookup` 요구사항 누락 시 fix-it 추가](cards/06-dynamicmemberlookup-fixits.md) | 6.2 | Sema / attribute validation | 중 | fix-it insertion |
| [#76320 existential에서 Self-reference 메서드를 못 쓰는 이유 note 추가](cards/07-existential-self-note.md) | 6.2 | Sema / diagnostics for existentials | 중상 | note addition |
| [#87830 escaping closure가 `inout`를 캡처할 때 fix-it 추가](cards/08-inout-capture-fixit.md) | 6.3 | Sema / closures + capture semantics | 중 | fix-it + note addition |
| [#87322 computed property의 중복 진단 제거](cards/09-computed-property-redundant-diagnostic.md) | 6.3 | Parse + Sema diagnostics interplay | 중 | diagnostic suppression / deduplication |
| [#87324 computed property의 type annotation fix-it 추가](cards/10-computed-property-type-fixit.md) | 6.3 | Parse diagnostics / fix-it | 하 | fix-it insertion |
| [#85882 redundant effect marker에 fix-it 추가](cards/11-redundant-effect-fixits.md) | 6.3 | Sema / effects diagnostics | 중 | fix-it insertion |
| [#86693 inheritance clause의 global actor annotation 금지](cards/12-global-actor-inheritance-clause.md) | 6.3 | Type resolution / attributes in inheritance clauses | 중 | accepts invalid / rule enforcement |

---

## 메타데이터

- 메타데이터 원본: [index.yaml](index.yaml)
- 각 카드에는 단계 추정, 첫 진입 파일 후보, 첫 재현 명령 후보가 포함됩니다.
- 이 라이브러리는 open issue용이므로, merged 사례 라이브러리인 [../case-studies/README.md](../case-studies/README.md)와 구분해서 사용하세요.
