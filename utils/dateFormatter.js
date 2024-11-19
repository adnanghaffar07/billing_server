export const dateFormatter = (date,ianaTimeZone) => {
    return date.toLocaleString("en-US", {
        timeZone: ianaTimeZone,
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
        timeZoneName: "short",
      });
}

export const shortDateFormatter = (date) => {
    return date.toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}