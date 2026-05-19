export type Attendance = 'sim' | 'nao' | '';

export interface AttendanceForm {
  fullName: string;
  guests: number;
  phone: string;
  attendance: Attendance;
  notes: string;
}
