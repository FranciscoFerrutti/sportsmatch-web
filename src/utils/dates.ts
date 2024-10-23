export const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    return new Date(date).toLocaleDateString('es-ES', options);
  };
  
  export const formatTime = (time: string): string => {
    return `${time}hs`;
  };
  