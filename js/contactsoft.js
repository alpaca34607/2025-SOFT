// 聯絡軟筋表單
const openContactBtn = document.getElementById("open-contact");
const closeContactBtn = document.getElementById("close-contact");
const contactPopup = document.getElementById("contact-popup");
const contactForm = document.getElementById("contact-form");
const messageInput = document.getElementById("message");
const charCount = document.getElementById("char-count");

// 確保 SweetAlert2 已載入
async function ensureSweetAlertLoaded() {
  if (window.Swal) return;
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

// 開啟聯絡表單彈窗
if (openContactBtn) {
  openContactBtn.addEventListener("click", () => {
    contactPopup.style.display = "flex";
    document.body.style.overflow = "hidden";
  });
}

// 關閉聯絡表單彈窗
if (closeContactBtn) {
  closeContactBtn.addEventListener("click", () => {
    contactPopup.style.display = "none";
    document.body.style.overflow = "";
  });
}

// 點擊外部關閉聯絡表單彈窗
if (contactPopup) {
  window.addEventListener("click", (event) => {
    if (event.target === contactPopup) {
      contactPopup.style.display = "none";
      document.body.style.overflow = "";
    }
  });
}

// 字數計算
if (messageInput && charCount) {
  messageInput.addEventListener("input", () => {
    charCount.textContent = messageInput.value.length;
  });
}

// 初始化 Email.js（當頁面載入時）
if (typeof emailjs !== "undefined") {
  emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
}

// 表單提交 - 使用 Email.js 發送郵件
if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 獲取表單資料
    const formData = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      subject: document.getElementById("subject").value,
      message: document.getElementById("message").value.trim(),
    };

    // 驗證必填欄位
    if (!formData.name || !formData.subject || !formData.message) {
      await ensureSweetAlertLoaded();
      await Swal.fire({
        icon: "warning",
        title: "請填寫所有必填欄位",
        text: "姓名、主旨和內容都是必填項目",
        confirmButtonText: "我知道了",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // 顯示載入狀態
    const submitBtn = contactForm.querySelector(".submit-btn");
    const originalBtnText = submitBtn ? submitBtn.textContent : "送出";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "發送中...";
    }

    try {
      // 主旨選項對應的中文
      const subjectMap = {
        shopping: "購物相關",
        cooperation: "合作邀請",
        ip: "角色IP",
        other: "其他",
      };
      const subjectText = subjectMap[formData.subject] || formData.subject;

      // 使用 Email.js 發送郵件
      await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        {
          from_name: formData.name,
          from_email: formData.email || "未提供",
          subject: subjectText,
          message: formData.message,
          reply_to: formData.email || "",
        },
        EMAILJS_CONFIG.PUBLIC_KEY
      );

      // 成功訊息
      await ensureSweetAlertLoaded();
      await Swal.fire({
        icon: "success",
        title: "感謝您的回饋！",
        text: "我們會盡快回覆您。",
        confirmButtonText: "確定",
        confirmButtonColor: "#3085d6",
      });

      // 清空表單
      contactForm.reset();
      if (charCount) {
        charCount.textContent = "0";
      }

      // 關閉彈窗
      if (contactPopup) {
        contactPopup.style.display = "none";
        document.body.style.overflow = "";
      }
    } catch (error) {
      console.error("Email.js 發送失敗:", error);
      console.error("錯誤詳情:", {
        status: error.status,
        text: error.text,
        response: error.response,
      });

      await ensureSweetAlertLoaded();

      // 根據錯誤類型顯示不同的訊息
      let errorTitle = "發送失敗";
      let errorText = "請稍後再試或直接來信 IG: @soft.ig";
      let errorIcon = "error";

      let useHtml = false;
      let htmlContent = "";

      if (error.text) {
        if (
          error.text.includes("recipients address is empty") ||
          error.status === 422
        ) {
          errorTitle = "收件人地址未設置";
          useHtml = true;
          htmlContent =
            "請在 Email.js Dashboard 中設置模板的「To Email」欄位。<br><br>詳細說明請查看 <strong>EMAILJS_SETUP.md</strong> 文件。";
          errorIcon = "warning";
        } else if (error.status === 400) {
          errorTitle = "發送失敗";
          errorText = "請檢查表單資料是否正確。";
        } else if (error.status === 401) {
          errorTitle = "驗證失敗";
          errorText = "Public Key 可能不正確，請檢查配置。";
        } else if (error.status === 404) {
          errorTitle = "配置錯誤";
          errorText = "Service ID 或 Template ID 不正確，請檢查配置。";
        }
      }

      const swalConfig = {
        icon: errorIcon,
        title: errorTitle,
        confirmButtonText: "我知道了",
        confirmButtonColor: "#3085d6",
      };

      if (useHtml) {
        swalConfig.html = htmlContent;
      } else {
        swalConfig.text = errorText;
      }

      await Swal.fire(swalConfig);
    } finally {
      // 恢復按鈕狀態
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    }
  });
}
