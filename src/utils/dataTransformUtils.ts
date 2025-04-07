export const toApiFormat = (event : any) => {
  // Strip duplicate fields and normalize to API format
  const {
    isOnline, startTime, endTime, createdBy, // Remove client-side props
    is_online, start_time, end_time, created_by, // Remove duplicate API props too
    _offlineCreated, // Remove internal tracking props
    ...rest
  } = event;
  
  // Clean, normalized API format
  return {
    ...rest,
    is_online: isOnline ?? is_online ?? false,
    start_time: startTime ?? start_time ?? null,
    end_time: endTime ?? end_time ?? null,
    created_by: createdBy ?? created_by ?? null
  };
};

export const toClientFormat = (event: any) => {
  // Always transform to client-side format with camelCase
  const {
    is_online, start_time, end_time, created_by,
    ...rest
  } = event;
  
  // Convert to explicitly boolean values
  const isOnlineBoolean = Boolean(is_online === true || 
    is_online === 'true' || 
    is_online === 1 || 
    is_online === '1');
  
  return {
    ...rest,
    isOnline: isOnlineBoolean,
    startTime: start_time ?? null,
    endTime: end_time ?? null,
    createdBy: created_by ?? null
  };
};