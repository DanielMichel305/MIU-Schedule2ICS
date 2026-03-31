

const observer = new MutationObserver(() => {
    
    const actionsDiv = document.querySelector(".portlet-title .actions") || document.querySelector("#main-content > app-schedule > ion-content > div > div.isweb > ion-card > ion-card-content > ion-grid > ion-row");
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

/**
 * @returns {number} - Number of weeks to repeat event
 */
function getNumberOfWeeks(){
    const semName = getSemsterName().toLowerCase();
    let numberOfWeeks =0;
    const year = getSemsterName().split('_')[1];

    if(semName.includes("spring")){
        const endDate = Date.UTC(year, 4,25);
        numberOfWeeks= (endDate - Date.now()) / ((1000*60*60*24) * 7)
    }
    else if(semName.includes("fall")){
        const endDate = Date.UTC(year, 11, 25);
        numberOfWeeks=(endDate - Date.now()) / ((1000*60*60*24) * 7)
    }
    else{
        const endDate = Date.UTC(year, 7, 6);
        numberOfWeeks= (endDate - Date.now()) / ((1000*60*60*24) * 7);
    }
    
    return Math.round(numberOfWeeks);
}

/**
 * @returns {string}
 */
function getSemsterName(){
    const semName =  document.querySelectorAll(".portlet .caption")?.[1]?.outerText?.split(":")?.[1]?.replaceAll(' ','_') || document.querySelector("#main-content > app-schedule > ion-content > div > div.isweb > ion-card > ion-card-content")?.innerText?.trim()?.split(' ')?.slice(0,2)?.join()?.trim()?.replace(',', '_');
    return semName;
}


function getCalanderFileName(){
    const semName = getSemsterName()
    let studentID = document.querySelector('#main-content > app-schedule > ion-content > div > ion-card > ion-card-content > ion-grid > ion-row:nth-child(1) > ion-col:nth-child(2)')?.innerText ||  document.querySelectorAll(".row")?.[1]?.outerText;
    studentID = studentID.split('/')[1];
    return `${studentID}_Calendar${semName}.ics`;
}


function getICSDayFormat(day){
    const formatDay = (day[0]+day[1]).toUpperCase()
    return formatDay;
}


function getSemesterStartDate() {
    const semName = getSemsterName().toLowerCase();
    
    const today = new Date();
    const year = today.getFullYear();


    const semesterStarts = {
        spring: new Date(year, 0, 30),
        fall:   new Date(year, 8, 13),
        summer: new Date(year, 6,5)
    };

    let semStart = null;
    if (semName.includes("spring")) semStart = semesterStarts.spring;
    else if (semName.includes("fall")) semStart = semesterStarts.fall;
    else semStart = semesterStarts.summer

    return (!semStart || today > semStart) ? today : semStart;
}


function parseEventTimes(day, timeStr, refDate = Date.now()) {
    
    const [startStr, endStr] = timeStr.split("-").map(s => s.trim());

    
    const dayMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
    
    const targetDay = dayMap[day];
    const diff = (targetDay - refDate.getDay() + 7) % 7;
    const eventDate = new Date(refDate);
    eventDate.setDate(refDate.getDate() + diff);

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


    const table1 = document.querySelectorAll(".dataTable_wrapper table")?.[1];
    const table2 = document.querySelector("#main-content > app-schedule > ion-content > div > div.isweb > ion-card > ion-card-content > div > div > table");

    const table = table1 || table2 || null;
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
            let visibleEntries = [...cell.querySelectorAll("div[ng-show]:not(.ng-hide)")];    ///I kinda understand this line's purpose but now sure how we got here (Claude 7beebi)
            
            if(visibleEntries.length === 0) visibleEntries = [...cell.querySelectorAll("p")];


            visibleEntries.forEach(entry => {
                

                let divs = [...entry.querySelectorAll("div")];
                if(divs.length === 0 ){
                    divs = entry.innerText.split('\n')
                }

                
                
                schedule[days[i]].push({
                    course: courseName,
                    section: divs[0].textContent?.trim() || divs[0],  
                    time: divs[1].textContent?.trim() || divs[1],      
                    instructor: divs[2].textContent?.trim() || divs[2],
                    room: divs[3].textContent?.trim() || divs[3]
                });
            });
        });
    });

    return schedule

}

function exportScheduleToICS(schedule){


    const calender = ics();
    
    const numberOfOccurrences = getNumberOfWeeks()
    const semStart = getSemesterStartDate();

    for (const day in schedule) {
        if (!Object.hasOwn(schedule, day)) continue;
        

        const lecturesOnDay = schedule[day];



        for (const lecture of lecturesOnDay) {
            const { startTime, endTime} = parseEventTimes(day, lecture.time, semStart);
            
            calender.addEvent(lecture.section, lecture.course, lecture.room, startTime, endTime, {freq: "WEEKLY", count: numberOfOccurrences, interval: 1});
            
            
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



