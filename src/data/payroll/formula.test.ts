import { describe, expect, it } from 'vitest';
import { buildSeed } from '../seed';
import { COST_CATEGORIES, INDICATORS, mainTemplateComponents } from './catalog';
import { computeEmployee } from './engine';
import { evaluateFormula, taxFiveBrackets } from './formula';

describe('công thức lương', () => {
  it('tính cộng trừ nhân chia, phần trăm và từ chối hàm lạ', () => {
    expect(evaluateFormula('2+3*4', {})).toBe(14);
    expect(evaluateFormula('(2+3)*4', {})).toBe(20);
    expect(evaluateFormula('INSURANCE_RATE*BHXH_NLD_RATE%', { INSURANCE_RATE: 32_000_000, BHXH_NLD_RATE: 8 })).toBe(2_560_000);
    expect(evaluateFormula('MAX(0,100-40)', {})).toBe(60);
    expect(evaluateFormula('1/0', {})).toBe(0);
    expect(() => evaluateFormula('alert(1)', {})).toThrow(/Hàm chưa được hỗ trợ/);
  });

  it('thuế 5 bậc', () => {
    expect(taxFiveBrackets(0)).toBe(0);
    expect(taxFiveBrackets(10_000_000)).toBe(500_000);
    expect(taxFiveBrackets(15_000_000)).toBe(1_000_000);
    expect(evaluateFormula('TAX5(THU_NHAP_TINH_THUE)', { THU_NHAP_TINH_THUE: 15_000_000 })).toBe(1_000_000);
  });

  it('có khoảng 172 chỉ số và 15 hạng mục', () => {
    expect(INDICATORS).toHaveLength(172);
    expect(INDICATORS.map(item => item.code)).toEqual(expect.arrayContaining(['PHU_CAP_AN_CA', 'THUC_NHAN', 'EMPLOYEE_CODE', 'OT_HOURS', 'INCOME__PHU_CAP_AN_TRUA__PREV_MONTH']));
    expect(COST_CATEGORIES).toHaveLength(15);
  });

  it('tính lương một nhân viên từ hợp đồng, công và người phụ thuộc', () => {
    const state = buildSeed(new Date('2026-10-28T08:00:00+07:00'));
    const employee = state.employees.find(item => item.id === 'emp-01')!;
    const values = computeEmployee(state, employee, '2026-10', mainTemplateComponents());
    const gross = Number(values.TONG_THU_NHAP);
    const taxable = Math.max(0, gross - 2_560_000 - 480_000 - 320_000 - 11_000_000 - 4_400_000 * 2);
    expect(values.LUONG_CO_BAN_THANG).toBe(32_000_000);
    expect(values.NUMBER_OF_DEPENDENT_PERSONS).toBe(2);
    expect(values.BHXH_NLD).toBe(2_560_000);
    expect(values.BHYT_NLD).toBe(480_000);
    expect(values.BHTN_NLD).toBe(320_000);
    expect(values.BHXH_DN).toBe(5_600_000);
    expect(values.THU_NHAP_TINH_THUE).toBe(taxable);
    expect(values.KHAU_TRU_THUE).toBe(taxFiveBrackets(taxable));
    expect(values.THUC_NHAN).toBe(gross - taxFiveBrackets(taxable) - 2_560_000 - 480_000 - 320_000);
    expect(Number(values.WORKING_POINT)).toBeGreaterThan(0);
  });
});
