// (document).ready
$(function () {
  // 漢堡按鈕點擊事件
  $(".hamburger").click(function () {
    // 切換按鈕的活躍狀態
    $(this).toggleClass("is-active");
    // 切換導航選單的顯示狀態
    $(".navigation").toggleClass("show");

    // 檢查導航選單是否處於顯示狀態
    if ($(".navigation").hasClass("show")) {
      // 顯示選單項目，依序滑入
      $(".menu li").each(function (index) {
        $(this)
          .delay(index * 100)
          .animate(
            {
              right: "-2px",
            },
            200
          ); // 毫秒的動畫時間
      });
    } else {
      // 隱藏選單項目，依序滑出
      $(".menu li").each(function (index) {
        $(this)
          .delay(index * 100)
          .animate(
            {
              right: "-180px",
            },
            200
          ); //毫秒的動畫時間
      });
    }
  });

  // 當 hover 單個選項時，該選項平滑滑入
  $(".menu li").hover(
    function () {
      $(this).stop(true, true).animate(
        {
          right: "-2px", // 單獨顯示該選項
        },
        400
      ); // 動畫時間
    },
    function () {
      // 當 hover 離開時，恢復為預設位置
      if (!$(".navigation").hasClass("show")) {
        $(this).stop(true, true).animate(
          {
            right: "-180px", // 恢復隱藏
          },
          400
        );
      }
    }
  );

  // 滑動至指定位置(react不可使用)
  $(".menu a").click(function () {
    // 取得屬性值
    let btn = $(this).attr("href");
    // 取得相對座標位置
    let pos = $(btn).offset();

    // 捲動至相對座標位置
    $("html,body").animate({ scrollTop: pos.top }, 1000);
  });

  // 至頂按鈕

  $("#gotop").click(function () {
    // 捲動至0座標位置
    $("html,body").animate({ scrollTop: 0 }, 1000);
  });

  // 至頂按鈕fadding
  $(window).scroll(function () {
    if ($(this).scrollTop() > 200) {
      /* 往下滑200後出現 */
      $("#gotop").stop().fadeIn(); /* stop指令使向上按鈕的淡出效果只做一次 */
    } else {
      $("#gotop").stop().fadeOut();
    }
  });
  // 移除行動裝置的背景影片
  if ($(window).width() <= 820) {
    $("#video-bg").remove();
  }

  // 通常啟用jq獨立打包套件(獨立放在外面)
  // $('.smoove').smoove({
  //     offset:250
  // })

  // 心理測驗介紹的輪播圖片 - 使用 Swiper
  if (typeof Swiper !== "undefined") {
    const testGallerySwiper = new Swiper(".test-gallery-swiper", {
      slidesPerView: 1,
      spaceBetween: 0,
      loop: true,
      autoplay: {
        delay: 2000,
        disableOnInteraction: false,
      },
      effect: "fade",
      fadeEffect: {
        crossFade: true,
      },
      speed: 500,
      allowTouchMove: false, // 禁用触摸滑动，保持自动播放
    });
  }
});

// 按鈕動畫

$(".test-button").mouseenter(function (e) {
  var parentOffset = $(this).offset();

  var relX = e.pageX - parentOffset.left;
  var relY = e.pageY - parentOffset.top;
  $(this).prev(".su_button_circle").css({ left: relX, top: relY });
  $(this).prev(".su_button_circle").removeClass("desplode-circle");
  $(this).prev(".su_button_circle").addClass("explode-circle");
});

$(".test-button").mouseleave(function (e) {
  var parentOffset = $(this).offset();

  var relX = e.pageX - parentOffset.left;
  var relY = e.pageY - parentOffset.top;
  $(this).prev(".su_button_circle").css({ left: relX, top: relY });
  $(this).prev(".su_button_circle").removeClass("explode-circle");
  $(this).prev(".su_button_circle").addClass("desplode-circle");
});
