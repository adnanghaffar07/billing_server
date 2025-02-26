export const processMetadata = (metadata) => {
    if (!Array.isArray(metadata)) {
        throw new Error('Metadata must be an array');
    }

    return metadata.reduce((result, item) => {
        if (!item.name || !item.hasOwnProperty('value')) {
            throw new Error('Each metadata item must have name and value properties');
        }
        result[item.name] = item.value;
        return result;
    }, {});
};

/**
 * POST /api/metadata/process
 * Process metadata and return name-value pairs
 */
export const processMetadataApi = async (req, res) => {
    try {
        const { metadata } = req.body;
        
        if (!metadata) {
            return res.status(400).json({
                success: false,
                error: 'Metadata is required in the request body'
            });
        }

        const processedData = processMetadata(metadata);
        
        return res.status(200).json({
            success: true,
            data: processedData
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
};