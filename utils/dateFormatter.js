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
    return new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZoneName: 'short'
    });
  };