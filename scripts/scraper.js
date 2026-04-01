/**
 * @returns {string}
 */
export function getSemsterName(){
    const semName =  document.querySelectorAll(".portlet .caption")?.[1]?.outerText?.split(":")?.[1]?.replaceAll(' ','_') || document.querySelector("#main-content > app-schedule > ion-content > div > div.isweb > ion-card > ion-card-content")?.innerText?.trim()?.split(' ')?.slice(0,2)?.join()?.trim()?.replace(',', '_');
    return semName;
}

export function getCalanderFileName(){
    const semName = getSemsterName()
    let studentID = document.querySelector('#main-content > app-schedule > ion-content > div > ion-card > ion-card-content > ion-grid > ion-row:nth-child(1) > ion-col:nth-child(2)')?.innerText ||  document.querySelectorAll(".row")?.[1]?.outerText;
    studentID = studentID.split('/')[1];
    return `${studentID}_Calendar${semName}.ics`;
}



export function parseAndBuildScheduleData(){


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