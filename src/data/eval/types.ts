export type ScoreKind = 'Thang điểm' | 'Điểm số' | 'Tỉ lệ hoàn thành';
export type EvalStatus = 'Nháp' | 'Đang đánh giá' | 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối';

export interface ScoreLevel { name: string; score: number; note: string }
export interface GradeBand { color: string; name: string; from: number; to: number }
export interface CriterionRef { criterionId: string; target: string; weight: number; counted: boolean }
export interface FlowStep { role: string; weight: number; deadline: string; person: string }
export interface CustomField { name: string; type: string; required: boolean }

export interface CriterionGroup { id: string; code: string; name: string; description: string }
export interface Criterion {
  id: string; name: string; code: string; groupId: string; kind: ScoreKind;
  description: string; active: boolean; levels: ScoreLevel[]; formula: string;
}
export interface EvalTemplate {
  id: string; name: string; active: boolean; scopes: string[];
  watchers: string[]; resultMode: string; kpiMode: string;
  evalSteps: FlowStep[]; approvalOn: boolean; approvalSteps: FlowStep[];
  criteria: CriterionRef[]; grades: GradeBand[]; fields: CustomField[];
}
export interface KpiSetup {
  id: string; name: string; start: string; due: string; templateId: string;
  status: string; selfFill: boolean; approve: boolean; employeeIds: string[];
}
export interface EvalPeriod {
  id: string; name: string; due: string; year: string; cycle: string; span: string;
  templateId: string; resultMode: string; kpiMode: string;
  allowLate: boolean; allowOverride: boolean; allowEdit: boolean;
  sharedTemplate: boolean; watchers: string[];
  evalSteps: FlowStep[]; approvalOn: boolean; approvalSteps: FlowStep[];
  criteria: CriterionRef[]; grades: GradeBand[]; fields: CustomField[];
  employeeIds: string[]; status: string;
}
export interface ScoreEntry { criterionId: string; raw: number | null; note: string }
export interface EvalForm {
  id: string; periodId: string; employeeId: string; templateName: string;
  due: string; createdAt: string; status: EvalStatus;
  kind: string; scores: ScoreEntry[]; comment: string; proposal: string;
  step: number;
}
export interface EvalState {
  groups: CriterionGroup[];
  criteria: Criterion[];
  templates: EvalTemplate[];
  kpiSetups: KpiSetup[];
  periods: EvalPeriod[];
  forms: EvalForm[];
}
