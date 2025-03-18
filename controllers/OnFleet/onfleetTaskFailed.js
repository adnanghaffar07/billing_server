import { sendPostRequest } from "../../utils/webhookUtils.js";
import { convertTimestampsToISO, hasNashMetadata } from "../makeUtilsControllers/onFleetRemoveMetaData.js";
import { processMetadata } from "../MetadataController.js";





export const onFleetTaskFailed = async (req, res) => {
        const { taskId } = req.body;
        
        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: 'Task ID is required'
            });
        }

        // Call the webhook

        try { 
            if(!hasNashMetadata(req.body.data.task.metadata) && req.body.data.task.metadata.length > 0){   
                console.log('Not nash metadata');
                const processedMetadata = processMetadata(req.body.data.task.metadata);
                console.log(processedMetadata);
                
                // Convert Unix timestamps to ISO format before sending
                const formattedPayload = convertTimestampsToISO({...req.body});
                await sendPostRequest({...formattedPayload, isNash: false, orderData: processedMetadata});
            }else{
                console.log('Is nash metadata');
                // Convert Unix timestamps to ISO format before sending
                const formattedPayload = convertTimestampsToISO({...req.body});
                await sendPostRequest({...formattedPayload, isNash: true});
            }

            return res.status(200).json({
                success: true,
                message: 'Task Uploaded successfully'
            });
            
        } catch (error) {
            console.log(error)
        }
    }