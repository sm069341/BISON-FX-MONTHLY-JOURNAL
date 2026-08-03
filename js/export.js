/*==========================================
        BISON FX JOURNAL
        EXPORT PNG
==========================================*/

const downloadBtn = document.getElementById("downloadBtn");

downloadBtn.addEventListener("click", exportReport);

function exportReport() {

    const report = document.querySelector(".report-card");

    const week = document
        .getElementById("weekDisplay")
        .innerText
        .replace(/\s+/g, "_");

    html2canvas(report, {

        scale: 3,

        backgroundColor: "#090E18",

        useCORS: true

    }).then(canvas => {

        const link = document.createElement("a");

        link.download = `BisonFX_${week}.png`;

        link.href = canvas.toDataURL("image/png");

        link.click();

    });

}