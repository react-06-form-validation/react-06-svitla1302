import { render, screen } from '@testing-library/react';
import ErrorMessage from './ErrorMessage';

describe('ErrorMessage Component', () => {
  test('does not render when no message is provided', () => {
    render(<ErrorMessage message={undefined} />);
    const errorMessage = screen.queryByText(/error/i);
    expect(errorMessage).not.toBeInTheDocument();
  });

  test('renders the error message when provided', () => {
    const message = 'This is an error!';
    render(<ErrorMessage message={message} />);
    const errorMessage = screen.getByText(message);
    expect(errorMessage).toBeInTheDocument();
  });
});
