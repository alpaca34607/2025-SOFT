import React, { useState } from "react";
import "./App.css";
import ShowContentQuestion from "./ShowContentQuestion";

function App() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [isQuizEnded, setIsQuizEnded] = useState(false);

  const questionData = [
    {
      id: 1,
      question: "太陽曬進了窗內，你的鬧鐘響了！",
      options: {
        A: { text: "按掉鬧鐘繼續睡，反正後面還設了5個", score: 5 },
        B: { text: "該起床了！難得今天有空閑要好好利用！", score: 1 },
        C: { text: "雖然醒了，但滑個手機再下床吧", score: 4 },
      },
      background: "bg1.jpg",
    },
    {
      id: 2,
      question:
        "你矇矇朧朧的下床，一腳踩到了異物，低頭一看發現貓咪在玩組到一半的樂高，你痛得發麻睏意全消",
      options: {
        A: { text: "等等，我沒有養貓啊？", score: 1 },
        B: { text: "等等，我沒有組樂高啊？", score: 2 },
        C: { text: "等等，這不是我房間啊？", score: 3 },
      },
      background: "bg2.jpg",
    },
    {
      id: 3,
      question: "你想起自己因租屋漏水而暫住房東家，現在面對屋內的雜亂你決定",
      options: {
        A: { text: "一邊被貓干擾一邊收拾好散落的樂高", score: 3 },
        B: { text: "先撸貓撸爆，樂高就擱著吧有空再收", score: 1 },
        C: { text: "離開這片混亂，先吃早餐填飽肚子", score: 4 },
      },
      background: "bg3.jpg",
    },
    {
      id: 4,
      question: "你出門了，你今天出門的目的是什麼呢？",
      options: {
        A: { text: "到商圈逛街買一些酷東西", score: 3 },
        B: { text: "到有景色的地方散步走走", score: 2 },
        C: { text: "和朋友會面，開心的談論八卦", score: 1 },
      },
      background: "bg4.jpg",
    },
    {
      id: 5,
      question: "走了一陣子，你覺得外頭天氣比你想像中的熱",
      options: {
        A: { text: "回家吧，下次再出門", score: 5 },
        B: { text: "都出門了，再繼續走到目的地吧", score: 1 },
        C: { text: "還是換個比較涼快的地點吧", score: 4 },
      },
      background: "bg5.jpg",
    },
    {
      id: 6,
      question:
        "回家路上你遇到穿著可愛玩偶服的工作人員招呼參加正在街上進行的免費活動，人們好像玩得很開心",
      options: {
        A: { text: "閒著也是閒著，去看看吧", score: 1 },
        B: { text: "好像有點可疑，還是拒絕吧", score: 5 },
        C: { text: "先拒絕，吃完晚餐再繞回來看活動", score: 3 },
      },
      background: "bg6.jpg",
    },
    {
      id: 7,
      question: "充實的一天結束了，晚餐你打算怎麼安排呢？",
      options: {
        A: { text: "我今天有出門好棒!回家吃炸雞配啤酒", score: 5 },
        B: { text: "都到商圈了，自己找間氣氛不錯的簡餐店吃晚餐吧", score: 4 },
        C: { text: "約約看朋友要不要一起吃晚餐吧", score: 1 },
      },
      background: "bg7.jpg",
    },
  ];

  const startQuiz = () => {
    setIsQuizStarted(true);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsQuizEnded(false);
  };

  const selectAnswer = (answer) => {
    setSelectedAnswer(answer);
  };

  const confirmAnswer = () => {
    if (selectedAnswer) {
      const answerScore =
        questionData[currentQuestion].options[selectedAnswer].score;
      setScore(score + answerScore);

      if (currentQuestion < questionData.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setIsQuizEnded(true);
      }

      setSelectedAnswer(null); // 重置選擇
    }
  };

  const restartQuiz = () => {
    setIsQuizStarted(false);
    setIsQuizEnded(false);
    setScore(0);
    setCurrentQuestion(0);
  };

  const renderResult = (score) => {
    let resultText = "";
    if (score >= 7 && score <= 12) resultText = "軟雞軟呱：滿嘴跑火車的社交王!";
    else if (score >= 13 && score <= 16) resultText = "心太軟：豆腐心的軟心腸!";
    else if (score >= 17 && score <= 19)
      resultText = "軟筋：百變隨和的適應高手!";
    else if (score >= 20 && score <= 22)
      resultText = "軟吉拉：肚量大但有底線的吃貨!";
    else if (score >= 23 && score <= 25)
      resultText = "軟泥馬：愛發呆的溫暖小王子!";
    else if (score >= 26 && score <= 30) resultText = "軟蛙：戀家的小小旅行家!";
    else resultText = "無法判定角色，請重新測驗！";

    return (
      <div id="result">
        <p>{resultText}</p>
        <img src="result-image.jpg" alt="結果圖" className="result-image" />
        <div className="result-buttons">
          <button className="result-button" onClick={restartQuiz}>
            再測一次
          </button>
          <button
            className="result-button"
            onClick={() => alert("分享測驗結果功能尚未實現！")}
          >
            分享結果
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <header>
        <h1>軟軟測驗</h1>
      </header>

      {!isQuizStarted && (
        <div id="start-screen">
          <button onClick={startQuiz}>
            <img
              src="start-button-image.png"
              alt="開始"
              className="startbutton"
            />
          </button>
        </div>
      )}

      {isQuizStarted && !isQuizEnded && (
        <div id="question">
          <ShowContentQuestion
            question={questionData[currentQuestion].question}
            options={questionData[currentQuestion].options}
            background={questionData[currentQuestion].background}
            selectAnswer={selectAnswer}
            selectedAnswer={selectedAnswer}
          />
          <button
            id="confirm-button"
            onClick={confirmAnswer}
            disabled={!selectedAnswer}
          >
            確認
          </button>
        </div>
      )}

      {isQuizEnded && renderResult(score)}
    </div>
  );
}

export default App;
