const observer = new MutationObserver(() => {
    
    const actionsDiv = document.querySelector(".portlet-title .actions");
    if (actionsDiv && !actionsDiv.querySelector('.export2ics')) {
        observer.disconnect();
        renderExportButton(actionsDiv);

        //parse and build function call//nvm


        observer.observe(document.body, {
            childList: true,  
            subtree: true     
        });
    }
});



function renderExportButton(actionsDiv){

    if(actionsDiv.querySelector('.export2ics')) return;

    const button = document.createElement("button");
    button.classList.add("btn", "btn-default", "btn-sm", "export2ics");
    button.textContent = "Export to ICS Format"
    
    button.onclick = ()=>{
        const schedule = parseAndBuildScheduleData();
        exportScheduleToICS(schedule)
        ///format to ics
    } 

    actionsDiv.appendChild(button);

    

}


function getCalanderFileName(){
    const semName = (document.querySelectorAll(".portlet .caption")[1]).outerText.split(":")[1].replaceAll(' ','_');
    const studentID = document.querySelectorAll(".row")[1].outerText.split('/')[1];
    return `${studentID}_Calendar${semName}.ics`;
}


function getICSDayFormat(day){
    const formatDay = (day[0]+day[1]).toUpperCase()
    return formatDay;
}

function parseEventTimes(day, timeStr) {
    
    const [startStr, endStr] = timeStr.split("-").map(s => s.trim());

    
    const dayMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
    const today = new Date();
    const targetDay = dayMap[day];
    const diff = (targetDay - today.getDay() + 7) % 7;
    const eventDate = new Date(today);
    eventDate.setDate(today.getDate() + diff);

    const toDateStr = (dateObj, timeStr) => {
        const [time, meridiem] = timeStr.split(" ");
        let [hours, minutes] = time.split(":").map(Number);
        if (meridiem === "PM" && hours !== 12) hours += 12;
        if (meridiem === "AM" && hours === 12) hours = 0;
        const d = new Date(dateObj);
        d.setHours(hours, minutes, 0);
        return d.toString();
    };

    return {
        startTime: toDateStr(eventDate, startStr),
        endTime: toDateStr(eventDate, endStr)
    };
}


function parseAndBuildScheduleData(){


    const table = document.querySelectorAll(".dataTable_wrapper table")[1];  //[1] because the block is also rendered but hidden so when using querySelector I get the first one of the 2 schecules (block hidden normally and the actual schedule..)
    if(!table) return;

    const tableHeaders = [...table.querySelectorAll('th')]
    const days = tableHeaders.map(th => th.textContent.trim()).slice(1);

    if(days[0] === 'Date'){ /// This is prolly a midterm schedule...handle later
        alert("Midterms/Finals schedules arent supported yet! Feel free to open a PR or wait till I implement it...")
    }


    const schedule = Object.fromEntries(days.map(day => [day, []]));

    const rows = [...table.querySelectorAll("tbody tr")];
    rows.forEach(row => {
        const cells = [...row.querySelectorAll("td")];
        const courseName = cells[0].textContent.trim();

        cells.slice(1).forEach((cell, i) => {
            // Only grab visible divs (Angular hides irrelevant ones with ng-hide)
            const visibleEntries = [...cell.querySelectorAll("div[ng-show]:not(.ng-hide)")];   ///I kinda understand this line's purpose but now sure how we got here (Claude 7beebi)

            visibleEntries.forEach(entry => {
                const divs = [...entry.querySelectorAll("div")];
                if (divs.length < 4) return;

                schedule[days[i]].push({
                    course: courseName,
                    section: divs[0].textContent.trim(),  
                    time: divs[1].textContent.trim(),      
                    instructor: divs[2].textContent.trim(),
                    room: divs[3].textContent.trim()
                });
            });
        });
    });

    return schedule

}

function exportScheduleToICS(schedule){

    const calender = ics();
    
    for (const day in schedule) {
        if (!Object.hasOwn(schedule, day)) continue;
        
        
        const lecturesOnDay = schedule[day];
        


        for (const lecture of lecturesOnDay) {

            const { startTime, endTime} = parseEventTimes(day, lecture.time);
            
            calender.addEvent(lecture.section, lecture.course, lecture.room, startTime, endTime, {freq: "WEEKLY", count: 2, interval: 1});
            
            
        }
        
        
    }

    const rawICSString = calender.build()
    
    const icsWithAlarmData = rawICSString.replaceAll(
        /END:VEVENT/g, 
        `BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Reminder
END:VALARM
END:VEVENT`
    );

    const calendarBlob = new Blob([icsWithAlarmData], {type : "text/calendar"});


    saveAs(calendarBlob, getCalanderFileName())


    


}




observer.observe(document.body, {
    childList: true,  
    subtree: true     
});



