import { requestKakaoWebtoons, KakaoWebtoon } from './requestKakaoWebtoons';
import { requestFanCount } from './requestFanCount';
import { requestSingularityInfo } from './requestSingularityInfo';
import { standardizeKakaoWebtoon } from './standardizeKakaoWebtoon';
import { UpdateDay, Webtoon } from '../../types';

export const getFinishedKakaoWebtoons = async (
  originalType: 'novel' | 'general',
) => {
  const [finishedWebtoons] = await requestKakaoWebtoons(
      `/sections?placement=${
        originalType === 'novel' ? 'novel' : 'channel'
      }_completed`,
    ),
    kakaoWebtoons = finishedWebtoons.cardGroups[0].cards;

  const deviedKakaoWebtoonsList: KakaoWebtoon[][] = [];

  //* 동시에 모든 웹툰을 비동기적으로 처리하면 카카오측 서버에서 요청을 막음 10개씩 나눠서 비동기적으로 처리
  const UNIT = 10;
  for (let index = 0; index < kakaoWebtoons.length; index += UNIT) {
    deviedKakaoWebtoonsList.push(kakaoWebtoons.slice(index, index + UNIT));
  }

  const webtoons: Webtoon[] = [];

  for (const deviedKakaoWebtoons of deviedKakaoWebtoonsList) {
    await Promise.all(
      deviedKakaoWebtoons.map(async (kakaoWebtoon) => {
        const { id } = kakaoWebtoon.content;

        const [fanCount, singularityInfo] = await Promise.all([
          requestFanCount(id),
          requestSingularityInfo(id),
        ]);

        webtoons.push(
          standardizeKakaoWebtoon(
            kakaoWebtoon,
            [UpdateDay.FINISHED],
            fanCount,
            singularityInfo,
          ),
        );
      }),
    );
  }

  return webtoons;
};
