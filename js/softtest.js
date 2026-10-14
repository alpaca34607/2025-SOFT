const questionData = [
  {
    id: 1,
    question: "太陽曬進了窗內，你的鬧鐘響了！",
    options: {
      A: { text: "按掉鬧鐘繼續睡，反正後面還設了5個", score: 5 },
      B: { text: "該起床了！<br>難得今天有空閑要好好利用！", score: 1 },
      C: { text: "雖然醒了，但滑個手機再下床吧", score: 4 },
    },
    background: "./images/softtest/bg1.png",
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
    background: "./images/softtest/bg2.png",
  },
  {
    id: 3,
    question: "你想起自己因租屋漏水而暫住房東家，現在面對屋內的雜亂你決定",
    options: {
      A: { text: "一邊被貓干擾一邊收拾好散落的樂高", score: 3 },
      B: { text: "先撸貓撸爆，樂高就擱著吧有空再收", score: 1 },
      C: { text: "離開這片混亂，先吃早餐填飽肚子", score: 4 },
    },
    background: "./images/softtest/bg3.png",
  },
  {
    id: 4,
    question: "你出門了，你今天出門的目的是什麼呢？",
    options: {
      A: { text: "到商圈逛街買一些酷東西", score: 3 },
      B: { text: "到有景色的地方散步走走", score: 2 },
      C: { text: "和朋友會面，開心的談論八卦", score: 1 },
    },
    background: "./images/softtest/bg4.png",
  },
  {
    id: 5,
    question: "走了一陣子，你覺得外頭天氣比你想像中的熱",
    options: {
      A: { text: "回家吧，下次再出門", score: 5 },
      B: { text: "都出門了，再繼續走到目的地吧", score: 1 },
      C: { text: "還是換個比較涼快的地點吧", score: 4 },
    },
    background: "./images/softtest/bg5.png",
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
    background: "./images/softtest/bg6.png",
  },
  {
    id: 7,
    question: "充實的一天結束了，晚餐你打算怎麼安排呢？",
    options: {
      A: { text: "我今天有出門好棒!<br>回家吃炸雞配啤酒!", score: 5 },
      B: { text: "都到商圈了，<br>自己找間氣氛不錯的簡餐店用餐吧!", score: 4 },
      C: { text: "約約看朋友要不要一起吃晚餐吧?", score: 1 },
    },
    background: "./images/softtest/bg7.png",
  },
];

class Quiz {
  constructor() {
    this.currentQuestion = 0;
    this.score = 0;
    this.selectedAnswer = null;
    this.isQuizStarted = false;
    this.isQuizEnded = false;
    this.test = document.getElementById("test");
    this.currentSnailPosition = 0;
    this.shareUrl = `${window.location.origin}/Becoming-Soft.html`;
    this.latestResult = {
      text: "",
      image: "",
    };
    this.init();
  }

  init() {
    this.renderStartScreen(); /* 初始化 */
  }

  renderStartScreen() {
    this.test.innerHTML = `

    <div class="heading-wrapper">
        <div class="heading">
            <div class=title-img>
                <img src="./images/softtest/title_img.svg" alt="軟軟測驗">
            </div>
            <div class="progress-bar">
                <img src="./images/softtest/bar0.svg" alt="進度條">
            </div>
        </div>
    </div>
    <div id="start-screen">
        <button class="start-btn" onclick="quiz.startQuiz()">
           START!
        </button>
    </div>
                `;
  }

  startQuiz() {
    this.isQuizStarted = true;
    this.currentQuestion = 0;
    this.score = 0;
    this.selectedAnswer = null;
    this.currentPosition = 0;
    this.renderQuestion();
    this.updateSnail();
  }

  selectAnswer(answer) {
    this.selectedAnswer = answer;
    document.querySelectorAll(".option-button").forEach((btn) => {
      btn.classList.remove("selected");
    });
    document
      .querySelector(`[data-option="${answer}"]`)
      .classList.add("selected");
    const confirmButton = document.getElementById("confirm-button");
    if (confirmButton) {
      confirmButton.disabled = false;
    }
  }

  confirmAnswer() {
    if (this.selectedAnswer) {
      const answerScore =
        questionData[this.currentQuestion].options[this.selectedAnswer].score;
      this.score += answerScore;

      if (this.currentQuestion < questionData.length - 1) {
        this.currentQuestion++;
        this.selectedAnswer = null;

        this.renderQuestion();
        this.updateSnail();
      } else {
        this.isQuizEnded = true;
        this.renderResult();
      }
    }
  }

  updateSnail() {
    const snail = document.querySelector(".snail");
    if (snail) {
      // 設置 transition
      snail.style.transition = "left 0.8s ease-out";

      // 計算新位置 現在題號/題目總數
      const progress = this.currentQuestion / (questionData.length - 1);

      // 最遠位置92%
      const maxPercentage = 92;

      // 移動距離= (現在題號/題目總數)*92
      const movePercentage = progress * maxPercentage;

      // 更新位置記錄  現在位置= (現在題號/題目總數)*92
      this.currentPosition = movePercentage;

      // 更新蝸牛位置 snail.style.left = 現在位置= (現在題號/題目總數)*92
      setTimeout(() => {
        snail.style.left = `${this.currentPosition}%`;
      }, 0);
    }
  }

  renderQuestion() {
    const question = questionData[this.currentQuestion];
    let optionsHtml = "";

    Object.keys(question.options).forEach((option) => {
      optionsHtml += `
                        <button 
                            class="option-button ${
                              this.selectedAnswer === option ? "selected" : ""
                            }" 
                            data-option="${option}"
                            onclick="quiz.selectAnswer('${option}')"
                        >
                            ${question.options[option].text}
                        </button>
                    `;
    });

    this.test.innerHTML = `
<div class="test-bg" style="   background: 
     
      url(${question.background}); 
  
    background-size: cover; 
    background-position:40% 50%;">
    <div class="heading-wrapper">
        <div class="heading">
            <div class="title-img">
                <img src="./images/softtest/title_img.svg" alt="軟軟測驗">
            </div>
            <div class="progress-bar">
                <div class="bar-content">
                    <div class="snail" style="left: ${this.currentPosition}%;">
                        <img src='./images/softtest/snail.svg' alt="小蝸牛" >
                    </div>
                    <img src='./images/softtest/bar0.svg' alt="進度條">
                </div>
            </div>
        </div>
    </div>
    <div class="question-container">
        <div class="Q"><h2>${question.question}</h2></div>
        <div id="options">${optionsHtml}</div>
        <button id="confirm-button" onclick="quiz.confirmAnswer()" disabled>確認</button>
    </div>
</div>

                `;
  }

  getResultText(score) {
    if (score >= 7 && score <= 12) return "軟雞軟呱：滿嘴跑火車的社交王!";
    if (score >= 13 && score <= 16) return "心太軟：豆腐心的軟心腸!";
    if (score >= 17 && score <= 19) return "軟筋：百變隨和的適應高手!";
    if (score >= 20 && score <= 22) return "軟吉拉：肚量大但有底線的吃貨!";
    if (score >= 23 && score <= 25) return "軟泥馬：愛發呆的溫暖小王子!";
    if (score >= 26 && score <= 30) return "軟蛙：戀家的小小旅行家!";
    return "無法判定角色，請重新測驗！";
  }

  getResultImage(score) {
    if (score >= 7 && score <= 12)
      return "./images/softtest/result-Softchicks.jpg";
    if (score >= 13 && score <= 16)
      return "./images/softtest/result-Softheart.jpg";
    if (score >= 17 && score <= 19) return "./images/softtest/result-Soft.jpg";
    if (score >= 20 && score <= 22)
      return "./images/softtest/result-Softzilla.jpg";
    if (score >= 23 && score <= 25)
      return "./images/softtest/result-Softpaca.jpg";
    if (score >= 26 && score <= 30)
      return "./images/softtest/result-Softfrog.jpg";
    return "images/unknown.jpg";
  }
  renderResult() {
    const resultText = this.getResultText(this.score);
    const resultImage = this.getResultImage(this.score);
    this.latestResult = {
      text: resultText,
      image: resultImage,
    };
    this.test.innerHTML = `
                    <div id="result">
                        <p>你的軟魂是--${resultText}</p>
                        <img src="${resultImage}" alt="結果圖" class="result-image">
                        <div class="result-buttons">
                            <button class="result-button" onclick="quiz.restartQuiz()">再測一次</button>
                            <button class="result-button" onclick="quiz.shareResult()">分享結果</button>
                        </div>
                    </div>
                `;
  }

  restartQuiz() {
    this.isQuizStarted = false;
    this.isQuizEnded = false;
    this.score = 0;
    this.currentQuestion = 0;
    this.renderStartScreen();
  }

  shareResult() {
    if (!this.isQuizEnded) return;
    const shareUrl = this.shareUrl;
    const shareMessage = `我的軟魂--${this.latestResult.text}\n${shareUrl}`;

    this.copyShareMessage(shareMessage);
  }

  copyShareMessage(message) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(message)
        .then(() => {
          Swal.fire({
            icon: "success",
            title: "已複製分享內容",
            text: "快告訴好友你的軟魂類型吧！",
            confirmButtonText: "好的",
          });
        })
        .catch(() => {
          this.showManualCopyModal(message);
        });
    } else {
      this.showManualCopyModal(message);
    }
  }

  showManualCopyModal(message) {
    Swal.fire({
      icon: "info",
      title: "請手動複製分享內容",
      input: "textarea",
      inputValue: message,
      inputAttributes: {
        readonly: true,
        "aria-label": "分享內容",
      },
      confirmButtonText: "完成",
      didOpen: () => {
        const textarea = Swal.getInput();
        if (textarea) {
          textarea.focus();
          textarea.select();
        }
      },
    });
  }
}

const quiz = new Quiz();
