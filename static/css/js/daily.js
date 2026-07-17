document.addEventListener("DOMContentLoaded", () => {
    const App = window.WasteApp;
    const dateInput = document.getElementById("reportDate");
    const branchInput = document.getElementById("branchFilter");
    const refreshButton = document.getElementById("refreshButton");
    let rows = [];

    dateInput.value = App.localDateInput();

    function render() {
        const data = rows.filter(row => row.date_iso === dateInput.value && (!branchInput.value || row.branch === branchInput.value));
        App.updateKpis(App.totals(data), data.length);
        document.getElementById("dailyCount").textContent = `${App.formatNumber(data.length)} รายการ`;
        document.getElementById("dailyCaption").textContent = `${App.formatDate(dateInput.value)}${branchInput.value ? ` · ${branchInput.value}` : " · ทุกหน่วยงาน"}`;
        document.getElementById("reportRows").innerHTML = data.length ? [...data].sort((a, b) => (b.timestamp_iso || "").localeCompare(a.timestamp_iso || "")).map((row, index) => `<tr>
            <td class="row-number">${index + 1}</td><td>${App.formatTime(row)}</td><td><span class="branch-badge">${App.escapeHtml(row.branch || "—")}</span></td>
            <td class="text-end">${App.formatNumber(row.general)}</td><td class="text-end recycle-value">${App.formatNumber(row.recycle)}</td><td class="text-end infectious-value">${App.formatNumber(row.infectious)}</td><td class="text-end">${App.formatNumber(row.document)}</td><td class="text-end toxic-value">${App.formatNumber(row.toxic)}</td>
            <td class="other-detail" title="${App.escapeHtml(row.other_detail || "")}">${row.other_detail ? App.escapeHtml(row.other_detail) : "—"}</td><td class="text-end"><strong>${App.formatNumber(row.total)} kg</strong></td><td>${App.escapeHtml(row.recorder || "—")}</td>
        </tr>`).join("") : App.emptyRow(11);
    }

    async function load() {
        App.setBusy(refreshButton, true);
        try { rows = await App.loadData(); App.populateBranches(branchInput, rows); render(); }
        catch (error) { App.showError(error); }
        finally { App.setBusy(refreshButton, false); }
    }

    dateInput.addEventListener("change", render);
    branchInput.addEventListener("change", render);
    refreshButton.addEventListener("click", load);
    load();
});
