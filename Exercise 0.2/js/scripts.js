function createTable(containerId, columns, rows) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const thead = `<thead><tr>${columns.map((col) => `<th>${col}</th>`).join("")}</tr></thead>`;
    const tbody = `<tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>`;
    container.innerHTML = `<table class="data-table">${thead}${tbody}</table>`;
}

function addStoryboardIcons() {
    const iconMap = {
        "Issue": "⚠️",
        "Demonstrate Issue": "📊",
        "Ideas for Overcoming": "💡",
        "Pilot Program": "🧪",
        "Before and After Data": "📈",
        "Recommendation": "✅"
    };

    document.querySelectorAll(".story-note strong").forEach((label) => {
        const text = label.textContent.trim();
        const icon = iconMap[text];
        if (!icon) return;
        label.innerHTML = `<span class="story-icon" aria-hidden="true">${icon}</span><span>${text}</span>`;
    });
}

function enhanceStoryboardLayout() {
    document.querySelectorAll(".story-note").forEach((card) => {
        const heading = card.querySelector("strong")?.textContent.trim();
        const textEl = card.querySelector("p");
        if (!heading || !textEl) return;

        const raw = textEl.textContent.trim();

        if (heading === "Before and After Data") {
            const beforeMatch = raw.match(/Before:\s*(.*?)(?=\.\s*After:|$)/i);
            const afterMatch = raw.match(/After:\s*(.*?)(?=$)/i);
            const beforeText = beforeMatch ? beforeMatch[1].trim() : "Before data not specified";
            const afterText = afterMatch ? afterMatch[1].trim() : "After data not specified";

            textEl.remove();
            card.classList.add("story-note-compare");
            card.insertAdjacentHTML(
                "beforeend",
                `<div class="compare-row">
                    <div class="compare-box compare-before">
                        <span class="compare-label">Before</span>
                        <p>${beforeText}</p>
                    </div>
                    <div class="compare-box compare-after">
                        <span class="compare-label">After</span>
                        <p>${afterText}</p>
                    </div>
                </div>`
            );
            return;
        }

        const listItems = raw
            .split(/;\s+|\.\s+(?=[A-Z0-9`])/)
            .map((s) => s.trim())
            .filter(Boolean);

        if (listItems.length > 1 || heading === "Demonstrate Issue" || heading === "Ideas for Overcoming" || heading === "Recommendation" || heading === "Pilot Program") {
            textEl.remove();
            card.classList.add("story-note-list");
            card.insertAdjacentHTML(
                "beforeend",
                `<ul>${listItems.map((item) => `<li>${item.replace(/\.$/, "")}</li>`).join("")}</ul>`
            );
        }
    });
}

function makeSvg(containerId, margins) {
    const root = d3.select(`#${containerId}`);
    root.selectAll("*").remove();

    const width = Math.max(root.node().getBoundingClientRect().width || 0, 720);
    const height = 300;

    const svg = root
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    const plotWidth = width - margins.left - margins.right;
    const plotHeight = height - margins.top - margins.bottom;

    const chart = svg
        .append("g")
        .attr("transform", `translate(${margins.left},${margins.top})`);

    return { svg, chart, plotWidth, plotHeight };
}

function getChartTooltip() {
    let tooltip = d3.select("body").select(".chart-tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body")
            .append("div")
            .attr("class", "chart-tooltip");
    }
    return tooltip;
}

function formatValue(value) {
    return typeof value === "number" ? value.toLocaleString() : String(value);
}

function attachBarTooltip(selection, getTitle, getValue) {
    const tooltip = getChartTooltip();

    selection
        .on("mouseenter", function(event, d) {
            d3.select(this).attr("opacity", 1);
            tooltip
                .style("opacity", 1)
                .html(`<strong>${getTitle(d)}</strong><br>${formatValue(getValue(d))}`);
        })
        .on("mousemove", function(event) {
            tooltip
                .style("left", `${event.pageX + 12}px`)
                .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseleave", function() {
            d3.select(this).attr("opacity", 0.95);
            tooltip.style("opacity", 0);
        });
}

function drawBarChart(containerId, data, options) {
    const { xKey, yKey, xLabel, yLabel, color = "#1d5f89", rotateTicks = false } = options;
    const margins = { top: 16, right: 20, bottom: rotateTicks ? 80 : 54, left: 56 };
    const { chart, plotWidth, plotHeight } = makeSvg(containerId, margins);

    const x = d3.scaleBand()
        .domain(data.map((d) => String(d[xKey])))
        .range([0, plotWidth])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, (d) => Number(d[yKey])) || 0])
        .nice()
        .range([plotHeight, 0]);

    const barPalette = ["#2563eb", "#10b981", "#a855f7", "#f59e0b", "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1", "#14b8a6"];
    const barColor = d3.scaleOrdinal(barPalette);

    const bars = chart.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", (d) => x(String(d[xKey])))
        .attr("y", (d) => y(Number(d[yKey])))
        .attr("width", x.bandwidth())
        .attr("height", (d) => plotHeight - y(Number(d[yKey])))
        .attr("fill", (d, i) => barColor(String(d[xKey]) || String(i)))
        .attr("opacity", 0.95);

    attachBarTooltip(bars, (d) => `${xLabel}: ${d[xKey]}`, (d) => `${yLabel}: ${d[yKey]}`);

    const xAxis = chart.append("g")
        .attr("transform", `translate(0,${plotHeight})`)
        .call(d3.axisBottom(x));

    if (rotateTicks) {
        xAxis.selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-0.6em")
            .attr("dy", "0.2em")
            .attr("transform", "rotate(-45)");
    }

    chart.append("g").call(d3.axisLeft(y));

    chart.append("text")
        .attr("x", plotWidth / 2)
        .attr("y", plotHeight + margins.bottom - 10)
        .attr("text-anchor", "middle")
        .attr("fill", "#334155")
        .style("font-size", "12px")
        .text(xLabel);

    chart.append("text")
        .attr("x", -plotHeight / 2)
        .attr("y", -40)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .attr("fill", "#334155")
        .style("font-size", "12px")
        .text(yLabel);
}

function drawHorizontalBarChart(containerId, data, options) {
    const { xKey, yKey, xLabel, color = "#10b981" } = options;
    const margins = { top: 16, right: 20, bottom: 54, left: 120 };
    const { chart, plotWidth, plotHeight } = makeSvg(containerId, margins);

    const y = d3.scaleBand()
        .domain(data.map((d) => String(d[yKey])))
        .range([0, plotHeight])
        .padding(0.2);

    const x = d3.scaleLinear()
        .domain([0, d3.max(data, (d) => Number(d[xKey])) || 0])
        .nice()
        .range([0, plotWidth]);

    const barPalette = ["#2563eb", "#10b981", "#a855f7", "#f59e0b", "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1", "#14b8a6"];
    const barColor = d3.scaleOrdinal(barPalette);

    const bars = chart.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d) => y(String(d[yKey])))
        .attr("width", (d) => x(Number(d[xKey])))
        .attr("height", y.bandwidth())
        .attr("fill", (d, i) => barColor(String(d[yKey]) || String(i)))
        .attr("opacity", 0.95);

    attachBarTooltip(bars, (d) => `${yKey}: ${d[yKey]}`, (d) => `${xLabel}: ${d[xKey]}`);

    chart.append("g").call(d3.axisLeft(y));
    chart.append("g")
        .attr("transform", `translate(0,${plotHeight})`)
        .call(d3.axisBottom(x));

    chart.append("text")
        .attr("x", plotWidth / 2)
        .attr("y", plotHeight + margins.bottom - 10)
        .attr("text-anchor", "middle")
        .attr("fill", "#334155")
        .style("font-size", "12px")
        .text(xLabel);
}

function drawScatterChart(containerId, data, options) {
    const { xKey, yKey, xLabel, yLabel, fill = "rgba(37, 99, 235, 0.45)", stroke = "#1d4ed8" } = options;
    const margins = { top: 16, right: 20, bottom: 54, left: 60 };
    const { chart, plotWidth, plotHeight } = makeSvg(containerId, margins);

    const xExtent = d3.extent(data, (d) => Number(d[xKey]));
    const yExtent = d3.extent(data, (d) => Number(d[yKey]));

    const x = d3.scaleLinear()
        .domain([xExtent[0] ?? 0, xExtent[1] ?? 1])
        .nice()
        .range([0, plotWidth]);

    const y = d3.scaleLinear()
        .domain([yExtent[0] ?? 0, yExtent[1] ?? 1])
        .nice()
        .range([plotHeight, 0]);

    chart.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", (d) => x(Number(d[xKey])))
        .attr("cy", (d) => y(Number(d[yKey])))
        .attr("r", (d) => Math.max(2, Math.min(9, Number(d.count || 1) + 1)))
        .attr("fill", fill)
        .attr("stroke", stroke)
        .attr("stroke-width", 1);

    chart.append("g")
        .attr("transform", `translate(0,${plotHeight})`)
        .call(d3.axisBottom(x));
    chart.append("g").call(d3.axisLeft(y));

    chart.append("text")
        .attr("x", plotWidth / 2)
        .attr("y", plotHeight + margins.bottom - 10)
        .attr("text-anchor", "middle")
        .attr("fill", "#334155")
        .style("font-size", "12px")
        .text(xLabel);

    chart.append("text")
        .attr("x", -plotHeight / 2)
        .attr("y", -42)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .attr("fill", "#334155")
        .style("font-size", "12px")
        .text(yLabel);
}

function setupQuestionToggles() {
    const buttons = document.querySelectorAll(".question-toggle");
    buttons.forEach((button) => {
        button.setAttribute("aria-expanded", "false");
        button.addEventListener("click", () => {
            const panel = document.getElementById(button.dataset.target);
            if (!panel) return;
            const isOpen = panel.classList.toggle("open");
            button.classList.toggle("is-open", isOpen);
            button.setAttribute("aria-expanded", String(isOpen));
        });
    });
}

function createCharts() {
    if (typeof d3 === "undefined") return;

    const { q1, q2, q3, q4, q5, q6 } = window.chartData || {};
    if (!q1 || !q2 || !q3 || !q4 || !q5 || !q6) {
        throw new Error("Chart data is missing.");
    }

    drawBarChart("q1Chart", q1, {
        xKey: "screenTech",
        yKey: "count",
        xLabel: "Screen technology",
        yLabel: "Available model count",
        color: "#2563eb"
    });
    createTable(
        "q1Table",
        ["Screen Technology", "Availability", "Count"],
        q1.map((item) => [item.screenTech, item.availability, item.count])
    );

    drawBarChart("q2Chart", q2, {
        xKey: "screenSize",
        yKey: "count",
        xLabel: "Screen size (inches)",
        yLabel: "Count",
        color: "#1d5f89",
        rotateTicks: true
    });
    createTable(
        "q2Table",
        ["Screen Size (inches)", "Frequency"],
        q2.map((item) => [item.screenSize, item.count])
    );

    const topBrands = q3.slice(0, 15);
    drawHorizontalBarChart("q3Chart", topBrands, {
        xKey: "modelCount",
        yKey: "brand",
        xLabel: "Number of models",
        color: "#10b981"
    });
    createTable(
        "q3Table",
        ["Brand", "Number of Models"],
        topBrands.map((item) => [item.brand, item.modelCount])
    );

    drawBarChart("q4Chart", q4, {
        xKey: "screenTech",
        yKey: "meanPower",
        xLabel: "Screen technology",
        yLabel: "Mean mode power (W)",
        color: "#f59e0b"
    });
    createTable(
        "q4Table",
        ["Screen Technology", "Sample Count", "Mean Mode Power (W)"],
        q4.map((item) => [item.screenTech, item.sampleCount, item.meanPower])
    );

    drawScatterChart("q5Chart", q5, {
        xKey: "x",
        yKey: "y",
        xLabel: "Screen size (cm diagonal)",
        yLabel: "Labelled energy consumption (kWh/year)",
        fill: "rgba(37, 99, 235, 0.4)",
        stroke: "#1d4ed8"
    });
    createTable(
        "q5Table",
        ["Screen Size (cm diagonal)", "Labelled Energy (kWh/year)", "Count"],
        q5.slice(0, 80).map((item) => [item.x, item.y, item.count])
    );

    drawScatterChart("q6Chart", q6, {
        xKey: "x",
        yKey: "y",
        xLabel: "Screen size (cm diagonal)",
        yLabel: "Star rating",
        fill: "rgba(16, 185, 129, 0.4)",
        stroke: "#059669"
    });
    createTable(
        "q6Table",
        ["Screen Size (cm diagonal)", "Star Rating", "Count"],
        q6.slice(0, 10).map((item) => [item.x, item.y, item.count])
    );
}

document.addEventListener("DOMContentLoaded", function() {
    try {
        addStoryboardIcons();
        enhanceStoryboardLayout();
        setupQuestionToggles();
        createCharts();
    } catch (error) {
        console.error(error);
        alert("Failed to load chart data. Please check the data files.");
    }
});