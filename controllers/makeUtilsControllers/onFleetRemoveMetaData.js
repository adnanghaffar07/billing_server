import { getSingleOnfleetTask, updateOnfleetTask } from "../../utils/onfleetConfig.js";
import { extractOrderDetailsFromNotes } from "../../utils/openaiConfig.js";

const calculateShefRate = (routeDuration, location) => {
    // Convert hours to minutes
    const durationMinutes = routeDuration * 60;
    let hourlyRate = location.toLowerCase() === 'chicago' ? 25 : 28; // 25 for Chicago, 28 for Seattle
    
    // If not divisible by 5, round up to next 5-minute interval
    if (durationMinutes % 5 !== 0) {
        const roundedMinutes = Math.ceil(durationMinutes / 5) * 5;
        return (roundedMinutes / 60) * hourlyRate;
    }
    
    // If already divisible by 5, just multiply by hourly rate
    return routeDuration * hourlyRate;
};

const hasNashMetadata = (metadata) => {
    if (!metadata || !Array.isArray(metadata)) return false;
    return metadata.some(meta => 
        meta.name === 'nash_customer_name' || 
        meta.name === 'nash_batch_route_duration'
    );
};

export const onFleetRemoveTipsFromMetaData = async (req, res) => {
    try {
        const { taskId } = req.body;
        
        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: 'Task ID is required'
            });
        }

        // Get the task details
        const task = await getSingleOnfleetTask(taskId);
        
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Check if metadata exists and has items
        if (!task.metadata || !Array.isArray(task.metadata) || task.metadata.length === 0) {
            // If no metadata, check notes for order details
            if (task.notes) {
                const orderDetails = await extractOrderDetailsFromNotes(task.notes);
                if (orderDetails.driverTip !== null || orderDetails.subtotal !== null) {
                    // Create metadata array with available information
                    const metadata = [];
                    
                    if (orderDetails.driverTip !== null) {
                        metadata.push({
                            type: 'number',
                            visibility: ['api'],
                            value: orderDetails.driverTip,
                            name: 'driver_tip'
                        });
                    }
                    
                    if (orderDetails.subtotal !== null) {
                        metadata.push({
                            type: 'number',
                            visibility: ['api', 'dashboard'],
                            value: orderDetails.subtotal,
                            name: 'order_subtotal'
                        });
                    }

                    // Add earnings message
                    const tipAmount = orderDetails.driverTip || 0;
                    const notesMessage = tipAmount >= 25 
                        ? `\n\nProjected earning for this order is $${tipAmount} including tips`
                        : '\n\nThis order projected earning is $25 including tips';

                    const newNotes = orderDetails.cleanedNotes + notesMessage;
                    console.log('Updating task with extracted details:', { metadata, newNotes });

                    const updatedTask = await updateOnfleetTask({
                        taskId: taskId,
                        metadata: metadata,
                        notes: newNotes
                    });

                    if (!updatedTask) {
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to update task in OnFleet',
                        });
                    }

                    return res.status(200).json({
                        success: true,
                        message: 'Extracted order details from notes and created metadata',
                        task: updatedTask
                    });
                }
            }

            const newNotes = `${task.notes || ''}\n\nThis order projected earning is $25 including tips`;
            console.log('Updating task with default notes:', newNotes);
            
            const updatedTask = await updateOnfleetTask({
                taskId: taskId,
                notes: newNotes
            });

            if (!updatedTask) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update task in OnFleet',
                });
            }

            return res.status(200).json({
                success: true,
                message: 'No metadata to process, added default earning note',
                task: updatedTask
            });
        }

        // Check if task has nash metadata
        const hasNash = hasNashMetadata(task.metadata);

        // Check for nash_batch_route_duration first
        const routeDurationMeta = task.metadata.find(meta => meta.name === 'nash_batch_route_duration');
        if (routeDurationMeta) {
            // Extract hours from string like "2.07 hours"
            const hours = parseFloat(routeDurationMeta.value);
            if (!isNaN(hours)) {
                // Check customer name from metadata
                const customerNameMeta = task.metadata.find(meta => meta.name === 'nash_customer_name');
                const customerName = customerNameMeta?.value?.toLowerCase() || '';
                
                let projectedEarning = 0;
                
                if (customerName.includes('alto')) {
                    // Handle Alto tasks
                    const fullAddress = [
                        task.destination?.address?.street,
                        task.destination?.address?.apartment,
                        task.destination?.address?.city,
                        task.destination?.address?.state,
                        task.destination?.address?.postalCode
                    ].filter(Boolean).join(' ').toLowerCase();

                    const isAustin = fullAddress.includes('austin');
                    const hourlyRate = isAustin ? 26 : 28;
                    projectedEarning = (hours * hourlyRate).toFixed(2);
                } else if (customerName.includes('shef')) {
                    // Handle Shef tasks
                    const isChicago = task.destination?.address?.city?.toLowerCase().includes('chicago');
                    projectedEarning = calculateShefRate(hours, isChicago ? 'chicago' : 'seattle').toFixed(2);
                } else {
                    // Skip if not Alto or Shef
                    return;
                }

                const newNotes = `${task.notes || ''}\n\nProjected Earning for this order is $${projectedEarning} including tips`;
                console.log('Updating task with notes:', newNotes);

                const updatedTask = await updateOnfleetTask({
                    taskId: taskId,
                    notes: newNotes
                });

                if (!updatedTask) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to update task in OnFleet',
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: 'Projected earnings added to notes based on route duration',
                    projectedEarning,
                    task: updatedTask
                });
            }
        }

        // If task has nash metadata, skip metadata updates and only update notes if needed
        if (hasNash) {
            const tipMeta = task.metadata.find(meta => meta.name === 'driver_tip');
            if (tipMeta) {
                const tipAmount = parseFloat(tipMeta.value);
                const notesMessage = tipAmount >= 25 
                    ? `\n\nProjected earning for this order is $${tipAmount} including tips`
                    : '\n\nThis order projected earning is $25 including tips';

                const newNotes = `${task.notes || ''}${notesMessage}`;
                console.log('Updating nash task with tip notes:', newNotes);

                const updatedTask = await updateOnfleetTask({
                    taskId: taskId,
                    notes: newNotes
                });

                if (!updatedTask) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to update task in OnFleet',
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: 'Updated notes for nash task',
                    task: updatedTask
                });
            }

            // If no tip in metadata, add default note
            const newNotes = `${task.notes || ''}\n\nThis order projected earning is $25 including tips`;
            console.log('Updating nash task with default notes:', newNotes);

            const updatedTask = await updateOnfleetTask({
                taskId: taskId,
                notes: newNotes
            });

            if (!updatedTask) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update task in OnFleet',
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Added default earning note to nash task',
                task: updatedTask
            });
        }

        // Continue with normal processing for non-nash tasks
        const tipMeta = task.metadata.find(meta => meta.name === 'driver_tip');
        
        if (!tipMeta && task.notes) {
            // Try to extract order details from notes if no tip in metadata
            const orderDetails = await extractOrderDetailsFromNotes(task.notes);
            if (orderDetails.driverTip !== null || orderDetails.subtotal !== null) {
                // Create metadata with available information
                const metadata = [...task.metadata];
                
                if (orderDetails.driverTip !== null) {
                    metadata.push({
                        type: 'number',
                        visibility: ['api'],
                        value: orderDetails.driverTip,
                        name: 'driver_tip'
                    });
                }
                
                if (orderDetails.subtotal !== null) {
                    metadata.push({
                        type: 'number',
                        visibility: ['api', 'dashboard'],
                        value: orderDetails.subtotal,
                        name: 'order_subtotal'
                    });
                }

                // Add earnings message
                const tipAmount = orderDetails.driverTip || 0;
                const notesMessage = tipAmount >= 25 
                    ? `\n\nProjected earning for this order is $${tipAmount} including tips`
                    : '\n\nThis order projected earning is $25 including tips';

                const newNotes = orderDetails.cleanedNotes + notesMessage;
                console.log('Updating task with extracted details:', { metadata, newNotes });

                const updatedTask = await updateOnfleetTask({
                    taskId: taskId,
                    metadata: metadata,
                    notes: newNotes
                });

                if (!updatedTask) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to update task in OnFleet',
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: 'Extracted order details from notes and added to metadata',
                    task: updatedTask
                });
            }

            // No tip found in notes either
            const newNotes = `${task.notes || ''}\n\nThis order projected earning is $25 including tips`;
            console.log('Updating task with default notes:', newNotes);

            const updatedTask = await updateOnfleetTask({
                taskId: taskId,
                notes: newNotes
            });

            if (!updatedTask) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update task in OnFleet',
                });
            }

            return res.status(200).json({
                success: true,
                message: 'No driver tip found in metadata or notes, added default earning note',
                task: updatedTask
            });
        }

        // Update metadata to make driver_tip visible only to API
        const updatedMetadata = task.metadata.map(meta => {
            if (meta.name === 'driver_tip') {
                return {
                    ...meta,
                    visibility: ['api']
                };
            }
            return meta;
        });

        // Parse tip amount
        const tipAmount = parseFloat(tipMeta.value);
        let notesMessage = '';

        if (tipAmount >= 25) {
            notesMessage = `\n\nProjected earning for this order is $${tipAmount} including tips`;
        } else {
            notesMessage = '\n\nThis order projected earning is $25 including tips.';
        }

        const newNotes = `${task.notes || ''}${notesMessage}`;
        console.log('Updating task with tip notes:', newNotes);

        const updatedTask = await updateOnfleetTask({
            taskId: taskId,
            metadata: updatedMetadata,
            notes: newNotes
        });

        if (!updatedTask) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update task in OnFleet',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Driver tip visibility and notes updated successfully',
            task: updatedTask
        });

    } catch (error) {
        console.error('Error updating driver tip visibility:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update driver tip visibility',
            error: error.message
        });
    }
};