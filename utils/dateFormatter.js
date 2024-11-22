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

export const getESTTimestamp = () => {
    // Create date object for current time
    const date = new Date();
    
    // Convert to EST
    const estTime = date.toLocaleString('en-US', {
      timeZone: 'America/New_York'
    });
    
    // Create new Date object from EST time
    const estDate = new Date(estTime);
    
    // Format the EST date
    return estDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZoneName: 'short'
    }) + ' EST';
};