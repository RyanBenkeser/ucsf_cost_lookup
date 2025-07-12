let procedures = [];
const PAGE_SIZE = 50;  // Number of rows per page
let currentPage = 1;

async function loadData() {
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    procedures = Array.isArray(data.standard_charge_information) ? data.standard_charge_information : [];

    if (!procedures.length) {
      console.warn("No procedure data found.");
    }

    currentPage = 1;
    renderTablePage(currentPage);
    renderPaginationControls();
  } catch (error) {
    console.error("Error loading or parsing data.json:", error);
    renderTablePage([]);
    renderPaginationControls();
  }
}

// Render only the procedures for the current page
function renderTablePage(page) {
  const table = document.getElementById("resultsTable");
  if (!procedures.length) {
    table.innerHTML = "<tr><td>No results found.</td></tr>";
    return;
  }

  const start = (page - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, procedures.length);
  const pageItems = procedures.slice(start, end);

  table.innerHTML = `
    <tr>
      <th>Description</th>
      <th>Codes</th>
      <th>Charges</th>
      <th>Billing Class</th>
    </tr>
  `;

  pageItems.forEach(entry => {
    const codes = Array.isArray(entry.code_information)
      ? entry.code_information.map(ci => `${ci.code || 'N/A'} (${ci.type || 'N/A'})`).join("<br>")
      : "No codes";

    const charges = Array.isArray(entry.standard_charges)
      ? entry.standard_charges.map(c => {
          const gross = c.gross_charge != null ? `$${c.gross_charge}` : "N/A";
          const discounted = c.discounted_cash != null ? `$${c.discounted_cash}` : "N/A";
          const notes = c.additional_generic_notes ? `<br><small>${c.additional_generic_notes}</small>` : "";
          return `${gross} → ${discounted}${notes}`;
        }).join("<hr>")
      : "No charges";

    const billingClasses = Array.isArray(entry.standard_charges)
      ? [...new Set(entry.standard_charges.map(c => c.billing_class || "N/A"))].join("<br>")
      : "N/A";

    table.innerHTML += `
      <tr>
        <td>${entry.description || "No description"}</td>
        <td>${codes}</td>
        <td>${charges}</td>
        <td>${billingClasses}</td>
      </tr>
    `;
  });
}

// Render pagination buttons
function renderPaginationControls() {
  let paginationDiv = document.getElementById("paginationControls");
  if (!paginationDiv) {
    paginationDiv = document.createElement("div");
    paginationDiv.id = "paginationControls";
    paginationDiv.style.marginTop = "1em";
    document.body.appendChild(paginationDiv);
  }

  const totalPages = Math.ceil(procedures.length / PAGE_SIZE);
  if (totalPages <= 1) {
    paginationDiv.innerHTML = "";
    return;
  }

  let buttonsHtml = "";

  // Previous button
  buttonsHtml += `<button ${currentPage === 1 ? "disabled" : ""} onclick="goToPage(${currentPage - 1})">Previous</button> `;

  // Show up to 5 page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);

  for (let i = startPage; i <= endPage; i++) {
    buttonsHtml += `<button ${i === currentPage ? "disabled" : ""} onclick="goToPage(${i})">${i}</button> `;
  }

  // Next button
  buttonsHtml += `<button ${currentPage === totalPages ? "disabled" : ""} onclick="goToPage(${currentPage + 1})">Next</button>`;

  paginationDiv.innerHTML = buttonsHtml;
}

function goToPage(page) {
  const totalPages = Math.ceil(procedures.length / PAGE_SIZE);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderTablePage(currentPage);
  renderPaginationControls();
}

// Search and paginate filtered results
function searchTable(query) {
  const q = query.toLowerCase().trim();

  procedures = proceduresOriginal.filter(entry => {
    const descMatch = (entry.description || "").toLowerCase().includes(q);
    const codeMatch = Array.isArray(entry.code_information) && entry.code_information.some(ci =>
      String(ci.code || "").toLowerCase().includes(q)
    );
    return descMatch || codeMatch;
  });

  currentPage = 1;
  renderTablePage(currentPage);
  renderPaginationControls();
}

let proceduresOriginal = [];

document.addEventListener("DOMContentLoaded", () => {
  loadData();

  document.getElementById("searchBox").addEventListener("input", e => {
    // Filter on the original full dataset, not the current paginated subset
    const q = e.target.value;
    procedures = proceduresOriginal;  // reset before filter
    if (q.length > 0) {
      procedures = proceduresOriginal.filter(entry => {
        const descMatch = (entry.description || "").toLowerCase().includes(q.toLowerCase());
        const codeMatch = Array.isArray(entry.code_information) && entry.code_information.some(ci =>
          String(ci.code || "").toLowerCase().includes(q.toLowerCase())
        );
        return descMatch || codeMatch;
      });
    } else {
      procedures = proceduresOriginal;
    }
    currentPage = 1;
    renderTablePage(currentPage);
    renderPaginationControls();
  });
});

// Modify loadData to save original unfiltered data
async function loadData() {
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    proceduresOriginal = Array.isArray(data.standard_charge_information) ? data.standard_charge_information : [];
    procedures = proceduresOriginal;

    if (!procedures.length) {
      console.warn("No procedure data found.");
    }

    currentPage = 1;
    renderTablePage(currentPage);
    renderPaginationControls();
  } catch (error) {
    console.error("Error loading or parsing data.json:", error);
    renderTablePage([]);
    renderPaginationControls();
  }
}
