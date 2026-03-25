import { useState } from 'react';
import TitleScreen from './screens/TitleScreen';
import QuizTypeScreen from './screens/QuizTypeScreen';
import RegionSelectScreen from './screens/RegionSelectScreen';
import DifficultySelectScreen from './screens/DifficultySelectScreen';
import MapQuizScreen from './screens/MapQuizScreen';
import TextQuizScreen from './screens/TextQuizScreen';
import RegionQuizScreen from './screens/RegionQuizScreen';
import ResultScreen from './screens/ResultScreen';
import RecordsScreen from './screens/RecordsScreen';
import type { Screen, QuizType, QuizResult } from './types';

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'title' });

  const go = (s: Screen) => setScreen(s);

  switch (screen.name) {
    case 'title':
      return (
        <TitleScreen
          onStart={() => go({ name: 'quizType' })}
          onRecords={() => go({ name: 'records' })}
        />
      );

    case 'quizType':
      return (
        <QuizTypeScreen
          onSelect={(type: QuizType) => {
            if (type === 'region') {
              go({ name: 'quiz', quizType: type, region: 'すべて', challenge: false });
            } else {
              go({ name: 'regionSelect', quizType: type });
            }
          }}
          onBack={() => go({ name: 'title' })}
        />
      );

    case 'regionSelect':
      return (
        <RegionSelectScreen
          quizType={screen.quizType}
          onSelect={(region) => {
            // 都道府県と形クイズのみ難易度選択を挟む
            if (screen.quizType === 'name') {
              go({ name: 'difficultySelect', quizType: screen.quizType, region });
            } else {
              go({ name: 'quiz', quizType: screen.quizType, region, challenge: false });
            }
          }}
          onBack={() => go({ name: 'quizType' })}
        />
      );

    case 'difficultySelect':
      return (
        <DifficultySelectScreen
          region={screen.region}
          onSelect={(challenge) =>
            go({ name: 'quiz', quizType: screen.quizType, region: screen.region, challenge })
          }
          onBack={() => go({ name: 'regionSelect', quizType: screen.quizType })}
        />
      );

    case 'quiz': {
      const { quizType, region, challenge } = screen;
      const handleFinish = (result: QuizResult) => go({ name: 'result', result, challenge });
      const handleBack = () =>
        quizType === 'region'
          ? go({ name: 'quizType' })
          : quizType === 'name'
          ? go({ name: 'difficultySelect', quizType, region })
          : go({ name: 'regionSelect', quizType });

      if (quizType === 'name' || quizType === 'shape') {
        return <MapQuizScreen region={region} challenge={challenge} onFinish={handleFinish} onBack={handleBack} />;
      }
      if (quizType === 'capital') {
        return <TextQuizScreen region={region} onFinish={handleFinish} onBack={handleBack} />;
      }
      if (quizType === 'region') {
        return <RegionQuizScreen onFinish={handleFinish} onBack={handleBack} />;
      }
      return null;
    }

    case 'result':
      return (
        <ResultScreen
          result={screen.result}
          challenge={screen.challenge}
          onRetry={() => {
            const { quizType, region } = screen.result;
            if (quizType === 'region') {
              go({ name: 'quiz', quizType, region: 'すべて', challenge: false });
            } else {
              go({ name: 'quiz', quizType, region, challenge: screen.challenge });
            }
          }}
          onBackToRegion={() => {
            const { quizType } = screen.result;
            if (quizType === 'region') {
              go({ name: 'quizType' });
            } else if (quizType === 'name') {
              go({ name: 'difficultySelect', quizType, region: screen.result.region });
            } else {
              go({ name: 'regionSelect', quizType });
            }
          }}
          onRecords={() => go({ name: 'records' })}
        />
      );

    case 'records':
      return <RecordsScreen onBack={() => go({ name: 'title' })} />;

    default:
      return null;
  }
}
