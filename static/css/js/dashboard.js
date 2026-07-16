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
        document.getElementById("generalKpi").textContent = App.formatNumber(sum.general);
        document.getElementById("recycleKpi").textContent = App.formatNumber(sum.recycle);
        document.getElementById("totalKpi").textContent = App.formatNumber(sum.total);
        document.getElementById("recordKpi").textContent = App.formatNumber(data.length);

        const grouped = data.reduce((result, row) => {
            const key = row.branch || "ไม่ระบุ";
            result[key] ||= { general: 0, recycle: 0, total: 0 };
            result[key].general += row.general;
            result[key].recycle += row.recycle;
            result[key].total += row.total;
            return result;
        }, {});
        const max = Math.max(...Object.values(grouped).map(item => item.total), 1);
        document.getElementById("branchSummary").innerHTML = Object.entries(grouped).length ? Object.entries(grouped).sort().map(([branch, item]) => `
            <div class="branch-row">
                <div class="branch-label"><span class="branch-badge">${App.escapeHtml(branch)}</span><strong>${App.formatNumber(item.total)} kg</strong></div>
                <div class="stacked-bar" aria-label="${App.escapeHtml(branch)} รวม ${item.total} กิโลกรัม" style="--width:${(item.total / max) * 100}%">
                    <span class="bar-general" style="--part:${item.total ? item.general / item.total * 100 : 0}%"></span><span class="bar-recycle"></span>
                </div>
                <div class="bar-legend"><span><i class="legend-general"></i>ทั่วไป ${App.formatNumber(item.general)}</span><span><i class="legend-recycle"></i>รีไซเคิล ${App.formatNumber(item.recycle)}</span></div>
            </div>`).join("") : '<div class="empty-block"><i class="bi bi-bar-chart"></i><span>ยังไม่มีข้อมูลในเดือนนี้</span></div>';

        const recent = [...data].sort((a, b) => (b.timestamp_iso || b.date_iso).localeCompare(a.timestamp_iso || a.date_iso)).slice(0, 6);
        document.getElementById("recentRows").innerHTML = recent.length ? recent.map(row => `<tr><td>${App.formatDate(row.date_iso)}</td><td><span class="branch-badge">${App.escapeHtml(row.branch || "—")}</span></td><td class="text-end fw-semibold">${App.formatNumber(row.total)} kg</td><td>${App.escapeHtml(row.recorder || "—")}</td></tr>`).join("") : App.emptyRow(4);
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

    monthInput.addEventListener("change", render);
    branchInput.addEventListener("change", render);
    refreshButton.addEventListener("click", load);
    load();
});
