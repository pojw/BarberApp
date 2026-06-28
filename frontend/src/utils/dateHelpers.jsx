


export function getTodayDateString(){
    const today = new Date();
    
    const year=today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}

export function isToday(dateString){
    return dateString === getTodayDateString()
}

export function isUpcomingOrToday(dateString){
    return dateString>=getTodayDateString();
}


export function sortBookingsByDateTime(bookings){
    return [...bookings].sort((a, b) => {
    const dateA = `${a.appointmentDate} ${a.startTime}`;
    const dateB = `${b.appointmentDate} ${b.startTime}`;

    return dateA.localeCompare(dateB);
    })
} 