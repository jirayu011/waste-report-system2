document.addEventListener("DOMContentLoaded", () => {
    const App = window.WasteApp;
    const monthInput = document.getElementById("dashboardMonth");
    const branchInput = document.getElementById("dashboardBranch");
    const refreshButton = document.getElementById("refreshButton");
    let rows = [];

    monthInput.value = App.localMonthInput();

    function filteredRows() {
        return rows.filter(row => (!monthInput.value || row.date_iso.startsWith(monthInput.value)) && (!branchInput.value || row.branch === branchInput.value));
    }

    function render() {
        const data = filteredRows();
        const sum = App.totals(data);
        App.updateKpis(sum, data.length);

        const grouped = data.reduce((result, row) => {
            const key = row.branch || "ไม่ระบุหน่วยงาน";
            result[key] ||= { ...Object.fromEntries(App.CATEGORIES.map(category => [category.key, 0])), total: 0 };
            App.CATEGORIES.forEach(category => { result[key][category.key] += row[category.key]; });
            result[key].total += row.total;
            return result;
        }, {});
        const max = Math.max(...Object.values(grouped).map(item => item.total), 1);
        document.getElementById("branchSummary").innerHTML = Object.entries(grouped).length ? Object.entries(grouped).sort().map(([branch, item]) => `
            <div class="branch-row">
                <div class="branch-label"><span class="branch-badge">${App.escapeHtml(branch)}</span><strong>${App.formatNumber(item.total)} kg</strong></div>
                <div class="stacked-bar" aria-label="${App.escapeHtml(branch)} รวม ${item.total} กิโลกรัม" style="--width:${(item.total / max) * 100}%">
                    ${App.CATEGORIES.map(category => `<span class="bar-${category.className}" style="--part:${item.total ? item[category.key] / item.total * 100 : 0}%"></span>`).join("")}
                </div>
                <div class="bar-legend">${App.CATEGORIES.map(category => `<span><i class="legend-${category.className}"></i>${category.label} ${App.formatNumber(item[category.key])}</span>`).join("")}</div>
            </div>`).join("") : '<div class="empty-block"><i class="bi bi-bar-chart"></i><span>ยังไม่มีข้อมูลในเดือนนี้</span></div>';

        const recent = [...data].sort((a, b) => (b.timestamp_iso || b.date_iso).localeCompare(a.timestamp_iso || a.date_iso)).slice(0, 6);
        document.getElementById("recentRows").innerHTML = recent.length ? recent.map(row => `<tr><td>${App.formatDate(row.date_iso)}</td><td><span class="branch-badge">${App.escapeHtml(row.branch || "—")}</span></td><td class="text-end fw-semibold">${App.formatNumber(row.total)} kg</td><td>${App.escapeHtml(row.recorder || "—")}</td></tr>`).join("") : App.emptyRow(4);
    }

    async function load() {
        App.setBusy(refreshButton, true);
        try { rows = await App.loadData(); App.populateBranches(branchInput, rows); render(); }
        catch (error) { App.showError(error); }
        finally { App.setBusy(refreshButton, false); }
    }

    monthInput.addEventListener("change", render);
    branchInput.addEventListener("change", render);
    refreshButton.addEventListener("click", load);
    load();
});
