# 학습 코스

이 디렉토리는 `yoda/tutorials/`에 흩어진 문서들을 **실제 학습 순서**로 묶은 코스 문서를 모아둡니다.

가장 먼저 봐야 할 코스:
- [00-swift-compiler-first-contribution-track.md](00-swift-compiler-first-contribution-track.md)

현재 제공 코스:
- [30-day-diagnostics-track.md](30-day-diagnostics-track.md)
- [30-day-optimizer-track.md](30-day-optimizer-track.md)
- [30-day-compiler-core-track.md](30-day-compiler-core-track.md)
- [samples/README.md](samples/README.md)


## 인터랙티브 코스 보기

30일 코스도 `../../docs/`의 웹 문서 뷰어에서 같은 방식으로 읽을 수 있습니다.
정적 배포 기준이라 로그인 없이도 현재 문서와 개인 메모가 localStorage에 저장됩니다.

```bash
cd yoda
./scripts/run_web.sh
```

---
이 코스부터 시작해야 하는 이유:
- 처음 기여를 목표로 할 때 필요한 순서만 남긴 단일 핵심 코스입니다.
- 이 문서 하나만 따라가면 빌드 → 테스트 → 관찰 → 작은 수정 → PR 준비까지 갑니다.

원칙:
- 문서는 많아도 하루에 소비하는 양은 적게 유지합니다.
- merged 사례와 open issue를 섞어서 배웁니다.
- 매일 반드시 로그를 남깁니다.
