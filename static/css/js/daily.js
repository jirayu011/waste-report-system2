document.addEventListener("DOMContentLoaded", () => {
    const App = window.WasteApp;
    const dateInput = document.getElementById("reportDate");
    const branchInput = document.getElementById("branchFilter");
    const refreshButton = document.getElementById("refreshButton");
    let rows = [];

    dateInput.value = App.localDateInput();

    function render() {
        const data = rows.filter(row => row.date_iso === dateInput.value && (!branchInput.value || row.branch === branchInput.value));
        const sum = App.totals(data);
        document.getElementById("generalKpi").textContent = App.formatNumber(sum.general);
        document.getElementById("recycleKpi").textContent = App.formatNumber(sum.recycle);
        document.getElementById("totalKpi").textContent = App.formatNumber(sum.total);
        document.getElementById("recordCount").textContent = App.formatNumber(data.length);
        document.getElementById("dailyCount").textContent = `${App.formatNumber(data.length)} รายการ`;
        document.getElementById("dailyCaption").textContent = `${App.formatDate(dateInput.value)}${branchInput.value ? ` · อาคาร ${branchInput.value}` : " · ทุกอาคาร"}`;
        document.getElementById("reportRows").innerHTML = data.length ? [...data].sort((a, b) => (b.timestamp_iso || "").localeCompare(a.timestamp_iso || "")).map((row, index) => `<tr>
            <td class="row-number">${index + 1}</td><td>${App.formatTime(row)}</td><td><span class="branch-badge">${App.escapeHtml(row.branch || "—")}</span></td>
            <td class="text-end">${App.formatNumber(row.general)}</td><td class="text-end recycle-value">${App.formatNumber(row.recycle)}</td><td class="text-end"><strong>${App.formatNumber(row.total)} kg</strong></td><td>${App.escapeHtml(row.recorder || "—")}</td>
        </tr>`).join("") : App.emptyRow(7);
    }

    async function load() {
        App.setBusy(refreshButton, true);
        try {
            rows = await App.loadData();
            App.populateBranches(branchInput, rows);
            render();
        } catch (error) { App.showError(error); }
        finally { App.setBusy(refreshButton, false); }
    }

    dateInput.addEventListener("change", render);
    branchInput.addEventListener("change", render);
    refreshButton.addEventListener("click", load);
    load();
});
