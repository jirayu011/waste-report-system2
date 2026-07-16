window.WasteApp = (() => {
    const FORM_URL = "https://docs.google.com/forms/d/1uLLBqKbqgTLa7tsu_OYfnpQipEO8ZrsSK-HxEDyLb9Q/viewform";
    const number = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 });

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
    }

    function localDateInput(date = new Date()) {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 10);
    }

    function localMonthInput(date = new Date()) { return localDateInput(date).slice(0, 7); }
    function formatNumber(value) { return number.format(Number(value) || 0); }
    function formatDate(iso) {
        if (!iso) return "—";
        return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${iso}T00:00:00`));
    }
    function formatTime(row) {
        if (row.timestamp_iso) return row.timestamp_iso.slice(11, 16);
        const match = String(row.timestamp || "").match(/(\d{1,2}:\d{2})(?::\d{2})?/);
        return match ? match[1] : "—";
    }

    async function loadData() {
        const response = await fetch("/api/data", { headers: { Accept: "application/json" } });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "ไม่สามารถโหลดข้อมูลได้");
        document.querySelectorAll("[data-form-link]").forEach(link => link.href = result.form_url || FORM_URL);
        return result.data;
    }

    function populateBranches(select, data) {
        const selected = select.value;
        const branches = [...new Set(data.map(row => row.branch).filter(Boolean))].sort();
        select.innerHTML = '<option value="">ทุกอาคาร</option>' + branches.map(branch => `<option value="${escapeHtml(branch)}">${escapeHtml(branch)}</option>`).join("");
        if (branches.includes(selected)) select.value = selected;
    }

    function totals(data) {
        return data.reduce((sum, row) => ({ general: sum.general + row.general, recycle: sum.recycle + row.recycle, total: sum.total + row.total }), { general: 0, recycle: 0, total: 0 });
    }

    function emptyRow(columns, text = "ไม่พบข้อมูลตามตัวกรองที่เลือก") {
        return `<tr><td colspan="${columns}" class="empty-state"><i class="bi bi-inbox"></i><span>${escapeHtml(text)}</span></td></tr>`;
    }

    function showError(error) {
        const target = document.getElementById("pageError");
        if (!target) return;
        target.textContent = `เกิดข้อผิดพลาด: ${error.message}`;
        target.classList.remove("d-none");
    }

    function setBusy(button, busy) {
        if (!button) return;
        button.disabled = busy;
        button.querySelector("i")?.classList.toggle("spin", busy);
    }

    document.querySelectorAll("[data-form-link]").forEach(link => link.href = FORM_URL);
    const page = document.body.dataset.page;
    document.querySelector(`[data-nav="${page}"]`)?.classList.add("active");

    return { escapeHtml, localDateInput, localMonthInput, formatNumber, formatDate, formatTime, loadData, populateBranches, totals, emptyRow, showError, setBusy };
})();
