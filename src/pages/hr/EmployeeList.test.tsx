import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { FeedbackProvider } from '../../components/feedback';
import { hr } from '../../data/repositories';
import EmployeeList from './EmployeeList';

function renderList() {
  return render(
    <MemoryRouter>
      <FeedbackProvider>
        <EmployeeList />
      </FeedbackProvider>
    </MemoryRouter>,
  );
}

describe('danh sách nhân sự', () => {
  beforeEach(() => hr.reset());

  it('tìm không dấu trong bảng', async () => {
    const user = userEvent.setup();
    renderList();
    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Tìm nhân sự'), 'bich');
    expect(screen.getByText('Trần Thị Bích')).toBeInTheDocument();
    expect(screen.queryByText('Nguyễn Văn An')).not.toBeInTheDocument();
  });
});
