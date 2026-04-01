import {parseEventTimes,  getNumberOfWeeks, getSemesterStartDate} from './utils.js'
import {parseAndBuildScheduleData, getCalanderFileName} from './scraper.js'


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
 * @param {object} schedule key-value object with days as key and lecture as value where value is an object with values section, course, room and time. time is a string of time seperated by '-' so it needs parsing using parseEventTimes() that returns startTime and endTime
 */
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

    const rawICSString = calender.build();

    const icsWithAlarmData = addEventAlarms(rawICSString, 15);
    

    const calendarBlob = new Blob([icsWithAlarmData], {type : "text/calendar"});


    saveAs(calendarBlob, getCalanderFileName())


    


}

/**
 * @param {string} alarmString ICS format string to inject alarm data into 
 * @param {number} alarmDuration duration in minutes to set as an alarm for all lectures (no first lecture support yet)
 * @returns {string} String with alarm data injected into the raw ICS string
 */
function addEventAlarms(alarmString, alarmDuration){     //Add support for multiple alarms by changing the alarm param to be a number of durations 

    const icsWithAlarmData = alarmString.replaceAll(
        /END:VEVENT/g, 

        `BEGIN:VALARM\nTRIGGER:-PT${alarmDuration}M\nACTION:DISPLAY\nDESCRIPTION:You Have a lecture in ${alarmDuration} minutes!\nEND:VALARM\nEND:VEVENT`
    );
    return icsWithAlarmData;

}




observer.observe(document.body, {
    childList: true,  
    subtree: true     
});



