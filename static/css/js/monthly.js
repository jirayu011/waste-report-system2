document.addEventListener("DOMContentLoaded", () => {
    const App = window.WasteApp;
    const monthInput = document.getElementById("reportMonth");
    const branchInput = document.getElementById("branchFilter");
    const refreshButton = document.getElementById("refreshButton");
    let rows = [];

    monthInput.value = App.localMonthInput();

    function render() {
        const data = rows.filter(row => row.date_iso.startsWith(monthInput.value) && (!branchInput.value || row.branch === branchInput.value));
        const sum = App.totals(data);
        document.getElementById("generalKpi").textContent = App.formatNumber(sum.general);
        document.getElementById("recycleKpi").textContent = App.formatNumber(sum.recycle);
        document.getElementById("totalKpi").textContent = App.formatNumber(sum.total);
        document.getElementById("recordCount").textContent = App.formatNumber(data.length);

        const grouped = Object.values(data.reduce((result, row) => {
            const key = `${row.date_iso}|${row.branch}`;
            result[key] ||= { date_iso: row.date_iso, branch: row.branch, general: 0, recycle: 0, total: 0, count: 0 };
            result[key].general += row.general; result[key].recycle += row.recycle; result[key].total += row.total; result[key].count += 1;
            return result;
        }, {})).sort((a, b) => b.date_iso.localeCompare(a.date_iso) || a.branch.localeCompare(b.branch));

        document.getElementById("monthlyCount").textContent = `${App.formatNumber(grouped.length)} แถว`;
        const monthLabel = monthInput.value ? new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" }).format(new Date(`${monthInput.value}-01T00:00:00`)) : "ทุกเดือน";
        document.getElementById("monthlyCaption").textContent = `${monthLabel}${branchInput.value ? ` · อาคาร ${branchInput.value}` : " · ทุกอาคาร"}`;
        document.getElementById("monthlyRows").innerHTML = grouped.length ? grouped.map((row, index) => `<tr>
            <td class="row-number">${index + 1}</td><td>${App.formatDate(row.date_iso)}</td><td><span class="branch-badge">${App.escapeHtml(row.branch || "—")}</span></td>
            <td class="text-end">${App.formatNumber(row.general)}</td><td class="text-end recycle-value">${App.formatNumber(row.recycle)}</td><td class="text-end"><strong>${App.formatNumber(row.total)} kg</strong></td><td class="text-end">${App.formatNumber(row.count)}</td>
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

    monthInput.addEventListener("change", render);
    branchInput.addEventListener("change", render);
    refreshButton.addEventListener("click", load);
    load();
});
