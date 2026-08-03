/*==========================================
            WEEK DISPLAY
==========================================*/

const weekStart = document.getElementById("weekStart");

const weekDisplay = document.getElementById("weekDisplay");

const reportWeek = document.getElementById("reportWeek");

weekStart.addEventListener("change", updateWeek);

function updateWeek(){

    if(!weekStart.value) return;

    const start = new Date(weekStart.value);

    const end = new Date(start);

    end.setDate(start.getDate()+4);

    const options = {

        day:"numeric",
        month:"short"

    };

    const text =

        start.toLocaleDateString("en-GB",options)

        +" - "+

        end.toLocaleDateString("en-GB",options);

    weekDisplay.innerHTML=text;

    reportWeek.innerHTML=text;

}