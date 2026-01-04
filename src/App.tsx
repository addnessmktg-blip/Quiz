import { useMemo, useState } from "react";
import tsvData from "../questions.tsv?raw";

type QuestionFormat = "4択" | "○×";

type Question = {
  no: number;
  round: number;
  format: QuestionFormat;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: string;
  explanation: string;
};

type Screen = "start" | "quiz" | "roundEnd" | "final";

const parseQuestions = (raw: string): Question[] => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return [];
  }

  const lines = trimmed.split(/\r?\n/);
  const [, ...rows] = lines;

  return rows
    .map((line) => line.split("\t"))
    .filter((cols) => cols.length >= 10)
    .map((cols) => {
      const [no, round, format, text, A, B, C, D, answer, explanation] = cols;
      return {
        no: Number(no),
        round: Number(round),
        format: format as QuestionFormat,
        text,
        options: {
          A: A ?? "",
          B: B ?? "",
          C: C ?? "",
          D: D ?? "",
        },
        answer: answer ?? "",
        explanation: explanation ?? "",
      };
    });
};

const formatAnswerLabel = (key: string) => {
  switch (key) {
    case "A":
      return "A";
    case "B":
      return "B";
    case "C":
      return "C";
    case "D":
      return "D";
    default:
      return key;
  }
};

const App = () => {
  const questions = useMemo(() => parseQuestions(tsvData), []);

  const rounds = useMemo(() => {
    const byRound = new Map<number, Question[]>();
    questions.forEach((question) => {
      if (!byRound.has(question.round)) {
        byRound.set(question.round, []);
      }
      byRound.get(question.round)!.push(question);
    });

    return [...byRound.entries()]
      .sort((a, b) => a[0] - b[0])
      .slice(0, 4)
      .map(([round, items]) => ({
        round,
        questions: items.sort((a, b) => a.no - b.no).slice(0, 5),
      }));
  }, [questions]);

  const [screen, setScreen] = useState<Screen>("start");
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);

  const currentRound = rounds[currentRoundIndex];
  const currentQuestion = currentRound?.questions[currentQuestionIndex];

  const startQuiz = () => {
    setScreen("quiz");
    setCurrentRoundIndex(0);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsCorrect(null);
    setRoundCorrect(0);
    setTotalCorrect(0);
  };

  const handleAnswer = (optionKey: string) => {
    if (selectedOption || !currentQuestion) {
      return;
    }

    const correct = optionKey === currentQuestion.answer;
    setSelectedOption(optionKey);
    setIsCorrect(correct);
    if (correct) {
      setRoundCorrect((prev) => prev + 1);
      setTotalCorrect((prev) => prev + 1);
    }
  };

  const goToNext = () => {
    if (!currentRound) {
      return;
    }

    const isLastQuestion = currentQuestionIndex >= currentRound.questions.length - 1;
    if (isLastQuestion) {
      setScreen("roundEnd");
      return;
    }

    setCurrentQuestionIndex((prev) => prev + 1);
    setSelectedOption(null);
    setIsCorrect(null);
  };

  const goToNextRound = () => {
    const isLastRound = currentRoundIndex >= rounds.length - 1;
    if (isLastRound) {
      setScreen("final");
      return;
    }

    setCurrentRoundIndex((prev) => prev + 1);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsCorrect(null);
    setRoundCorrect(0);
    setScreen("quiz");
  };

  if (questions.length === 0) {
    return (
      <div className="app">
        <div className="card">
          <h1>読み込みに失敗しました</h1>
          <p>questions.tsv の内容を確認してください。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        {screen === "start" && (
          <div className="screen">
            <h1 className="title">4ラウンドクイズ</h1>
            <p className="subtitle">各ラウンド5問、全20問に挑戦しよう！</p>
            <button className="primary-button" onClick={startQuiz}>
              スタート
            </button>
          </div>
        )}

        {screen === "quiz" && currentRound && currentQuestion && (
          <div className="screen">
            <div className="progress">
              <span className="badge">Round {currentRound.round}</span>
              <span className="progress-text">
                Round {currentRound.round} / 5問中 {currentQuestionIndex + 1}
              </span>
            </div>

            <div className="card question-card">
              <p className="question-text">{currentQuestion.text}</p>
            </div>

            <div className="options">
              {(["A", "B", "C", "D"] as const)
                .filter((key) =>
                  currentQuestion.format === "○×" ? key === "A" || key === "B" : true
                )
                .filter((key) => currentQuestion.options[key])
                .map((key) => {
                  const isSelected = selectedOption === key;
                  const isAnswer = currentQuestion.answer === key;
                  const buttonClass = [
                    "option-button",
                    isSelected ? "selected" : "",
                    selectedOption ? "locked" : "",
                    selectedOption && isAnswer ? "correct" : "",
                    selectedOption && isSelected && !isAnswer ? "wrong" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <button
                      key={key}
                      className={buttonClass}
                      onClick={() => handleAnswer(key)}
                      disabled={Boolean(selectedOption)}
                    >
                      <span className="option-label">{formatAnswerLabel(key)}</span>
                      <span className="option-text">{currentQuestion.options[key]}</span>
                    </button>
                  );
                })}
            </div>

            {selectedOption && (
              <div className="card result-card">
                <h2 className={isCorrect ? "correct-text" : "wrong-text"}>
                  {isCorrect ? "正解！" : "不正解"}
                </h2>
                <p className="explanation">{currentQuestion.explanation}</p>
                <button className="primary-button" onClick={goToNext}>
                  次へ
                </button>
              </div>
            )}
          </div>
        )}

        {screen === "roundEnd" && currentRound && (
          <div className="screen">
            <h1 className="title">Round {currentRound.round} 終了</h1>
            <p className="result-score">
              正解数 {roundCorrect} / 5
            </p>
            <button className="primary-button" onClick={goToNextRound}>
              {currentRoundIndex >= rounds.length - 1 ? "結果を見る" : "次のRoundへ"}
            </button>
          </div>
        )}

        {screen === "final" && (
          <div className="screen">
            <h1 className="title">全ラウンド終了！</h1>
            <p className="result-score">総合結果 {totalCorrect} / 20</p>
            <button className="primary-button" onClick={startQuiz}>
              最初から
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
