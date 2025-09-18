document.addEventListener("DOMContentLoaded", async () => {
  const tbody = document.querySelector("tbody");
  const sortBtn = document.getElementById("sortBtn");
  const sortIcon = sortBtn.querySelector(".sort-icon");
  const searchInput = document.getElementById("search");
  let isAscending = true;
  let productData = [];

  function mapStatusClass(cellOpenStatus) {
    if (cellOpenStatus === "stopped_selling") return "status-soldout";
    return "status-avalible";
  }

  function mapStatusText(cellOpenStatus) {
    switch (cellOpenStatus) {
      case "open_for_preorder":
        return "開放預購中";
      case "stopped_selling":
        return "已停止販售";
      case "preparing":
      default:
        return "準備中";
    }
  }

  function mapMarkerText(cellRemainingStatus) {
    return cellRemainingStatus === "sold_out" ? "已售完" : "尚有餘量";
  }

  function mapMarkerColor(cellRemainingStatus) {
    return cellRemainingStatus === "sold_out" ? "markerGrey" : "markerLight";
  }

  function updateSortButton() {
    sortIcon.classList.toggle("descending", !isAscending);
    sortBtn.classList.toggle("active");
  }

  function renderProducts(products) {
    tbody.innerHTML = products
      .map(
        (product) => `
<tr>
  <td class="product-cell">
    <a href="${product.link}">
      <div class="cell-bg"><img src="./images/shop/Union.svg"></div>
      <div class="${product.status}">${product.statusText}</div>
      <figure class="product-figure">
        <div class="img-wrapper">
          <div class="${product.markerColor}"> ${product.marker}</div>
          <img src="${product.imgUrl}" alt="${product.title}">
        </div>
        <figcaption>
          <div class="product-title">${product.title}</div>
          <div class="price-cell">NT.${product.price}</div>
        </figcaption>
      </figure>
    </a>
  </td>
  </tr>
        `
      )
      .join("");
  }

  function filterAndSortProducts() {
    let filtered = [...productData];

    // 搜尋過濾（依商品名稱）
    const keyword = (searchInput.value || "").trim();
    if (keyword) {
      filtered = filtered.filter((p) => p.title.includes(keyword));
    }

    // 排序（依建立時間）
    filtered.sort((a, b) => {
      return isAscending
        ? a.createdAt - b.createdAt
        : b.createdAt - a.createdAt;
    });

    renderProducts(filtered);
  }

  // 從後端載入商品
  try {
    const resp = await API.getProducts();
    const fallbackThumb = "./images/shop/product-Softzilla-thumb.jpg";

    // 構建完整的圖片 URL
    const buildImageUrl = (imagePath) => {
      if (!imagePath) return fallbackThumb;
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
      }
      const baseURL =
        window.ENV_CONFIG?.API_BASE_URL || "http://localhost:3000";
      return `${baseURL}${imagePath}`;
    };

    productData = (resp.products || []).map((p) => ({
      // 以 created_at 排序（轉為毫秒）
      createdAt: p.created_at ? new Date(p.created_at).getTime() : 0,
      title: p.name,
      link: `./product.html?id=${p.product_id}`,
      price: p.price,
      imgUrl: buildImageUrl(p.thumbnail_path),
      status: mapStatusClass(p.cell_open_status),
      statusText: mapStatusText(p.cell_open_status),
      marker: mapMarkerText(p.cell_remaining_status),
      markerColor: mapMarkerColor(p.cell_remaining_status),
    }));
  } catch (err) {
    console.error("載入商品列表失敗，回退至空清單:", err);
    productData = [];
  }

  // 綁定事件
  sortBtn.addEventListener("click", () => {
    isAscending = !isAscending;
    updateSortButton();
    filterAndSortProducts();
  });
  searchInput.addEventListener("input", filterAndSortProducts);

  // 初始渲染
  updateSortButton();
  filterAndSortProducts();
});
