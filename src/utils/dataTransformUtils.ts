export const toApiFormat = (event : any) => {
  const {
    isOnline, startTime, endTime, createdBy,
    is_online, start_time, end_time, created_by,
    _offlineCreated,
    ...rest
  } = event;
  
  return {
    ...rest,
    is_online: isOnline ?? is_online ?? false,
    start_time: startTime ?? start_time ?? null,
    end_time: endTime ?? end_time ?? null,
    created_by: createdBy ?? created_by ?? null
  };
};

export const toClientFormat = (event: any) => {
  const {
    is_online, start_time, end_time, created_by,
    ...rest
  } = event;
  
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