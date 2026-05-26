export type Attendance = 'sim' | 'nao' | '';

export interface AttendanceForm {
  fullName: string;
  companions: number;
  phone: string;
  attendance: Attendance;
  notes: string;
}
