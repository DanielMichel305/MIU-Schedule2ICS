import {getSemsterName} from './scraper.js'

export function parseEventTimes(day, timeStr, refDate = Date.now()) {
    
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


export /**
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


export function getSemesterStartDate() {
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