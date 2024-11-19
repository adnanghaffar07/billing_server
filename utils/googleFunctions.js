import axios from 'axios';


export const getTimeZoneFromCoordinates = async(coordinates) =>{
    const UrlToCallTZ = `https://maps.googleapis.com/maps/api/timezone/json?location=${coordinates}&timestamp=1704067200&key=${process.env.GOOGLE_API_KEY}`;
    const timeZoneResponse = await axios.get(UrlToCallTZ);
    const googleTimeZoneId = timeZoneResponse.data.timeZoneId;
    return googleTimeZoneId;
}
 export const getAddressFromCoordinates = async(coordinates) => {
    const UrlToCallAddress = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates}&key=${process.env.GOOGLE_API_KEY}`;
    const addressResponse = await axios.get(UrlToCallAddress);
    const address = addressResponse.data.results[0].formatted_address;
    return address;
}